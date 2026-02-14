/* ═══════════════════════════════════════════════════════════════
   FreelanceBoard — Google Apps Script Backend (v2 — date-safe)
   ═══════════════════════════════════════════════════════════════
   
   IMPORTANT: après mise à jour de ce code, il faut créer un
   NOUVEAU déploiement (pas "modifier" l'ancien) pour que les
   changements soient pris en compte.
   
   Déployer > Nouveau déploiement > Application Web
   - Exécuter en tant que : Moi
   - Accès : Tout le monde
   → Copie la NOUVELLE URL et mets-la dans FreelanceBoard.
   
   ═══════════════════════════════════════════════════════════════ */

var SHEET_NAMES = { jobs: "Jobs", calendar: "Calendar", settings: "Settings" };

var JOBS_HEADERS = [
  "id", "name", "client", "contact", "type", "dailyRate",
  "fixedAmount", "currency", "status", "color", "poNumber",
  "notes", "startDate", "endDate", "createdAt"
];
var CALENDAR_HEADERS = ["date", "jobId", "period"];
var SETTINGS_HEADERS = ["key", "value"];

var NUMERIC_FIELDS = ["dailyRate", "fixedAmount"];

// ─── HELPERS ─────────────────────────────────────────────────

/**
 * Retourne un onglet par nom, le crée s'il n'existe pas.
 * Force le format Texte brut sur toutes les colonnes pour
 * empêcher Sheets d'auto-convertir les dates et IDs.
 */
function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
  }

  // Vérifier/écrire les headers
  var firstRow = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  var isEmpty = firstRow.every(function(cell) { return cell === "" || cell === null; });
  if (isEmpty || String(firstRow[0]) !== String(headers[0])) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight("bold")
      .setBackground("#F2E8D5");
    sheet.setFrozenRows(1);
  }

  // Force Texte brut sur toutes les colonnes de données
  // "@" = Plain Text → empêche la conversion auto de "2026-02-14" en Date
  var maxRows = Math.max(sheet.getMaxRows(), 200);
  if (maxRows > 1) {
    sheet.getRange(2, 1, maxRows - 1, headers.length).setNumberFormat("@");
  }

  return sheet;
}

/**
 * Lit un onglet et retourne un tableau d'objets.
 * Utilise getDisplayValues() pour toujours avoir des strings.
 */
function sheetToArray(sheetName, headers) {
  var sheet = getOrCreateSheet(sheetName, headers);
  var lastRow = sheet.getLastRow();

  if (lastRow <= 1) return [];

  // getDisplayValues() retourne TOUJOURS des strings
  // contrairement à getValues() qui retourne des Date objects
  var data = sheet.getRange(2, 1, lastRow - 1, headers.length).getDisplayValues();

  var results = [];
  for (var r = 0; r < data.length; r++) {
    var row = data[r];
    // Ignorer les lignes vides
    var hasContent = false;
    for (var c = 0; c < row.length; c++) {
      if (row[c] !== "" && row[c] !== null) { hasContent = true; break; }
    }
    if (!hasContent) continue;

    var obj = {};
    for (var i = 0; i < headers.length; i++) {
      var h = headers[i];
      var val = row[i];
      if (NUMERIC_FIELDS.indexOf(h) >= 0) {
        obj[h] = (val === "" || val === null) ? 0 : Number(val);
      } else {
        obj[h] = (val === null || val === undefined) ? "" : String(val);
      }
    }
    results.push(obj);
  }
  return results;
}

/**
 * Écrit un tableau d'objets dans un onglet (remplace tout).
 * Toutes les valeurs sont écrites comme strings.
 */
function arrayToSheet(sheetName, headers, dataArray) {
  var sheet = getOrCreateSheet(sheetName, headers);
  var lastRow = sheet.getLastRow();

  // Effacer les données existantes (pas les headers)
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
  }

  if (!dataArray || dataArray.length === 0) return;

  var rows = [];
  for (var r = 0; r < dataArray.length; r++) {
    var obj = dataArray[r];
    var row = [];
    for (var i = 0; i < headers.length; i++) {
      var val = obj[headers[i]];
      // Toujours écrire en string pour éviter l'auto-format
      row.push(val === undefined || val === null ? "" : String(val));
    }
    rows.push(row);
  }

  var range = sheet.getRange(2, 1, rows.length, headers.length);
  range.setNumberFormat("@"); // Force Plain Text AVANT d'écrire
  range.setValues(rows);
}

function readSettings() {
  var arr = sheetToArray(SHEET_NAMES.settings, SETTINGS_HEADERS);
  var obj = {};
  for (var i = 0; i < arr.length; i++) {
    if (arr[i].key) {
      try { obj[arr[i].key] = JSON.parse(arr[i].value); }
      catch(e) { obj[arr[i].key] = arr[i].value; }
    }
  }
  return obj;
}

function writeSettings(settingsObj) {
  var keys = Object.keys(settingsObj);
  var arr = [];
  for (var i = 0; i < keys.length; i++) {
    var k = keys[i];
    var v = settingsObj[k];
    arr.push({
      key: k,
      value: typeof v === "object" ? JSON.stringify(v) : String(v)
    });
  }
  arrayToSheet(SHEET_NAMES.settings, SETTINGS_HEADERS, arr);
}

// ─── RESPONSE ────────────────────────────────────────────────

function createJsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── GET ─────────────────────────────────────────────────────

function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || "readAll";

    if (action === "readAll") {
      return createJsonResponse({
        success: true,
        data: {
          jobs: sheetToArray(SHEET_NAMES.jobs, JOBS_HEADERS),
          entries: sheetToArray(SHEET_NAMES.calendar, CALENDAR_HEADERS),
          settings: readSettings()
        },
        timestamp: new Date().toISOString()
      });
    }

    if (action === "ping") {
      return createJsonResponse({
        success: true,
        message: "FreelanceBoard API v2 OK",
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({ success: false, error: "Action inconnue: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// ─── POST ────────────────────────────────────────────────────

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action || "writeAll";

    if (action === "writeAll") {
      if (body.jobs !== undefined)
        arrayToSheet(SHEET_NAMES.jobs, JOBS_HEADERS, body.jobs);
      if (body.entries !== undefined)
        arrayToSheet(SHEET_NAMES.calendar, CALENDAR_HEADERS, body.entries);
      if (body.settings !== undefined)
        writeSettings(body.settings);

      return createJsonResponse({
        success: true,
        message: "Données synchronisées",
        timestamp: new Date().toISOString()
      });
    }

    return createJsonResponse({ success: false, error: "Action inconnue: " + action });
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() });
  }
}

// ─── INIT ────────────────────────────────────────────────────

function initSheet() {
  getOrCreateSheet(SHEET_NAMES.jobs, JOBS_HEADERS);
  getOrCreateSheet(SHEET_NAMES.calendar, CALENDAR_HEADERS);
  getOrCreateSheet(SHEET_NAMES.settings, SETTINGS_HEADERS);

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var jobsSheet = ss.getSheetByName(SHEET_NAMES.jobs);
  if (jobsSheet) {
    jobsSheet.setColumnWidth(1, 140);
    jobsSheet.setColumnWidth(2, 200);
    jobsSheet.setColumnWidth(3, 150);
    jobsSheet.setColumnWidth(4, 150);
    jobsSheet.setColumnWidth(5, 80);
    jobsSheet.setColumnWidth(6, 100);
    jobsSheet.setColumnWidth(7, 100);
    jobsSheet.setColumnWidth(8, 70);
    jobsSheet.setColumnWidth(9, 100);
    jobsSheet.setColumnWidth(10, 80);
    jobsSheet.setColumnWidth(11, 120);
    jobsSheet.setColumnWidth(12, 250);
    jobsSheet.setColumnWidth(13, 120);
    jobsSheet.setColumnWidth(14, 120);
    jobsSheet.setColumnWidth(15, 180);
  }

  console.log("FreelanceBoard v2 initialisé (format Texte brut).");
}
