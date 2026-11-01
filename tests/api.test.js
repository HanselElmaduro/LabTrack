import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApp } from '../01_Sistema/server/index.js';
import { today } from '../01_Sistema/server/database.js';

const credentials={name:'Administrador de prueba',username:'tester',password:'SoloPruebas-2026!'};
const equipment=(extra={})=>({code:'TEST-001',name:'Osciloscopio de prueba',category:'Medición',location:'Laboratorio 01',status:'Disponible',brand:'Rigol',notes:'Datos ficticios',...extra});
async function fixture(t,options={}) {
  const app=createApp({databasePath:':memory:',seed:false,...options});
  await new Promise(resolve=>app.server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${app.server.address().port}`;
  let cookie='',csrf='';
  const request=async(path,method='GET',body,headers={})=>{
    const response=await fetch(base+path,{method,headers:{...(body?{'Content-Type':'application/json'}:{}),...(cookie?{Cookie:cookie}:{}),...(csrf?{'X-CSRF-Token':csrf}:{}),...headers},body:body?JSON.stringify(body):undefined});
    const value=response.headers.get('set-cookie');if(value)cookie=value.split(';')[0];
    const data=response.headers.get('content-type')?.includes('application/json')?await response.json():await response.text();
    if(data.csrfToken)csrf=data.csrfToken;
    return {status:response.status,data,headers:response.headers};
  };
  t.after(()=>app.close());
  return {app,request,base,setup:()=>request('/api/setup','POST',credentials),csrf:()=>csrf,cookie:()=>cookie};
}

test('Primera configuración: cuenta única, hash de contraseña y sesión HttpOnly',async t=>{
  const f=await fixture(t);
  assert.equal((await f.request('/api/session')).data.setupRequired,true);
  assert.equal((await f.request('/api/equipos')).status,401);
  const result=await f.setup();assert.equal(result.status,201);
  assert.match(result.headers.get('set-cookie'),/HttpOnly; SameSite=Strict/);
  const user=f.app.db.prepare('SELECT * FROM users').get();assert.notEqual(user.password_hash,credentials.password);assert.equal(user.password_hash.length,128);
  assert.equal((await f.setup()).status,409);
  assert.equal((await f.request('/api/session')).data.authenticated,true);
  assert.equal((await f.request('/api/equipos')).status,200);
});

test('Acceso real, error de credenciales, cierre e invalidación de sesión',async t=>{
  const f=await fixture(t);await f.setup();const oldCookie=f.cookie();
  assert.equal((await f.request('/api/logout','POST',{})).status,200);
  assert.equal((await f.request('/api/equipos','GET',undefined,{Cookie:oldCookie})).status,401);
  assert.equal((await f.request('/api/login','POST',{username:'tester',password:'incorrecta'})).status,401);
  assert.equal((await f.request('/api/login','POST',{username:'TESTER',password:credentials.password})).status,200);
  assert.equal((await f.request('/api/resumen')).status,200);
});

test('CRUD real: crear, consultar, actualizar y eliminar con auditoría',async t=>{
  const f=await fixture(t);await f.setup();const created=await f.request('/api/equipos','POST',equipment());
  assert.equal(created.status,201);const id=created.data.item.id;
  const detail=await f.request('/api/equipos/'+id);assert.equal(detail.data.item.name,'Osciloscopio de prueba');
  const edited=await f.request('/api/equipos/'+id,'PUT',{...equipment({location:'Laboratorio 02'}),version:1});assert.equal(edited.status,200);assert.equal(edited.data.item.version,2);
  const listed=await f.request('/api/equipos');assert.equal(listed.data.items[0].location,'Laboratorio 02');
  assert.equal((await f.request('/api/equipos/'+id,'DELETE',{version:2})).status,200);
  assert.equal((await f.request('/api/equipos/'+id)).status,404);
  assert.deepEqual((await f.request('/api/actividad')).data.items.slice(0,3).map(a=>a.kind),['baja','edicion','alta']);
});

test('Campos obligatorios, categoría y códigos únicos incluso con acentos',async t=>{
  const f=await fixture(t);await f.setup();
  assert.equal((await f.request('/api/equipos','POST',equipment({name:'   '}))).status,400);
  assert.equal((await f.request('/api/equipos','POST',equipment({category:'Otra'}))).status,400);
  assert.equal((await f.request('/api/equipos','POST',equipment({status:'Prestado'}))).status,400);
  assert.equal((await f.request('/api/equipos','POST',equipment({code:' ñ-01 '}))).status,201);
  assert.equal((await f.request('/api/equipos','POST',equipment({code:'Ñ-01'}))).status,409);
  assert.equal((await f.request('/api/equipos')).data.items[0].code,'Ñ-01');
});

test('Búsqueda combinada, categoría, paginación y resumen global',async t=>{
  const f=await fixture(t);await f.setup();
  for(let n=1;n<=12;n++)await f.request('/api/equipos','POST',equipment({code:'CODE-'+n,name:'Medición '+n,status:n===12?'Mantenimiento':'Disponible'}));
  assert.equal((await f.request('/api/equipos?limit=10')).data.items.length,10);
  assert.equal((await f.request('/api/equipos?limit=10&page=2')).data.items.length,2);
  assert.equal((await f.request('/api/equipos?q=medicion&estado=Mantenimiento&categoria='+encodeURIComponent('Medición'))).data.total,1);
  assert.equal((await f.request('/api/equipos?q=inexistente')).data.total,0);
  assert.equal((await f.request('/api/resumen')).data.counts.total,12);
});

test('Control de versiones impide sobrescribir cambios de otra sesión',async t=>{
  const f=await fixture(t);await f.setup();const {data}=await f.request('/api/equipos','POST',equipment()),id=data.item.id;
  assert.equal((await f.request('/api/equipos/'+id,'PUT',{...equipment({name:'Cambio nuevo'}),version:1})).status,200);
  assert.equal((await f.request('/api/equipos/'+id,'PUT',{...equipment({name:'Cambio antiguo'}),version:1})).status,409);
  assert.equal((await f.request('/api/equipos/'+id,'DELETE',{version:1})).status,409);
  assert.equal((await f.request('/api/equipos/'+id)).data.item.name,'Cambio nuevo');
});

test('Préstamo, bloqueo de eliminación, edición preservada y devolución con historial',async t=>{
  const f=await fixture(t);await f.setup();const {data}=await f.request('/api/equipos','POST',equipment()),id=data.item.id;
  const loan=await f.request('/api/prestamos','POST',{equipmentId:id,borrower:'Estudiante Demo',loanDate:today()});assert.equal(loan.status,201);
  assert.equal((await f.request('/api/prestamos','POST',{equipmentId:id,borrower:'Otra persona',loanDate:today()})).status,409);
  let item=(await f.request('/api/equipos/'+id)).data.item;assert.equal(item.status,'Prestado');
  assert.equal((await f.request('/api/equipos/'+id,'DELETE',{version:item.version})).status,409);
  const edit=await f.request('/api/equipos/'+id,'PUT',{...equipment({location:'Nueva ubicación',status:'Prestado'}),version:item.version});assert.equal(edit.status,200);assert.equal(edit.data.item.borrower,'Estudiante Demo');
  assert.equal((await f.request('/api/equipos/'+id,'PUT',{...equipment(),version:edit.data.item.version})).status,409);
  assert.equal((await f.request('/api/prestamos/'+loan.data.item.id+'/devolver','POST',{})).status,200);
  assert.equal((await f.request('/api/prestamos/'+loan.data.item.id+'/devolver','POST',{})).status,409);
  item=(await f.request('/api/equipos/'+id)).data.item;assert.equal(item.status,'Disponible');assert.equal(item.borrower,null);
  assert.equal((await f.request('/api/prestamos?estado=devueltos')).data.items.length,1);
  await f.request('/api/equipos/'+id,'DELETE',{version:item.version});
  const history=(await f.request('/api/prestamos?estado=todos')).data.items[0];assert.equal(history.equipment_id,null);assert.equal(history.equipment_code,'TEST-001');
});

test('Préstamos rechazan fechas inválidas, fechas futuras, solicitante vacío y mantenimiento',async t=>{
  const f=await fixture(t);await f.setup();const {data}=await f.request('/api/equipos','POST',equipment({status:'Mantenimiento'}));const id=data.item.id;
  const input={equipmentId:id,borrower:'Demo',loanDate:today()};
  assert.equal((await f.request('/api/prestamos','POST',input)).status,409);
  assert.equal((await f.request('/api/prestamos','POST',{...input,borrower:'  '})).status,400);
  assert.equal((await f.request('/api/prestamos','POST',{...input,loanDate:'2999-01-01'})).status,400);
  assert.equal((await f.request('/api/prestamos','POST',{...input,loanDate:'2026-02-30'})).status,400);
  assert.equal((await f.request('/api/prestamos','POST',{...input,dueDate:'2000-01-01'})).status,400);
});

test('Mutaciones requieren CSRF y rechazan solicitudes desde otro origen',async t=>{
  const f=await fixture(t);await f.setup();
  assert.equal((await f.request('/api/equipos','POST',equipment(),{'X-CSRF-Token':''})).status,403);
  assert.equal((await f.request('/api/equipos','POST',equipment(),{Origin:'https://otro.example'})).status,403);
  assert.equal((await f.request('/api/equipos','POST',equipment(),{'Sec-Fetch-Site':'cross-site'})).status,403);
  assert.equal((await f.request('/api/equipos')).data.total,0);
});

test('Exportación JSON sin credenciales y CSV protegido frente a fórmulas',async t=>{
  const f=await fixture(t);await f.setup();await f.request('/api/equipos','POST',equipment({name:'=1+1',notes:'Una "nota", especial'}));
  const csv=await f.request('/api/exportar?formato=csv');assert.equal(csv.status,200);assert.match(csv.data,/'=1\+1/);assert.match(csv.data,/""nota""/);
  const json=await f.request('/api/exportar');assert.equal(json.data.equipment.length,1);assert.equal(json.data.users,undefined);assert.equal(json.data.sessions,undefined);assert.match(json.headers.get('content-disposition'),/attachment/);
});

test('Los archivos de datos y servidor no son públicos; CSP y recursos correctos',async t=>{
  const f=await fixture(t);
  for(const path of ['/data/labtrack.sqlite','/server/auth.js','/package.json'])assert.equal((await f.request(path)).status,404);
  const index=await f.request('/');assert.equal(index.status,200);assert.match(index.headers.get('content-security-policy'),/script-src 'self'/);assert.match(index.data,/app.js/);
  for(const path of ['/styles.css','/app.js','/logo.svg'])assert.equal((await f.request(path)).status,200);
});

test('Datos y sesiones persisten al reiniciar el servidor y no reaparecen ejemplos eliminados',async t=>{
  const folder=await mkdtemp(join(tmpdir(),'labtrack-test-'));t.after(()=>rm(folder,{recursive:true,force:true}));const databasePath=join(folder,'test.sqlite');
  const app1=createApp({databasePath,seed:true});await new Promise(resolve=>app1.server.listen(0,'127.0.0.1',resolve));let base=`http://127.0.0.1:${app1.server.address().port}`;
  const setup=await fetch(base+'/api/setup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(credentials)});assert.equal(setup.status,201);const cookie=setup.headers.get('set-cookie').split(';')[0];
  app1.db.prepare('DELETE FROM equipment').run();await app1.close();
  const app2=createApp({databasePath,seed:true});await new Promise(resolve=>app2.server.listen(0,'127.0.0.1',resolve));t.after(()=>app2.close());base=`http://127.0.0.1:${app2.server.address().port}`;
  const response=await fetch(base+'/api/equipos',{headers:{Cookie:cookie}});assert.equal(response.status,200);assert.equal((await response.json()).total,0);
});

test('El acceso bloquea intentos repetidos sin invalidar la sesión existente',async t=>{
  const f=await fixture(t);await f.setup();
  for(let i=0;i<8;i++)assert.equal((await f.request('/api/login','POST',{username:'tester',password:'incorrecta'})).status,401);
  assert.equal((await f.request('/api/login','POST',credentials)).status,429);
  assert.equal((await f.request('/api/resumen')).status,200);
});
