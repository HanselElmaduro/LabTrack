import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';
import { openDatabase, CATEGORIES, today, transaction, logActivity } from './database.js';
import { createSession, getSession, destroySession, publicUser, passwordRecord, verifyPassword, validCsrf } from './auth.js';
import { HttpError, text, equipmentInput, loanInput, checkVersion } from './validation.js';
import { ensureDemoAdmin } from './demo-admin.js';

const here=dirname(fileURLToPath(import.meta.url));
const assets = new Map([['/',['index.html','text/html; charset=utf-8']],['/styles.css',['styles.css','text/css; charset=utf-8']],['/app.js',['app.js','text/javascript; charset=utf-8']],['/logo.svg',['logo.svg','image/svg+xml']]]);
const json=(res,status,body)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(body));};
async function bodyOf(req) {
  if(!String(req.headers['content-type']||'').startsWith('application/json')) throw new HttpError(415,'Utiliza un cuerpo JSON.');
  let raw='',size=0;
  for await(const chunk of req) {size+=chunk.length;if(size>16384)throw new HttpError(413,'El formulario es demasiado grande.');raw+=chunk;}
  try {const parsed=JSON.parse(raw);if(!parsed||Array.isArray(parsed)||typeof parsed!=='object')throw Error();return parsed;}
  catch{throw new HttpError(400,'El formulario no contiene JSON válido.');}
}
const equipmentSelect=`SELECT e.*,l.id AS loan_id,l.borrower,l.reference,l.loan_date,l.due_date FROM equipment e LEFT JOIN loans l ON l.equipment_id=e.id AND l.returned_at IS NULL`;
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();

export function createApp({databasePath=resolve(here,'../data/labtrack.sqlite'),seed=true,demoAdmin=seed,secureCookies=false}={}) {
  const db=openDatabase(databasePath,{seed}), attempts=new Map();
  if (demoAdmin) ensureDemoAdmin(db);
  const getEquipment=id=>{const item=db.prepare(equipmentSelect+' WHERE e.id=?').get(id);if(!item)throw new HttpError(404,'No se encontró el equipo.');return item;};
  const rateKey=req=>req.socket.remoteAddress||'local';
  const server=createServer(async(req,res)=>{
    res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
    res.setHeader('X-Frame-Options','DENY');res.setHeader('Cache-Control','no-store');
    res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    try {
      const url=new URL(req.url,'http://localhost'), path=url.pathname, method=req.method;
      if(method==='GET' && assets.has(path)) {
        const [file,type]=assets.get(path);const bytes=await readFile(resolve(here,'../public',file));
        res.writeHead(200,{'Content-Type':type});res.end(bytes);return;
      }
      if(!path.startsWith('/api/'))throw new HttpError(404,'Página no encontrada.');
      if(!['GET','POST','PUT','DELETE'].includes(method))throw new HttpError(405,'Método no permitido.');
      if(method!=='GET') {
        const origin=req.headers.origin;
        if((origin && new URL(origin).host!==req.headers.host)||req.headers['sec-fetch-site']==='cross-site')throw new HttpError(403,'La solicitud debe realizarse desde LabTrack.');
      }
      const session=getSession(db,req), setupRequired=!db.prepare('SELECT 1 FROM users LIMIT 1').get();
      if(path==='/api/session' && method==='GET')return json(res,200,{authenticated:Boolean(session),setupRequired,user:session?publicUser(session):null,csrfToken:session?.csrf_token||null});
      if(path==='/api/setup' && method==='POST') {
        if(!setupRequired)throw new HttpError(409,'La cuenta inicial ya fue creada. Inicia sesión.');
        const body=await bodyOf(req),name=text(body.name,'Nombre',{min:2,max:80}),username=text(body.username,'Usuario',{min:3,max:32}).toLowerCase();
        if(!/^[a-z0-9._-]+$/.test(username))throw new HttpError(400,'El usuario solo admite letras sin acentos, números, punto, guion y guion bajo.');
        const password=text(body.password,'Contraseña',{min:10,max:128});
        const record=await passwordRecord(password);
        const user=transaction(db,()=>{
          if(db.prepare('SELECT 1 FROM users LIMIT 1').get())throw new HttpError(409,'La cuenta inicial ya fue creada.');
          const result=db.prepare('INSERT INTO users(username,name,salt,password_hash) VALUES(?,?,?,?)').run(username,name,record.salt,record.hash);
          const item=db.prepare('SELECT * FROM users WHERE id=?').get(Number(result.lastInsertRowid));
          logActivity(db,item.id,'cuenta','Laboratorio configurado',`${item.name} creó la cuenta inicial.`);return item;
        });
        const csrfToken=createSession(db,user.id,res,secureCookies);return json(res,201,{user:publicUser(user),csrfToken});
      }
      if(path==='/api/login' && method==='POST') {
        const key=rateKey(req), now=Date.now(), previous=attempts.get(key);
        if(previous && previous.until>now && previous.count>=8)throw new HttpError(429,'Demasiados intentos. Espera cinco minutos antes de volver a intentar.');
        const body=await bodyOf(req),username=text(body.username,'Usuario',{max:32}),password=text(body.password,'Contraseña',{max:128});
        const user=db.prepare('SELECT * FROM users WHERE username=? COLLATE NOCASE').get(username);
        if(!await verifyPassword(password,user)) {
          const entry=previous&&previous.until>now?previous:{count:0,until:now+300000};entry.count++;attempts.set(key,entry);
          if(attempts.size>1000)for(const [ip,entry]of attempts)if(entry.until<now)attempts.delete(ip);
          throw new HttpError(401,'Usuario o contraseña incorrectos.');
        }
        attempts.delete(key);if(session)destroySession(db,session,res);
        const csrfToken=createSession(db,user.id,res,secureCookies);return json(res,200,{user:publicUser(user),csrfToken});
      }
      if(!session)throw new HttpError(401,'Inicia sesión para continuar.');
      if(method!=='GET' && !validCsrf(req,session))throw new HttpError(403,'La sesión necesita actualizarse. Recarga la página.');
      if(path==='/api/logout' && method==='POST'){destroySession(db,session,res);return json(res,200,{ok:true});}
      if(path==='/api/catalogos' && method==='GET')return json(res,200,{categories:CATEGORIES,today:today()});
      if(path==='/api/resumen' && method==='GET') {
        const counts={total:0,Disponible:0,Prestado:0,Mantenimiento:0};
        for(const row of db.prepare('SELECT status,COUNT(*) AS count FROM equipment GROUP BY status').all()){counts[row.status]=row.count;counts.total+=row.count;}
        const overdue=db.prepare("SELECT COUNT(*) AS count FROM loans WHERE returned_at IS NULL AND due_date<>'' AND due_date<?").get(today()).count;
        return json(res,200,{counts,overdue,recentEquipment:db.prepare(equipmentSelect+' ORDER BY e.created_at DESC,e.id DESC LIMIT 5').all(),activeLoans:db.prepare('SELECT * FROM loans WHERE returned_at IS NULL ORDER BY created_at DESC LIMIT 4').all(),activity:db.prepare('SELECT a.*,u.name AS user_name FROM activity a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 5').all()});
      }
      if(path==='/api/equipos' && method==='GET') {
        const query=normalize(url.searchParams.get('q')),status=url.searchParams.get('estado'),category=url.searchParams.get('categoria');
        const all=db.prepare(equipmentSelect+' ORDER BY e.id DESC').all().filter(e=>(!query||normalize(e.name+' '+e.code+' '+e.brand).includes(query))&&(!status||e.status===status)&&(!category||e.category===category));
        const limit=Math.min(50,Math.max(1,Number(url.searchParams.get('limit'))||10));const totalPages=Math.max(1,Math.ceil(all.length/limit)),page=Math.min(totalPages,Math.max(1,Math.floor(Number(url.searchParams.get('page'))||1)));
        return json(res,200,{items:all.slice((page-1)*limit,page*limit),total:all.length,page,totalPages,limit});
      }
      if(path==='/api/equipos' && method==='POST') {
        const input=equipmentInput(await bodyOf(req));
        const item=transaction(db,()=>{const result=db.prepare('INSERT INTO equipment(code,name,category,location,status,brand,notes) VALUES(?,?,?,?,?,?,?)').run(input.code,input.name,input.category,input.location,input.status,input.brand,input.notes);logActivity(db,session.id,'alta','Equipo registrado',`${input.code} · ${input.name}`);return getEquipment(Number(result.lastInsertRowid));});
        return json(res,201,{item});
      }
      const equipmentMatch=path.match(/^\/api\/equipos\/(\d+)$/);
      if(equipmentMatch) {
        const id=Number(equipmentMatch[1]);if(!Number.isSafeInteger(id))throw new HttpError(400,'Identificador inválido.');
        if(method==='GET'){const item=getEquipment(id);return json(res,200,{item,history:db.prepare('SELECT * FROM loans WHERE equipment_id=? ORDER BY id DESC LIMIT 20').all(id)});}
        if(method==='PUT') {
          const body=await bodyOf(req);
          const item=transaction(db,()=>{const current=getEquipment(id);checkVersion(body,current);const input=equipmentInput(body,current);
            db.prepare("UPDATE equipment SET code=?,name=?,category=?,location=?,status=?,brand=?,notes=?,version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(input.code,input.name,input.category,input.location,input.status,input.brand,input.notes,id);
            logActivity(db,session.id,'edicion','Equipo actualizado',`${input.code} · ${input.name}`);return getEquipment(id);
          });return json(res,200,{item});
        }
        if(method==='DELETE') {
          const body=await bodyOf(req);
          transaction(db,()=>{const current=getEquipment(id);checkVersion(body,current);if(current.status==='Prestado')throw new HttpError(409,'Devuelve el equipo antes de eliminarlo.');
            db.prepare('DELETE FROM equipment WHERE id=?').run(id);logActivity(db,session.id,'baja','Equipo eliminado',`${current.code} · ${current.name}`);
          });return json(res,200,{ok:true});
        }
      }
      if(path==='/api/prestamos' && method==='GET') {
        const query=normalize(url.searchParams.get('q')),status=url.searchParams.get('estado')||'activos';
        const items=db.prepare('SELECT l.*,u.name AS created_by_name FROM loans l JOIN users u ON u.id=l.created_by ORDER BY l.id DESC').all().filter(l=>(status==='todos'||(status==='devueltos'?Boolean(l.returned_at):!l.returned_at))&&(!query||normalize(l.borrower+' '+l.equipment_name+' '+l.equipment_code+' '+l.reference).includes(query)));
        return json(res,200,{items,today:today()});
      }
      if(path==='/api/prestamos' && method==='POST') {
        const input=loanInput(await bodyOf(req));
        const item=transaction(db,()=>{const equipment=getEquipment(input.equipmentId);if(equipment.status!=='Disponible')throw new HttpError(409,'El equipo ya no está disponible. Actualiza la lista.');
          const result=db.prepare('INSERT INTO loans(equipment_id,equipment_code,equipment_name,borrower,reference,loan_date,due_date,created_by) VALUES(?,?,?,?,?,?,?,?)').run(equipment.id,equipment.code,equipment.name,input.borrower,input.reference,input.loanDate,input.dueDate,session.id);
          db.prepare("UPDATE equipment SET status='Prestado',version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(equipment.id);
          logActivity(db,session.id,'prestamo','Préstamo registrado',`${equipment.code} · ${input.borrower}`);return db.prepare('SELECT * FROM loans WHERE id=?').get(Number(result.lastInsertRowid));
        });return json(res,201,{item});
      }
      const returnMatch=path.match(/^\/api\/prestamos\/(\d+)\/devolver$/);
      if(returnMatch && method==='POST') {
        transaction(db,()=>{const loan=db.prepare('SELECT * FROM loans WHERE id=?').get(Number(returnMatch[1]));if(!loan)throw new HttpError(404,'Préstamo no encontrado.');if(loan.returned_at)throw new HttpError(409,'La devolución ya fue registrada.');
          db.prepare("UPDATE loans SET returned_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(loan.id);
          db.prepare("UPDATE equipment SET status='Disponible',version=version+1,updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id=?").run(loan.equipment_id);
          logActivity(db,session.id,'devolucion','Devolución registrada',`${loan.equipment_code} · ${loan.borrower}`);
        });return json(res,200,{ok:true});
      }
      if(path==='/api/actividad' && method==='GET') {
        const query=normalize(url.searchParams.get('q')),kind=url.searchParams.get('tipo');
        const items=db.prepare('SELECT a.*,u.name AS user_name FROM activity a LEFT JOIN users u ON u.id=a.user_id ORDER BY a.id DESC LIMIT 500').all().filter(a=>(!kind||a.kind===kind)&&(!query||normalize(a.title+' '+a.detail+' '+a.user_name).includes(query)));
        return json(res,200,{items});
      }
      if(path==='/api/exportar' && method==='GET') {
        const equipment=db.prepare('SELECT * FROM equipment ORDER BY id').all();
        if(url.searchParams.get('formato')==='csv') {
          const safe=value=>'"'+String(value??'').replace(/^[=+@\-\t\r]/,"'$&").replace(/"/g,'""')+'"';
          const fields=['code','name','category','location','status','brand','notes'];
          const csv='\uFEFF'+[['Código','Nombre','Categoría','Ubicación','Estado','Marca / modelo','Notas'],...equipment.map(e=>fields.map(f=>e[f]))].map(row=>row.map(safe).join(',')).join('\r\n');
          res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="LabTrack_inventario_${today()}.csv"`});return res.end(csv);
        }
        res.setHeader('Content-Disposition',`attachment; filename="LabTrack_respaldo_${today()}.json"`);
        return json(res,200,{system:'LabTrack',version:2,exportedAt:new Date().toISOString(),equipment,loans:db.prepare('SELECT * FROM loans ORDER BY id').all()});
      }
      throw new HttpError(404,'Ruta no encontrada.');
    } catch(error) {
      if(res.headersSent){res.end();return;}
      const duplicate=/UNIQUE constraint failed: equipment.code/.test(error.message);
      if(!error.status && !duplicate)console.error('Error de LabTrack:',error.message);
      json(res,duplicate?409:error.status||500,{error:duplicate?'Ya existe un equipo con ese código.':error.status?error.message:'No se pudo completar la operación. Intenta de nuevo.'});
    }
  });
  return {server,db,close:()=>new Promise((resolve,reject)=>server.close(error=>{db.close();error?reject(error):resolve();}))};
}

if(process.argv[1] && resolve(process.argv[1])===fileURLToPath(import.meta.url)) {
  const app=createApp({databasePath:process.env.LABTRACK_DB_PATH||resolve(here,'../data/labtrack.sqlite'),secureCookies:process.env.LABTRACK_SECURE_COOKIE==='1'});
  const host=process.env.HOST||(process.argv.includes('--host')?'0.0.0.0':'127.0.0.1');
  const portArg=process.argv.indexOf('--port');
  const port=Number(process.env.PORT || (portArg>=0?process.argv[portArg+1]:3000));
  app.server.listen(port,host,()=>console.log(`LabTrack: http://${host==='0.0.0.0'?'localhost':host}:${port}\nBase de datos SQLite preparada. Demo local: admin / 1234. En instalaciones existentes, habilita ese acceso con npm run demo:admin.`));
  for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>app.close().then(()=>process.exit(0)));
}

