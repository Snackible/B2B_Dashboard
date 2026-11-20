import { fetchTabs, sheetsFetch } from './_googleSheetsAuth.js';

// Confirmed via Sheets API (tab names + column layout/row counts both verified):
const CCBD_ID = '1AKDPhz1RvZoNDL5RSYeg7wRu4vInRHFCRsTvmDYOueM'; // "CCBD Tracker"
const OPS_ID = '1XWnWJO2UWvtNaoHVBcrEkHEWyvDnermcpPrceAkLas4'; // "B2B Consolidated": Sales_Log/Ads_Log/InMails/Master_Log
const PENDING_ID = '1pggQxxQnTA1RksfPRm4cuiyxMQeAnQYX8yPJGgZA5LA'; // "Pending delivery"

function quoteSheetName(name) {
  if (/^[A-Za-z0-9_]+$/.test(name)) return name;
  return `'${name.replace(/'/g, "''")}'`;
}

async function fetchRange(spreadsheetId, sheetName) {
  const json = await sheetsFetch(
    `${spreadsheetId}/values/${encodeURIComponent(quoteSheetName(sheetName))}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`
  );
  return json.values || [];
}

// Confirmed via the live Apps Script source (project "Bd consolidated
// appscript", doGet()): Master_Log keeps only rows from the last 120 days
// (a rolling window off today, column index 8) and narrows each row down to
// 5 columns: [r0, r3, r4, r6, r8].
async function fetchMasterLog() {
  const rows = await fetchRange(OPS_ID, 'Master_Log');
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 120);
  return rows.slice(1).filter((r) => {
    if (!r[8]) return false;
    const d = new Date(r[8]);
    return !isNaN(d) && d >= cutoff;
  }).map((r) => [r[0], r[3], r[4], r[6], r[8]]);
}

// Same Apps Script also reads Pending_Sales/Pending_Delivery from a
// *different* spreadsheet's "Sales"/"Samples" tabs (not tabs literally named
// Pending_Sales/Pending_Delivery). No date or row-count filtering — it only
// drops rows with no ref/date at all.
async function fetchPendingDelivery() {
  const rows = await fetchRange(PENDING_ID, 'Samples');
  return rows.slice(1).filter((r) => r[0] || r[2]);
}
async function fetchPendingSales() {
  const rows = await fetchRange(PENDING_ID, 'Sales');
  return rows.slice(1).filter((r) => r[0]);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    // Sales_Log/Ads_Log/InMails live on OPS_ID too, but /api/sheets?source=ops
    // already fetches those same tabs for the Sales tab — re-reading them here
    // doubled our per-minute Sheets API read volume on every page load and was
    // tripping Google's rate limit (429) under normal traffic. Only Master_Log
    // (unique to this endpoint) still needs an OPS_ID read.
    const [ccbdData, masterLog, pendingDelivery, pendingSales] = await Promise.all([
      fetchTabs(CCBD_ID, { CCBD_BAU: 'BAU', CCBD_Festive: 'Festive', CCBD_Diwali: 'Diwali CCBD' }),
      fetchMasterLog(),
      fetchPendingDelivery(),
      fetchPendingSales(),
    ]);

    // parseCcbd/parseCcbd-for-Diwali expect header-less rows (Apps Script sent
    // them pre-stripped); parseCcbdFestive strips its own header, so that one
    // is left as-is.
    ccbdData.CCBD_BAU = ccbdData.CCBD_BAU.slice(1);
    ccbdData.CCBD_Diwali = ccbdData.CCBD_Diwali.slice(1);

    const merged = {
      ...ccbdData,
      Master_Log: masterLog,
      Pending_Delivery: pendingDelivery,
      Pending_Sales: pendingSales,
    };
    res.status(200).json(merged);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
