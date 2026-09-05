// app.js
const REFRESH_MS=10000;
let lastHash='';
const $=id=>document.getElementById(id);
const num=v=>Number(v||0).toLocaleString('en-US');
function timeFmt(v){if(!v)return '--'; if(typeof v==='string')return v; return new Date(v).toLocaleTimeString('en-PH',{hour12:false,hour:'2-digit',minute:'2-digit'});}
function activityFmt(v){if(!v)return '00:00'; const d=new Date(v); if(isNaN(d))return v; const now=new Date(); let m=Math.max(0,Math.floor((now-d)/60000)); return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0');}
function remarkClass(s){s=(s||'').toUpperCase(); if(s.includes('UNSAFE')||s.includes('ROUGH SEA'))return 'danger'; if(s.includes('WAITING')||s.includes('INSPECTION'))return 'warn'; return '';}
function render(d){
 $('syncText').textContent='LIVE • UPDATED '+new Date(d.updated_at).toLocaleTimeString('en-PH',{hour12:false});
 $('refreshSec').textContent=(REFRESH_MS/1000)+'s';
 const rows=d.berths||[]; $('berthGrid').innerHTML=rows.map(x=>{let p=Math.max(0,Math.min(100,(x.progress||0)*100));let vacant=String(x.vessel||'').toUpperCase()==='VACANT';return `<article class="berth ${vacant?'vacant':''}"><div class="berth-head"><span>${x.berth}</span><span class="vessel">${x.vessel||'—'}</span><span>V${x.voyage||0}</span><span>${x.time||'--'}</span></div><div class="berth-body"><div class="cols"><span class="value">${num(x.booking)}</span><span class="value">${num(x.dispatch)}</span><span class="value">${num(x.loaded)}</span><span class="value">${num(x.balance)}</span><span class="value">${num(x.stockpile)}</span><span class="progress-wrap"><span class="bar"><i style="width:${p}%"></i></span><b>${p.toFixed(0)}%</b></span><span class="activity">${activityFmt(x.activity_time)}</span><span class="label">BOOKING</span><span class="label">DISPATCH</span><span class="label">LOADED</span><span class="label">BALANCE</span><span class="label">STOCKPILE</span><span class="label">PROGRESS</span><span class="label">ACTIVITY</span></div><div class="remark ${remarkClass(x.remarks)}">${x.remarks||' '}</div><div class="equip">EQUIPMENT: ${x.equipment||'—'}</div></div></article>`}).join('');
 const t=d.total||{}; $('totalBooking').textContent=num(t.booking);$('totalDispatch').textContent=num(t.dispatch);$('totalLoaded').textContent=num(t.loaded);$('totalBalance').textContent=num(t.balance);$('totalProgress').textContent=((t.progress||0)*100).toFixed(0)+'%';$('totalStockpile').textContent=num(t.stockpile);
 $('trucking').innerHTML='<div class="tr"><span>HAULER</span><span>AUGUST</span><span>SEPT</span><span>DAILY</span></div>'+(d.trucking||[]).map(x=>`<div class="tr"><b>${x.hauler}</b><span>${num(x.august)}</span><span>${num(x.september)}</span><span>${num(x.daily)}</span></div>`).join('');
 $('dailyProduction').innerHTML=(d.daily_production||[]).map(x=>`<div><span>${x.shift}</span><b>${num(x.qty)}</b></div>`).join('');
 const m=d.monthly||[]; $('monthly').innerHTML='<div class="mh">MONTH</div><div class="mh">2025</div><div class="mh">2026</div>'+m.map(x=>`<div>${x.month}</div><div>${num(x.y2025)}</div><div>${num(x.y2026)}</div>`).join('');
 const s=d.status||{}; ['stevedores','cranes','forklifts','supervisor','checker','pmc'].forEach(k=>$(k).textContent=s[k]??'--');
 $('alphaRows').innerHTML=(d.alpha||[]).map(x=>`<div class="alpha-row"><b>${x.berth}</b><span>${x.vessel}</span><span>${x.materials||''}</span><span>${x.remarks||''}</span></div>`).join('');
 const alerts=rows.filter(x=>x.remarks&&x.vessel!=='VACANT').map(x=>`${x.berth}: ${x.vessel} — ${x.remarks}`); $('tickerText').textContent=alerts.length?alerts.join('   •   '):'ALL PORT OPERATIONS NORMAL';
}
async function load(){try{const r=await fetch('data.json?t='+Date.now(),{cache:'no-store'}); if(!r.ok)throw new Error(r.status);const d=await r.json();const h=JSON.stringify(d);if(h!==lastHash){lastHash=h;render(d)}}catch(e){$('syncText').textContent='OFFLINE / WAITING FOR DATA';}}
function clock(){const n=new Date();$('phDate').textContent=n.toLocaleDateString('en-PH',{weekday:'short',year:'numeric',month:'short',day:'2-digit'});$('phTime').textContent=n.toLocaleTimeString('en-PH',{hour12:false});}
clock();setInterval(clock,1000);load();setInterval(load,REFRESH_MS);
