# Cement Loading Operations Dashboard — Google Sheets History

This package keeps the original live dashboard (`data.json` + full `render()` logic) and adds shared history using Google Sheets + Google Apps Script.

## Setup
1. Create/open a Google Sheet.
2. Extensions → Apps Script.
3. Paste `GoogleAppsScript_Code.gs` into `Code.gs`.
4. Deploy → New deployment → Web app.
5. Execute as: **Me**. Who has access: **Anyone**.
6. Copy the Web app URL ending in `/exec`.
7. Put that URL into `config.js` as `APPS_SCRIPT_URL`.
8. Replace the files in your GitHub Pages repository.
9. Hard refresh with Ctrl+F5.

History is retained for about 7 days and is shared across devices.


## Replay controls (latest)

- Replay selection is **hour-only**: 00:00 through 23:00.
- Minutes and seconds are not requested.
- Historical identification shows the selected hour only.
- A visible **↻ RETURN TO LIVE** button appears beside PREVIOUS while replaying.


## Replay identification

Replay mode uses an hour-only selector and shows a prominent PREVIOUS DISPLAY bar with the selected hour and date, plus RETURN TO LIVE.


## Replay picker update

The previous-display picker now uses **hour + minute** (`HH:MM`) and removes seconds. The replay identification is displayed at the **top-left next to the logo**, showing the saved display date and time. A **RETURN TO LIVE** button is placed with the dashboard controls.


IMPORTANT REPLAY BEHAVIOR
- Google Sheets history now saves a complete dashboard snapshot every 30 minutes.
- Identical dashboard data is intentionally saved again each minute.
- This allows PREVIOUS to return the display for the selected HH:MM instead of repeatedly returning the first/only saved time.
- Existing history remains usable; new minute-by-minute snapshots start accumulating after this version is deployed.


30-MINUTE REPLAY: a complete dashboard snapshot is saved every 30 minutes, even when the displayed data has not changed.
