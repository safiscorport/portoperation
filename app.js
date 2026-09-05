const REFRESH_MS=10000;
let lastHash='';
const $=id=>document.getElementById(id);
const num=v=>v==null||v===''||isNaN(v)?'-':Number(v).toLocaleString('en-US');
function remarkClass(s){s=(s||'').toUpperCase(); if(s.includes('UNSAFE')||s.includes('ROUGH SEA'))return 'danger'; if(s.includes('WAITING')||s.includes('INSPECTION'))return 'warn'; return '';}

function render(d){
 $('syncText').textContent='LIVE • UPDATED '+new Date(d.updated_at).toLocaleTimeString('en-PH',{hour12:false});
 $('refreshSec').textContent=(REFRESH_MS/1000)+'s';
 
 const rows=d.berths||[];
 let html=`<div class="berth-row header"><span>Berth</span><span>Vessel</span><span>Voy #</span><span>Booking</span><span>Dispatch</span><span>Loaded</span><span>Balance</span><span>Progress</span><span>Stockpile</span><span>Time</span><span>Remarks</span><span>Act</span></div>`;
 
 rows.forEach(x=>{
   let p=Math.max(0,Math.min(100,(x.progress||0)*100));
   let vacant=String(x.vessel||'').toUpperCase()==='VACANT';
   html+=`<div class="berth-row ${vacant?'vacant':''}">
     <b>${x.berth}</b>
     <span class="vessel">${x.vessel||'—'}</span>
     <span>${x.voyage||'-'}</span>
     <span class="val">${num(x.booking)}</span>
     <span class="val">${num(x.dispatch)}</span>
     <span class="val">${num(x.loaded)}</span>
     <span class="val">${num(x.balance)}</span>
     <span class="progress-wrap"><span class="bar"><i style="width:${p}%"></i></span><b>${p.toFixed(0)}%</b></span>
     <span class="val">${num(x.stockpile)}</span>
     <span>${x.time||'-'}</span>
     <span class="remark ${remarkClass(x.remarks)}">${x.remarks||''}</span>
     <span class="act">${x.activity_time||'0:00'}</span>
   </div>`;
 });
 
 const t=d.total||{};
 html+=`<div class="berth-row total-row">
   <span>TOTAL</span><span></span><span></span>
   <span class="val">${num(t.booking)}</span>
   <span class="val">${num(t.dispatch)}</span>
   <span class="val">${num(t.loaded)}</span>
   <span class="val">${num(t.balance)}</span>
   <span>${((t.progress||0)*100).toFixed(0)}%</span>
   <span class="val">${num(t.stockpile)}</span>
   <span></span><span></span><span></span>
 </div>`;
 $('berthGrid').innerHTML=html;
 
 const s=d.status||{};
 ['supervisor','checker','pmc','cranes','forklifts','stevedores'].forEach(k=>$(k).textContent=s[k]??'--');
 
 $('trucking').innerHTML='<div class="tr"><span>HAULER</span><span>AUGUST</span><span>SEPTEMBER</span><span>DAILY</span></div>'+(d.trucking||[]).map(x=>`<div class="tr"><b>${x.hauler}</b><span>${num(x.august)}</span><span>${num(x.september)}</span><span>${num(x.daily)}</span></div>`).join('');
 
 $('truckingStockpile').innerHTML='<div class="tr"><span>HAULER</span><span>QTY</span><span></span><span></span></div>'+(d.trucking_stockpile||[]).map(x=>`<div class="tr"><b>${x.hauler}</b><span>${num(x.qty)}</span><span></span><span></span></div>`).join('');
 
 $('dailyProduction').innerHTML=(d.daily_production||[]).map(x=>`<div><span>${x.shift}</span><b>${num(x.qty)}</b></div>`).join('');
 
 const m=d.monthly||[];
 $('monthly').innerHTML='<div class="mh">Month</div><div class="mh">2025</div><div class="mh">2026</div><div class="mh">Month</div><div class="mh">2026</div>'+m.map(x=>`<div>${x.month}</div><div>${num(x.y2025)}</div><div>${num(x.y2026)}</div><div>-</div><div>-</div>`).join('');
 
 const alphaRows=d.alpha||[];
 const foreignRow=d.foreign;
 $('alphaRows').innerHTML=alphaRows.map(x=>`<div class="alpha-row"><b>${x.berth}</b><span>${x.vessel}</span><span>${x.materials||''}</span><span>${x.discharge_pct||''}</span><span>${x.balance||''}</span><span>${Math.round((x.progress||0)*100)}%</span><span>${x.time||''}</span><span class="remark">${x.remarks||''}</span><span class="equip">${x.equipment||''}</span><span class="act">${x.activity_time||''}</span></div>`).join('') +
   (foreignRow?`<div class="alpha-row" style="border-top:1px dashed #38bdf8;"><b>${foreignRow.berth}</b><span>${foreignRow.vessel}</span><span>${foreignRow.materials||''}</span><span>${foreignRow.discharge_pct||''}</span><span>${foreignRow.balance||''}</span><span>${Math.round((foreignRow.progress||0)*100)}%</span><span>${foreignRow.time||''}</span><span class="remark">${foreignRow.remarks||''}</span><span class="equip">${foreignRow.equipment||''}</span><span class="act">${foreignRow.activity_time||''}</span></div>`:'');

 const alerts=rows.filter(x=>x.remarks&&String(x.vessel).toUpperCase()!=='VACANT').map(x=>`${x.berth}: ${x.vessel} — ${x.remarks}`);
 $('tickerText').textContent=alerts.length?alerts.join('   •   '):'ALL PORT OPERATIONS NORMAL';
}

async function load(){try{const r=await fetch('data.json?t='+Date.now(),{cache:'no-store'}); if(!r.ok)throw new Error(r.status);const d=await r.json();const h=JSON.stringify(d);if(h!==lastHash){lastHash=h;render(d)}}catch(e){$('syncText').textContent='OFFLINE / WAITING FOR DATA';}}
function clock(){const n=new Date();$('phDate').textContent=n.toLocaleDateString('en-PH',{weekday:'short',year:'numeric',month:'short',day:'2-digit'});$('phTime').textContent=n.toLocaleTimeString('en-PH',{hour12:false});}
clock();setInterval(clock,1000);load();setInterval(load,REFRESH_MS);
