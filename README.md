# Cement Loading Operations Dashboard — Google Sheets Shared History

This version uses **Google Sheets + Google Apps Script** for shared history. The full original dashboard rendering code is retained so `data.json` continues to power the live display.

The GitHub Pages dashboard remains the frontend. Historical snapshots are stored in a Google Sheet, so the same history can be viewed from different computers/TVs.

## Files

- `index.html` — dashboard and Previous/date/time history interface
- `app.js` — live dashboard + shared history logic
- `styles.css` — dashboard styling
- `data.json` — live dashboard data source
- `logo.png` — dashboard logo
- `config.js` — Google Apps Script Web App URL
- `GoogleAppsScript_Code.gs` — backend to paste into Google Apps Script
- `config.js.example` — configuration template

## Setup

### 1. Create the Google Sheet

Create a new Google Sheet, for example:

**Cement Dashboard History**

You do not need to create columns manually. The Apps Script will create a tab called `DashboardHistory`.

### 2. Add Apps Script

In the Google Sheet:

**Extensions → Apps Script**

Delete the default code and paste everything from:

`GoogleAppsScript_Code.gs`

Save the project.

### 3. Deploy the Web App

In Apps Script:

**Deploy → New deployment**

Choose:

- Type: **Web app**
- Execute as: **Me**
- Who has access: **Anyone**

Deploy and authorize the script if Google asks.

Copy the URL ending in:

`/exec`

### 4. Configure the GitHub dashboard

Open `config.js` and replace:

`https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec`

with your Apps Script Web App URL.

Then commit/push the files to GitHub Pages.

### 5. Test

Open the dashboard from one computer.

Wait for live data to change and be saved.

Then open the dashboard from another computer/TV and use:

**PREVIOUS → DATE → TIME**

The historical display is retrieved from the shared Google Sheet.

## History behavior

- Keeps approximately **7 days** of history.
- Saves a snapshot when dashboard data changes.
- The dashboard checks/saves approximately every **30 seconds**.
- Old records are automatically removed when new records are saved.
- History is shared between devices because it is stored in Google Sheets rather than browser localStorage.

## Important security note

The Apps Script Web App is configured for public access so any dashboard device can read/write history without Google sign-in.

Do not put passwords, API keys, credentials, or other sensitive information into the dashboard data.

For an internal/private production system, the backend can be hardened later with authentication or a protected write endpoint.

## Time zone

The dashboard UI is designed around Philippine time (`en-PH`). Google Sheets/Apps Script should ideally use the same time zone:

**File → Settings → Time zone → GMT+08:00 / Manila**

The stored timestamps are ISO timestamps, so the dashboard can still display them consistently.

## Updating the dashboard

Only `config.js` needs the Apps Script URL. The Google Sheet stays separate from GitHub, so your history does not accumulate in the GitHub repository.


## IMPORTANT FIX

This package restores the complete original `app.js`, including the live dashboard `render()` logic. The previous Google conversion accidentally omitted that code, which could leave the live dashboard blank. This package fixes that issue.


# CLOUD CAPTURE — IMPORTANT

This version is different from browser-based history.

Google Apps Script fetches the public `data.json` directly and stores a
complete dashboard snapshot in Google Sheets every 30 minutes.

Therefore:
- The dashboard page does NOT need to be open.
- A TV/browser can be off and snapshots continue.
- The PREVIOUS button reads the saved snapshots from Google Sheets.
- History is retained for 7 days.
- Apps Script time triggers run approximately every 30 minutes; Google
  controls the exact execution minute.

ONE-TIME ACTION:
Run `setup30MinuteTrigger()` in Apps Script once. It installs the cloud
trigger and immediately captures the first snapshot.

Then deploy/update the Apps Script Web App and put its `/exec` URL in
`config.js`.

DATA SOURCE:
The Apps Script currently fetches:
https://safisccport.github.io/portoperation/data.json

If your live `data.json` is hosted at a different public address, change
`DATA_URL` in `GoogleAppsScript_Code.gs`.
