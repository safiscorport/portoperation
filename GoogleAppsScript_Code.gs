/**
 * CEMENT LOADING OPERATIONS DASHBOARD
 * Google Sheets cloud history backend
 *
 * IMPORTANT:
 * This version captures data in the CLOUD every 5 minutes.
 * The dashboard browser/TV does NOT need to be open.
 *
 * One-time setup:
 * 1. Open the Google Sheet -> Extensions -> Apps Script.
 * 2. Replace Code.gs with this file.
 * 3. Check DATA_URL below.
 * 4. Run setup5MinuteTrigger() ONCE from the Apps Script editor.
 *    Authorize the script when Google asks.
 * 5. Deploy -> New deployment -> Web app:
 *      Execute as: Me
 *      Who has access: Anyone
 * 6. Put the /exec URL into config.js.
 *
 * The script creates/uses a sheet named DashboardHistory.
 */

const DATA_URL =
  "https://safiscorport.github.io/portoperation/data.json";

const SHEET_NAME = "DashboardHistory";
const RETENTION_DAYS = 7;
const TIME_ZONE = "Asia/Manila";
const HEADERS = ["recorded_at", "payload_json"];

/**
 * Web app GET endpoint used by the dashboard to read history.
 */
function doGet(e) {
  try {
    const action =
      (e && e.parameter && e.parameter.action) || "health";

    if (action === "history") {
      const start = e.parameter.start || "";
      const end = e.parameter.end || "";

      return jsonOutput({
        ok: true,
        rows: getHistory_(start, end)
      });
    }

    if (action === "latest") {
      const latest = getLatestHistory_();
      return jsonOutput({
        ok: true,
        recorded_at: latest ? latest.recorded_at : null
      });
    }

    if (action === "capture") {
      const result = captureDashboardSnapshot_();
      return jsonOutput(result);
    }

    return jsonOutput({
      ok: true,
      service: "cement-dashboard-history",
      message: "Cloud capture backend is running.",
      capture: "every 5 minutes"
    });

  } catch (err) {
    return jsonOutput({
      ok: false,
      error: String(err)
    });
  }
}

/**
 * POST is kept for compatibility, but normal history capture is now
 * performed by the time-driven cloud trigger.
 */
function doPost(e) {
  try {
    const body = JSON.parse(
      (e && e.postData && e.postData.contents) || "{}"
    );

    if (body.action === "save" &&
        body.recorded_at &&
        body.payload !== undefined) {

      saveHistory_(
        body.recorded_at,
        body.payload
      );

      cleanupOldRows_();

      return jsonOutput({ ok: true });
    }

    return jsonOutput({
      ok: false,
      error: "Unknown or incomplete action"
    });

  } catch (err) {
    return jsonOutput({
      ok: false,
      error: String(err)
    });
  }
}

/**
 * RUN THIS ONCE manually from Apps Script.
 *
 * It creates a single time-driven trigger which runs approximately
 * every 5 minutes. Apps Script controls the exact execution minute.
 */
function setup5MinuteTrigger() {
  const triggers =
    ScriptApp.getProjectTriggers();

  triggers.forEach(function(trigger) {
    if (
      trigger.getHandlerFunction() ===
      "captureDashboardSnapshot"
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger(
    "captureDashboardSnapshot"
  )
    .timeBased()
    .everyMinutes(5)
    .create();

  // Take one snapshot immediately so history starts now.
  captureDashboardSnapshot();

  Logger.log(
    "5-minute cloud capture trigger installed."
  );
}

/**
 * Trigger entry point.
 */
function captureDashboardSnapshot() {
  const result =
    captureDashboardSnapshot_();

  console.log(result);
  return result;
}

/**
 * Fetch the public data.json and store a complete snapshot.
 */
function captureDashboardSnapshot_() {
  const response =
    UrlFetchApp.fetch(
      DATA_URL,
      {
        method: "get",
        muteHttpExceptions: true,
        followRedirects: true
      }
    );

  const status =
    response.getResponseCode();

  if (status < 200 || status >= 300) {
    throw new Error(
      "DATA_URL returned HTTP " + status
    );
  }

  const text =
    response.getContentText();

  let payload;

  try {
    payload = JSON.parse(text);
  } catch (err) {
    throw new Error(
      "data.json is not valid JSON: " + err
    );
  }

  saveHistory_(
    new Date(),
    payload
  );

  cleanupOldRows_();

  return {
    ok: true,
    recorded_at: new Date().toISOString(),
    message: "Dashboard snapshot captured."
  };
}

function getSheet_() {
  const ss =
    SpreadsheetApp.getActiveSpreadsheet();

  ss.setSpreadsheetTimeZone(
    TIME_ZONE
  );

  let sheet =
    ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    sheet =
      ss.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet
      .getRange(
        1,
        1,
        1,
        HEADERS.length
      )
      .setValues([HEADERS]);

    sheet.setFrozenRows(1);
  }

  return sheet;
}

function saveHistory_(
  recordedAt,
  payload
) {
  const sheet = getSheet_();

  sheet.appendRow([
    recordedAt instanceof Date
      ? recordedAt
      : new Date(recordedAt),
    JSON.stringify(payload)
  ]);
}

function getLatestHistory_() {
  const sheet = getSheet_();
  const lastRow = sheet.getLastRow();

  if (lastRow < 2) return null;

  const value = sheet.getRange(lastRow, 1).getValue();
  return {
    recorded_at: value instanceof Date
      ? value.toISOString()
      : new Date(value).toISOString()
  };
}

function getHistory_(
  startIso,
  endIso
) {
  const sheet = getSheet_();
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) {
    return [];
  }

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        2
      )
      .getValues();

  const start =
    startIso
      ? new Date(startIso).getTime()
      : -Infinity;

  const end =
    endIso
      ? new Date(endIso).getTime()
      : Infinity;

  return values
    .map(function(row) {
      const dt =
        row[0] instanceof Date
          ? row[0]
          : new Date(row[0]);

      let payload = null;

      try {
        payload =
          JSON.parse(row[1]);
      } catch (_) {}

      return {
        recorded_at:
          dt.toISOString(),
        payload: payload
      };
    })
    .filter(function(item) {
      const t =
        new Date(
          item.recorded_at
        ).getTime();

      return (
        Number.isFinite(t) &&
        t >= start &&
        t <= end &&
        item.payload !== null
      );
    })
    .sort(function(a, b) {
      return (
        new Date(a.recorded_at) -
        new Date(b.recorded_at)
      );
    });
}

function cleanupOldRows_() {
  const sheet = getSheet_();
  const lastRow =
    sheet.getLastRow();

  if (lastRow < 2) return;

  const cutoff =
    Date.now() -
    RETENTION_DAYS *
    24 *
    60 *
    60 *
    1000;

  const values =
    sheet
      .getRange(
        2,
        1,
        lastRow - 1,
        1
      )
      .getValues();

  const rowsToDelete = [];

  values.forEach(function(row, index) {
    const dt =
      row[0] instanceof Date
        ? row[0]
        : new Date(row[0]);

    if (
      dt.getTime() < cutoff
    ) {
      rowsToDelete.push(
        index + 2
      );
    }
  });

  for (
    let i = rowsToDelete.length - 1;
    i >= 0;
    i--
  ) {
    sheet.deleteRow(
      rowsToDelete[i]
    );
  }
}

function jsonOutput(obj) {
  return ContentService
    .createTextOutput(
      JSON.stringify(obj)
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}
