import { fetchTabs, listTabTitles, sheetsFetch } from './_googleSheetsAuth.js';

// The live Apps Script endpoint (doGet) just does getDataRange().getValues()
// on the first sheet and returns it raw under key "Sample_sheet" — no
// filtering (a separate draft script in the same project adds a cutoff-date
// filter, but it has 0 executions and isn't the deployed/live version, so we
// don't apply it here). parseSamples() in src/lib/parsers.js matches this
// key by substring, so the exact key name is preserved.
const SAMPLES_ID = '1Ia4L6F9Q92YuG2VmvX-8aiesMH03oH-mVLl20o46QvU';
const SAMPLES_TAB = 'Sample sheet '; // trailing space is part of the real tab name

async function fetchSamples(limit) {
  // A bare sheet-name range trims trailing blank rows; Apps Script's
  // getDataRange() does not, so pin the full declared grid size instead.
  const meta = await sheetsFetch(`${SAMPLES_ID}?fields=sheets.properties`);
  const props = meta.sheets.find((s) => s.properties.title === SAMPLES_TAB.trim() || s.properties.title === SAMPLES_TAB).properties;
  const { rowCount, columnCount } = props.gridProperties;
  const colLetter = (n) => { let s = ''; for (; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s; return s; };
  const quoted = `'${SAMPLES_TAB.replace(/'/g, "''")}'`;
  const range = `${quoted}!A1:${colLetter(columnCount)}${rowCount}`;
  const json = await sheetsFetch(
    `${SAMPLES_ID}/values/${encodeURIComponent(range)}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`
  );
  const rows = json.values || [];
  const header = rows[0];
  const data = rows.slice(1);
  // The old endpoint ignored ?limit entirely and always returned all 50K+
  // rows; we honor it here so the "today"/"week"/"month" tiers actually do
  // less work and paint faster, while "all" (no limit) keeps full parity.
  const sliced = limit ? data.slice(-limit) : data;
  return { Sample_sheet: [header, ...sliced] };
}

// Confirmed Drive spreadsheets behind the dashboard's Google Sheets API sources.
const SOURCES = {
  noor: { id: '1vCd7Qk8c3R79kMvNjdkjGFQFZMCbNHL-XGRgqxYp5gQ', dynamic: true },
  diwali: {
    id: '1WzxK5J4zHxncBeIo7JXQkemKce3JcRQNAa6XlbBeSsY',
    tabs: {
      'LinkedIn Tracker': 'LinkedIn Tracker',
      'Cold Calls Tracker': 'Cold Calls Tracker',
      'Sample Box': 'Sample Box ', // trailing space is part of the real tab name
      'Email Tracker': 'Email Tracker',
    },
  },
  bd: {
    id: '1vXtFftHevPHxUTy6YSmVspdwamKvsIyc23siEQhm3DA',
    tabs: { Sheet1: 'Sheet1', 'Recurring clients': 'Recurring clients' },
  },
  // Column layouts verified against parseCcbd/parseCcbdFestive before wiring in.
  ccbd: {
    id: '1AKDPhz1RvZoNDL5RSYeg7wRu4vInRHFCRsTvmDYOueM',
    tabs: { CCBD_BAU: 'BAU', CCBD_Festive: 'Festive', CCBD_Diwali: 'Diwali CCBD' },
  },
  // Row counts verified identical to the Apps Script output for both tabs.
  ops: {
    id: '1XWnWJO2UWvtNaoHVBcrEkHEWyvDnermcpPrceAkLas4',
    tabs: { Ads_Log: 'Ads_Log', InMails: 'InMails ' },
  },
  // The old OPS_ID "Sales_Log" tab stopped being updated after 19/08/2026 —
  // someone started a replacement spreadsheet ("Sales Dashboard FY | 26-27")
  // instead. Same column layout (Ref/Order Type/PO Date/Order Date/POC/
  // Client Name/Gross Sales), just under "Active Orders", and kept live.
  // Returned under the "Sales_Log" key so parseSales finds it unchanged.
  sales: {
    id: '1tn_pzuBoiPhjmCggTPL1edvEjTW4CHRAtx3yEQeRkrQ',
    tabs: { Sales_Log: 'Active Orders' },
  },
  // "Database YE- April26" — a second mail-merge outreach database (Diwali +
  // Year-End campaigns), ~70 industry-named tabs each with their own
  // "Previous Merge - <date>" columns (parsed by parseNoor, same as "noor").
  // Excludes admin/audit tabs (Master_Log alone is 80K+ rows and redundant —
  // the per-tab merge columns already carry everything it logs) and "Copy
  // of …" duplicates.
  ye: {
    id: '1DhFKoZMQt6tKJEmuUHkoGfR9H29outde4rOrXrr_ScA',
    dynamic: true,
    exclude: [
      'Master_Log', 'Dashboard', 'Timeline', 'Suppression', 'Lead Submissions',
      'Sodexo Combined', 'Sheet105', 'Sheet106', 'Sheet45',
      'Follow-up on: Diwali july financial services- september',
    ],
  },
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const source = req.query?.source;
  if (source === 'samples') {
    try {
      const limit = req.query?.limit ? parseInt(req.query.limit, 10) : null;
      res.status(200).json(await fetchSamples(limit));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
    return;
  }
  const cfg = SOURCES[source];
  if (!cfg) { res.status(400).json({ error: `Unknown source "${source}"` }); return; }
  try {
    const tabs = cfg.dynamic
      ? Object.fromEntries((await listTabTitles(cfg.id))
          .filter((t) => !t.startsWith('Copy of') && !(cfg.exclude || []).includes(t))
          .map((t) => [t, t]))
      : cfg.tabs;
    const data = await fetchTabs(cfg.id, tabs);
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
