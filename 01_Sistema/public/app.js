const $ = id => document.getElementById(id);
const paths = {
  dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  box:'m12 3 9 5v8l-9 5-9-5V8z M3 8l9 5 9-5 M12 13v8 M7.5 5.5l9 5',
  arrows:'M4 7h15m-4-4 4 4-4 4 M20 17H5m4-4-4 4 4 4',
  clock:'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0 M12 7v5l3 2',
  building:'M4 21V5h10v16 M14 10h6v11 M2 21h20 M8 9h2 M8 13h2 M8 17h2 M17 14h1 M17 17h1',
  plus:'M12 5v14 M5 12h14', check:'m5 12 4 4L19 6', x:'m6 6 12 12 M6 18 18 6',
  logout:'M9 4H4v16h5 M10 12h11 M17 8l4 4-4 4', menu:'M4 6h16 M4 12h16 M4 18h16',
  search:'M20 20l-5-5 M17 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0',
  download:'M12 3v12 M7 10l5 5 5-5 M4 15v5h16v-5', arrow:'M5 12h14 M14 7l5 5-5 5',
  edit:'m15 4 5 5 M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14z',
  trash:'M3 6h18 M9 6V3h6v3 M5 6l1 15h12l1-15 M10 10v7 M14 10v7',
  eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7 M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
  tool:'m14 6 4 4 M14 6a5 5 0 0 1 7-3l-4 4 3 3 4-4a5 5 0 0 1-7 7L7 22l-4-4 9-9a5 5 0 0 1 2-3',
  monitor:'M3 4h18v13H3z M12 17v4 M8 21h8', shield:'m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
  spark:'m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z',
  chevronLeft:'m14 6-6 6 6 6', chevronRight:'m10 6 6 6-6 6',
  alert:'m12 3 10 18H2z M12 9v4 M12 17h.01', refresh:'M20 7v5h-5 M4 17v-5h5 M5 7a8 8 0 0 1 13-2l2 2 M4 17l2 2a8 8 0 0 0 13-2',
};
const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="${paths[name] || paths.box}"/></svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = { user:null, csrf:null, setup:false, view:'resumen', categories:[], today:'', summary:null, equipment:null, page:1, q:'', status:'', category:'', loanTab:'activos', loanQ:'', activityQ:'', activityType:'', editing:null, confirmation:null, requestId:0 };
const statusClass = value => ({Prestado:'amber',Mantenimiento:'purple',Devuelto:'neutral',Vencido:'red'}[value] || '');
const badge = value => `<span class="badge ${statusClass(value)}"><i></i>${esc(value)}</span>`;
const categoryIcon = category => ['Cómputo','Audiovisual'].includes(category)?'monitor':category==='Herramientas'?'tool':'box';
const initials = name => name.trim().split(/\s+/).slice(0,2).map(x=>x[0]).join('').toUpperCase();
const shortDate = value => value?new Intl.DateTimeFormat('es-DO',{day:'2-digit',month:'short',year:'numeric',timeZone:'America/Santo_Domingo'}).format(new Date(value.length===10?value+'T12:00:00Z':value)):'Sin fecha';
const dateTime = value => new Intl.DateTimeFormat('es-DO',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'America/Santo_Domingo'}).format(new Date(value));
const relativeTime = value => {const min=Math.max(0,Math.floor((Date.now()-Date.parse(value))/60000));return min<1?'Ahora':min<60?`Hace ${min} min`:min<1440?`Hace ${Math.floor(min/60)} h`:shortDate(value);};

async function api(path,options={}) {
  let response;
  try {response=await fetch(path,{...options,headers:{...(options.body?{'Content-Type':'application/json'}:{}),...(options.method&&options.method!=='GET'&&state.csrf?{'X-CSRF-Token':state.csrf}:{}),...options.headers},credentials:'same-origin'});}
  catch{setConnection(false);throw Error('No podemos conectar con el servidor. Comprueba que LabTrack sigue abierto e intenta de nuevo.');}
  const data=await response.json();
  if(!response.ok){if(response.status===401 && state.user){state.user=null;state.csrf=null;await boot();}throw Error(data.error||'No se pudo completar la operación.');}
  setConnection(true);return data;
}
const write = (path,body,method='POST') => api(path,{method,body:JSON.stringify(body)});
function setConnection(online){const element=document.querySelector('.connection');element.classList.toggle('offline',!online);element.innerHTML=`<i></i>${online?'Sistema conectado':'Sin conexión'}`;}
function toast(message,error=false){const item=document.createElement('div');item.className='toast'+(error?' error':'');item.innerHTML=icon(error?'alert':'check')+`<span>${esc(message)}</span>`;$('toast-container').append(item);setTimeout(()=>item.remove(),6000);}
function setBusy(button,busy){if(busy){button.dataset.previousText=button.textContent;button.disabled=true;button.textContent='Guardando…';}else{button.disabled=false;button.textContent=button.dataset.previousText||'Guardar';}}
function fillIcons(){document.querySelectorAll('[data-icon]').forEach(e=>{e.innerHTML=icon(e.dataset.icon);});}
function empty(title,description,action=''){return `<div class="empty-state"><div class="empty-icon">${icon('box')}</div><h3>${esc(title)}</h3><p>${esc(description)}</p>${action}</div>`;}
function equipmentCell(item){const idx=Math.max(0,state.categories.indexOf(item.category))%4;return `<div class="equipment-cell"><span class="equipment-avatar c${idx}">${icon(categoryIcon(item.category))}</span><div><b>${esc(item.name)}</b><small>${esc(item.brand||item.category)}</small></div></div>`;}
function actionButton(action,id,label,symbol,extra=''){return `<button class="icon-button ${extra}" data-action="${action}" data-id="${id}" aria-label="${esc(label)}" title="${esc(label)}">${icon(symbol)}</button>`;}
function equipmentRows(items,compact=false){return items.map(item=>`<tr>${compact?'':`<td><span class="code-label">${esc(item.code)}</span></td>`}<td>${equipmentCell(item)}</td>${compact?'':`<td>${esc(item.category)}</td>`}<td>${esc(item.location)}</td><td>${badge(item.status)}${item.borrower?`<small class="borrower-label">${esc(item.borrower)} · ${shortDate(item.loan_date)}</small>`:''}</td><td><div class="row-actions">${actionButton('detail',item.id,`Ver ${item.code}`,'eye')}${compact?'':actionButton('edit',item.id,`Editar ${item.code}`,'edit')}${compact?'':item.status==='Disponible'?actionButton('lend',item.id,`Prestar ${item.code}`,'arrows'):item.status==='Prestado'?actionButton('return',item.loan_id,`Devolver ${item.code}`,'arrows'):''}${compact?'':actionButton('delete',item.id,`Eliminar ${item.code}`,'trash','danger-icon')}</div></td></tr>`).join('');}
function activityRows(items,full=false){return items.map(a=>`<div class="activity-item"><div class="activity-symbol">${icon({alta:'plus',edicion:'edit',baja:'trash',prestamo:'arrows',devolucion:'check',cuenta:'shield'}[a.kind])}</div><div class="activity-content"><b>${esc(a.title)}</b><p>${esc(a.detail)}</p>${full?`<small>Registrado por ${esc(a.user_name||'Sistema')} · ${dateTime(a.created_at)}</small>`:''}</div><span class="activity-time">${relativeTime(a.created_at)}</span></div>`).join('');}

async function boot(){
  try {
    const data=await api('/api/session');state.setup=data.setupRequired;state.user=data.user;state.csrf=data.csrfToken;
    $('auth').hidden=Boolean(state.user);$('application').hidden=!state.user;$('auth-retry').hidden=true;
    if(!state.user){$('auth-title').textContent=state.setup?'Prepara tu laboratorio':'Qué bueno verte de nuevo';$('auth-description').textContent=state.setup?'Crea tu cuenta de administrador para empezar a organizar tus equipos.':'Inicia sesión y continúa donde lo dejaste.';$('setup-name').hidden=!state.setup;$('auth-name').required=state.setup;$('password-help').hidden=!state.setup;$('auth-password').minLength=state.setup?10:1;$('auth-password').autocomplete=state.setup?'new-password':'current-password';$('auth-submit').textContent=state.setup?'Crear cuenta y entrar':'Entrar a LabTrack';$('auth-form').hidden=false;$('auth-error').textContent='';return;}
    const catalog=await api('/api/catalogos');state.categories=catalog.categories;state.today=catalog.today;
    $('user-name').textContent=state.user.name;$('user-avatar').textContent=$('top-avatar').textContent=initials(state.user.name);
    $('today-label').textContent=new Intl.DateTimeFormat('es-DO',{day:'numeric',month:'long',year:'numeric',timeZone:'America/Santo_Domingo'}).format(new Date());
    $('equipment-category').innerHTML=state.categories.map(c=>`<option>${esc(c)}</option>`).join('');
    await route();
  }catch(error){$('auth-title').textContent='Conectemos tu laboratorio';$('auth-description').textContent=error.message;$('auth-retry').hidden=false;$('auth-form').hidden=true;}
}

function dashboard(data){
  const c=data.counts,total=c.total;
  const stats=[['Total de equipos',total,'Inventario registrado','box',''],['Disponibles',c.Disponible,'Listos para un nuevo préstamo','check','green'],['En préstamo',c.Prestado,data.overdue?`${data.overdue} con fecha prevista vencida`:'Seguimiento de préstamos activos','arrows','amber'],['En mantenimiento',c.Mantenimiento,'Equipos en revisión','tool','purple']];
  const green=total?c.Disponible/total*100:0,amber=total?c.Prestado/total*100:0;
  return `<section class="hero"><div class="hero-copy"><span class="eyebrow">TODO EN SU LUGAR</span><h2>Un laboratorio organizado<br>empieza aquí.</h2><p>Consulta tus equipos, gestiona préstamos y ten una visión clara de lo que está pasando.</p></div><div class="hero-visual" aria-hidden="true"><div class="hero-mini-card">${icon('box')}<div class="mini-lines"></div><strong>${total} equipos</strong><div class="mini-lines short"></div></div><div class="hero-mini-tag">${icon('check')} Inventario actualizado</div></div></section>
    <section class="stats-grid" aria-label="Indicadores del inventario">${stats.map(([label,value,caption,symbol,color])=>`<article class="stat-card"><div class="stat-top"><span>${label}</span><span class="stat-icon ${color}">${icon(symbol)}</span></div><div class="stat-number">${value}</div><span class="stat-caption"><i class="tiny-dot"></i>${esc(caption)}</span></article>`).join('')}</section>
    <div class="dashboard-grid"><section class="panel"><div class="panel-header"><div><h2>Equipos recientes</h2><p>Las últimas incorporaciones a tu inventario.</p></div><a class="text-link" href="#equipos">Ver inventario ${icon('arrow')}</a></div>${data.recentEquipment.length?`<div class="table-scroll"><table><thead><tr><th>Equipo</th><th>Ubicación</th><th>Estado</th><th><span class="sr-only">Acciones</span></th></tr></thead><tbody>${equipmentRows(data.recentEquipment,true)}</tbody></table></div>`:empty('El primer equipo es el comienzo','Registra un equipo para empezar a construir tu inventario.',`<button class="button primary small-button" data-action="new">Registrar equipo</button>`)}</section>
    <section class="panel distribution-panel"><div class="panel-header"><div><h2>Estado del inventario</h2><p>Una vista de todos tus equipos.</p></div></div><div class="distribution-body"><div class="donut-wrap"><div class="donut" style="background:${total?`conic-gradient(#69b899 0% ${green}%,#e9bb6a ${green}% ${green+amber}%,#a493d0 ${green+amber}% 100%)`:'#eef2f8'}"><div class="donut-center"><b>${total}</b><small>equipos en total</small></div></div></div><div class="legend">${[['Disponible','#69b899'],['Prestado','#e9bb6a'],['Mantenimiento','#a493d0']].map(([key,color])=>`<div class="legend-row"><i class="legend-dot" style="background:${color}"></i>${key==='Prestado'?'En préstamo':key==='Disponible'?'Disponibles':'Mantenimiento'}<b>${c[key]}</b><small>${total?Math.round(c[key]/total*100):0}%</small></div>`).join('')}</div></div><div class="panel-note">${icon('refresh')} Se actualiza con cada operación.</div></section></div>
    <div class="dashboard-bottom"><section class="panel"><div class="panel-header"><div><h2>Préstamos en curso</h2><p>Equipos que están fuera del laboratorio.</p></div><a class="text-link" href="#prestamos">Ver todos ${icon('arrow')}</a></div>${data.activeLoans.length?data.activeLoans.map(l=>`<div class="loan-preview"><span class="equipment-avatar">${icon('arrows')}</span><div class="loan-info"><b>${esc(l.equipment_name)}</b><small>${esc(l.borrower)} · ${esc(l.equipment_code)}</small></div><button class="button secondary small-button" data-action="return" data-id="${l.id}">Devolver</button></div>`).join(''):empty('Todo está en su lugar','Cuando registres un préstamo, podrás darle seguimiento desde aquí.',`<button class="text-link" data-action="new-loan">Registrar un préstamo ${icon('arrow')}</button>`)}</section><section class="panel"><div class="panel-header"><div><h2>Actividad reciente</h2><p>Los últimos movimientos de tu laboratorio.</p></div><a class="text-link" href="#actividad">Ver actividad ${icon('arrow')}</a></div><div class="activity-list">${data.activity.length?activityRows(data.activity):empty('Aún no hay movimientos','Las operaciones del equipo aparecerán aquí.')}</div></section></div>`;
}

function equipmentView(data){const start=data.total?(data.page-1)*data.limit+1:0,end=Math.min(data.page*data.limit,data.total);return `<section class="panel"><div class="table-toolbar"><div class="search-field"><span>${icon('search')}</span><input id="equipment-search" aria-label="Buscar equipos" placeholder="Buscar por nombre, código o marca…" value="${esc(state.q)}"></div><select id="status-filter" aria-label="Filtrar por estado"><option value="">Todos los estados</option>${['Disponible','Prestado','Mantenimiento'].map(s=>`<option ${state.status===s?'selected':''}>${s}</option>`).join('')}</select><select id="category-filter" aria-label="Filtrar por categoría"><option value="">Todas las categorías</option>${state.categories.map(c=>`<option ${state.category===c?'selected':''}>${esc(c)}</option>`).join('')}</select>${state.q||state.status||state.category?'<button class="text-link" data-action="clear-filters">Limpiar filtros</button>':''}</div>
    ${data.items.length?`<div class="table-scroll"><table><thead><tr><th>Código</th><th>Equipo</th><th>Categoría</th><th>Ubicación</th><th>Estado</th><th>Acciones</th></tr></thead><tbody>${equipmentRows(data.items)}</tbody></table></div>`:empty('No encontramos equipos',state.q||state.status||state.category?'Prueba otra búsqueda o limpia los filtros para ver el inventario.':'Registra el primer equipo de tu laboratorio.')}
    <div class="table-footer"><span>Mostrando ${start}–${end} de ${data.total} equipos</span><div class="pagination"><button class="icon-button" data-action="previous-page" aria-label="Página anterior" ${data.page===1?'disabled':''}>${icon('chevronLeft')}</button><span class="page-current">${data.page} / ${data.totalPages}</span><button class="icon-button" data-action="next-page" aria-label="Página siguiente" ${data.page===data.totalPages?'disabled':''}>${icon('chevronRight')}</button></div></div></section>`;}

function loansView(data){const items=data.items,overdue=items.filter(l=>!l.returned_at&&l.due_date&&l.due_date<state.today).length;return `${overdue?`<div class="notice">${icon('alert')}<span>${overdue} préstamo${overdue===1?' tiene':'s tienen'} una devolución prevista vencida. Revisa su estado con el solicitante.</span></div>`:''}<section class="panel"><div class="tabs" role="group" aria-label="Estado de préstamos">${[['activos','En curso'],['devueltos','Devueltos'],['todos','Historial completo']].map(([key,label])=>`<button class="${state.loanTab===key?'active':''}" data-action="loan-tab" data-tab="${key}" aria-pressed="${state.loanTab===key}">${label}</button>`).join('')}</div><div class="table-toolbar"><div class="search-field"><span>${icon('search')}</span><input id="loan-search" aria-label="Buscar préstamos" placeholder="Buscar equipo o solicitante…" value="${esc(state.loanQ)}"></div><span class="muted">${items.length} registro${items.length===1?'':'s'}</span></div>${items.length?`<div class="table-scroll"><table><thead><tr><th>Equipo</th><th>Solicitante</th><th>Fecha de préstamo</th><th>Devolución prevista</th><th>Estado</th><th>Acción</th></tr></thead><tbody>${items.map(l=>`<tr><td><div class="equipment-cell"><span class="equipment-avatar">${icon('box')}</span><div><b>${esc(l.equipment_name)}</b><small>${esc(l.equipment_code)}${l.equipment_id?'':' · Equipo eliminado'}</small></div></div></td><td><div class="equipment-cell"><div><b>${esc(l.borrower)}</b><small>${esc(l.reference||'Sin referencia')}</small></div></div></td><td>${shortDate(l.loan_date)}</td><td>${l.due_date?shortDate(l.due_date):'No indicada'}</td><td>${badge(l.returned_at?'Devuelto':l.due_date&&l.due_date<state.today?'Vencido':'Prestado')}</td><td>${l.returned_at?`<span class="muted">${shortDate(l.returned_at)}</span>`:`<button class="button secondary small-button" data-action="return" data-id="${l.id}">${icon('check')} Devolver</button>`}</td></tr>`).join('')}</tbody></table></div>`:empty('Sin préstamos en esta vista','Registra un préstamo o cambia de pestaña para consultar el historial.',`<button class="button primary small-button" data-action="new-loan">Registrar préstamo</button>`)}</section>`;}

function activityView(data){return `<section class="panel"><div class="table-toolbar"><div class="search-field"><span>${icon('search')}</span><input id="activity-search" aria-label="Buscar actividad" placeholder="Buscar un movimiento…" value="${esc(state.activityQ)}"></div><select id="activity-filter" aria-label="Filtrar por tipo de actividad"><option value="">Todos los movimientos</option>${[['alta','Registros'],['edicion','Actualizaciones'],['baja','Eliminaciones'],['prestamo','Préstamos'],['devolucion','Devoluciones'],['cuenta','Configuración']].map(([key,label])=>`<option value="${key}" ${state.activityType===key?'selected':''}>${label}</option>`).join('')}</select></div><div class="panel-header"><div><h2>Historial de movimientos</h2><p>Hasta los últimos 500 movimientos. Los registros se generan automáticamente.</p></div><span class="muted">${data.items.length} registros</span></div><div class="activity-list">${data.items.length?activityRows(data.items,true):empty('No encontramos movimientos','Prueba otro filtro o registra una operación en el inventario.')}</div></section>`;}

async function route(){
  if(!state.user)return;
  const requested=location.hash.slice(1);state.view=['resumen','equipos','prestamos','actividad'].includes(requested)?requested:'resumen';
  setNavOpen(false);document.querySelectorAll('[data-view]').forEach(e=>{const active=e.dataset.view===state.view;e.classList.toggle('active',active);if(active)e.setAttribute('aria-current','page');else e.removeAttribute('aria-current');});
  const labels={resumen:['UNA VISTA CLARA DE TU LABORATORIO','Resumen general','Equipos organizados, decisiones más sencillas.','Resumen'],equipos:['CADA EQUIPO CUENTA','Inventario de equipos','Consulta, organiza y mantén al día todos tus equipos.','Equipos'],prestamos:['UN SEGUIMIENTO DE PRINCIPIO A FIN','Préstamos y devoluciones','Conoce quién tiene cada equipo y registra su regreso.','Préstamos'],actividad:['CADA MOVIMIENTO, EN UN SOLO LUGAR','Actividad del laboratorio','Consulta el historial de operaciones de tu equipo.','Actividad']}[state.view];
  [$('page-eyebrow').textContent,$('page-title').textContent,$('page-description').textContent,$('breadcrumb-current').textContent]=labels;
  $('page-actions').innerHTML=state.view==='actividad'?`<button class="button secondary" data-action="refresh">${icon('refresh')} Actualizar</button>`:state.view==='prestamos'?`<button class="button primary" data-action="new-loan">${icon('plus')} Nuevo préstamo</button>`:`<a class="button secondary" href="/api/exportar?formato=csv" download>${icon('download')} Exportar CSV</a><button class="button primary" data-action="new">${icon('plus')} Nuevo equipo</button>`;
  $('view-content').innerHTML='<div class="loading-state"><div class="spinner"></div>Cargando tu laboratorio…</div>';
  await loadView();
}

async function loadView({preserveFocus=false}={}){
  if(!state.user)return;
  const ticket=++state.requestId,active=document.activeElement,focusId=preserveFocus?active?.id:null,selection=focusId&&active.selectionStart;
  try {
    const summary=await api('/api/resumen');let html;
    if(state.view==='resumen')html=dashboard(summary);
    if(state.view==='equipos'){const params=new URLSearchParams({q:state.q,estado:state.status,categoria:state.category,page:String(state.page),limit:'10'});const data=await api('/api/equipos?'+params);state.equipment=data;state.page=data.page;html=equipmentView(data);}
    if(state.view==='prestamos')html=loansView(await api('/api/prestamos?'+new URLSearchParams({q:state.loanQ,estado:state.loanTab})));
    if(state.view==='actividad')html=activityView(await api('/api/actividad?'+new URLSearchParams({q:state.activityQ,tipo:state.activityType})));
    if(ticket!==state.requestId)return;
    state.summary=summary;$('nav-total').textContent=summary.counts.total;$('nav-loans').textContent=summary.counts.Prestado;$('nav-loans').hidden=!summary.counts.Prestado;
    $('view-content').innerHTML=html;$('updated-label').textContent='Actualizado a las '+new Intl.DateTimeFormat('es-DO',{hour:'2-digit',minute:'2-digit'}).format(new Date());
    if(focusId&&$(focusId)){const input=$(focusId);input.focus();if(typeof selection==='number')input.setSelectionRange(selection,selection);}
  }catch(error){if(ticket===state.requestId){$('view-content').innerHTML=empty('No pudimos cargar esta vista',error.message,'<button class="button secondary" data-action="refresh">Reintentar</button>');toast(error.message,true);}}
}

async function openEquipment(id){
  const item=id?(await api('/api/equipos/'+id)).item:null;state.editing=item;
  $('equipment-form').reset();$('equipment-error').textContent='';$('equipment-title').textContent=item?'Editar equipo':'Registrar equipo';
  for(const field of ['code','name','category','location','brand','notes','status']){const input=$('equipment-'+field);if(item)input.value=item[field];}
  $('equipment-status').disabled=item?.status==='Prestado';$('equipment-status-help').hidden=item?.status!=='Prestado';
  $('equipment-dialog').showModal();
}

async function openLoan(equipmentId){
  const records=[];let page=1,more=true;
  while(more){const data=await api('/api/equipos?estado=Disponible&limit=50&page='+page);records.push(...data.items);more=page<data.totalPages;page++;}
  if(!records.length){toast('No hay equipos disponibles para prestar.',true);return;}
  if(equipmentId&&!records.some(x=>x.id===equipmentId)){toast('El equipo ya no está disponible. Actualiza la lista.',true);await loadView();return;}
  $('loan-form').reset();$('loan-error').textContent='';$('loan-equipment').innerHTML=records.map(e=>`<option value="${e.id}">${esc(e.code)} · ${esc(e.name)}</option>`).join('');if(equipmentId)$('loan-equipment').value=equipmentId;
  $('loan-date').value=state.today;$('loan-date').max=state.today;$('loan-due').min=state.today;$('loan-dialog').showModal();
}

function confirmAction({title,description,label,danger,action}){
  state.confirmation=action;$('confirm-title').textContent=title;$('confirm-description').textContent=description;$('confirm-error').textContent='';$('confirm-accept').textContent=label;$('confirm-accept').className='button '+(danger?'danger':'primary');$('confirm-icon').className='confirm-icon'+(danger?'':' success');$('confirm-icon').innerHTML=icon(danger?'trash':'check');$('confirm-dialog').showModal();
}
async function openDetail(id){const {item,history}=await api('/api/equipos/'+id);$('detail-title').textContent=item.name;$('detail-content').innerHTML=`<div class="detail-heading"><span class="equipment-avatar">${icon(categoryIcon(item.category))}</span><div><span class="code-label">${esc(item.code)}</span><div style="margin-top:7px">${badge(item.status)}</div></div></div><dl class="detail-fields">${[['Categoría',item.category],['Ubicación',item.location],['Marca / modelo',item.brand||'No indicada'],['Última actualización',dateTime(item.updated_at)]].map(([key,value])=>`<div><dt>${key}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>${item.notes?`<div class="detail-notes">${esc(item.notes)}</div>`:''}${item.borrower?`<div class="notice" style="margin-top:15px">${icon('arrows')}<span>Prestado a <b>${esc(item.borrower)}</b> desde ${shortDate(item.loan_date)}.</span></div>`:''}<section class="detail-history"><h3>Últimos préstamos</h3>${history.length?history.map(l=>`<div class="detail-history-item"><div>${esc(l.borrower)}<small>${shortDate(l.loan_date)}${l.returned_at?' · Devuelto '+shortDate(l.returned_at):''}</small></div>${badge(l.returned_at?'Devuelto':'Prestado')}</div>`).join(''):'<p class="muted">Este equipo aún no registra préstamos.</p>'}</section><div class="modal-footer"><a class="button secondary" href="/api/exportar" download>${icon('download')} Respaldo JSON</a><button class="button primary" data-close="detail-dialog">Cerrar ficha</button></div>`;$('detail-dialog').showModal();}
function setNavOpen(open){document.body.classList.toggle('nav-open',open);$('nav-overlay').hidden=!open;$('toggle-nav').setAttribute('aria-expanded',String(open));}

document.addEventListener('click',async event=>{
  const close=event.target.closest('[data-close]');if(close){$(close.dataset.close).close();return;}
  const button=event.target.closest('[data-action]');if(!button)return;
  const id=Number(button.dataset.id),action=button.dataset.action;
  try {
    if(action==='new')await openEquipment();if(action==='edit')await openEquipment(id);if(action==='detail')await openDetail(id);
    if(action==='lend')await openLoan(id);if(action==='new-loan')await openLoan();
    if(action==='delete'){const {item}=await api('/api/equipos/'+id);if(item.status==='Prestado'){toast('Registra la devolución antes de eliminar este equipo.',true);return;}confirmAction({title:'¿Eliminar este equipo?',description:`${item.code} · ${item.name} se eliminará del inventario. El historial de préstamos se conservará. Esta acción no se puede deshacer.`,label:'Eliminar equipo',danger:true,action:async()=>{await write('/api/equipos/'+id,{version:item.version},'DELETE');toast('Equipo eliminado del inventario.');}});}
    if(action==='return'){confirmAction({title:'¿El equipo ya regresó?',description:'Al confirmar, el equipo volverá a estar disponible y el préstamo quedará guardado en el historial.',label:'Confirmar devolución',danger:false,action:async()=>{await write('/api/prestamos/'+id+'/devolver',{});toast('Devolución registrada. El equipo está disponible.');}});}
    if(action==='previous-page'){state.page--;await loadView();}if(action==='next-page'){state.page++;await loadView();}
    if(action==='clear-filters'){state.q=state.status=state.category='';state.page=1;await loadView();}
    if(action==='loan-tab'){state.loanTab=button.dataset.tab;await loadView();}if(action==='refresh')await loadView();
  }catch(error){toast(error.message,true);}
});

$('auth-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('auth-submit');$('auth-error').textContent='';setBusy(button,true);try{const result=await write(state.setup?'/api/setup':'/api/login',{name:$('auth-name').value,username:$('auth-user').value,password:$('auth-password').value});state.csrf=result.csrfToken;$('auth-password').value='';await boot();}catch(error){$('auth-error').textContent=error.message;}finally{setBusy(button,false);}});
$('auth-retry').onclick=boot;
$('toggle-password').innerHTML=icon('eye');$('auth-note-icon').innerHTML=icon('shield');
$('toggle-password').onclick=()=>{const field=$('auth-password');field.type=field.type==='password'?'text':'password';$('toggle-password').setAttribute('aria-label',field.type==='password'?'Mostrar contraseña':'Ocultar contraseña');};
$('equipment-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('equipment-save');$('equipment-error').textContent='';setBusy(button,true);try{const body=Object.fromEntries(new FormData(event.currentTarget));if(state.editing){body.version=state.editing.version;if(state.editing.status==='Prestado')body.status='Prestado';}await write('/api/equipos'+(state.editing?'/'+state.editing.id:''),body,state.editing?'PUT':'POST');$('equipment-dialog').close();state.page=1;toast(state.editing?'Equipo actualizado correctamente.':'Equipo registrado correctamente.');await loadView();}catch(error){$('equipment-error').textContent=error.message;}finally{setBusy(button,false);}});
$('loan-form').addEventListener('submit',async event=>{event.preventDefault();const button=$('loan-save');$('loan-error').textContent='';setBusy(button,true);try{const body=Object.fromEntries(new FormData(event.currentTarget));body.equipmentId=Number(body.equipmentId);await write('/api/prestamos',body);$('loan-dialog').close();toast('Préstamo registrado. Puedes consultarlo en Préstamos.');await loadView();}catch(error){$('loan-error').textContent=error.message;}finally{setBusy(button,false);}});
$('loan-date').addEventListener('change',()=>{$('loan-due').min=$('loan-date').value;});
$('confirm-accept').onclick=async()=>{const button=$('confirm-accept');setBusy(button,true);try{await state.confirmation();$('confirm-dialog').close();await loadView();}catch(error){$('confirm-error').textContent=error.message;}finally{setBusy(button,false);}};
$('logout').onclick=async()=>{try{await write('/api/logout',{});state.user=null;state.csrf=null;state.requestId++;await boot();toast('Sesión cerrada. Tus datos siguen guardados.');}catch(error){toast(error.message,true);}};
$('toggle-nav').onclick=()=>setNavOpen(!document.body.classList.contains('nav-open'));$('nav-overlay').onclick=()=>setNavOpen(false);
document.addEventListener('keydown',event=>{if(event.key==='Escape')setNavOpen(false);});
let debounce;
document.addEventListener('input',event=>{const mapping={'equipment-search':'q','loan-search':'loanQ','activity-search':'activityQ'},key=mapping[event.target.id];if(key){state[key]=event.target.value;state.page=1;clearTimeout(debounce);debounce=setTimeout(()=>loadView({preserveFocus:true}),280);}});
document.addEventListener('change',async event=>{const mapping={'status-filter':'status','category-filter':'category','activity-filter':'activityType'},key=mapping[event.target.id];if(key){state[key]=event.target.value;state.page=1;await loadView();}});
window.addEventListener('hashchange',route);fillIcons();boot();
