const REFRESH_MS = 10000;
let lastHash = '';

/* =========================================================
   SHARED HISTORY / SUPABASE
   ========================================================= */

const SHARED_HISTORY_CONFIG =
  window.SHARED_HISTORY_CONFIG || {};

const SUPABASE_URL =
  String(
    SHARED_HISTORY_CONFIG.SUPABASE_URL || ""
  ).replace(/\/+$/, "");

const SUPABASE_ANON_KEY =
  String(
    SHARED_HISTORY_CONFIG.SUPABASE_ANON_KEY || ""
  );

const SHARED_HISTORY_RETENTION_DAYS =
  Number(
    SHARED_HISTORY_CONFIG.RETENTION_DAYS || 7
  );

const SHARED_HISTORY_SAVE_INTERVAL_MS =
  Number(
    SHARED_HISTORY_CONFIG.SAVE_INTERVAL_MS || 30000
  );

let lastSharedHistoryPayload = "";
let lastSharedHistorySaveAt = 0;

function sharedHistoryConfigured() {
  const c = window.SHARED_HISTORY_CONFIG || {};
  return !!c.APPS_SCRIPT_URL &&
         !c.APPS_SCRIPT_URL.includes("YOUR_DEPLOYMENT_ID");
}

function sharedHistoryUrl(params = {}) {
  const base = (window.SHARED_HISTORY_CONFIG || {}).APPS_SCRIPT_URL;
  if (!base) return "";
  const url = new URL(base);
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      url.searchParams.set(key, value);
    }
  });
  return url.toString();
}

async function saveSharedHistorySnapshot(d) {
  if (!sharedHistoryConfigured()) return;

  const cfg = window.SHARED_HISTORY_CONFIG;
  const now = Date.now();
  const payloadText = JSON.stringify(d);

  // Avoid saving identical data repeatedly.
  if (payloadText === lastSharedHistoryPayload &&
      now - lastSharedHistorySaveAt < cfg.SAVE_INTERVAL_MS) {
    return;
  }

  if (payloadText === lastSharedHistoryPayload) return;

  try {
    await fetch(cfg.APPS_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        action: "save",
        recorded_at: new Date().toISOString(),
        payload: d
      })
    });

    lastSharedHistoryPayload = payloadText;
    lastSharedHistorySaveAt = now;
  } catch (err) {
    console.warn("Google Sheets history save failed:", err);
  }
}

async function loadSharedHistory(startIso, endIso) {
  if (!sharedHistoryConfigured()) return [];

  try {
    const url = sharedHistoryUrl({
      action: "history",
      start: startIso,
      end: endIso
    });

    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) throw new Error(`History HTTP ${response.status}`);

    const result = await response.json();
    if (!result.ok) throw new Error(result.error || "History request failed");

    return Array.isArray(result.rows) ? result.rows : [];
  } catch (err) {
    console.error("Google Sheets history load failed:", err);
    return [];
  }
}

async function cleanupSharedHistory() {
  // Cleanup is handled server-side by Apps Script whenever history is written.
  return;
}

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

      render(d);

    }

  }

  catch (e) {

    $('syncText').textContent =
      'ONLINE / WAITING FOR DATA';

  }

}


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
