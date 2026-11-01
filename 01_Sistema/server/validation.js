import { CATEGORIES, today } from './database.js';

export class HttpError extends Error {
  constructor(status,message) { super(message);this.status=status; }
}
export function text(value,label,{min=1,max=100,optional=false}={}) {
  if(optional && (value===undefined || value===null || value==='')) return '';
  if(typeof value!=='string') throw new HttpError(400,`${label}: introduce un texto válido.`);
  const normalized=value.trim();
  if(normalized.length<min || normalized.length>max) throw new HttpError(400,`${label}: usa entre ${min} y ${max} caracteres.`);
  return normalized;
}
export function validDate(value,label,{optional=false}={}) {
  if(optional && !value) return '';
  if(typeof value!=='string' || !/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value+'T12:00:00Z')) || new Date(value+'T12:00:00Z').toISOString().slice(0,10)!==value) throw new HttpError(400,`${label}: selecciona una fecha válida.`);
  return value;
}
export function equipmentInput(body,current) {
  const record={code:text(text(body.code,'Código',{max:40}).toUpperCase(),'Código',{max:40}), name:text(body.name,'Nombre',{max:100}),category:text(body.category,'Categoría'),location:text(body.location,'Ubicación',{max:100}),brand:text(body.brand,'Marca o modelo',{optional:true,max:80}),notes:text(body.notes,'Notas',{optional:true,max:500})};
  if(!CATEGORIES.includes(record.category)) throw new HttpError(400,'Selecciona una categoría válida.');
  if(current?.status==='Prestado') {
    if(body.status && body.status!=='Prestado') throw new HttpError(409,'Devuelve el equipo antes de cambiar su estado.');
    record.status='Prestado';
  } else {
    if(!['Disponible','Mantenimiento'].includes(body.status)) throw new HttpError(400,'Selecciona Disponible o Mantenimiento.');
    record.status=body.status;
  }
  return record;
}
export function loanInput(body) {
  if(!Number.isSafeInteger(body.equipmentId) || body.equipmentId<1) throw new HttpError(400,'Selecciona un equipo.');
  const loanDate=validDate(body.loanDate,'Fecha de préstamo'), dueDate=validDate(body.dueDate,'Fecha prevista',{optional:true});
  if(loanDate>today()) throw new HttpError(400,'La fecha de préstamo no puede ser futura.');
  if(dueDate && dueDate<loanDate) throw new HttpError(400,'La devolución prevista no puede ser anterior al préstamo.');
  return {equipmentId:body.equipmentId,borrower:text(body.borrower,'Solicitante',{min:2,max:100}),reference:text(body.reference,'Referencia',{optional:true,max:40}),loanDate,dueDate};
}
export function checkVersion(body,current) {
  if(!Number.isSafeInteger(body.version) || body.version!==current.version) throw new HttpError(409,'Este equipo cambió en otra sesión. Actualiza la lista y vuelve a intentarlo.');
}
