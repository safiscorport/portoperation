const REFRESH_MS = 10000;
let lastHash = '';
const $ = id => document.getElementById(id);
const num = v => v == null || v === '' || isNaN(v) ? '-' : Number(v).toLocaleString('en-US');

function remarkClass(s) {
  s = (s || '').toUpperCase();
  if (s.includes('UNSAFE') || s.includes('ROUGH')) return 'danger';
  if (s.includes('WAITING') || s.includes('INSPECTION')) return 'warn';
  return 'normal';
}

const berthCols = '7vw 16vw 6vw 8vw 8vw 8vw 8vw 10vw 8vw 7vw 14vw 8vw';
const alphaCols = '7vw 16vw 8vw 8vw 8vw 8vw 7vw 14vw 14vw 8vw';

function render(d) {
  // 1. Berths Grid
  const rows = d.berths || [];
  let html = `<div class="t-row header" style="grid-template-columns:${berthCols}"><span>Berth</span><span>Vessel</span><span>Voyage #</span><span>Booking</span><span>Dispatch</span><span>Loaded</span><span>Balance</span><span>Progress</span><span>Stockpile</span><span>Time</span><span>Remarks</span><span>Activity time</span></div>`;
  
  rows.forEach(x => {
    let p = Math.max(0, Math.min(100, (x.progress ?? x.Progress ?? 0) * 100));
    let vessel = x.vessel || x.Vessel || '—';
    let vacant = String(vessel).toUpperCase() === 'VACANT';
    let remarks = x.remarks || x.Remarks || '';
    let remText = remarks ? `<span class="remark ${remarkClass(remarks)}">${remarks}</span>` : '';
    let actTime = x.activity_time || x.activityTime || x.ActivityTime || '0:00';
    
    html += `<div class="t-row ${vacant ? 'vacant' : ''}" style="grid-template-columns:${berthCols}">
      <b>${x.berth || x.Berth || '-'}</b>
      <span class="vessel">${vessel}</span>
      <span>${x.voyage || x.Voyage || '-'}</span>
      <span class="val">${num(x.booking ?? x.Booking)}</span>
      <span class="val">${num(x.dispatch ?? x.Dispatch)}</span>
      <span class="val">${num(x.loaded ?? x.Loaded)}</span>
      <span class="val">${num(x.balance ?? x.Balance)}</span>
      <span class="bar-wrap"><div class="bar"><i style="width:${p}%"></i></div>${p.toFixed(0)}%</span>
      <span class="val">${num(x.stockpile ?? x.Stockpile)}</span>
      <span>${x.time || x.Time || '-'}</span>
      <div>${remText}</div>
      <span class="val" style="color:#ff8a80">${actTime}</span>
    </div>`;
  });
  
  const t = d.total || {};
  let totalProg = ((t.progress ?? t.Progress) || 0) * 100;
  html += `<div class="t-row total" style="grid-template-columns:${berthCols}">
    <span>TOTAL</span><span></span><span></span>
    <span class="val">${num(t.booking ?? t.Booking)}</span>
    <span class="val">${num(t.dispatch ?? t.Dispatch)}</span>
    <span class="val">${num(t.loaded ?? t.Loaded)}</span>
    <span class="val">${num(t.balance ?? t.Balance)}</span>
    <span>${totalProg.toFixed(0)}%</span>
    <span class="val">${num(t.stockpile ?? t.Stockpile)}</span>
    <span></span><span></span><span></span>
  </div>`;
  $('berthGrid').innerHTML = html;
  
  // 2. Alpha Grid
  const alphaRows = d.alpha || [];
  let aHtml = `<div class="t-row header" style="grid-template-columns:${alphaCols}"><span>Berth</span><span>Vessel</span><span>MATERIALS</span><span>DISCHARGE %</span><span>Balance</span><span>Progress</span><span>Time</span><span>Remarks</span><span>Deployed Equip.</span><span>Activity time</span></div>`;
  
  alphaRows.forEach(x => {
    let p = Math.max(0, Math.min(100, (x.progress ?? x.Progress ?? 0) * 100));
    let remarks = x.remarks || x.Remarks || '';
    let remText = remarks ? `<span class="remark normal">${remarks}</span>` : '';
    let materials = x.materials || x.Materials || x.mat || x.Mat || '';
    let discharge = x.discharge_pct || x.dischargePct || x.DischargePct || x.discharge || x.Discharge || '';
    let balance = x.balance || x.Balance || '';
    let equipment = x.equipment || x.deployed_equip || x.Equipment || x.DeployedEquip || '';
    let actTime = x.activity_time || x.activityTime || x.ActivityTime || '';
    
    aHtml += `<div class="t-row" style="grid-template-columns:${alphaCols}">
      <b>${x.berth || x.Berth || '-'}</b>
      <span class="vessel">${x.vessel || x.Vessel || '-'}</span>
      <span>${materials}</span>
      <span>${discharge}</span>
      <span>${balance}</span>
      <span class="bar-wrap"><div class="bar"><i style="width:${p}%"></i></div>${p.toFixed(0)}%</span>
      <span>${x.time || x.Time || ''}</span>
      <div>${remText}</div>
      <span>${equipment}</span>
      <span class="val" style="color:#ff8a80">${actTime}</span>
    </div>`;
  });
  $('alphaGrid').innerHTML = aHtml;

  // 3. Lower Dashboards & Tables
  const truck = d.trucking || [];
  $('truckingTable').innerHTML = `<div class="sub-row header" style="grid-template-columns:2fr 1fr 1fr 1fr"><span>Trucking</span><span>August</span><span>September</span><span>Daily</span></div>` +
    truck.map(x => `<div class="sub-row" style="grid-template-columns:2fr 1fr 1fr 1fr"><b>${x.hauler || x.Hauler || '-'}</b><span>${num(x.august ?? x.August)}</span><span>${num(x.september ?? x.September)}</span><span>${num(x.daily ?? x.Daily)}</span></div>`).join('') +
    `<div class="sub-row" style="grid-template-columns:2fr 1fr 1fr 1fr; font-weight:bold;"><b>Total</b><span>${num(truck.reduce((a, c) => a + (c.august ?? c.August || 0), 0))}</span><span>${num(truck.reduce((a, c) => a + (c.september ?? c.September || 0), 0))}</span><span>${num(truck.reduce((a, c) => a + (c.daily ?? c.Daily || 0), 0))}</span></div>`;

  const m = d.monthly || [];
  $('vesselLoadingTable').innerHTML = `<div class="sub-row header" style="grid-template-columns:2fr 1.5fr 1.5fr 1.5fr 1.5fr"><span>Vessel Cement Loading</span><span>2025</span><span>2026</span><span>2025</span><span>2026</span></div>` +
    m.map(x => `<div class="sub-row" style="grid-template-columns:2fr 1.5fr 1.5fr 1.5fr 1.5fr"><span>${x.month || x.Month || '-'}</span><span>${num(x.y2025 ?? x.Y2025)}</span><span>${num(x.y2026 ?? x.Y2026)}</span><span>-</span><span>-</span></div>`).join('');

  const dp = d.daily_production || [];
  $('dailyProdTable').innerHTML = `<div class="sub-row header" style="grid-template-columns:3fr 1fr"><span>Cement loading Daily Production</span><span></span></div>` +
    dp.map(x => `<div class="sub-row" style="grid-template-columns:3fr 1fr"><span>${x.shift || x.Shift || '-'}</span><span class="val">${num(x.qty ?? x.Qty)}</span></div>`).join('');

  const ts = d.trucking_stockpile || [];
  $('truckingStockpileTable').innerHTML = `<div class="sub-row header" style="grid-template-columns:3fr 1fr"><span>TRUCKING (STOCKPILE)</span><span></span></div>` +
    ts.map(x => `<div class="sub-row" style="grid-template-columns:3fr 1fr"><span>${x.hauler || x.Hauler || '-'}</span><span class="val">${num(x.qty ?? x.Qty)}</span></div>`).join('');

  const s = d.status || {};
  $('supervisor').textContent = s.supervisor || s.Supervisor || '--';
  $('checker').textContent = s.checker || s.Checker || '--';
  $('pmc').textContent = s.pmc || s.PMC || '--';
  $('cranes').textContent = s.cranes ?? s.Cranes ?? '--';
  $('forklifts').textContent = s.forklifts ?? s.Forklifts ?? '--';
  $('stevedores').textContent = s.stevedores ?? s.Stevedores ?? '--';
}

async function load() {
  try {
    const r = await fetch('data.json?t=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error(r.status);
    const d = await r.json();
    const h = JSON.stringify(d);
    if (h !== lastHash) { lastHash = h; render(d); }
  } catch (e) {
    console.error("Failed to load data.json:", e);
  }
}

function clock() {
  const n = new Date();
  $('phDate').textContent = n.toLocaleDateString('en-PH', { year: 'numeric', month: '2-digit', day: '2-digit' });
  $('phTime').textContent = n.toLocaleTimeString('en-PH', { hour12: false });
}

clock();
setInterval(clock, 1000);
load();
setInterval(load, REFRESH_MS);
