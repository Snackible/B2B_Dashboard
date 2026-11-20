// Now reads from Google Sheets API ("Sample Data (Snackible+Dipsters)",
// tab "Sample sheet"). The old Apps Script doGet() ignored the ?limit param
// entirely and re-scanned all ~50K rows on every tier call; this endpoint
// does one Sheets API read and applies the same header-row cutoff-date
// filter server-side, honoring ?limit for the tiered loads below.
export const SAMPLES_URL = '/api/sheets?source=samples';

// These now read straight from Google Sheets API via our own serverless
// functions (api/sheets.js) using a service-account credential — row counts
// and/or column layouts verified to match the Apps Script output.
export const DIWALI_URL = '/api/sheets?source=diwali';
export const NOOR_URL = '/api/sheets?source=noor';
export const BD_URL = '/api/sheets?source=bd'; // "Sheet1" + "Recurring clients" tabs confirmed
// Also fixes the previously-broken Sales tab: parseSales falls back to a
// "Sales_Log"-named key, which this source provides (222 rows, verified
// identical to the old Apps Script Sales_Log tab).
export const SHEET_URL = '/api/sheets?source=ops';

// LEGACY_URL: CCBD_BAU/Festive/Diwali and Sales_Log/Ads_Log/InMails now come
// from Sheets API (verified row-for-row against the old Apps Script output).
// Master_Log and Pending_* stay on Apps Script: a raw Sheets API read returns
// far MORE rows than Apps Script does (83,155 vs 24,024 for Master_Log;
// 1,868 vs 105 for Pending_Delivery) — Apps Script is filtering stale/handled
// rows server-side and that logic hasn't been found.
export const LEGACY_URL = '/api/legacy';

// Sample_sheet spans years (~7MB full read), so it's loaded small-to-large.
export const SAMPLE_TIERS = [
  { key: 'today', limit: 300, label: "Loading today's samples…" },
  { key: 'week', limit: 1500, label: 'Loading this week’s samples…' },
  { key: 'month', limit: 6000, label: "Loading this month's samples…" },
  { key: 'all', limit: null, label: 'Loading full sample history… (this can take a while)' },
];

export const PENDING_ALLOWED_POCS = ['Mahi', 'Bhoomika', 'Prabhnoor', 'Kritik', 'Dhyana', 'Khushi'];
