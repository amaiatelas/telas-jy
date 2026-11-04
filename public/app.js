(function(){
'use strict';
function $(s){return document.querySelector(s)}
var CFG=window.TELAS_CONFIG||{};
if(!CFG.SUPABASE_URL||!CFG.SUPABASE_ANON_KEY||/PEGA_AQUI/.test(String(CFG.SUPABASE_URL)+String(CFG.SUPABASE_ANON_KEY))){
$('#app').innerHTML='<div style="padding:32px;max-width:520px;margin:0 auto"><h1>Falta configurar la app</h1><p>Abre el archivo <b>config.js</b> y pega la URL y la clave pública de tu proyecto de Supabase.</p></div>';return}
if(!window.supabase){$('#app').innerHTML='<div style="padding:32px;max-width:520px;margin:0 auto"><h1>No se pudo cargar</h1><p>Revisa tu conexión a internet y recarga la página.</p></div>';return}
var sb=window.supabase.createClient(CFG.SUPABASE_URL,CFG.SUPABASE_ANON_KEY);

var DAYS3=['dom','lun','mar','mié','jue','vie','sáb'];
var DAYN=['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
var MS=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var ESL={en_proceso:'En proceso',listo:'Listo',entregado:'Entregado',cancelado:'Cancelado'};
var ESC={'En proceso':'en_proceso','Listo':'listo','Entregado':'entregado','Cancelado':'cancelado'};

function esc(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function lp(ts){return new Date(ts).toLocaleDateString('en-CA',{timeZone:'America/La_Paz'})}
function hora(ts){return new Date(ts).toLocaleTimeString('en-GB',{timeZone:'America/La_Paz',hour:'2-digit',minute:'2-digit'})}
function today(){return lp(Date.now())}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function pdt(s){var p=s.split('-').map(Number);return new Date(p[0],p[1]-1,p[2])}
function addDays(s,k){var x=pdt(s);x.setDate(x.getDate()+k);return iso(x)}
function lab(d){if(d===today())return 'Hoy';if(d===addDays(today(),-1))return 'Ayer';var x=pdt(d);return DAYS3[x.getDay()]+' '+x.getDate()+' '+MS[x.getMonth()]}
function fd(d){var x=pdt(d);return x.getDate()+' '+MS[x.getMonth()]}
function th(n){return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')}
function bs(n){return th(n)+' Bs'}
function m2(cm){return (cm/100).toFixed(2).replace('.',',')}
function tm(s){var p=String(s).split(':');return +p[0]*60+ +p[1]}

var S={orders:[],designs:[],DF:70,TR:20,retiros:[],horario:[],acc:[]};
var R={role:null,scr:'login',id:null,flt:'todos',q:'',pm:'Efectivo',hv:'pagos',hp:'7',hm:'todos',hf:null,ht:null,est:null,fuera:null,cta:null};
var NP=null;
function own(){return R.role==='dueno'}

function cents(i){return Math.round(+(i.cm*i.p).toFixed(6))+(i.df?Math.round(i.rec*100):0)}
function csub(i){if(i.sub!=null)return i.sub;return Math.ceil(cents(i)/100)}
function craw(i){return cents(i)/100}
function tot(o){return o.it.reduce(function(a,i){return a+csub(i)},0)+(o.trv||0)}
function paid(o){return o.pg.reduce(function(a,p){return a+(p.x?0:p.ef+p.qr)},0)}
function sal(o){return o.es==='Cancelado'?0:Math.max(0,tot(o)-paid(o))}
function pend(o){return o.es==='Cancelado'?0:o.it.filter(function(i){return !i.h}).length}
function byN(n){return S.orders.filter(function(o){return o.n===n})[0]}
function allDone(o){return o.it.length>0&&o.it.every(function(i){return i.h})}
/* Celular normalizado: sin espacios, guiones, paréntesis ni "+", y sin el 591 inicial (igual que crear_pedido) */
function ncel(s){var d=String(s==null?'':s).replace(/[\s\-()+]/g,'');return /^591\d{8}$/.test(d)?d.slice(3):d}
/* Título de un pedido: el nombre del cliente o, si no hay, su celular */
function nom(o){return o.cl||o.cel}
function envFalta(o){return !!o.env&&o.es!=='Cancelado'&&!(o.env.nom&&o.env.cel&&o.env.ciu)}
function envTxt(o){return !o.env?'Retiro en tienda':(o.env.ciu?'Envío a '+o.env.ciu:'Envío (ciudad pendiente)')}
function prevCount(cel){var c=ncel(cel);if(c.length<7)return 0;return S.orders.filter(function(o){return ncel(o.cel)===c}).length}
function avisoCliente(){var n=prevCount(NP.cel),el=$('#regmsg');if(!el)return;el.textContent=n===1?'Cliente con 1 pedido anterior':'Cliente con '+n+' pedidos anteriores';el.style.display=n?'':'none'}

/* ---------- datos ---------- */
function mapOrder(r){
return {id:r.id,n:r.numero,cl:r.cliente_nombre||'',cel:r.cliente_celular,
env:r.tipo_entrega==='envio'?{nom:r.envio_nombre||'',cel:r.envio_celular||'',ciu:r.envio_ciudad||'',tro:r.envio_tropico?1:0}:null,
trv:r.costo_envio||0,f:r.fecha_entrega,reg:lp(r.creado_en),ent:r.fecha_entregado,es:ESL[r.estado]||r.estado,
it:(r.pedido_items||[]).slice().sort(function(a,b){return a.orden-b.orden}).map(function(i){return {id:i.id,d:i.diseno,cm:+i.cm,p:+i.precio_metro,df:i.doble_forro?1:0,c:i.color_forro||'',h:i.hecho?1:0,rec:i.recargo,sub:i.subtotal}}),
pg:(r.pagos||[]).slice().sort(function(a,b){return a.creado_en<b.creado_en?-1:1}).map(function(p){return {id:p.id,d:lp(p.creado_en),t:Date.parse(p.creado_en),ef:p.efectivo,qr:p.qr,v:p.verificado?1:0,x:p.anulado?1:0,mot:p.motivo_anulacion||''}})};
}
async function cargar(){
var q=[
sb.from('pedidos').select('*, pedido_items(*), pagos(*)').order('numero',{ascending:false}).limit(1000),
sb.from('disenos').select('*').eq('activo',true).order('nombre'),
sb.from('ajustes').select('*').eq('id',1).maybeSingle()];
if(own())q.push(sb.from('retiros').select('*').order('creado_en',{ascending:false}).limit(1000));
var r=await Promise.all(q);
for(var k=0;k<r.length;k++){if(r[k].error)throw r[k].error}
S.orders=r[0].data.map(mapOrder);
S.designs=r[1].data.map(function(d){return {id:d.id,n:d.nombre,pat:d.patron,col:d.color}});
if(r[2].data){S.DF=r[2].data.recargo_forro;S.TR=r[2].data.envio_tropico}
S.retiros=own()?r[3].data.map(function(x){return {id:x.id,d:x.fecha,t:Date.parse(x.creado_en),m:x.monto}}):[];
}
async function recargar(){busy(1);try{await cargar()}catch(e){toast('No se pudieron actualizar los datos: '+(e.message||''))}busy(0);draw()}
async function run(fn,okMsg){
busy(1);
try{var r=await fn();if(r&&r.error)throw r.error;if(okMsg)toast(okMsg);return r||{}}
catch(e){var m=e.message||'No se pudo completar la acción';if(/duplicate key/i.test(m))m='Ese nombre ya existe';toast(m);return null}
finally{busy(0)}
}
async function cargarAccesos(){
busy(1);
try{
var h=await sb.from('horarios').select('*').order('dia');if(h.error)throw h.error;
S.horario=[];h.data.forEach(function(x){S.horario[x.dia]={on:x.permitido?1:0,a:String(x.desde).slice(0,5),b:String(x.hasta).slice(0,5)}});
var a=await sb.from('accesos').select('*').order('creado_en',{ascending:false}).limit(8);if(a.error)throw a.error;
S.acc=a.data.map(function(x){return {u:x.usuario,tipo:x.tipo,d:lp(x.creado_en),h:hora(x.creado_en)}});
R.cta=await llamarCuenta({accion:'estado'});
}catch(e){toast(e.message||'No se pudo cargar la información de accesos')}
finally{busy(0)}
}
async function llamarCuenta(body){
var s=await sb.auth.getSession();var tk=s.data&&s.data.session?s.data.session.access_token:'';
var r=await fetch('/.netlify/functions/cuenta',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+tk},body:JSON.stringify(body)});
var d={};try{d=await r.json()}catch(e){}
if(!r.ok)throw new Error(d.error||'No se pudo conectar con el servidor de cuentas. Revisa que la función de Netlify esté publicada.');
return d}

/* ---------- sesión ---------- */
var tim=null;
async function iniciar(){
var s=await sb.auth.getSession();
if(s.data&&s.data.session){await abrirSesion(false)}else{R.scr='login';draw()}
}
async function abrirSesion(registrar){
busy(1);
var r=await sb.rpc(registrar?'registrar_acceso':'estado_acceso');
if(r.error){busy(0);toast('No se pudo verificar tu acceso: '+r.error.message);await sb.auth.signOut();R.scr='login';draw();return}
var e=r.data;
if(!e||!e.rol){busy(0);await sb.auth.signOut();R.scr='login';draw();toast('Tu cuenta no tiene permisos en Telas JY');return}
if(e.rol==='vendedora'&&!e.dentro){R.fuera=e;R.role=null;await sb.auth.signOut();busy(0);R.scr='fuera';draw();return}
R.role=e.rol==='dueno'?'dueno':'vend';R.est=e;
try{await cargar()}catch(er){busy(0);toast('No se pudieron cargar los datos: '+(er.message||''));return}
busy(0);R.scr='pedidos';draw();window.scrollTo(0,0);
if(tim)clearInterval(tim);tim=setInterval(vigilar,20000);
}
async function vigilar(){
if(!R.role)return;
var r=await sb.rpc('estado_acceso');
if(r.error||!r.data)return;
var e=r.data;
if(e.rol==='vendedora'&&!e.dentro){clearInterval(tim);R.fuera=e;R.role=null;await sb.auth.signOut();R.scr='fuera';draw();return}
R.est=e;
var af=document.activeElement;
var calma=!ask.o&&!R.envdirty&&['nuevo','editar','accesos','ajustes','clave'].indexOf(R.scr)<0&&!(af&&/INPUT|SELECT|TEXTAREA/.test(af.tagName));
if(calma){try{await cargar();draw()}catch(x){}}
}

/* ---------- utilidades de pantalla ---------- */
function busy(n){busy.c=(busy.c||0)+(n?1:-1);if(busy.c<0)busy.c=0;$('#cargando').style.display=busy.c>0?'block':'none'}
function toast(m){var t=$('#toast');t.textContent=m;t.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(function(){t.classList.remove('show')},3200)}
function ask(o){
var M=$('#modal');
M.innerHTML='<div class="mb"><h2 class="serif h2" style="margin-bottom:8px">'+esc(o.title)+'</h2><p class="mut" style="font-size:15px;margin:0 0 14px">'+esc(o.text||'')+'</p>'+(o.input?'<label class="lb" for="mi">'+esc(o.input)+'</label><input id="mi" class="fi" maxlength="120"><div id="merr" class="err"></div>':'')+'<div class="g2" style="margin-top:8px"><button class="btn o2" data-a="mno">Cancelar</button><button class="btn'+(o.danger?' danger-fill':'')+'" data-a="mok">'+esc(o.ok||'Confirmar')+'</button></div></div>';
M.classList.add('open');ask.o=o;var i=$('#mi');if(i)i.focus()}
function closeAsk(){$('#modal').classList.remove('open');ask.o=null}
function ruler(){return '<svg class="ruler" width="100%" height="16" aria-hidden="true"><defs><pattern id="regla" width="40" height="16" patternUnits="userSpaceOnUse"><path d="M0.6 0v11M8.6 0v6M16.6 0v6M24.6 0v6M32.6 0v6" stroke="currentColor" stroke-width="1.2" fill="none"/></pattern></defs><rect width="100%" height="16" fill="url(#regla)"/></svg>'}
function sw(name,size){
var o=S.designs.filter(function(x){return x.n===name})[0]||{pat:'liso',col:'#9AA0B0'};size=size||40;
var s='<svg width="'+size+'" height="'+size+'" viewBox="0 0 40 40" aria-hidden="true" style="flex:none"><rect width="40" height="40" rx="9" fill="'+o.col+'" stroke="rgba(0,0,0,.12)"/>';
if(o.pat==='floral')s+='<circle cx="12" cy="13" r="5" fill="#fff" fill-opacity=".45"/><circle cx="27" cy="24" r="6" fill="#fff" fill-opacity=".45"/><circle cx="14" cy="30" r="3" fill="#fff" fill-opacity=".45"/>';
else if(o.pat==='rayas')s+='<rect x="7" width="5" height="40" fill="#fff" fill-opacity=".4"/><rect x="18" width="5" height="40" fill="#fff" fill-opacity=".4"/><rect x="29" width="5" height="40" fill="#fff" fill-opacity=".4"/>';
else if(o.pat==='lunares')s+='<circle cx="10" cy="10" r="2.6" fill="#15172B" fill-opacity=".75"/><circle cx="30" cy="10" r="2.6" fill="#15172B" fill-opacity=".75"/><circle cx="20" cy="20" r="2.6" fill="#15172B" fill-opacity=".75"/><circle cx="10" cy="30" r="2.6" fill="#15172B" fill-opacity=".75"/><circle cx="30" cy="30" r="2.6" fill="#15172B" fill-opacity=".75"/>';
return s+'</svg>'}
var IC={
back:'<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
ped:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 9h6M9 13h6M9 17h3"/></svg>',
nue:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>',
cor:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="6" r="2.5"/><circle cx="6" cy="18" r="2.5"/><path d="M8 7.5L20 17M8 16.5L20 7"/></svg>',
his:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
mas:'<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>',
chev:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
trash:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"/></svg>',
plus:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
edit:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20h4L19 9l-4-4L4 16v4zM13.5 6.5l4 4"/></svg>',
out:'<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M15 8l4 4-4 4M19 12H9"/></svg>'};

function hero(o){
var top=o.back?'<button class="ib" data-a="go" data-v="'+o.back+'" aria-label="Volver">'+IC.back+'</button>':'<div class="brand"><span class="mono">JY</span><span class="serif" style="font-size:22px">Telas JY</span></div>';
var right=o.right!==undefined?o.right:'<span class="rolechip">'+(own()?'Dueño':'Vendedora')+'</span>';
var h='<header class="hero"><div class="cn"><div class="htop">'+top+'<div class="hright">'+right+'<button class="ib lo" data-a="logout" aria-label="Cerrar sesión">'+IC.out+'<span>Cerrar sesión</span></button></div></div>';
if(o.title)h+='<div class="serif ht">'+o.title+'</div>';
if(o.big)h+='<div class="serif big'+(o.debt?' dbt':'')+'">'+o.big+'</div>';
if(o.kick)h+='<div class="kick">'+o.kick+'</div>';
if(o.sub)h+='<div class="hsub">'+o.sub+'</div>';
if(o.stats){h+='<div class="stats" style="grid-template-columns:repeat('+o.stats.length+',minmax(0,1fr))">';o.stats.forEach(function(s){h+='<div class="st'+(s[2]?' w':'')+'"><div class="serif sv">'+s[0]+'</div><div class="sl">'+s[1]+'</div></div>'});h+='</div>'}
return h+'</div>'+ruler()+'</header>'}
function chipEs(o,extra){var c={'En proceso':'c-prog','Listo':'c-ok','Entregado':'c-done','Cancelado':'c-cancel'}[o.es];return '<span class="chip '+c+(extra?' ch-hero':'')+'">'+o.es+'</span>'}

/* ---------- pantallas ---------- */
function sLogin(){
return '<header class="hero" style="padding:0"><svg class="trama" width="100%" height="100%" aria-hidden="true"><defs><pattern id="trama" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7h14M7 0v14" stroke="#fff" stroke-opacity=".07" stroke-width="1" fill="none"/></pattern></defs><rect width="100%" height="100%" fill="url(#trama)"/></svg><div class="cn" style="position:relative;padding:70px 24px 26px"><span class="mono big">JY</span><div class="serif" style="font-size:46px;line-height:1.05;margin-top:16px">Telas JY</div><div class="hsub" style="font-size:15px">Pedidos, cortes y pagos en un solo lugar</div></div>'+ruler()+'</header>'+
'<div class="sheet"><div class="cn narrow"><h1 class="serif h1">Inicia sesión</h1>'+
'<div class="fld"><label class="lb" for="lc">Correo</label><input id="lc" class="fi" type="email" autocomplete="username" placeholder="nombre@correo.com"></div>'+
'<div class="fld"><label class="lb" for="lp">Contraseña</label><input id="lp" class="fi" type="password" autocomplete="current-password" placeholder="Tu contraseña"></div>'+
'<div id="lerr" class="err"></div><button class="btn" data-a="entrar">Entrar</button>'+
'<p class="mut" style="margin-top:14px">¿Olvidaste tu contraseña? Pídele al dueño que te cree una nueva.</p></div></div>'}

function sFuera(){
var e=R.fuera||{},msg;
var d5=e.desde?String(e.desde).slice(0,5):'',h5=e.hasta?String(e.hasta).slice(0,5):'';
if(e.activo===false)msg='Tu acceso está desactivado';
else if(!e.hoy_permitido)msg='Hoy no tienes acceso';
else if(e.ahora&&d5&&e.ahora<d5)msg='Hoy tu horario empieza a las '+d5;
else msg='Hoy tu horario terminó a las '+h5;
var rows=[1,2,3,4,5,6,0].map(function(d){var x=(e.horario||[]).filter(function(y){return y.dia===d})[0];return '<div class="l" style="padding:6px 0"><span>'+DAYN[d]+'</span><b>'+(x&&x.permitido?String(x.desde).slice(0,5)+' a '+String(x.hasta).slice(0,5):'Sin acceso')+'</b></div>'}).join('');
return '<header class="hero" style="padding:0"><div class="cn" style="padding:60px 24px 22px"><span class="mono">JY</span><div class="serif" style="font-size:40px;line-height:1.05;margin-top:14px">Telas JY</div></div>'+ruler()+'</header>'+
'<div class="sheet"><div class="cn narrow"><h1 class="serif h1">'+(e.activo===false?'Acceso desactivado':'Fuera de horario')+'</h1><p style="font-size:17px;margin:0 0 14px">'+msg+'</p>'+
'<div class="box"><div class="lb" style="margin-bottom:8px">Tu horario de ingreso</div>'+rows+'<div class="mut" style="border-top:1px solid var(--line);margin-top:8px;padding-top:10px">Hora de Bolivia. Si necesitas entrar ahora, habla con el dueño.</div></div>'+
'<button class="btn" data-a="go" data-v="login">Volver al inicio</button></div></div>'}

function sPed(){
var cob=0,cp=0;S.orders.forEach(function(o){cob+=sal(o);cp+=pend(o)});
var cnt={todos:S.orders.length,saldo:S.orders.filter(function(o){return sal(o)>0}).length,pagado:S.orders.filter(function(o){return sal(o)<=0&&o.es!=='Cancelado'}).length,cortes:S.orders.filter(function(o){return pend(o)>0}).length};
var tabs=[['todos','Todos'],['saldo','Con saldo'],['pagado','Pagados'],['cortes','Cortes pendientes']].map(function(t){return '<button class="tab'+(R.flt===t[0]?' on':'')+'" data-a="flt" data-v="'+t[0]+'">'+t[1]+' <span class="cnt">'+cnt[t[0]]+'</span></button>'}).join('');
return hero({kick:'Por cobrar',big:bs(cob),debt:cob>0,stats:[[S.orders.length,'Pedidos'],[cp,'Cortes pendientes']]})+
'<div class="sheet"><div class="cn" style="padding-top:12px"><input id="q" class="fi" aria-label="Buscar pedido" placeholder="Buscar por celular, nombre o número" value="'+esc(R.q)+'" style="background:var(--surface2)"><div class="tabs">'+tabs+'</div><div id="pl"></div></div></div>'}
function orderRow(o){
var dl=esc(envTxt(o))+(o.ent?', entregado '+fd(o.ent):'');
var tk=o.it.map(function(i){return '<span class="tk'+(i.h?' f':'')+'"></span>'}).join('');
var done=o.it.filter(function(i){return i.h}).length,s=sal(o),t=tot(o);
var amt=s>0?'<span class="debt-l">Debe</span><span class="serif amt-d">'+bs(s)+'</span><span class="mut">de '+bs(t)+'</span>':'<span class="serif amt">'+bs(t)+'</span>'+(o.es!=='Cancelado'?'<span class="good">Pagado</span>':'');
return '<button class="ord" data-a="open" data-v="'+o.n+'"><div class="ord-main"><b class="ord-n">'+esc(nom(o))+'</b><span class="mut">Pedido '+o.n+', '+dl+'</span>'+(envFalta(o)?'<span class="chip c-warn" style="align-self:flex-start">Datos de envío pendientes</span>':'')+(own()&&o.pg.some(function(x){return !x.x&&x.qr>0&&!x.v})?'<span class="chip c-warn" style="align-self:flex-start">QR sin verificar en el banco</span>':'')+
'<div class="ord-meta">'+chipEs(o)+'<span class="ticks">'+tk+'</span><span class="mut">Cortes '+done+' de '+o.it.length+'</span></div></div><div class="ord-amt">'+amt+'</div></button>'}
function drawPedList(){
var q=R.q.toLowerCase().trim(),qc=q.replace(/[\s\-]/g,''),qn=ncel(q);
var rows=S.orders.filter(function(o){
if(q){var h=(o.cl+' '+o.cel+' '+o.n).toLowerCase(),hc=h.replace(/[\s\-]/g,'');if(h.indexOf(q)<0&&hc.indexOf(qc)<0&&!(qn&&hc.indexOf(qn)>=0))return false}
if(R.flt==='saldo')return sal(o)>0;
if(R.flt==='pagado')return sal(o)<=0&&o.es!=='Cancelado';
if(R.flt==='cortes')return pend(o)>0;
return true});
var el=$('#pl');if(!el)return;
el.innerHTML=rows.length?rows.map(orderRow).join(''):'<div class="empty">'+(S.orders.length?'No hay pedidos con ese filtro':'Todavía no hay pedidos. Toca “Nuevo” para registrar el primero.')+'</div>'}

function sDet(){
var o=byN(R.id);if(!o){R.scr='pedidos';return sPed()}
var s=sal(o),p=paid(o),t=tot(o),pm=R.pm||'Efectivo';
var h=hero({back:'pedidos',right:chipEs(o,'background:transparent;border:1px solid rgba(255,255,255,.4);color:#fff'),kick:'Pedido '+o.n,title:esc(nom(o)),sub:(o.cl?esc(o.cel)+'<br>':'')+esc(envTxt(o))+(o.ent?', entregado '+fd(o.ent):'')});
var b='<div class="sheet"><div class="cn">';
if(o.es==='Cancelado')b+='<div class="box" style="margin-top:18px"><b>Pedido cancelado</b></div>';
else if(s>0){
var f='';
if(pm==='Mixto')f='<div class="g2"><div><label class="lb" for="pe">Efectivo (Bs)</label><input id="pe" class="fi" inputmode="numeric"></div><div><label class="lb" for="pq">QR (Bs)</label><input id="pq" class="fi" inputmode="numeric"></div></div>';
else f='<label class="lb" for="pa">Monto (Bs)</label><input id="pa" class="fi" inputmode="numeric">';
b+='<div class="saldo"><div class="l" style="align-items:flex-end"><div><div style="font-size:13px;color:var(--saldo-soft);font-weight:500">Saldo pendiente</div><div class="serif big">'+bs(s)+'</div></div><div style="text-align:right;font-size:13px;color:var(--saldo-soft);line-height:1.6"><div>Total '+bs(t)+'</div><div>Pagado '+bs(p)+'</div></div></div>'+
'<div class="seg dk" style="margin:16px 0 12px" role="group" aria-label="Método de pago">'+['Efectivo','QR','Mixto'].map(function(x){return '<button data-a="pmeth" data-v="'+x+'" class="'+(pm===x?'on':'')+'">'+x+'</button>'}).join('')+'</div>'+f+
'<div id="perr" class="err" style="color:var(--saldo-soft)"></div><div class="g2"><button class="btn b" data-a="comp">Completar pago</button><button class="btn w" data-a="reg" style="margin-top:0">Registrar pago</button></div></div>'}
else b+='<div class="pagado">Pedido pagado por completo</div>';
if(o.es==='En proceso'&&allDone(o))b+='<div class="note"><span><b>Todos los cortes hechos.</b> ¿Marcar como listo?</span><button class="btn sm" style="width:auto" data-a="listo">Marcar como listo</button></div>';
b+='<div class="l" style="margin:6px 0"><h2 class="serif h2">Cortes</h2><span style="display:flex;align-items:center;gap:10px"><span class="mut">'+o.it.filter(function(i){return i.h}).length+' de '+o.it.length+' hechos</span>'+(own()&&o.es!=='Cancelado'?'<button class="btn o sm" style="width:auto;margin:0;height:40px;padding:0 14px" data-a="edit">'+IC.edit+' Editar pedido</button>':'')+'</span></div><div class="card">';
o.it.forEach(function(i,j){
var raw=craw(i),rr=raw!==Math.round(raw)?'<div class="mut" style="font-size:11px">'+raw.toFixed(2).replace('.',',')+' redondeado</div>':'';
b+='<div class="crow"><input type="checkbox" data-a="cut" data-v="'+j+'" aria-label="Marcar corte '+esc(i.d)+' como hecho"'+(i.h?' checked':'')+'>'+sw(i.d)+'<div style="flex:1"><div style="font-weight:700;font-size:16px" class="'+(i.h?'st-t':'')+'">'+esc(i.d)+'</div><div class="mut">'+i.cm+' cm a '+i.p+' Bs por metro</div>'+(i.df?'<div style="font-size:13px;font-weight:700;color:var(--brass-text)">Doble forro '+esc(i.c.toLowerCase())+', +'+i.rec+' Bs</div>':'')+'</div><div style="text-align:right"><div class="serif" style="font-size:20px">'+bs(csub(i))+'</div>'+rr+'</div></div>'});
b+='</div>';
if(o.trv>0)b+='<div class="l mut" style="padding:8px 4px 0"><span>Envío trópico</span><span>'+bs(o.trv)+'</span></div>';
b+='<div class="l" style="padding:8px 4px 0"><b>Total del pedido</b><span class="serif" style="font-size:26px">'+bs(t)+'</span></div>';
if(o.env)b+=secEnvio(o);
b+='<h2 class="serif h2" style="margin:22px 0 8px">Pagos</h2>';
if(!o.pg.length)b+='<div class="mut">Sin pagos registrados</div>';
o.pg.forEach(function(x,j){
var me=x.ef>0&&x.qr>0?'Mixto, ef. '+bs(x.ef)+' y QR '+bs(x.qr):(x.ef>0?'Efectivo':'QR');
b+='<div class="hrow"><div class="l"><div class="'+(x.x?'st-t':'')+'"><b>'+me+'</b><div class="mut">'+fd(x.d)+(x.x?', anulado: '+esc(x.mot):'')+'</div></div><div style="text-align:right"><div class="serif '+(x.x?'st-t':'')+'" style="font-size:20px">'+bs(x.ef+x.qr)+'</div></div></div>'+
(x.x?'':'<div class="l" style="margin-top:6px"><label class="ck" style="min-height:36px;font-size:13px"><input type="checkbox" data-a="ver" data-v="'+j+'"'+(x.v?' checked':'')+(own()?'':' disabled')+' style="width:20px;height:20px"> '+(x.qr>0?'Verificado en el banco':'Verificado')+'</label>'+(own()?'<button class="btn o2 sm" style="width:auto;height:40px" data-a="anu" data-v="'+j+'">Anular</button>':'')+'</div>')+'</div>'});
if(!own()&&o.pg.length)b+='<div class="mut">Solo el dueño verifica y anula pagos.</div>';
b+='<h2 class="serif h2" style="margin:22px 0 8px"><label for="es">Estado del pedido</label></h2><select id="es" class="fi" data-a="es">'+['En proceso','Listo','Entregado'].concat(own()?['Cancelado']:[]).map(function(x){return '<option'+(x===o.es?' selected':'')+'>'+x+'</option>'}).join('')+'</select>'+
'<div class="g2" style="margin-top:14px"><button class="btn" data-a="wa">Enviar por WhatsApp</button><button class="btn o2" style="margin-top:0" data-a="pdfped">Descargar PDF</button></div>'+
(own()?'<button class="btn o2 danger" style="margin-top:22px" data-a="delp">'+IC.trash+' Eliminar pedido</button>':'')+'</div></div>';
return h+b}

/* Datos de envío del pedido: dueño y vendedora pueden completarlos o corregirlos mientras no esté cancelado */
function secEnvio(o){
var can=o.es!=='Cancelado',d=can?'':' disabled';
var h='<h2 class="serif h2" style="margin-top:22px">Datos de envío</h2>';
if(envFalta(o))h+='<div class="note" style="margin-top:8px"><span><b>Datos de envío pendientes.</b> Completa el nombre, el celular y la ciudad.</span></div>';
h+='<div class="box" style="margin-top:8px"><div class="fld"><label class="lb" for="env_nom">Nombre completo</label><input id="env_nom" class="fi" value="'+esc(o.env.nom)+'"'+d+'></div>'+
'<div class="g2"><div><label class="lb" for="env_cel">Celular</label><input id="env_cel" class="fi" inputmode="tel" value="'+esc(o.env.cel)+'"'+d+'></div><div><label class="lb" for="env_ciu">Ciudad</label><input id="env_ciu" class="fi" value="'+esc(o.env.ciu)+'"'+d+'></div></div>'+
'<label class="ck" style="margin-top:8px"><input type="checkbox" id="env_tro"'+(o.env.tro?' checked':'')+d+'> ¿Es para trópico? (+'+S.TR+' Bs)</label>'+
(can?'<div id="enverr" class="err"></div><button class="btn" data-a="saveenv">Guardar datos de envío</button>':'<p class="mut" style="margin:10px 0 0">Pedido cancelado: no se pueden cambiar los datos de envío.</p>')+'</div>';
return h}

/* Editar pedido (solo dueño): cortes y entrega. El total nunca puede quedar por debajo de lo ya pagado. */
function ecalc(o){var s=NP.items.reduce(function(a,i){return a+nsub(i)},0),e=0;
if(NP.ent==='envio'&&NP.tro)e=(o.env&&o.env.tro)?o.trv:S.TR;
return {s:s,e:e,t:s+e,p:paid(o)}}
function etot(){
var o=byN(R.id);if(!o||!$('#n3'))return;
var c=ecalc(o),dif=c.t-c.p,bad=dif<0;
$('#n1').textContent=bs(c.s);$('#n2').textContent=bs(c.e);$('#n3').textContent=bs(c.t);
var nb=$('#nb3');if(nb)nb.textContent=bs(c.t);
var er=$('#nerr');if(er&&!bad)er.textContent='';
var cn=$('#ncnt');if(cn)cn.textContent=NP.items.length+(NP.items.length===1?' corte':' cortes');
$('#ep').textContent=bs(c.p);
$('#es2').textContent=bad?'Menor que lo pagado':bs(dif);
var fila=$('#esr');fila.style.color=(bad||dif>0)?'var(--hero-bad)':'var(--hero-muted)';fila.style.fontWeight=(bad||dif>0)?'700':'';
$('#n6').style.display=(!bad&&dif===0&&c.t>0)?'block':'none'}
function sEditar(){
var o=byN(R.id);
if(!o||!NP||!NP.edit||!own()||o.es==='Cancelado'){R.scr=o?'detalle':'pedidos';return o?sDet():sPed()}
var h=hero({back:'detalle',title:'Editar pedido '+o.n,sub:esc(nom(o))});
h+='<div class="sheet"><div class="cn narrow nuevo editar" style="max-width:640px">'+
'<div class="sec"><div class="l" style="margin-bottom:12px"><h2 class="serif h2">Cortes</h2><span class="mut" id="ncnt"></span></div><div id="ni"></div><button class="btn o" data-a="addcut">'+IC.plus+' Agregar corte</button></div>'+
'<div class="sec"><h2 class="serif h2" style="margin-bottom:12px">Entrega</h2><div class="seg" role="group" aria-label="Tipo de entrega"><button data-a="nent" data-v="retiro" class="'+(NP.ent==='retiro'?'on':'')+'">Retiro en tienda</button><button data-a="nent" data-v="envio" class="'+(NP.ent==='envio'?'on':'')+'">Envío</button></div>';
if(NP.ent==='envio')h+='<div style="margin-top:12px"><p class="mut" style="margin:0 0 10px;font-size:13px">Estos datos son opcionales. Puedes completarlos después.</p><div class="fld"><label class="lb" for="en">Nombre completo</label><input id="en" class="fi" data-np="en" value="'+esc(NP.en)+'"></div><div class="g2"><div><label class="lb" for="ec">Celular</label><input id="ec" class="fi" inputmode="numeric" data-np="ec" value="'+esc(NP.ec)+'"></div><div><label class="lb" for="ci">Ciudad</label><input id="ci" class="fi" data-np="ci" value="'+esc(NP.ci)+'"></div></div><label class="ck" style="margin-top:8px"><input type="checkbox" id="ntro" data-a="ntro"'+(NP.tro?' checked':'')+'> ¿Es para trópico? (+'+S.TR+' Bs)</label></div>';
h+='</div>'+
'<div class="box tot" style="margin-top:18px"><div class="l" style="color:var(--hero-muted)"><span>Cortes</span><span id="n1"></span></div><div class="l" style="color:var(--hero-muted)"><span>Envío trópico</span><span id="n2"></span></div><div class="l" style="border-top:1px solid rgba(255,255,255,.2);margin-top:8px;padding-top:10px;align-items:baseline"><b style="color:var(--gold)">Total nuevo</b><span class="serif" style="font-size:44px;line-height:1.05" id="n3"></span></div><div class="l" style="color:var(--hero-muted);margin-top:8px"><span>Ya pagado</span><span id="ep"></span></div><div class="l" id="esr" style="color:var(--hero-muted)"><span>Saldo pendiente</span><span id="es2"></span></div><div id="n6" style="display:none;font-weight:700;margin-top:4px">Pedido pagado por completo</div><div style="font-size:12px;color:var(--hero-muted);margin:6px 0 0">Cada corte se redondea hacia arriba a Bs enteros. El total no puede quedar menor que lo ya pagado.</div></div>'+
'<div class="nbar"><div id="nerr" class="err" role="alert"></div><div class="nbar-in"><div class="nbar-t"><span class="mut">Total</span><b class="serif" id="nb3"></b></div><button class="btn" data-a="saveedit">Guardar cambios</button></div></div></div></div>';
return h}
function resetNP(){NP={cel:'',items:[{d:0,cm:'',p:'',df:0,c:''}],ent:'retiro',en:'',ec:'',ci:'',tro:0,pm:'Efectivo',ad:'',ae:'',aq:''}}
/* Números del formulario: aceptan coma o punto, máximo 2 decimales; siempre se normalizan con punto */
function dnum(s){var t=String(s==null?'':s).trim();if(t==='')return {v:0,e:''};
if(/^(\d+([.,]\d{0,2})?|[.,]\d{1,2})$/.test(t))return {v:parseFloat(t.replace(',','.')),e:''};
if(/^\d*[.,]\d{3,}$/.test(t))return {v:0,e:'Usa máximo 2 decimales'};
return {v:0,e:'Escribe un número válido, por ejemplo 80,5'}}
function pn(s){return dnum(s).v}
function fe(s){return dnum(s).e}
function nsub(i){return csub({cm:pn(i.cm),p:pn(i.p),df:i.df,rec:(i.rec!=null?i.rec:S.DF)})}
function nraw(i){return craw({cm:pn(i.cm),p:pn(i.p),df:i.df,rec:(i.rec!=null?i.rec:S.DF)})}
function ntotal(){return NP.items.reduce(function(a,i){return a+nsub(i)},0)+(NP.ent==='envio'&&NP.tro?S.TR:0)}
/* Adelanto: solo Bs enteros. Devuelve efectivo, QR y un mensaje de error (vacío si todo está bien) */
function adel(){
var campos=NP.pm==='Mixto'?[NP.ae,NP.aq]:[NP.ad],v=[];
for(var k=0;k<campos.length;k++){var t=String(campos[k]||'').trim();
if(t==='')v.push(0);
else if(/^\d{1,9}$/.test(t))v.push(+t);
else return {ef:0,qr:0,err:/^-/.test(t)?'El adelanto no puede ser negativo':'El adelanto debe ser un número entero de Bs, sin decimales'}}
if(NP.pm==='Mixto')return {ef:v[0],qr:v[1],err:''};
return NP.pm==='QR'?{ef:0,qr:v[0],err:''}:{ef:v[0],qr:0,err:''}}
function secAdelanto(){
var mix=NP.pm==='Mixto';
var met=['Efectivo','QR','Mixto'].map(function(x){return '<button data-a="npm" data-v="'+x+'" class="'+(NP.pm===x?'on':'')+'">'+x+'</button>'}).join('');
var campo=mix?'<div class="g2"><div><label class="lb" for="ae">Efectivo (Bs)</label><input id="ae" class="fi" inputmode="numeric" data-np="ae" value="'+esc(NP.ae)+'" placeholder="0"></div><div><label class="lb" for="aq">QR (Bs)</label><input id="aq" class="fi" inputmode="numeric" data-np="aq" value="'+esc(NP.aq)+'" placeholder="0"></div></div><button class="btn o sm" style="width:auto;margin:8px 0 0" data-a="npall">Paga todo</button>'
:'<div style="display:flex;gap:8px;align-items:flex-end"><div style="flex:1;min-width:0"><label class="lb" for="ad">Monto (Bs)</label><input id="ad" class="fi" inputmode="numeric" data-np="ad" value="'+esc(NP.ad)+'" placeholder="0"></div><button class="btn o sm" style="width:auto;margin:0;height:50px" data-a="npall">Paga todo</button></div>';
return '<div class="sec"><h2 class="serif h2" style="margin-bottom:4px">Adelanto</h2><p class="mut" style="margin:0 0 12px">Déjalo en 0 si todavía no pagó</p><div class="seg" role="group" aria-label="Método del adelanto" style="margin-bottom:12px">'+met+'</div>'+campo+'</div>'}
function sNuevo(){
if(!NP)resetNP();
var prev=prevCount(NP.cel);
var h=hero({back:'pedidos',title:'Nuevo pedido'});
if(!S.designs.length){
return h+'<div class="sheet"><div class="cn narrow"><h2 class="serif h2" style="margin-top:22px">Primero agrega diseños</h2><p class="mut" style="font-size:15px">'+(own()?'La lista de diseños está vacía. Agrega los diseños de tela en Ajustes para poder registrar pedidos.':'La lista de diseños está vacía. Pídele al dueño que agregue los diseños.')+'</p>'+(own()?'<button class="btn" data-a="go" data-v="ajustes">Ir a Ajustes</button>':'')+'</div></div>'}
h+='<div class="sheet"><div class="cn narrow nuevo" style="max-width:640px">'+
'<div class="sec"><h2 class="serif h2" style="margin-bottom:12px">Cliente</h2><div class="fld"><label class="lb" for="cel">Celular del cliente</label><input id="cel" class="fi" inputmode="tel" data-np="cel" value="'+esc(NP.cel)+'" placeholder="71234567"></div><div id="regmsg" class="mut" style="font-size:13px;margin-top:2px;'+(prev?'':'display:none')+'">'+(prev===1?'Cliente con 1 pedido anterior':'Cliente con '+prev+' pedidos anteriores')+'</div></div>'+
'<div class="sec"><div class="l" style="margin-bottom:12px"><h2 class="serif h2">Cortes</h2><span class="mut" id="ncnt"></span></div><div id="ni"></div><button class="btn o" data-a="addcut">'+IC.plus+' Agregar corte</button><div class="mut" style="margin-top:10px">'+(own()?'<button class="menu" style="min-height:44px;border:none;font-size:14px;color:var(--accent)" data-a="go" data-v="ajustes">Agregar diseño a la lista</button>':'¿Falta un diseño? Pídeselo al dueño.')+'</div></div>'+
'<div class="sec"><h2 class="serif h2" style="margin-bottom:12px">Entrega</h2><div class="seg" role="group" aria-label="Tipo de entrega"><button data-a="nent" data-v="retiro" class="'+(NP.ent==='retiro'?'on':'')+'">Retiro en tienda</button><button data-a="nent" data-v="envio" class="'+(NP.ent==='envio'?'on':'')+'">Envío</button></div>';
if(NP.ent==='envio')h+='<div style="margin-top:12px"><p class="mut" style="margin:0 0 10px;font-size:13px">Estos datos son opcionales. Puedes completarlos después.</p><div class="fld"><label class="lb" for="en">Nombre completo</label><input id="en" class="fi" data-np="en" value="'+esc(NP.en)+'"></div><div class="g2"><div><label class="lb" for="ec">Celular</label><input id="ec" class="fi" inputmode="numeric" data-np="ec" value="'+esc(NP.ec)+'"></div><div><label class="lb" for="ci">Ciudad</label><input id="ci" class="fi" data-np="ci" value="'+esc(NP.ci)+'"></div></div><label class="ck" style="margin-top:8px"><input type="checkbox" id="ntro" data-a="ntro"'+(NP.tro?' checked':'')+'> ¿Es para trópico? (+'+S.TR+' Bs)</label></div>';
h+='</div>'+
secAdelanto()+'<div class="box tot" style="margin-top:18px"><div class="l" style="color:var(--hero-muted)"><span>Cortes</span><span id="n1"></span></div><div class="l" style="color:var(--hero-muted)"><span>Envío trópico</span><span id="n2"></span></div><div class="l" style="border-top:1px solid rgba(255,255,255,.2);margin-top:8px;padding-top:10px;align-items:baseline"><b style="color:var(--gold)">Total</b><span class="serif" style="font-size:44px;line-height:1.05" id="n3"></span></div><div class="l" style="color:var(--hero-muted);margin-top:8px"><span>Adelanto</span><span id="n4"></span></div><div class="l" id="n5r" style="color:var(--hero-muted)"><span>Saldo pendiente</span><span id="n5"></span></div><div id="n6" style="display:none;font-weight:700;margin-top:4px">Pedido pagado por completo</div><div style="font-size:12px;color:var(--hero-muted);margin:6px 0 0">Cada corte se redondea hacia arriba a Bs enteros.</div></div>'+
'<div class="nbar"><div id="nerr" class="err" role="alert"></div><div class="nbar-in"><div class="nbar-t"><span class="mut">Total</span><b class="serif" id="nb3"></b></div><button class="btn" data-a="savep">Guardar pedido</button></div></div></div></div>';
return h}
function rn(){
if(!$('#ni'))return;
var h='';
NP.items.forEach(function(it,k){
var raw=nraw(it),rr=raw!==Math.round(raw)?'<span style="font-size:12px;font-weight:400;color:var(--muted)">'+raw.toFixed(2).replace('.',',')+' redondeado </span>':'';
var dn=S.designs[it.d]?S.designs[it.d].n:'';
h+='<div class="box"><div class="cut-h"><b>Corte '+(k+1)+'</b></div><div style="display:flex;gap:10px;align-items:flex-end;margin-bottom:12px">'+sw(dn,50)+'<div style="flex:1"><label class="lb" for="d'+k+'">Diseño</label><select id="d'+k+'" class="fi" data-a="nd" data-k="'+k+'">'+S.designs.map(function(d,j){return '<option value="'+j+'"'+(j===it.d?' selected':'')+'>'+esc(d.n)+'</option>'}).join('')+'</select></div><button class="btn o2" style="width:50px;height:50px;padding:0;margin:0" data-a="delcut" data-v="'+k+'" aria-label="Quitar corte '+(k+1)+'">'+IC.trash+'</button></div>'+
'<div class="g2"><div><label class="lb" for="c'+k+'">Medida (cm)</label><input id="c'+k+'" class="fi" inputmode="decimal" data-ni="'+k+'" data-f="cm" value="'+esc(it.cm)+'" placeholder="80"><div class="err" id="ecm'+k+'">'+fe(it.cm)+'</div></div><div><label class="lb" for="p'+k+'">Costo por metro (Bs)</label><input id="p'+k+'" class="fi" inputmode="decimal" data-ni="'+k+'" data-f="p" value="'+esc(it.p)+'" placeholder="45"><div class="err" id="epr'+k+'">'+fe(it.p)+'</div></div></div>'+
'<label class="ck" style="margin-top:6px"><input type="checkbox" data-a="ndf" data-k="'+k+'"'+(it.df?' checked':'')+'> Doble forro (+'+S.DF+' Bs)</label>'+
(it.df?'<div class="fld" style="margin-top:6px"><label class="lb" for="col'+k+'">Color del forro</label><input id="col'+k+'" class="fi" data-ni="'+k+'" data-f="c" value="'+esc(it.c)+'" placeholder="Negro"></div>':'')+
'<div class="l" style="border-top:1px solid var(--line);margin-top:10px;padding-top:10px;align-items:baseline"><span class="mut">Subtotal</span><span><span id="nr'+k+'">'+rr+'</span><span class="serif" style="font-size:24px" id="ns'+k+'">'+bs(nsub(it))+'</span></span></div></div>'});
$('#ni').innerHTML=h;ntot()}
function ntot(){
if(NP&&NP.edit){etot();return}
var s=NP.items.reduce(function(a,i){return a+nsub(i)},0),e=NP.ent==='envio'&&NP.tro?S.TR:0,t=s+e;
$('#n1').textContent=bs(s);$('#n2').textContent=bs(e);$('#n3').textContent=bs(t);var nb=$('#nb3');if(nb)nb.textContent=bs(t);var c=$('#ncnt');if(c)c.textContent=NP.items.length+(NP.items.length===1?' corte':' cortes');
var a=adel(),ad=a.ef+a.qr,txt='',rojo=false,pagado=false;
if(a.err)txt='—';
else if(ad>t){txt='Supera el total';rojo=true}
else if(t>0&&ad===t)pagado=true;
else{txt=bs(t-ad);rojo=t-ad>0}
$('#n4').textContent=a.err?'—':bs(ad);
$('#n5').textContent=txt;
var fila=$('#n5r');fila.style.display=pagado?'none':'';fila.style.color=rojo?'var(--hero-bad)':'var(--hero-muted)';fila.style.fontWeight=rojo?'700':'';
$('#n6').style.display=pagado?'block':'none'}

function sCortes(){
var g={};S.designs.forEach(function(d){g[d.n]=[]});
S.orders.forEach(function(o){if(o.es==='Entregado'||o.es==='Cancelado')return;o.it.forEach(function(i,j){(g[i.d]=g[i.d]||[]).push({o:o,i:i,j:j})})});
var tp=0,cm=0;Object.keys(g).forEach(function(n){g[n].forEach(function(x){if(!x.i.h){tp++;cm+=x.i.cm}})});
var h=hero({title:'Cortes por diseño',sub:'Marca cada corte cuando lo termines',stats:[[tp,'cortes pendientes'],[m2(cm)+' m','de tela necesaria']]});
var b='<div class="sheet"><div class="cn" style="padding-top:8px">',any=0;
Object.keys(g).forEach(function(n){var r=g[n];if(!r.length)return;any=1;
var pe=r.filter(function(x){return !x.i.h}),c2=pe.reduce(function(a,x){return a+x.i.cm},0);
b+='<div class="sec"><div class="l" style="margin-bottom:6px"><span style="display:flex;align-items:center;gap:12px">'+sw(n)+'<b style="font-size:17px">'+esc(n)+'</b></span><span class="mut">'+pe.length+(pe.length===1?' corte':' cortes')+', '+m2(c2)+' m</span></div>';
r.forEach(function(x){b+='<label class="ck'+(x.i.h?' st-t':'')+'" style="padding:8px 0;min-height:52px"><input type="checkbox" data-a="cx" data-v="'+x.o.n+','+x.j+'"'+(x.i.h?' checked':'')+'><span><b class="serif" style="font-size:20px">'+x.i.cm+' cm</b> <span class="mut">'+esc(nom(x.o))+', pedido '+x.o.n+'</span>'+(x.i.df?'<br><span style="font-size:13px;font-weight:700;color:var(--brass-text)">Forro '+esc(x.i.c.toLowerCase())+'</span>':'')+'</span></label>'});
b+='</div>'});
return h+b+(any?'':'<div class="empty">No hay cortes pendientes</div>')+(any&&own()?'<button class="btn o2" style="margin-top:14px" data-a="pdfcor">Descargar PDF de cortes pendientes</button>':'')+'</div></div>'}

function lastRetiro(){return S.retiros.slice().sort(function(a,b){return b.t-a.t})[0]||null}
function cashSince(){var lr=lastRetiro(),s=0;S.orders.forEach(function(o){o.pg.forEach(function(p){if(!p.x&&(!lr||p.t>lr.t))s+=p.ef})});return s}
function hset(p){R.hp=p;var t=today();
if(p==='hoy'){R.hf=t;R.ht=t}else if(p==='ayer'){R.hf=addDays(t,-1);R.ht=R.hf}else if(p==='7'){R.hf=addDays(t,-6);R.ht=t}else if(p==='mes'){R.hf=t.slice(0,8)+'01';R.ht=t}else if(p==='todo'){R.hf='2000-01-01';R.ht=t}}
function inr(d){return d&&d>=R.hf&&d<=R.ht}
function rangeLab(){if(R.hf===R.ht)return lab(R.hf).toLowerCase();if(R.hf==='2000-01-01')return 'de todo el historial';return 'del '+fd(R.hf)+' al '+fd(R.ht)}
function grp(rows){var g={};rows.forEach(function(r){(g[r.d]=g[r.d]||[]).push(r)});return Object.keys(g).sort().reverse().map(function(k){return [k,g[k]]})}
function histData(){
var pg=[];S.orders.forEach(function(o){o.pg.forEach(function(p){if(inr(p.d))pg.push({p:p,o:o})})});
var pv=S.orders.filter(function(o){return inr(o.reg)&&o.es!=='Cancelado'}),en=S.orders.filter(function(o){return inr(o.ent)});
var d={pg:pg,pv:pv,en:en,ef:0,qr:0,vend:0,rt:0,nr:0};
pg.forEach(function(r){if(!r.p.x){d.ef+=r.p.ef;d.qr+=r.p.qr}});pv.forEach(function(o){d.vend+=tot(o)});
S.retiros.forEach(function(r){if(inr(r.d)){d.rt+=r.m;d.nr++}});
d.ens=en.filter(function(o){return sal(o)>0}).length;return d}
function sHist(){
var ow=own();
if(!R.hf)hset('7');
if(!ow){R.hf=today();R.ht=today();if(R.hv==='retiros')R.hv='pagos'}
var D=histData(),hv=R.hv,hd;
if(hv==='pagos'){var st=[[th(D.ef),'Efectivo'],[th(D.qr),'QR']];if(ow)st.push([th(D.rt),'Retirado']);hd={kick:'Cobrado '+rangeLab(),big:bs(D.ef+D.qr),stats:st}}
else if(hv==='ventas')hd={kick:'Vendido '+rangeLab(),big:bs(D.vend),stats:[[D.pv.length,'Pedidos']]};
else if(hv==='entregas')hd={kick:'Entregas '+rangeLab(),big:String(D.en.length),stats:[[D.en.length-D.ens,'Sin saldo'],[D.ens,'Con saldo',D.ens>0]]};
else hd={kick:'Retirado '+rangeLab(),big:bs(D.rt),stats:[[D.nr,D.nr===1?'Retiro':'Retiros']]};
hd.title='Historial';var h=hero(hd);
var vs=[['pagos','Pagos'],['ventas','Ventas'],['entregas','Entregas']];if(ow)vs.push(['retiros','Retiros']);
var b='<div class="sheet"><div class="cn"><div class="tabs">'+vs.map(function(v){return '<button class="tab'+(hv===v[0]?' on':'')+'" data-a="hv" data-v="'+v[0]+'">'+v[1]+'</button>'}).join('')+'</div>';
if(ow){b+='<div class="pills">'+[['hoy','Hoy'],['ayer','Ayer'],['7','7 días'],['mes','Este mes'],['todo','Todo']].map(function(p){return '<button class="pill'+(R.hp===p[0]?' on':'')+'" data-a="hp" data-v="'+p[0]+'">'+p[1]+'</button>'}).join('')+'</div><details class="fechas"'+(R.hp==='x'?' open':'')+'><summary>Elegir otras fechas</summary><div class="g2" style="margin:10px 0 8px"><div><label class="lb" for="hd1">Desde</label><input id="hd1" type="date" class="fi" value="'+(R.hf==='2000-01-01'?addDays(today(),-365):R.hf)+'"></div><div><label class="lb" for="hd2">Hasta</label><input id="hd2" type="date" class="fi" value="'+R.ht+'"></div></div></details>'}
else b+='<div class="mut" style="padding:10px 0">Solo se muestran los registros de hoy.</div>';
if(ow&&hv==='pagos')b+='<div class="seg" style="margin-bottom:6px">'+[['todos','Todos'],['ef','Efectivo'],['qr','QR']].map(function(m){return '<button data-a="hm" data-v="'+m[0]+'" class="'+(R.hm===m[0]?'on':'')+'">'+m[1]+'</button>'}).join('')+'</div>';
var list='';
if(hv==='pagos'){var rows=[];D.pg.forEach(function(r){var a=R.hm==='ef'?r.p.ef:R.hm==='qr'?r.p.qr:r.p.ef+r.p.qr;if(a>0)rows.push({d:r.p.d,r:r,a:a})});
grp(rows).forEach(function(g){var s=g[1].reduce(function(a,x){return a+(x.r.p.x?0:x.a)},0);list+='<div class="dh"><span>'+lab(g[0])+'</span><span class="serif" style="font-size:22px">'+bs(s)+'</span></div>';
g[1].forEach(function(x){var p=x.r.p,m=p.ef>0&&p.qr>0?'Mixto, ef. '+bs(p.ef)+' y QR '+bs(p.qr):p.ef>0?'Efectivo':'QR';
list+='<div class="hrow"><div class="l"><div class="'+(p.x?'st-t':'')+'"><b>'+esc(nom(x.r.o))+'</b><div class="mut">Pedido '+x.r.o.n+', '+m+(p.x?', anulado':'')+'</div></div><div style="text-align:right"><div class="serif '+(p.x?'st-t':'')+'" style="font-size:20px">'+bs(x.a)+'</div>'+(p.x?'':(p.v?'<span class="good" style="font-size:12px">'+(p.qr>0?'Verificado en el banco':'Verificado')+'</span>':'<span class="chip c-warn">'+(p.qr>0?'QR sin verificar':'Sin verificar')+'</span>'))+'</div></div></div>'})})}
else if(hv==='ventas'){grp(D.pv.map(function(o){return {d:o.reg,o:o}})).forEach(function(g){var s=g[1].reduce(function(a,x){return a+tot(x.o)},0);list+='<div class="dh"><span>'+lab(g[0])+'</span><span class="serif" style="font-size:22px">'+bs(s)+'</span></div>';
g[1].forEach(function(x){var q=sal(x.o);list+='<div class="hrow"><div class="l"><div><b>'+esc(nom(x.o))+'</b><div class="mut">Pedido '+x.o.n+'</div></div><div style="text-align:right"><div class="serif" style="font-size:20px">'+bs(tot(x.o))+'</div>'+(q>0?'<span class="debt">Debe '+bs(q)+'</span>':'<span class="good" style="font-size:12px">Pagado</span>')+'</div></div></div>'})})}
else if(hv==='entregas'){grp(D.en.map(function(o){return {d:o.ent,o:o}})).forEach(function(g){list+='<div class="dh"><span>'+lab(g[0])+'</span><span>'+g[1].length+(g[1].length===1?' entrega':' entregas')+'</span></div>';
g[1].forEach(function(x){var q=sal(x.o);list+='<div class="hrow"><div class="l"><div><b>'+esc(nom(x.o))+'</b><div class="mut">Pedido '+x.o.n+', total '+bs(tot(x.o))+'</div></div>'+(q>0?'<span class="debt">Entregado con saldo '+bs(q)+'</span>':'<span class="good" style="font-size:13px">Pagado</span>')+'</div></div>'})})}
else{var lr=lastRetiro(),cs=cashSince();
list+='<div class="box"><div class="l mut"><span>Último retiro</span><b style="color:var(--text)">'+(lr?lab(lr.d)+', '+bs(lr.m):'Ninguno todavía')+'</b></div><div class="mut" style="margin-top:6px">Efectivo cobrado desde entonces</div><div class="serif" style="font-size:34px;color:var(--accent)">'+bs(cs)+'</div>'+
'<label class="lb" for="rmon" style="margin-top:10px">Monto a retirar (Bs)</label><input id="rmon" class="fi" inputmode="numeric" value="'+cs+'" style="font-size:20px;font-weight:700;height:52px"><div id="rerr" class="err"></div>'+
'<button class="btn o sm" data-a="rall" data-v="'+cs+'">Usar todo ('+bs(cs)+')</button><button class="btn" data-a="rret">Registrar retiro</button><div class="mut" style="text-align:center;margin-top:8px">Se guarda con la fecha de hoy: '+DAYN[pdt(today()).getDay()].toLowerCase()+' '+fd(today())+'</div></div>';
var rr=S.retiros.filter(function(r){return inr(r.d)}).map(function(r){return {d:r.d,r:r}});
list+='<div class="dh"><span>'+rangeLab().replace(/^./,function(c){return c.toUpperCase()})+'</span><span class="serif" style="font-size:22px">'+bs(D.rt)+'</span></div>';
grp(rr).forEach(function(g){var s=g[1].reduce(function(a,x){return a+x.r.m},0);list+='<div class="hrow"><div class="l"><b>'+lab(g[0])+'</b><span class="serif" style="font-size:20px">'+bs(s)+'</span></div></div>'})}
if(list.indexOf('hrow')<0&&hv!=='retiros')list+='<div class="empty">No hay registros en este periodo</div>';
b+=list;
if(ow)b+='<button class="btn o2" style="margin-top:14px" data-a="pdfhist">Descargar PDF del periodo</button>';
return h+b+'</div></div>'}

function sMas(){
var items=[['saldos','Saldos pendientes','Cuánto debe cada cliente'],['clave','Cambiar contraseña','Cambia tu clave de ingreso']];if(own()){items.push(['ajustes','Ajustes','Precios de envío, doble forro y diseños']);items.push(['accesos','Accesos','Cuenta y horario de la vendedora'])}
return hero({title:'Más'})+'<div class="sheet"><div class="cn narrow" style="max-width:640px"><div style="padding-top:8px">'+items.map(function(i){return '<button class="menu" data-a="go" data-v="'+i[0]+'"><span class="menu-t"><b>'+i[1]+'</b><small>'+i[2]+'</small></span>'+IC.chev+'</button>'}).join('')+'<button class="menu" data-a="sync"><span class="menu-t"><b>Actualizar datos ahora</b><small>Trae lo último de la nube</small></span>'+IC.chev+'</button></div>'+
'<div class="box" style="margin-top:22px"><b>Varios aparatos</b><p class="mut" style="margin:6px 0 0">Los datos se guardan en la nube. Lo que registres en el celular aparece en la laptop y viceversa; se actualizan solos cada pocos segundos.</p></div>'+
'<button class="btn o2 quiet" style="margin-top:6px" data-a="logout">'+IC.out+' Cerrar sesión</button></div></div>'}

/* Saldos por cliente: se agrupan por celular (normalizado); el título es el nombre si alguno de sus pedidos lo tiene */
function saldosData(){
var g={},tt=0;S.orders.forEach(function(o){var s=sal(o);if(s>0){var k=ncel(o.cel)||o.cel;var c=g[k]=g[k]||{cel:o.cel,nom:'',s:0,n:[]};if(!c.nom&&o.cl)c.nom=o.cl;c.s+=s;c.n.push(o.n);tt+=s}});
return {g:g,tt:tt}}
function sSaldos(){
var D=saldosData(),g=D.g,tt=D.tt;
var b=Object.keys(g).sort(function(a,c){return g[c].s-g[a].s}).map(function(k){var c=g[k];return '<div class="hrow"><div class="l"><div><b>'+esc(c.nom||c.cel)+'</b><div class="mut">'+(c.nom?esc(c.cel)+', ':'')+'pedidos '+c.n.join(', ')+'</div></div><span class="debt" style="font-size:16px">'+bs(c.s)+'</span></div></div>'}).join('');
return hero({back:'mas',kick:'Total por cobrar',big:bs(tt),debt:tt>0})+'<div class="sheet"><div class="cn" style="padding-top:12px">'+(b||'<div class="empty">Nadie tiene saldo pendiente</div>')+(own()&&b?'<button class="btn o2" style="margin-top:12px" data-a="pdfsal">Descargar PDF de saldos</button>':'')+'</div></div>'}

function sClave(){return hero({back:'mas',title:'Cambiar contraseña'})+'<div class="sheet"><div class="cn narrow"><div class="fld" style="margin-top:18px"><label class="lb" for="k1">Contraseña nueva</label><input id="k1" class="fi" type="password" autocomplete="new-password"></div><div class="fld"><label class="lb" for="k2">Repite la contraseña</label><input id="k2" class="fi" type="password" autocomplete="new-password"></div><div id="kerr" class="err"></div><button class="btn" data-a="saveclave">Guardar contraseña</button></div></div>'}

function sAjustes(){
var rows=S.designs.map(function(d){return '<div class="l" style="padding:8px 0;border-bottom:1px solid var(--line2)"><span style="display:flex;align-items:center;gap:12px">'+sw(d.n,32)+esc(d.n)+'</span><button class="btn o2 sm" style="width:auto;height:38px;margin:0" data-a="ocd" data-v="'+d.id+'">Ocultar</button></div>'}).join('');
return hero({back:'mas',title:'Ajustes'})+'<div class="sheet"><div class="cn narrow" style="max-width:640px"><div class="sec"><div class="g2"><div><label class="lb" for="adf">Recargo doble forro (Bs)</label><input id="adf" class="fi" inputmode="numeric" data-a="aj" data-v="DF" value="'+S.DF+'"></div><div><label class="lb" for="atr">Envío trópico (Bs)</label><input id="atr" class="fi" inputmode="numeric" data-a="aj" data-v="TR" value="'+S.TR+'"></div></div><p class="mut">Los cambios se aplican solo a los pedidos nuevos.</p></div>'+
'<div class="sec"><h2 class="serif h2" style="margin-bottom:8px">Diseños</h2>'+(rows||'<p class="mut">Todavía no hay diseños. Agrega el primero abajo.</p>')+'<div class="fld" style="margin-top:14px"><label class="lb" for="dnew">Diseño nuevo</label><input id="dnew" class="fi" placeholder="Nombre del diseño"></div><div class="g2"><div><label class="lb" for="dpat">Muestra</label><select id="dpat" class="fi"><option value="liso">Liso</option><option value="floral">Floral</option><option value="rayas">Rayas</option><option value="lunares">Lunares</option></select></div><div><label class="lb" for="dcol">Color</label><input id="dcol" class="fi" type="color" value="#B01C75" style="padding:4px"></div></div><div id="derr" class="err"></div><button class="btn" data-a="addd">Agregar diseño</button></div></div></div>'}

function sAccesos(){
var c=R.cta||{creada:false,email:'',activo:true};
var hr=[1,2,3,4,5,6,0].map(function(d){var x=S.horario[d]||{on:0,a:'08:00',b:'19:00'};return '<div style="display:flex;align-items:center;gap:8px;min-height:50px"><input type="checkbox" id="ho'+d+'"'+(x.on?' checked':'')+' style="width:22px;height:22px;accent-color:var(--btn);flex:none" aria-label="'+DAYN[d]+' permitido"><label for="ho'+d+'" style="width:50px;font-weight:700">'+DAYS3[d].replace(/^./,function(z){return z.toUpperCase()})+'</label><input type="time" class="fi" style="height:44px;flex:1;min-width:0;padding:0 8px" id="ha'+d+'" value="'+x.a+'" aria-label="'+DAYN[d]+' desde"><input type="time" class="fi" style="height:44px;flex:1;min-width:0;padding:0 8px" id="hb'+d+'" value="'+x.b+'" aria-label="'+DAYN[d]+' hasta"></div>'}).join('');
var ac=S.acc.map(function(a){var bad=a.tipo!=='Ingreso';return '<div class="hrow" style="'+(bad?'border-color:var(--bad);background:color-mix(in srgb,var(--bad) 12%,var(--surface))':'')+'"><div class="l"><div><b>'+a.u+'</b><div class="mut">'+a.tipo+'</div></div><span class="mut">'+lab(a.d)+' '+a.h+'</span></div></div>'}).join('');
return hero({back:'mas',title:'Accesos'})+'<div class="sheet"><div class="cn narrow" style="max-width:640px">'+
'<div class="sec"><div class="l" style="margin-bottom:12px"><h2 class="serif h2">Cuenta de la vendedora</h2><span class="chip '+(c.creada?'c-ok':'c-done')+'">'+(c.creada?'Cuenta creada':'Sin cuenta')+'</span></div>'+
'<div class="fld"><label class="lb" for="ce">Correo</label><input id="ce" class="fi" type="email" value="'+esc(c.email)+'" placeholder="vendedora@correo.com"></div>'+
'<div class="fld"><label class="lb" for="cc">Contraseña nueva</label><div style="display:flex;gap:8px"><input id="cc" class="fi" type="text" autocomplete="off" placeholder="Mínimo 8 caracteres" style="flex:1;min-width:0"><button class="btn o sm" style="width:auto;margin:0;height:50px" data-a="gen">Generar</button></div><p class="mut" style="margin:6px 0 0">Anótala y entrégasela en persona: después de guardar no se vuelve a mostrar. Déjala vacía para no cambiarla.</p></div>'+
'<label class="ck"><input type="checkbox" id="ca"'+(c.activo!==false?' checked':'')+'> Acceso activo</label><div id="cerr" class="err"></div><button class="btn" data-a="savecta">Guardar cuenta</button></div>'+
'<div class="sec"><h2 class="serif h2">Horario de ingreso</h2><p class="mut" style="margin:4px 0 8px">Hora de Bolivia. Solo aplica a la vendedora.</p>'+hr+'<p class="mut">Fuera de este horario la vendedora no puede entrar. Si está dentro, se le avisa 10 minutos antes y su sesión se cierra a la hora de salida.</p><div id="herr" class="err"></div><button class="btn" data-a="savehor">Guardar horario</button></div>'+
'<div class="sec"><h2 class="serif h2" style="margin-bottom:10px">Historial de accesos</h2>'+(ac||'<p class="mut">Todavía no hay accesos registrados.</p>')+'</div></div></div>'}

function navHtml(){
var cur=R.scr;if(cur==='detalle'||cur==='editar')cur='pedidos';if(['saldos','clave','ajustes','accesos'].indexOf(cur)>=0)cur='mas';
var it=[['pedidos','Pedidos',IC.ped],['nuevo','Nuevo',IC.nue],['cortes','Cortes',IC.cor],['historial','Historial',IC.his],['mas','Más',IC.mas]];
return '<div class="navlogo"><span class="mono">JY</span><span class="serif" style="font-size:25px">Telas JY</span></div>'+it.map(function(i){return '<button data-a="go" data-v="'+i[0]+'" class="'+(cur===i[0]?'on':'')+'"'+(cur===i[0]?' aria-current="page"':'')+'>'+i[2]+'<span>'+i[1]+'</span></button>'}).join('')}

function draw(){
if(!R.role&&R.scr!=='login'&&R.scr!=='fuera')R.scr='login';
if(!own()&&(R.scr==='ajustes'||R.scr==='accesos'))R.scr='mas';
var nav=$('#nav');
if(R.scr==='login'||R.scr==='fuera'){nav.style.display='none'}else{nav.style.display='';nav.innerHTML=navHtml()}
var fn={login:sLogin,fuera:sFuera,pedidos:sPed,detalle:sDet,nuevo:sNuevo,cortes:sCortes,historial:sHist,mas:sMas,saldos:sSaldos,clave:sClave,ajustes:sAjustes,accesos:sAccesos,editar:sEditar}[R.scr];
var av='';
if(R.role==='vend'&&R.est&&R.est.segundos_restantes!=null&&R.est.segundos_restantes<=600){var mn=Math.max(1,Math.ceil(R.est.segundos_restantes/60));av='<div class="aviso" role="alert">Tu horario termina en '+mn+(mn===1?' minuto':' minutos')+'. Termina lo que estás haciendo.</div>'}
var ap=$('#app');ap.dataset.scr=R.scr;ap.classList.toggle('enter',draw.p!==undefined&&draw.p!==R.scr);draw.p=R.scr;
ap.innerHTML=av+fn();
if(R.scr==='pedidos')drawPedList();
if(R.scr==='nuevo'||R.scr==='editar')rn();
}
function go(s){if(NP&&NP.edit)NP=null;S.designs=S.designs.filter(function(d){return !d.extra});R.scr=s;R.envdirty=0;if(s==='nuevo')resetNP();draw();window.scrollTo(0,0);if(s==='nuevo'){var c=$('#cel');if(c)c.focus({preventScroll:true})}}

/* ---------- PDF y WhatsApp ---------- */
function pdf(titulo,filas,archivo){
if(!window.jspdf){toast('No se pudo cargar el generador de PDF. Revisa tu conexión.');return}
var d=new window.jspdf.jsPDF({unit:'pt',format:'a4'});
d.setFillColor(90,14,61);d.rect(0,0,595,74,'F');
d.setTextColor(255,255,255);d.setFont('helvetica','bold');d.setFontSize(22);d.text('Telas JY',40,40);
d.setFont('helvetica','normal');d.setFontSize(11);d.text(titulo,40,60);d.text(fd(today())+' '+today().slice(0,4),555,60,{align:'right'});
d.setDrawColor(216,183,110);d.setLineWidth(2);d.line(0,76,595,76);
var y=106;d.setTextColor(21,23,43);
filas.forEach(function(f){
if(y>790){d.addPage();y=60}
if(f.h){y+=8;d.setFont('helvetica','bold');d.setFontSize(13);d.text(f.h,40,y);d.setDrawColor(228,227,221);d.setLineWidth(.7);d.line(40,y+5,555,y+5);y+=22}
else if(f.t){d.setFont('helvetica','normal');d.setFontSize(10);var ls=d.splitTextToSize(f.t,515);d.text(ls,40,y);y+=14*ls.length}
else{d.setFont('helvetica',f.b?'bold':'normal');d.setFontSize(10);var ll=d.splitTextToSize(String(f[0]),400);d.text(ll,40,y);if(f[1]!=null)d.text(String(f[1]),555,y,{align:'right'});y+=14*ll.length+2}
});
d.save(archivo)}
function pdfPedido(o){
var f=[{h:'Cliente'}];if(o.cl)f.push(['Nombre',o.cl]);
f.push(['Celular',o.cel],['Entrega',envTxt(o)+(o.ent?', entregado '+fd(o.ent):'')],['Estado',o.es]);
if(o.env){var de=[o.env.nom,o.env.cel,o.env.ciu].filter(Boolean).join(', ');f.push(['Datos de envío',(de||'Pendientes')+(o.env.tro?' (trópico)':'')])}
f.push({h:'Cortes'});
o.it.forEach(function(i){f.push([i.d+': '+i.cm+' cm a '+i.p+' Bs por metro'+(i.df?', doble forro '+i.c+' (+'+i.rec+' Bs)':'')+(i.h?' (hecho)':''),bs(csub(i))])});
if(o.trv>0)f.push(['Envío trópico',bs(o.trv)]);
f.push(['TOTAL',bs(tot(o))]);f[f.length-1].b=1;
f.push({h:'Pagos'});
if(!o.pg.length)f.push({t:'Sin pagos registrados'});
o.pg.forEach(function(p){var m=p.ef>0&&p.qr>0?'Mixto (ef. '+bs(p.ef)+', QR '+bs(p.qr)+')':p.ef>0?'Efectivo':'QR';f.push([fd(p.d)+', '+m+(p.x?', ANULADO':'')+(p.v&&!p.x?', verificado':''),bs(p.ef+p.qr)])});
f.push(['Pagado',bs(paid(o))]);var s=sal(o);f.push(['SALDO PENDIENTE',bs(s)]);f[f.length-1].b=1;
pdf('Pedido '+o.n,f,'pedido-'+o.n+'.pdf')}
function pdfHist(){
var D=histData(),f=[{t:'Periodo: '+rangeLab()},{h:'Resumen'},['Cobrado',bs(D.ef+D.qr)],['En efectivo',bs(D.ef)],['Por QR',bs(D.qr)],['Vendido',bs(D.vend)+' en '+D.pv.length+' pedidos'],['Entregas',String(D.en.length)],['Retirado de la tienda',bs(D.rt)]];
f.push({h:'Pagos'});
var rows=[];D.pg.forEach(function(r){rows.push({d:r.p.d,r:r})});
grp(rows).forEach(function(g){var s=g[1].reduce(function(a,x){return a+(x.r.p.x?0:x.r.p.ef+x.r.p.qr)},0);f.push([lab(g[0]),bs(s)]);f[f.length-1].b=1;
g[1].forEach(function(x){var p=x.r.p,m=p.ef>0&&p.qr>0?'mixto':p.ef>0?'efectivo':'QR';f.push(['   '+nom(x.r.o)+', pedido '+x.r.o.n+', '+m+(p.x?', ANULADO':'')+(p.v&&!p.x?', verificado':''),bs(p.ef+p.qr)])})});
f.push({h:'Retiros de efectivo'});
var rr=S.retiros.filter(function(r){return inr(r.d)}).map(function(r){return {d:r.d,m:r.m}});
if(!rr.length)f.push({t:'Sin retiros en este periodo'});
rr.forEach(function(r){f.push([lab(r.d),bs(r.m)])});
pdf('Historial',f,'historial.pdf')}
function pdfSaldos(){
var D=saldosData(),g=D.g,tt=D.tt;
var f=[{h:'Saldos pendientes'}];
Object.keys(g).sort(function(a,b){return g[b].s-g[a].s}).forEach(function(k){var c=g[k];f.push([(c.nom?c.nom+', ':'')+c.cel+', pedidos '+c.n.join(', '),bs(c.s)])});
f.push(['TOTAL POR COBRAR',bs(tt)]);f[f.length-1].b=1;
pdf('Saldos pendientes',f,'saldos-pendientes.pdf')}
function pdfCortes(){
var g={};S.orders.forEach(function(o){if(o.es==='Entregado'||o.es==='Cancelado')return;o.it.forEach(function(i){if(!i.h)(g[i.d]=g[i.d]||[]).push({o:o,i:i})})});
var f=[],tc=0,tcm=0;
Object.keys(g).sort().forEach(function(n){var cm=g[n].reduce(function(a,x){return a+x.i.cm},0);f.push({h:n+': '+g[n].length+' cortes, '+m2(cm)+' m'});tc+=g[n].length;tcm+=cm;
g[n].forEach(function(x){f.push(['   '+x.i.cm+' cm, '+nom(x.o)+', pedido '+x.o.n+(x.i.df?', forro '+x.i.c:''),''])})});
if(!f.length)f.push({t:'No hay cortes pendientes'});else f.push(['TOTAL: '+tc+' cortes',m2(tcm)+' m']);
pdf('Cortes pendientes por diseño',f,'cortes-pendientes.pdf')}
function whatsapp(o){
var n=String(o.cel).replace(/\D/g,'');var full=n.length===8?'591'+n:n;
var t='Hola'+(o.cl?' '+o.cl:'')+', este es el resumen de tu pedido '+o.n+' en Telas JY:\n'+o.it.map(function(i){return '- '+i.d+', '+i.cm+' cm'+(i.df?' con doble forro '+i.c:'')+': '+bs(csub(i))}).join('\n')+(o.trv>0?'\n- Envío a trópico: '+bs(o.trv):'')+'\nTotal: '+bs(tot(o))+'\nPagado: '+bs(paid(o))+'\nSaldo: '+bs(sal(o))+'\n¡Gracias por tu compra!';
window.open('https://wa.me/'+full+'?text='+encodeURIComponent(t),'_blank')}

/* ---------- acciones ---------- */
var A={
go:async function(e){var v=e.dataset.v;if(v==='accesos'&&own()){await cargarAccesos()}go(v)},
entrar:async function(){
var em=$('#lc').value.trim(),pw=$('#lp').value,er=$('#lerr');
if(!em||!pw){er.textContent='Escribe tu correo y tu contraseña';return}
er.textContent='';busy(1);
var r=await sb.auth.signInWithPassword({email:em,password:pw});
busy(0);
if(r.error){er.textContent=/banned/i.test(r.error.message)?'Tu acceso está desactivado':(/invalid/i.test(r.error.message)?'Correo o contraseña incorrectos':r.error.message);return}
await abrirSesion(true)},
logout:async function(){clearInterval(tim);await sb.auth.signOut();R.role=null;R.est=null;S.orders=[];S.retiros=[];R.scr='login';draw();window.scrollTo(0,0)},
sync:function(){recargar().then(function(){toast('Datos actualizados')})},
open:function(e){R.id=+e.dataset.v;R.pm='Efectivo';R.scr='detalle';R.envdirty=0;draw();window.scrollTo(0,0)},
saveenv:async function(){
var o=byN(R.id);if(!o||!o.env)return;
var nm=$('#env_nom').value.trim(),ce=$('#env_cel').value.trim(),ci=$('#env_ciu').value.trim(),tr=$('#env_tro').checked;
await run(function(){return sb.from('pedidos').update({envio_nombre:nm||null,envio_celular:ce||null,envio_ciudad:ci||null,envio_tropico:tr}).eq('id',o.id)},'Datos de envío guardados');
R.envdirty=0;await recargar()},
flt:function(e){R.flt=e.dataset.v;draw()},
pmeth:function(e){R.pm=e.dataset.v;draw()},
comp:function(){var o=byN(R.id),s=sal(o);if((R.pm||'Efectivo')==='Mixto'){var ef=parseInt($('#pe').value,10)||0;$('#pq').value=Math.max(0,s-ef)}else $('#pa').value=s},
reg:async function(){
var o=byN(R.id),pm=R.pm||'Efectivo',ef=0,qr=0,er=$('#perr'),a,b;
if(pm==='Mixto'){a=$('#pe').value.trim()||'0';b=$('#pq').value.trim()||'0';if(!/^\d+$/.test(a)||!/^\d+$/.test(b)){er.textContent='Ingresa montos en Bs enteros';return}ef=+a;qr=+b}
else{a=$('#pa').value.trim();if(!/^\d+$/.test(a)){er.textContent='Ingresa un monto en Bs enteros';return}if(pm==='Efectivo')ef=+a;else qr=+a}
if(ef+qr<=0){er.textContent='Ingresa un monto mayor a 0';return}
if(ef+qr>sal(o)){er.textContent='El monto supera el saldo ('+bs(sal(o))+')';return}
var r=await run(function(){return sb.from('pagos').insert({pedido_id:o.id,efectivo:ef,qr:qr})},'Pago registrado');
if(r)await recargar()},
anu:function(e){var pid=byN(R.id).pg[+e.dataset.v].id;ask({title:'Anular pago',text:'El pago queda tachado en el historial y deja de sumar.',input:'Motivo',ok:'Anular pago',fn:async function(v){var r=await run(function(){return sb.from('pagos').update({anulado:true,motivo_anulacion:v}).eq('id',pid)},'Pago anulado');if(r)await recargar()}})},
listo:async function(){var o=byN(R.id);var r=await run(function(){return sb.from('pedidos').update({estado:'listo'}).eq('id',o.id)},'Pedido marcado como listo');if(r)await recargar()},
addcut:function(){NP.items.push({d:0,cm:'',p:'',df:0,c:''});rn();var q=$('#c'+(NP.items.length-1));if(q)q.focus()},
delcut:function(e){if(NP.items.length>1){NP.items.splice(+e.dataset.v,1);rn()}else $('#nerr').textContent='El pedido necesita al menos un corte'},
nent:function(e){NP.ent=e.dataset.v;draw()},
npm:function(e){NP.pm=e.dataset.v;draw()},
npall:function(){var t=ntotal(),er=$('#nerr');if(!(t>0)){er.textContent='Primero completa los cortes para saber el total';return}er.textContent='';
if(NP.pm==='Mixto'){NP.ae=String(t);NP.aq='0';$('#ae').value=NP.ae;$('#aq').value=NP.aq}else{NP.ad=String(t);$('#ad').value=NP.ad}
ntot()},
savep:function(){return savep()},
rall:function(e){$('#rmon').value=e.dataset.v},
rret:function(){var v=$('#rmon').value.trim(),er=$('#rerr');if(!/^\d+$/.test(v)||+v<=0){er.textContent='Ingresa un monto entero mayor a 0';return}er.textContent='';
ask({title:'¿Registrar retiro de '+bs(+v)+'?',text:'Se guarda con la fecha de hoy.',ok:'Confirmar',fn:async function(){var r=await run(function(){return sb.from('retiros').insert({monto:+v})},'Retiro registrado');if(r)await recargar()}})},
hv:function(e){R.hv=e.dataset.v;draw()},
hp:function(e){hset(e.dataset.v);draw()},
hm:function(e){R.hm=e.dataset.v;draw()},
addd:async function(){var n=$('#dnew').value.trim(),er=$('#derr');if(!n){er.textContent='Escribe el nombre del diseño';return}
var r=await run(function(){return sb.from('disenos').insert({nombre:n,patron:$('#dpat').value,color:$('#dcol').value})});
if(!r){return}
await recargar();toast('Diseño agregado')},
ocd:function(e){var id=+e.dataset.v;ask({title:'¿Ocultar este diseño?',text:'Ya no aparecerá en la lista de nuevos pedidos. Los pedidos anteriores no cambian.',ok:'Ocultar',fn:async function(){var r=await run(function(){return sb.from('disenos').update({activo:false}).eq('id',id)},'Diseño oculto');if(r)await recargar()}})},
gen:function(){var w=['Tela','Hilo','Lino','Seda'];$('#cc').value=w[Math.floor(Math.random()*4)]+Math.floor(1000+Math.random()*9000)+String.fromCharCode(65+Math.floor(Math.random()*26))},
savecta:async function(){
var em=$('#ce').value.trim(),pw=$('#cc').value,er=$('#cerr'),c=R.cta||{creada:false};
if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){er.textContent='Escribe un correo válido';return}
if(!c.creada&&pw.length<8){er.textContent='La contraseña es obligatoria (mínimo 8 caracteres)';return}
if(pw&&pw.length<8){er.textContent='La contraseña necesita al menos 8 caracteres';return}
er.textContent='';busy(1);
try{await llamarCuenta({accion:'guardar',email:em,password:pw,activo:$('#ca').checked});toast('Cuenta guardada. La contraseña no se vuelve a mostrar.');busy(0);await cargarAccesos();draw()}
catch(x){busy(0);er.textContent=x.message}},
savehor:async function(){
var arr=[],er=$('#herr');
for(var d=0;d<7;d++){var on=$('#ho'+d).checked,a=$('#ha'+d).value,b=$('#hb'+d).value;
if(on&&(!a||!b||tm(a)>=tm(b))){er.textContent='En '+DAYN[d]+' la hora de salida debe ser después de la de entrada';return}
var prev=S.horario[d]||{a:'08:00',b:'19:00'};
arr.push({dia:d,permitido:on,desde:(a&&b&&tm(a)<tm(b))?a:prev.a,hasta:(a&&b&&tm(a)<tm(b))?b:prev.b})}
er.textContent='';
var r=await run(function(){return sb.rpc('guardar_horarios',{p:arr})},'Horario guardado');
if(r){await cargarAccesos();draw()}},
saveclave:async function(){var a=$('#k1').value,b=$('#k2').value,er=$('#kerr');if(a.length<8){er.textContent='La contraseña necesita al menos 8 caracteres';return}if(a!==b){er.textContent='Las contraseñas no coinciden';return}
var r=await run(function(){return sb.auth.updateUser({password:a})},'Contraseña actualizada');if(r)go('mas')},
pdfped:function(){var o=byN(R.id);if(o)pdfPedido(o)},
edit:function(){var o=byN(R.id);if(!o||!own()||o.es==='Cancelado')return;
S.designs=S.designs.filter(function(d){return !d.extra});
var its=o.it.map(function(i){var k=-1;for(var j=0;j<S.designs.length;j++){if(S.designs[j].n===i.d){k=j;break}}
if(k<0){S.designs.push({id:-1,n:i.d,pat:'liso',col:'#9AA0B0',extra:1});k=S.designs.length-1}
return {id:i.id,d:k,cm:String(i.cm),p:String(i.p),df:i.df,c:i.c,rec:i.df?i.rec:null}});
NP={edit:1,items:its,ent:o.env?'envio':'retiro',en:o.env?o.env.nom:'',ec:o.env?o.env.cel:'',ci:o.env?o.env.ciu:'',tro:o.env&&o.env.tro?1:0};
R.scr='editar';draw();window.scrollTo(0,0)},
saveedit:async function(){
var o=byN(R.id),er=$('#nerr');if(!o||!NP||!NP.edit||!own())return;
for(var k=0;k<NP.items.length;k++){var i=NP.items[k];
if(fe(i.cm)){er.textContent='Corte '+(k+1)+', medida: '+fe(i.cm);return}
if(fe(i.p)){er.textContent='Corte '+(k+1)+', costo por metro: '+fe(i.p);return}
if(!(pn(i.cm)>0)){er.textContent='El corte '+(k+1)+' necesita una medida mayor a 0';return}
if(!(pn(i.p)>0)){er.textContent='El corte '+(k+1)+' necesita el costo por metro';return}
if(i.df&&!String(i.c||'').trim()){er.textContent='Indica el color del doble forro del corte '+(k+1);return}}
var c=ecalc(o);
if(c.t<c.p){er.textContent='El total ('+bs(c.t)+') no puede ser menor que lo ya pagado ('+bs(c.p)+'). Primero anula un pago.';return}
er.textContent='';
var payload={id:o.id,entrega:NP.ent,envio_nombre:NP.ent==='envio'?NP.en.trim():null,envio_celular:NP.ent==='envio'?NP.ec.trim():null,envio_ciudad:NP.ent==='envio'?NP.ci.trim():null,tropico:NP.ent==='envio'&&!!NP.tro,
items:NP.items.map(function(i){return {id:i.id||null,diseno:S.designs[i.d].n,cm:pn(i.cm),precio_metro:pn(i.p),doble_forro:!!i.df,color_forro:String(i.c||'').trim()}})};
var r=await run(function(){return sb.rpc('editar_pedido',{p:payload})},'Pedido actualizado');
if(!r)return;
NP=null;R.scr='detalle';await recargar();window.scrollTo(0,0)},
delp:function(){var o=byN(R.id);if(!o||!own())return;
var pgs=o.pg.reduce(function(a,p){return a+(p.x?0:p.ef+p.qr)},0);
ask({title:'¿Eliminar el pedido '+o.n+'?',text:o.pg.length?'Tiene '+o.pg.length+(o.pg.length===1?' pago registrado':' pagos registrados')+' ('+bs(pgs)+'). Se borra todo: el pedido, sus cortes y sus pagos. No se puede deshacer.':'Se borra por completo, con sus cortes. No se puede deshacer.',ok:'Eliminar pedido',danger:1,fn:async function(){
var r=await run(function(){return sb.from('pedidos').delete().eq('id',o.id).select('id')});
if(!r)return;
if(!r.data||!r.data.length){toast('No se pudo eliminar el pedido');return}
toast('Pedido '+o.n+' eliminado');R.scr='pedidos';R.id=null;await recargar();window.scrollTo(0,0)}})},
pdfhist:function(){pdfHist()},
pdfsal:function(){pdfSaldos()},
pdfcor:function(){pdfCortes()},
wa:function(){var o=byN(R.id);if(o)whatsapp(o)},
mno:function(){closeAsk()},
mok:function(){var o=ask.o;if(!o)return;var v='';if(o.input){v=$('#mi').value.trim();if(!v){$('#merr').textContent='Escribe el motivo';return}}closeAsk();o.fn(v)}
};
async function savep(){
var er=$('#nerr'),cel=ncel(NP.cel);
if(!S.designs.length){er.textContent='Primero agrega diseños en Ajustes';return}
if(cel.length<7){er.textContent='Ingresa el celular del cliente';return}
for(var k=0;k<NP.items.length;k++){var i=NP.items[k];
if(fe(i.cm)){er.textContent='Corte '+(k+1)+', medida: '+fe(i.cm);return}
if(fe(i.p)){er.textContent='Corte '+(k+1)+', costo por metro: '+fe(i.p);return}
if(!(pn(i.cm)>0)){er.textContent='El corte '+(k+1)+' necesita una medida mayor a 0';return}
if(!(pn(i.p)>0)){er.textContent='El corte '+(k+1)+' necesita el costo por metro';return}
if(i.df&&!i.c.trim()){er.textContent='Indica el color del doble forro del corte '+(k+1);return}}
var a=adel();
if(a.err){er.textContent=a.err;return}
var tt=ntotal();
if(a.ef+a.qr>tt){er.textContent='El adelanto no puede superar el total ('+bs(tt)+')';return}
er.textContent='';
var payload={celular:cel,entrega:NP.ent,envio_nombre:NP.ent==='envio'?NP.en.trim():null,envio_celular:NP.ent==='envio'?NP.ec.trim():null,envio_ciudad:NP.ent==='envio'?NP.ci.trim():null,tropico:NP.ent==='envio'&&!!NP.tro,fecha_entrega:today(),pago_efectivo:a.ef,pago_qr:a.qr,
items:NP.items.map(function(i){return {diseno:S.designs[i.d].n,cm:pn(i.cm),precio_metro:pn(i.p),doble_forro:!!i.df,color_forro:i.c.trim()}})};
var r=await run(function(){return sb.rpc('crear_pedido',{p:payload})});
if(!r)return;
var num=r.data;NP=null;
busy(1);try{await cargar()}catch(e){}busy(0);
R.id=num;R.pm='Efectivo';R.scr='detalle';draw();window.scrollTo(0,0);toast('Pedido '+num+' guardado')}

document.addEventListener('click',function(ev){
var e=ev.target.closest('[data-a]');if(!e)return;
var t=e.tagName;if(t==='INPUT'||t==='SELECT')return;
var f=A[e.dataset.a];if(f)f(e)});
document.addEventListener('change',async function(ev){
var e=ev.target,a=e.dataset.a;
if(e.id==='hd1'||e.id==='hd2'){var x=$('#hd1').value,y=$('#hd2').value;if(x&&y){if(x>y){var z=x;x=y;y=z}R.hf=x;R.ht=y;R.hp='x';draw()}return}
if(!a)return;
var o,r;
if(a==='cut'){o=byN(R.id);var it=o.it[+e.dataset.v];r=await run(function(){return sb.from('pedido_items').update({hecho:e.checked}).eq('id',it.id)});await recargar()}
else if(a==='cx'){var p=e.dataset.v.split(',');o=byN(+p[0]);var it2=o.it[+p[1]];r=await run(function(){return sb.from('pedido_items').update({hecho:e.checked}).eq('id',it2.id)});await recargar()}
else if(a==='ver'){o=byN(R.id);var pg=o.pg[+e.dataset.v];r=await run(function(){return sb.from('pagos').update({verificado:e.checked}).eq('id',pg.id)});await recargar()}
else if(a==='es'){o=byN(R.id);var v=e.value;
if(v==='Cancelado'){e.value=o.es;ask({title:'¿Cancelar este pedido?',text:'El pedido deja de contar en las ventas y en los saldos.',ok:'Cancelar pedido',fn:async function(){var r2=await run(function(){return sb.from('pedidos').update({estado:'cancelado'}).eq('id',o.id)},'Pedido cancelado');if(r2)await recargar()}});return}
r=await run(function(){return sb.from('pedidos').update({estado:ESC[v],fecha_entregado:v==='Entregado'?today():null}).eq('id',o.id)},'Estado actualizado');await recargar()}
else if(a==='nd'){NP.items[+e.dataset.k].d=+e.value;rn()}
else if(a==='ndf'){NP.items[+e.dataset.k].df=e.checked?1:0;rn()}
else if(a==='ntro'){NP.tro=e.checked?1:0;ntot()}
else if(a==='aj'){var n=parseInt(e.value,10);if(n>=0){var patch=e.dataset.v==='DF'?{recargo_forro:n}:{envio_tropico:n};r=await run(function(){return sb.from('ajustes').update(patch).eq('id',1)},'Ajuste guardado');if(r){if(e.dataset.v==='DF')S.DF=n;else S.TR=n}}}
});
document.addEventListener('input',function(ev){
var e=ev.target;
if(e.id==='q'){R.q=e.value;drawPedList();return}
if(e.id&&e.id.indexOf('env_')===0){R.envdirty=1;return}
if(e.dataset.np){NP[e.dataset.np]=e.value;
if(e.dataset.np==='cel')avisoCliente();
if(e.dataset.np==='ad'||e.dataset.np==='ae'||e.dataset.np==='aq')ntot();
return}
if(e.dataset.ni!==undefined){var it=NP.items[+e.dataset.ni],f=e.dataset.f;it[f]=e.value;
if(f==='cm'||f==='p'){var k=e.dataset.ni,raw=nraw(it),ee=$('#e'+(f==='cm'?'cm':'pr')+k);if(ee)ee.textContent=fe(e.value);$('#ns'+k).textContent=bs(nsub(it));$('#nr'+k).innerHTML=raw!==Math.round(raw)?'<span style="font-size:12px;font-weight:400;color:var(--muted)">'+raw.toFixed(2).replace('.',',')+' redondeado </span>':'';ntot()}}
});
document.addEventListener('keydown',function(ev){
if(ev.key==='Escape'&&ask.o)closeAsk();
if(ev.key==='Enter'&&R.scr==='login'&&(ev.target.id==='lp'||ev.target.id==='lc'))A.entrar()});
document.addEventListener('visibilitychange',function(){if(!document.hidden&&R.role)vigilar()});

sb.auth.onAuthStateChange(function(ev){if(ev==='SIGNED_OUT'&&R.role){R.role=null;R.scr='login';draw()}});
draw();
iniciar();
})();
