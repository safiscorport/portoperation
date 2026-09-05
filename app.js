const REFRESH_MS=10000;
let lastHash='';
const $=id=>document.getElementById(id);
const num=v=>v==null||v===''||isNaN(v)?'-':Number(v).toLocaleString('en-US');
function remarkClass(s){s=(s||'').toUpperCase(); if(s.includes('UNSAFE')||s.includes('ROUGH'))return 'danger'; if(s.includes('WAITING')||s.includes('INSPECTION'))return 'warn'; return '';}

const berthCols='7vw 16vw 6vw 8vw 8vw 8vw 8vw 10vw 8vw 7vw 14vw 8vw';
const alphaCols='7vw 16vw 8vw 8vw 8vw 8vw 7vw 14vw 14vw 8vw';

function render(d){
 const rows=d.berths||[];
 let html=`<div class="t-row header" style="grid-template-columns:${berthCols}"><span>Berth</span><span>Vessel</span><span>Voyage #</span><span>Booking</span><span>Dispatch</span><span>Loaded</span><span>Balance</span><span>Progress</span><span>Stockpile</span><span>Time</span><span>Remarks</span><span>Activity time</span></div>`;
 
 rows.forEach(x=>{
   let p=Math.max(0,Math.min(100,(x.progress||0)*100));
   let vacant=String(x.vessel||'').toUpperCase()==='VACANT';
   html+=`<div class="t-row ${vacant?'vacant':''}" style="grid-template-columns:${berthCols}">
     <b>${x.berth}</b>
     <span class="vessel">${x.vessel||'—'}</span>
     <span>${x.voyage||'-'}</span>
     <span class="val">${num(x.booking)}</span>
     <span class="val">${num(x.dispatch)}</span>
     <span class="val">${num(x.loaded)}</span>
     <span class="val">${num(x.balance)}</span>
     <span class="bar-wrap"><div class="bar"><i style="width:${p}%"></i></div>${p.toFixed(0)}%</span>
     <span class="val">${num(x.stockpile)}</span>
     <span>${x.time||'-'}</span>
     <span class="remark ${remarkClass(x.remarks)}">${x.remarks||''}</span>
     <span class="val" style="color:#ff8a80">${x.activity_time||'0:00'}</span>
   </div>`;
 });
 
 const t=d.total||{};
 html+=`<div class="t-row total" style="grid-template-columns:${berthCols}">
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
 
 const alphaRows=d.alpha||[];
 const foreign=d.foreign;
 let aHtml=`<div class="t-row header" style="grid-template-columns:${alphaCols}"><span>Berth</span><span>Vessel</span><span>MATERIALS</span><span>DISCHARGE %</span><span>Balance</span><span>Progress</span><span>Time</span><span>Remarks</span><span>Deployed Equip.</span><span>Activity time</span></div>`;
 alphaRows.concat(foreign ? [foreign] : []).forEach(x=>{
   let p=Math.max(0,Math.min(100,(x.progress||0)*100));
   aHtml+=`<div class="t-row" style="grid-template-columns:${alphaCols}">
     <b>${x.berth}</b>
     <span class="vessel">${x.vessel}</span>
     <span>${x.materials||''}</span>
     <span>${x.discharge_pct||''}</span>
     <span>${x.balance||''}</span>
     <span class="bar-wrap"><div class="bar"><i style="width:${p}%"></i></div>${p.toFixed(0)}%</span>
     <span>${x.time||''}</span>
     <span class="remark">${x.remarks||''}</span>
     <span>${x.equipment||''}</span>
     <span class="val" style="color:#ff8a80">${x.activity_time||''}</span>
   </div>`;
 });
 $('alphaGrid').innerHTML=aHtml;

 const truck=d.trucking||[];
 $('truckingTable').innerHTML=`<div class="sub-row header" style="grid-template-columns:2fr 1fr 1fr 1fr"><span>Trucking</span><span>August</span><span>September</span><span>Daily</span></div>`+
   truck.map(x=>`<div class="sub-row" style="grid-template-columns:2fr 1fr 1fr 1fr"><b>${x.hauler}</b><span>${num(x.august)}</span><span>${num(x.september)}</span><span>${num(x.daily)}</span></div>`).join('')+
   `<div class="sub-row" style="grid-template-columns:2fr 1fr 1fr 1fr; font-weight:bold;"><b>Total</b><span>${num(truck.reduce((a,c)=>a+(c.august||0),0))}</span><span>${num(truck.reduce((a,c)=>a+(c.september||0),0))}</span><span>${num(truck.reduce((a,c)=>a+(c.daily||0),0))}</span></div>`;

 const m=d.monthly||[];
 $('vesselLoadingTable').innerHTML=`<div class="sub-row header" style="grid-template-columns:2fr 1.5fr 1.5fr 1.5fr 1.5fr"><span>Vessel Cement Loading</span><span>2025</span><span>2026</span><span>2025</span><span>2026</span></div>`+
   m.map(x=>`<div class="sub-row" style="grid-template-columns:2fr 1.5fr 1.5fr 1.5fr 1.5fr"><span>${x.month}</span><span>${num(x.y2025)}</span><span>${num(x.y2026)}</span><span>-</span><span>-</span></div>`).join('');

 const dp=d.daily_production||[];
 $('dailyProdTable').innerHTML=`<div class="sub-row header" style="grid-template-columns:3fr 1fr"><span>Cement loading Daily Production</span><span></span></div>`+
   dp.map(x=>`<div class="sub-row" style="grid-template-columns:3fr 1fr"><span>${x.shift}</span><span class="val">${num(x.qty)}</span></div>`).join('');

 const ts=d.trucking_stockpile||[];
 $('truckingStockpileTable').innerHTML=`<div class="sub-row header" style="grid-template-columns:3fr 1fr"><span>TRUCKING (STOCKPILE)</span><span></span></div>`+
   ts.map(x=>`<div class="sub-row" style="grid-template-columns:3fr 1fr"><span>${x.hauler}</span><span class="val">${num(x.qty)}</span></div>`).join('');

 const s=d.status||{};
 $('supervisor').textContent=s.supervisor||'--';
 $('checker').textContent=s.checker||'--';
 $('pmc').textContent=s.pmc||'--';
 $('cranes').textContent=s.cranes||'--';
 $('forklifts').textContent=s.forklifts||'--';
 $('stevedores').textContent=s.stevedores||'--';
}

async function load(){try{const r=await fetch('data.json?t='+Date.now(),{cache:'no-store'}); if(!r.ok)throw new Error(r.status);const d=await r.json();const h=JSON.stringify(d);if(h!==lastHash){lastHash=h;render(d)}}catch(e){}}
function clock(){const n=new Date();$('phDate').textContent=n.toLocaleDateString('en-PH',{year:'numeric',month:'2-digit',day:'2-digit'});$('phTime').textContent=n.toLocaleTimeString('en-PH',{hour12:false});}
clock();setInterval(clock,1000);load();setInterval(load,REFRESH_MS);
