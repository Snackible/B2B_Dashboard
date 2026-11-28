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
// "Database YE- April26" — a second mail-merge outreach database (Diwali +
// Year-End campaigns across ~70 industry tabs), same "Previous Merge - <date>"
// column format as Noor, parsed the same way.
export const YE_URL = '/api/sheets?source=ye';
export const BD_URL = '/api/sheets?source=bd'; // "Sheet1" + "Recurring clients" tabs confirmed
export const SHEET_URL = '/api/sheets?source=ops'; // Ads_Log + InMails
// "Sales Dashboard FY | 26-27" / Active Orders — the live replacement for the
// old Sales_Log tab, which stopped getting new rows after 19/08/2026.
export const TOTAL_SALES_URL = '/api/sheets?source=sales';

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
