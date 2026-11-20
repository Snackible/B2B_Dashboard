import { JWT } from 'google-auth-library';

let client;

// Credentials come from env vars only — never from a committed key file.
// Locally: set GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY in .env.local (gitignored).
// On Vercel: set the same two as Project Environment Variables.
function getClient() {
  if (!client) {
    const email = process.env.GOOGLE_SA_EMAIL;
    const key = (process.env.GOOGLE_SA_PRIVATE_KEY || '').replace(/\\n/g, '\n');
    if (!email || !key) throw new Error('Missing GOOGLE_SA_EMAIL / GOOGLE_SA_PRIVATE_KEY env vars');
    client = new JWT({ email, key, scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'] });
  }
  return client;
}

export async function sheetsFetch(path) {
  const { token } = await getClient().getAccessToken();
  const r = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!r.ok) throw new Error(`Sheets API ${r.status}: ${(await r.text()).slice(0, 300)}`);
  return r.json();
}

export async function listTabTitles(spreadsheetId) {
  const meta = await sheetsFetch(`${spreadsheetId}?fields=sheets.properties.title`);
  return (meta.sheets || []).map((s) => s.properties.title);
}

// A1 notation requires single-quoting a sheet name that isn't a bare identifier
// (spaces, punctuation, etc.), with any literal ' doubled.
function quoteSheetName(name) {
  if (/^[A-Za-z0-9_]+$/.test(name)) return name;
  return `'${name.replace(/'/g, "''")}'`;
}

// tabs: { outputKey: actualSheetTabName }
export async function fetchTabs(spreadsheetId, tabs) {
  const entries = Object.entries(tabs);
  const ranges = entries.map(([, name]) => `ranges=${encodeURIComponent(quoteSheetName(name))}`).join('&');
  const json = await sheetsFetch(`${spreadsheetId}/values:batchGet?${ranges}&valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`);
  const out = {};
  entries.forEach(([key], i) => { out[key] = json.valueRanges[i]?.values || []; });
  return out;
}
