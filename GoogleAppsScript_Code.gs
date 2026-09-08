/**
 * Cement Loading Operations Dashboard - Google Sheets history backend
 *
 * 1. Create a Google Sheet.
 * 2. Extensions -> Apps Script.
 * 3. Replace the default Code.gs with this file.
 * 4. Deploy -> New deployment -> Web app.
 *    Execute as: Me
 *    Who has access: Anyone
 * 5. Copy the /exec URL into config.js.
 *
 * The first sheet tab is used automatically and will be named DashboardHistory.
 */

const RETENTION_DAYS = 7;
const SHEET_NAME = "DashboardHistory";
const HEADERS = ["recorded_at", "payload_json"];

function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || "health";

    if (action === "history") {
      const start = e.parameter.start || "";
      const end = e.parameter.end || "";
      return jsonOutput({
        ok: true,
        rows: getHistory_(start, end)
      });
    }

    return jsonOutput({
      ok: true,
      service: "cement-dashboard-history",
      message: "Google Sheets history backend is running."
    });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    if (body.action !== "save") {
      return jsonOutput({ ok: false, error: "Unknown action" });
    }

    if (!body.recorded_at || body.payload === undefined) {
      return jsonOutput({ ok: false, error: "Missing recorded_at or payload" });
    }

    saveHistory_(body.recorded_at, body.payload);
    cleanupOldRows_();

    return jsonOutput({ ok: true });
  } catch (err) {
    return jsonOutput({ ok: false, error: String(err) });
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
    sheet.setFrozenRows(1);
  }

  return sheet;
}

function saveHistory_(recordedAt, payload) {
  const sheet = getSheet_();

  sheet.appendRow([
    new Date(recordedAt),
    JSON.stringify(payload)
  ]);
}

function getHistory_(startIso, endIso) {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return [];

  const values = sheet.getRange(2, 1, lastRow - 1, 2).getValues();

  const start = startIso ? new Date(startIso).getTime() : -Infinity;
  const end = endIso ? new Date(endIso).getTime() : Infinity;

  return values
    .map(function(row) {
      const dt = row[0] instanceof Date ? row[0] : new Date(row[0]);
      let payload = null;

      try {
        payload = JSON.parse(row[1]);
      } catch (_) {}

      return {
        recorded_at: dt.toISOString(),
        payload: payload
      };
    })
    .filter(function(item) {
      const t = new Date(item.recorded_at).getTime();
      return Number.isFinite(t) && t >= start && t <= end && item.payload !== null;
    })
    .sort(function(a, b) {
      return new Date(a.recorded_at) - new Date(b.recorded_at);
    });
}

function cleanupOldRows_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return;

  const cutoff = Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const values = sheet.getRange(2, 1, lastRow - 1, 1).getValues();

  const rowsToDelete = [];

  values.forEach(function(row, index) {
    const dt = row[0] instanceof Date ? row[0] : new Date(row[0]);
    if (dt.getTime() < cutoff) {
      rowsToDelete.push(index + 2);
    }
  });

  // Delete bottom-up so row numbers remain valid.
  for (let i = rowsToDelete.length - 1; i >= 0; i--) {
    sheet.deleteRow(rowsToDelete[i]);
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
