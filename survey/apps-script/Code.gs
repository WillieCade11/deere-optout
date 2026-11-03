/**
 * Deere Settlement Grower Survey: Google Apps Script backend
 * Version 2026-11-03 v1.0, Graceful Solutions LLC
 *
 * What this does:
 *   1. doPost()      receives each survey answer from the GitHub page and adds a row to a Google Sheet.
 *   2. dailyReport() emails a summary every morning (6 AM US Central) to REPORT_EMAIL.
 *   3. setup()       run ONCE by hand. Creates the Sheet and the daily timer.
 *
 * See survey/SETUP.md in the GitHub repository for step-by-step instructions.
 */

// ===== Settings you may change =====
var REPORT_EMAIL = "willie@graceful.solutions";
var TIME_ZONE = "America/Chicago";   // US Central
var REPORT_HOUR = 6;                 // 6 AM Central
var SHEET_NAME = "Responses";

// Allowed answers. Anything else is rejected, which keeps junk out of the Sheet.
var ALLOWED = {
  q1: ["None", "1 to 5", "6 to 9", "10 or more"],
  q2: ["Yes, postcard", "Yes, email", "Yes, both", "No", "Not sure"],
  q3: ["Yes", "No", "Not sure"],
  q4: ["Yes", "No", "Not sure"]
};
var QUESTION_TEXT = {
  q1: "Q1. Large Deere equipment owned during the Class Period",
  q2: "Q2. Received a settlement notice (postcard or email)",
  q3: "Q3. Deere dealer serviced equipment during the Class Period",
  q4: "Q4. Owns other Deere equipment with an ECU not counted"
};
var HEADERS = ["Timestamp (Central)", "Q1 Equipment count", "Q2 Notice received", "Q3 Dealer service",
               "Q4 Other ECU equipment", "State", "Source", "Version"];

// ===== Run this ONE time from the editor =====
function setup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty("SHEET_ID");
  var ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create("Deere Settlement Grower Survey - Responses");
    props.setProperty("SHEET_ID", ss.getId());
  }
  ss.setSpreadsheetTimeZone(TIME_ZONE);
  var sh = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
  sh.setName(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
    sh.setFrozenRows(1);
  }

  // Replace any old daily timer with a fresh one.
  ScriptApp.getProjectTriggers().forEach(function (t) {
    if (t.getHandlerFunction() === "dailyReport") ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger("dailyReport").timeBased().everyDays(1)
    .atHour(REPORT_HOUR).inTimezone(TIME_ZONE).create();

  Logger.log("Setup complete. Sheet: " + ss.getUrl());
}

// ===== Receives each survey submission =====
function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var d = JSON.parse((e && e.postData && e.postData.contents) || "{}");

    // Spam trap: real people never fill in the hidden "website" box.
    if (d.website) return reply_({ ok: true });

    for (var q in ALLOWED) {
      if (ALLOWED[q].indexOf(d[q]) === -1) return reply_({ ok: false, error: "bad " + q });
    }
    var state = String(d.state || "").slice(0, 40);
    var src = String(d.src || "").replace(/[^\w\-]/g, "").slice(0, 40);
    var ver = String(d.version || "").slice(0, 30);

    lock.waitLock(10000);
    var sh = sheet_();
    sh.appendRow([new Date(), d.q1, d.q2, d.q3, d.q4, state, src, ver]);
    return reply_({ ok: true });
  } catch (err) {
    return reply_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

// Lets you open the Web app URL in a browser to confirm it is running.
function doGet() {
  return ContentService.createTextOutput("Deere survey backend is running.");
}

// ===== Daily email summary =====
function dailyReport() {
  var sh = sheet_();
  var rows = sh.getLastRow() > 1 ? sh.getRange(2, 1, sh.getLastRow() - 1, HEADERS.length).getValues() : [];
  var now = new Date();
  var dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  var last24 = rows.filter(function (r) { return r[0] instanceof Date && r[0] >= dayAgo; });

  var html = [];
  var stamp = Utilities.formatDate(now, TIME_ZONE, "EEEE, MMMM d, yyyy 'at' h:mm a z");
  html.push("<div style='font-family:Calibri,Arial,sans-serif;font-size:15px;color:#1A1A17'>");
  html.push("<h2 style='color:#1F4D2E;margin:0 0 4px'>Deere Settlement Grower Survey: Daily Report</h2>");
  html.push("<p style='margin:0 0 12px;color:#4A4840'>" + stamp + "</p>");
  html.push("<p><b>Total responses:</b> " + rows.length + "<br><b>New in the last 24 hours:</b> " + last24.length + "</p>");

  // Headline: growers who had dealer service but got no notice.
  var serviced = rows.filter(function (r) { return r[3] === "Yes"; });
  var noNotice = serviced.filter(function (r) { return r[2] === "No" || r[2] === "Not sure"; });
  html.push("<div style='background:#FBE38B;border-radius:8px;padding:10px 14px;margin:12px 0'>" +
    "<b>Key finding:</b> " + noNotice.length + " of " + serviced.length +
    " growers who had Deere dealer service report <b>no notice or not sure</b>" +
    (serviced.length ? " (" + pct_(noNotice.length, serviced.length) + ")." : ".") + "</div>");

  var cols = { q1: 1, q2: 2, q3: 3, q4: 4 };
  for (var q in ALLOWED) {
    html.push("<h3 style='color:#1F4D2E;margin:16px 0 4px'>" + QUESTION_TEXT[q] + "</h3>");
    html.push(table_(ALLOWED[q].map(function (a) {
      var all = rows.filter(function (r) { return r[cols[q]] === a; }).length;
      var day = last24.filter(function (r) { return r[cols[q]] === a; }).length;
      return [a, all, pct_(all, rows.length), day];
    }), ["Answer", "All time", "Share", "Last 24 hrs"]));
  }

  // Notice received, by state, for growers with dealer service.
  var byState = {};
  serviced.forEach(function (r) {
    var s = r[5] || "Not given";
    byState[s] = byState[s] || [0, 0];
    byState[s][0]++;
    if (r[2] === "No" || r[2] === "Not sure") byState[s][1]++;
  });
  var stateRows = Object.keys(byState).sort().map(function (s) {
    return [s, byState[s][0], byState[s][1], pct_(byState[s][1], byState[s][0])];
  });
  html.push("<h3 style='color:#1F4D2E;margin:16px 0 4px'>By state (growers with dealer service)</h3>");
  html.push(stateRows.length ? table_(stateRows, ["State", "Had dealer service", "No notice or not sure", "Share"]) : "<p>No responses yet.</p>");

  html.push("<p style='margin-top:16px'><a href='" + SpreadsheetApp.openById(sheetId_()).getUrl() +
    "'>Open the full response sheet</a></p>");
  html.push("<p style='font-size:12px;color:#4A4840'>Sent automatically by the survey backend. A CSV of all responses is attached.</p></div>");

  MailApp.sendEmail({
    to: REPORT_EMAIL,
    subject: "Deere Grower Survey: " + last24.length + " new, " + rows.length + " total (" +
             Utilities.formatDate(now, TIME_ZONE, "MMM d, yyyy") + ")",
    htmlBody: html.join(""),
    attachments: [csv_(rows)]
  });
}

// ===== Helpers =====
function sheetId_() {
  var id = PropertiesService.getScriptProperties().getProperty("SHEET_ID");
  if (!id) throw new Error("Run setup() first.");
  return id;
}
function sheet_() { return SpreadsheetApp.openById(sheetId_()).getSheetByName(SHEET_NAME); }
function pct_(n, d) { return d ? Math.round((n / d) * 100) + "%" : "0%"; }
function reply_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
function table_(rows, head) {
  var td = "style='border:1px solid #D5DED3;padding:4px 10px'";
  var h = "<table style='border-collapse:collapse'><tr>" + head.map(function (x) {
    return "<th " + td.replace("'", "'background:#EEF3EC;") + ">" + x + "</th>";
  }).join("") + "</tr>";
  rows.forEach(function (r) { h += "<tr>" + r.map(function (c) { return "<td " + td + ">" + c + "</td>"; }).join("") + "</tr>"; });
  return h + "</table>";
}
function csv_(rows) {
  var esc = function (v) {
    if (v instanceof Date) v = Utilities.formatDate(v, TIME_ZONE, "yyyy-MM-dd HH:mm:ss");
    v = String(v == null ? "" : v);
    return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v;
  };
  var text = [HEADERS].concat(rows).map(function (r) { return r.map(esc).join(","); }).join("\r\n");
  var name = "Deere Grower Survey Responses " + Utilities.formatDate(new Date(), TIME_ZONE, "yyyy-MM-dd") + ".csv";
  return Utilities.newBlob(text, "text/csv", name);
}

// Optional: run by hand to send a report right now (for testing).
function sendReportNow() { dailyReport(); }
