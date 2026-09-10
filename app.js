const REFRESH_MS = 10000;
let lastHash = '';

/* =========================================================
   SHARED HISTORY / GOOGLE SHEETS
   ========================================================= */

const SHARED_HISTORY_CONFIG =
  window.SHARED_HISTORY_CONFIG || {};

const SHARED_HISTORY_RETENTION_DAYS =
  Number(SHARED_HISTORY_CONFIG.RETENTION_DAYS || 7);

const SHARED_HISTORY_SAVE_INTERVAL_MS =
  Number(SHARED_HISTORY_CONFIG.SAVE_INTERVAL_MS || 30000);

let lastSharedHistoryPayload = '';
let lastSharedHistorySaveAt = 0;

function sharedHistoryConfigured() {
  const url = String(
    SHARED_HISTORY_CONFIG.APPS_SCRIPT_URL || ''
  ).trim();

  return !!url && !url.includes('YOUR_DEPLOYMENT_ID');
}

async function saveSharedHistorySnapshot(d) {
  if (!sharedHistoryConfigured()) return;

  const now = Date.now();
  const payload = JSON.stringify(d);

  if (payload === lastSharedHistoryPayload) return;
  if (now - lastSharedHistorySaveAt < SHARED_HISTORY_SAVE_INTERVAL_MS) return;

  try {
    await fetch(SHARED_HISTORY_CONFIG.APPS_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify({
        action: 'save',
        recorded_at: new Date().toISOString(),
        payload: d
      })
    });

    lastSharedHistoryPayload = payload;
    lastSharedHistorySaveAt = now;
  } catch (error) {
    console.warn('[Shared History] Google Sheets save failed:', error);
  }
}

async function loadSharedHistory(startIso, endIso) {
  if (!sharedHistoryConfigured()) return [];

  try {
    const url = new URL(SHARED_HISTORY_CONFIG.APPS_SCRIPT_URL);
    url.searchParams.set('action', 'history');
    url.searchParams.set('start', startIso);
    url.searchParams.set('end', endIso);

    const response = await fetch(url.toString(), {
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }

    const result = await response.json();

    if (!result.ok) {
      throw new Error(result.error || 'History request failed');
    }

    return Array.isArray(result.rows) ? result.rows : [];
  } catch (error) {
    console.warn('[Shared History] Google Sheets load failed:', error);
    return [];
  }
}

async function cleanupSharedHistory() {
  // Old records are cleaned up by Google Apps Script after a save.
  return;
}

window.loadSharedHistory = loadSharedHistory;
window.sharedHistoryConfigured = sharedHistoryConfigured;

/* =========================================================
   LAST CLOUD CAPTURE DISPLAY
   ========================================================= */

async function updateLastCaptureDisplay() {
  if (document.body.classList.contains('history-viewing')) return;
  if (!sharedHistoryConfigured()) return;

  try {
    const url = new URL(SHARED_HISTORY_CONFIG.APPS_SCRIPT_URL);
    url.searchParams.set('action', 'latest');
    url.searchParams.set('_', Date.now());

    const response = await fetch(url.toString(), { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);

    const result = await response.json();
    if (!result.ok || !result.row || !result.row.recorded_at) return;

    const dt = new Date(result.row.recorded_at);
    if (!Number.isFinite(dt.getTime())) return;

    const label = document.getElementById('reviewLabel');
    const text = document.getElementById('reviewTimeText');
    const info = document.getElementById('reviewInfo');

    if (label) label.textContent = 'LAST CAPTURE';
    if (text) text.textContent = dt.toLocaleString('en-PH', {
      year: 'numeric', month: 'short', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    });
    if (info) info.classList.add('show');
  } catch (error) {
    console.warn('[Shared History] Latest capture lookup failed:', error);
  }
}

window.updateLastCaptureDisplay = updateLastCaptureDisplay;

const $ = id => document.getElementById(id);

const num = v =>
  (v === undefined ||
   v === null ||
   v === 0 ||
   v === '-')
    ? (v === 0 ? '0' : (v || '—'))
    : Number(v).toLocaleString('en-US');


function formatActivityTime(val) {
  if (!val || val === '0:00' || val === '-') return '0:00';
  return val;
}


function isStoppageRemark(text) {
  if (!text || text === '-') return false;

  const lower = text.toLowerCase();

  return (
    lower.includes('waiting') ||
    lower.includes('stopped') ||
    lower.includes('stop') ||
    lower.includes('delay') ||
    lower.includes('breakdown') ||
    lower.includes('refuse') ||
    lower.includes('standby') ||
    lower.includes('repair') ||
    lower.includes('maintenance') ||
    lower.includes('problem') ||
    lower.includes('issue') ||
    lower.includes('shortage') ||
    lower.includes('no stock')
  );
}


/* =========================================================
   MONTHLY NUMBER HELPERS
   ========================================================= */

function monthlyNumber(v) {

  if (
    v === undefined ||
    v === null ||
    v === '' ||
    v === '-'
  ) {
    return 0;
  }

  const n = Number(
    String(v).replace(/,/g, '')
  );

  return Number.isFinite(n) ? n : 0;
}


function monthlyFormat(v) {

  if (
    v === undefined ||
    v === null ||
    v === '' ||
    v === '-'
  ) {
    return '—';
  }

  const n = monthlyNumber(v);

  return n.toLocaleString('en-US');
}


function monthlyVarianceClass(v) {

  if (v > 0) {
    return 'monthly-var-positive';
  }

  if (v < 0) {
    return 'monthly-var-negative';
  }

  return 'monthly-var-zero';
}


function monthlyVarianceText(v) {

  if (v > 0) {
    return '+' + Math.abs(v).toLocaleString('en-US');
  }

  if (v < 0) {
    return '-' + Math.abs(v).toLocaleString('en-US');
  }

  return '0';
}


/* =========================================================
   RENDER
   ========================================================= */

function render(d) {

  /* =======================================================
     LIVE STATUS
     ======================================================= */

  $('syncText').textContent =
    'LIVE • UPDATED ' +
    new Date(d.updated_at).toLocaleTimeString(
      'en-PH',
      {
        hour12: false
      }
    );

  $('refreshSec').textContent =
    (REFRESH_MS / 1000) + 's';


  /* =======================================================
     BERTHS
     ======================================================= */

  const rows = d.berths || [];

  $('berthGrid').innerHTML =
    rows.map(x => {

      let p =
        Math.max(
          0,
          Math.min(
            100,
            (x.progress || 0) * 100
          )
        );

      let vacant =
        String(x.vessel || '').toUpperCase() === 'VACANT';

      let remarkAlert =
        isStoppageRemark(x.remarks)
          ? 'stoppage-alert'
          : '';

      return `
        <div class="berth-row ${vacant ? 'vacant' : ''}">

          <span>
            <b>${x.berth}</b>
          </span>

          <span class="vessel">
            ${x.vessel || '—'}
          </span>

          <span>
            ${x.voyage || '-'}
          </span>

          <span>
            ${num(x.booking)}
          </span>

          <span>
            ${num(x.dispatch)}
          </span>

          <span>
            ${num(x.loaded)}
          </span>

          <span>
            ${num(x.balance)}
          </span>

          <span>
            <div class="progress-wrap">
              <div class="bar">
                <i style="width:${p}%"></i>
              </div>

              ${p > 0 ? p.toFixed(0) + '%' : ''}
            </div>
          </span>

          <span>
            ${num(x.stockpile)}
          </span>

          <span>
            ${x.time || '-'}
          </span>

          <span class="remark ${remarkAlert}">
            ${x.remarks || '-'}
          </span>

          <span>
            ${x.equipment || '0'}
          </span>

          <span class="activity">
            ${formatActivityTime(x.activity_time)}
          </span>

        </div>
      `;

    }).join('');


  /* =======================================================
     TOTALS
     ======================================================= */

  const t = d.total || {};

  $('totalBooking').textContent =
    num(t.booking);

  $('totalDispatch').textContent =
    num(t.dispatch);

  $('totalLoaded').textContent =
    num(t.loaded);

  $('totalBalance').textContent =
    num(t.balance);

  $('totalProgress').textContent =
    ((t.progress || 0) * 100).toFixed(0) + '%';

  $('totalStockpile').textContent =
    num(t.stockpile);


  /* =======================================================
     ALPHA BERTHS
     R1 / R2 / R3
     ======================================================= */

  $('alphaRows').innerHTML =
    (d.alpha || []).map(x => {

      let pVal =
        parseFloat(
          String(x.progress)
            .replace('%', '')
        ) || 0;

      let remarkAlert =
        isStoppageRemark(x.remarks)
          ? 'stoppage-alert'
          : '';

      return `
        <div class="alpha-row">

          <span>
            <b>${x.berth}</b>
          </span>

          <span class="vessel">
            ${x.vessel}
          </span>

          <span>
            ${x.materials || '-'}
          </span>

          <span>
            ${x.discharge || '0%'}
          </span>

          <span>
            ${x.balance || '0%'}
          </span>

          <span>
            <div class="progress-wrap">
              <div class="bar">
                <i style="width:${pVal}%"></i>
              </div>

              ${x.progress}
            </div>
          </span>

          <span>
            ${x.time || '0:00'}
          </span>

          <span class="remark ${remarkAlert}">
            ${x.remarks || '-'}
          </span>

          <span>
            ${x.equip || '0'}
          </span>

          <span class="activity">
            ${formatActivityTime(x.activity_time)}
          </span>

        </div>
      `;

    }).join('');


  /* =======================================================
     FOREIGN BERTH
     BERTH F
     ======================================================= */

  const f = d.foreign || {};

  let fPVal =
    parseFloat(
      String(f.progress || '0')
        .replace('%', '')
    ) || 0;

  let fRemarkAlert =
    isStoppageRemark(f.remarks)
      ? 'stoppage-alert'
      : '';

  $('foreignRow').innerHTML = `

    <span>
      <b>${f.berth}</b>
    </span>

    <span class="vessel">
      ${f.vessel}
    </span>

    <span>
      ${f.materials || '-'}
    </span>

    <span>
      ${f.discharge || '-'}
    </span>

    <span>
      ${f.balance || '-'}
    </span>

    <span>

      <div class="progress-wrap">

        <div class="bar">
          <i style="width:${fPVal}%"></i>
        </div>

        ${f.progress || '-'}

      </div>

    </span>

    <span>
      ${f.time || '-'}
    </span>

    <span class="remark ${fRemarkAlert}">
      ${f.remarks || '-'}
    </span>

    <span>
      ${f.equip || '0'}
    </span>

    <span class="activity">
      ${formatActivityTime(f.activity_time)}
    </span>

  `;


  /* =======================================================
     TRUCKING
     ======================================================= */

  const truckData =
    d.trucking || [];

  const truckTotal =
    truckData.reduce(
      (acc, curr) => ({

        august:
          acc.august +
          (
            typeof curr.august === 'number'
              ? curr.august
              : 0
          ),

        september:
          acc.september +
          (
            typeof curr.september === 'number'
              ? curr.september
              : 0
          ),

        daily:
          acc.daily +
          (
            typeof curr.daily === 'number'
              ? curr.daily
              : 0
          )

      }),
      {
        august: 0,
        september: 0,
        daily: 0
      }
    );


  $('trucking').innerHTML =

    truckData.map(x => `

      <div class="tr">

        <b>
          ${x.hauler}
        </b>

        <span>
          ${num(x.august)}
        </span>

        <span>
          ${num(x.september)}
        </span>

        <span>
          ${num(x.daily)}
        </span>

      </div>

    `).join('')

    +

    `

      <div class="tr total-row">

        <b>
          Total
        </b>

        <span>
          <b>${num(truckTotal.august)}</b>
        </span>

        <span>
          <b>${num(truckTotal.september)}</b>
        </span>

        <span>
          <b>${num(truckTotal.daily)}</b>
        </span>

      </div>

    `;


  /* =======================================================
     MONTHLY TABLE
     
     2025 | VARIANCE | 2026

     Variance = 2026 - 2025
     ======================================================= */

  const m =
    d.monthly || [];

  const mt =
    d.monthly_total || {};

  let monthlyHTML = '';


  /* -------------------------------------------------------
     MONTHLY ROWS
     ------------------------------------------------------- */

  m.forEach(x => {

    const y2025 =
      monthlyNumber(x.y2025);

    const y2026 =
      monthlyNumber(x.y2026);

    const variance =
      y2026 - y2025;


    monthlyHTML += `

      <div class="monthly-row">

        <!-- MONTH -->

        <div class="monthly-month">
          ${x.month}
        </div>


        <!-- 2025 -->

        <div class="monthly-2025">
          ${monthlyFormat(x.y2025)}
        </div>


        <!-- CENTER VARIANCE -->

        <div class="
          monthly-variance
          ${monthlyVarianceClass(variance)}
        ">

          <span class="variance-value">
            ${monthlyVarianceText(variance)}
          </span>

        </div>


        <!-- 2026 -->

        <div class="monthly-2026">
          ${monthlyFormat(x.y2026)}
        </div>

      </div>

    `;

  });


  /* -------------------------------------------------------
     TOTAL ROW
     ------------------------------------------------------- */

  const total2025 =
    monthlyNumber(mt.y2025);

  const total2026 =
    monthlyNumber(mt.y2026);

  const totalVariance =
    total2026 - total2025;


  monthlyHTML += `

    <div class="
      monthly-row
      monthly-total
    ">

      <!-- TOTAL -->

      <div class="monthly-month">
        TOTAL
      </div>


      <!-- 2025 -->

      <div class="monthly-2025">
        ${monthlyFormat(mt.y2025)}
      </div>


      <!-- TOTAL VARIANCE -->

      <div class="
        monthly-variance
        ${monthlyVarianceClass(totalVariance)}
      ">

        <span class="variance-value">
          ${monthlyVarianceText(totalVariance)}
        </span>

      </div>


      <!-- 2026 -->

      <div class="monthly-2026">
        ${monthlyFormat(mt.y2026)}
      </div>

    </div>

  `;


  $('monthly').innerHTML =
    monthlyHTML;


  /* =======================================================
     DAILY PRODUCTION
     ======================================================= */

  const prodData =
    d.daily_production || [];

  const prodTotal =
    prodData.reduce(
      (sum, curr) =>
        sum +
        (
          typeof curr.qty === 'number'
            ? curr.qty
            : 0
        ),
      0
    );


  $('dailyProduction').innerHTML =

    prodData.map(x => `

      <div class="prod-row">

        <span>
          ${x.shift}
        </span>

        <b>
          ${num(x.qty)}
        </b>

      </div>

    `).join('')

    +

    `

      <div class="prod-row total-row">

        <span>
          Total
        </span>

        <b>
          ${num(prodTotal)}
        </b>

      </div>

    `;


  /* =======================================================
     TRUCKING STOCKPILE
     ======================================================= */

  const stockData =
    d.trucking_stockpile || [];

  const stockTotal =
    stockData.reduce(
      (sum, curr) =>
        sum +
        (
          typeof curr.volume === 'number'
            ? curr.volume
            : 0
        ),
      0
    );


  $('truckingStockpile').innerHTML =

    stockData.map(x => `

      <div class="prod-row">

        <span>
          ${x.client}
        </span>

        <b>
          ${num(x.volume)}
        </b>

      </div>

    `).join('')

    +

    `

      <div class="prod-row total-row">

        <span>
          Total
        </span>

        <b>
          ${num(stockTotal)}
        </b>

      </div>

    `;


  /* =======================================================
     STATUS & PERSONNEL
     ======================================================= */

  const s =
    d.status || {};

  $('supervisor').textContent =
    s.supervisor || '--';

  $('checker').textContent =
    s.checker || '--';

  $('pmc').textContent =
    s.pmc || '--';

  $('cranes').textContent =
    s.cranes ?? '--';

  $('forklifts').textContent =
    s.forklifts ?? '--';

  $('stevedores').textContent =
    s.stevedores ?? '--';


  /* =======================================================
     TICKER / ALERTS
     ======================================================= */

  const alerts =
    rows
      .filter(
        x =>
          x.remarks &&
          x.remarks !== '-' &&
          x.vessel !== 'VACANT'
      )
      .map(
        x =>
          `${x.berth}: ${x.vessel} — ${x.remarks}`
      );


  $('tickerText').textContent =
    alerts.length
      ? alerts.join('    •    ')
      : 'ALL PORT OPERATIONS NORMAL';

}


/* =========================================================
   LOAD DATA.JSON
   ========================================================= */

async function load() {

  try {

    const r =
      await fetch(
        'data.json?t=' + Date.now(),
        {
          cache: 'no-store'
        }
      );


    if (!r.ok) {
      throw new Error(r.status);
    }


    const d =
      await r.json();

    // Save to shared cloud history in the background.
    saveSharedHistorySnapshot(d);


    const h =
      JSON.stringify(d);


    if (h !== lastHash) {

      lastHash = h;

      // Do not overwrite a selected historical display with live data.
      if (!document.body.classList.contains('history-viewing')) {
        render(d);
      }

    }

  }

  catch (e) {

    $('syncText').textContent =
      'ONLINE / WAITING FOR DATA';

  }

}


updateLastCaptureDisplay();
setInterval(updateLastCaptureDisplay, 30000);

/* =========================================================
   CLOCK
   ========================================================= */

function clock() {

  const n =
    new Date();


  $('phDate').textContent =
    n.toLocaleDateString(
      'en-PH',
      {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: '2-digit'
      }
    );


  $('phTime').textContent =
    n.toLocaleTimeString(
      'en-PH',
      {
        hour12: false
      }
    );

}


/* =========================================================
   START
   ========================================================= */

clock();

setInterval(
  clock,
  1000
);

load();

setInterval(
  load,
  REFRESH_MS
);
