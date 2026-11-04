const $=id=>document.getElementById(id);
const eur=n=>n==null?'':n.toLocaleString(C.loc)+' €';
const short=n=>n>=1e6?(n/1e6).toLocaleString(C.loc,{maximumFractionDigits:2})+' M€':Math.round(n/1e3)+' k€';
let ALL=[],VIEW=[],shown=24;
const PAGE=24;

// Mapa
const map=L.map('map',{scrollWheelZoom:true,zoomControl:true}).setView([40.43,-3.69],13);
L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles © Esri — Esri, HERE, Garmin, © OpenStreetMap',maxZoom:16}).addTo(map);
const layer=L.markerClusterGroup({showCoverageOnHover:false,maxClusterRadius:45,spiderfyOnMaxZoom:true,iconCreateFunction:c=>L.divIcon({className:'',html:`<span class="clu">${c.getChildCount()}</span>`,iconSize:[38,38]})}).addTo(map);
const pins={};
let boundsFilter=false;

function card(p){
  const st=p.soon?`<span class="badge gold">${C.soon}</span>`:(p.works?`<span class="badge">${C.works[p.works]}</span>`:'');
  const specs=[p.m2&&p.m2+' '+C.m2,p.bed!=null&&p.bed+' '+C.bedShort,p.bath!=null&&p.bath+' '+C.bathShort,p.garage&&C.garageS,p.terrace&&C.terraceS].filter(Boolean).join(' · ');const TL=C.types[p.type]||C.types.other;
  return `<a class="card" id="c-${p.id}" href="${C.base}/${p.id}" data-id="${p.id}">
   <div class="ph"><img loading="lazy" src="${p.cover||''}" alt="${TL} · ${p.street}">${st}</div>
   <div class="m"><div class="pr">${eur(p.price)}</div><div class="st">${p.street}</div><div class="sp2">${TL} · ${specs}</div></div></a>`;
}

function readF(){
  return {t:$('fType').value,min:+$('fMin').value||0,max:+$('fMax').value||0,m2:+$('fM2').value||0,bed:+$('fBed').value||0,gar:$('fGar').checked,ter:$('fTer').checked,now:$('fNow').checked,sort:$('fSort').value};
}
function apply(){
  const f=readF();
  let v=ALL.filter(p=>(!f.t||p.type===f.t)&&(!f.min||p.price>=f.min)&&(!f.max||p.price<=f.max)&&(!f.m2||(p.m2||0)>=f.m2)&&(!f.bed||(p.bed||0)>=f.bed)&&(!f.gar||p.garage)&&(!f.ter||p.terrace)&&(!f.now||(!p.soon&&!p.works)));
  const filtered=v;
  if(boundsFilter){const b=map.getBounds();v=v.filter(p=>p.lat&&b.contains([p.lat,p.lng]))}
  const S={rec:(a,b)=>String(b.updated).localeCompare(String(a.updated)),pa:(a,b)=>a.price-b.price,pd:(a,b)=>b.price-a.price,ma:(a,b)=>(a.eurm2||9e9)-(b.eurm2||9e9),sd:(a,b)=>(b.m2||0)-(a.m2||0)};
  v.sort(S[f.sort]);
  VIEW=v;shown=PAGE;
  drawList();drawPins(filtered);
  $('count').textContent=`${v.length} ${v.length===1?C.count1:C.countN}${boundsFilter?' '+C.onMap:''}`;
  saveF(f);
}
function drawList(){
  $('grid').innerHTML=VIEW.slice(0,shown).map(card).join('');
  $('empty').hidden=VIEW.length>0;
  $('more').hidden=VIEW.length<=shown;
  document.querySelectorAll('.card').forEach(c=>{
    c.addEventListener('mouseenter',()=>hl(c.dataset.id,true));
    c.addEventListener('mouseleave',()=>hl(c.dataset.id,false));
  });
}
function drawPins(list){
  layer.clearLayers();
  for(const k in pins)delete pins[k];
  list.forEach(p=>{
    if(!p.lat||!p.lng)return;
    const m=L.marker([p.lat,p.lng],{icon:L.divIcon({className:'',html:`<span class="pin" id="pin-${p.id}">${short(p.price)}</span>`,iconSize:[0,0]})});
    m.bindPopup(`<a href="${C.base}/${p.id}" style="text-decoration:none;color:#0D1B2A;display:block;width:200px"><img src="${p.cover||''}" style="width:200px;height:130px;object-fit:cover;display:block"><strong style="display:block;margin-top:6px">${eur(p.price)}</strong>${p.street} · ${p.m2||''} ${C.m2}</a>`,{closeButton:false});
    m.on('mouseover',()=>hl(p.id,true));m.on('mouseout',()=>hl(p.id,false));
    m.addTo(layer);pins[p.id]=m;
  });
}
function hl(id,on){
  const c=$('c-'+id);if(c)c.classList.toggle('hl',on);
  const pn=$('pin-'+id);if(pn){pn.classList.toggle('on',on);const m=pins[id];if(m)m.setZIndexOffset(on?1000:0)}
}
function fit(){
  const pts=ALL.filter(p=>p.lat&&p.lng).map(p=>[p.lat,p.lng]);
  if(pts.length)map.fitBounds(pts,{padding:[30,30],maxZoom:15});
}
// filtrar por la zona visible del mapa cuando el usuario lo mueve
let userMoved=false;
['pointerdown','wheel','touchstart'].forEach(ev=>map.getContainer().addEventListener(ev,()=>{userMoved=true},{passive:true}));
map.on('moveend',()=>{if(userMoved){boundsFilter=true;apply()}});

function saveF(f){try{sessionStorage.setItem('olaraF',JSON.stringify(f))}catch(e){}}
function loadF(){try{const f=JSON.parse(sessionStorage.getItem('olaraF')||'null');if(!f)return;$('fType').value=f.t||'';$('fMin').value=f.min||'';$('fMax').value=f.max||'';$('fM2').value=f.m2||'';$('fBed').value=f.bed||'';$('fGar').checked=!!f.gar;$('fTer').checked=!!f.ter;$('fNow').checked=!!f.now;$('fSort').value=f.sort||'rec'}catch(e){}}
function resetF(){['fType','fMin','fMax','fM2','fBed'].forEach(i=>$(i).value='');['fGar','fTer','fNow'].forEach(i=>$(i).checked=false);$('fSort').value='rec';boundsFilter=false;userMoved=false;fit();apply()}

['fType','fM2','fBed','fGar','fTer','fNow','fSort'].forEach(i=>$(i).addEventListener('change',apply));
['fMin','fMax'].forEach(i=>$(i).addEventListener('input',()=>{clearTimeout(window._t);window._t=setTimeout(apply,350)}));
$('reset').onclick=resetF;
$('more').onclick=()=>{shown+=PAGE;drawList()};
$('mapbtn').onclick=()=>{document.body.classList.toggle('showmap');$('mapbtn').textContent=document.body.classList.contains('showmap')?C.listBtn:C.mapBtn;setTimeout(()=>map.invalidateSize(),50)};

fetch('/api/viviendas').then(r=>{if(!r.ok)throw 0;return r.json()}).then(j=>{
  ALL=j.items||[];
  [...new Set(ALL.map(p=>p.type))].forEach(t=>{const o=document.createElement('option');o.value=t;o.textContent=C.types[t]||C.types.other;$('fType').appendChild(o)});
  loadF();fit();apply();
}).catch(()=>{$('count').textContent='';$('grid').innerHTML='<p class="empty">'+C.loadErr+'</p>'});
