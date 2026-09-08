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


## Replay display

Historical/replay mode now shows the replay time at **hour precision only** (no minutes or seconds in the replay identification), and a clear **RETURN TO LIVE** control is provided to immediately return to the live dashboard.
