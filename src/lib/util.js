export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const pad = (n) => String(n).padStart(2, '0');

export function fmt(n) {
  if (!n || isNaN(n) || n === 0) return '—';
  if (n >= 100000) return '₹' + (n / 100000).toFixed(1) + 'L';
  if (n >= 1000) return '₹' + (n / 1000).toFixed(0) + 'K';
  return '₹' + Math.round(n);
}
export const pct = (a, b) => (b > 0 ? Math.round((a / b) * 100) + '%' : '0%');
export const pctDec = (a, b, dec = 2) => (b > 0 ? ((a / b) * 100).toFixed(dec) + '%' : '0.00%');
/** "2026-04-15" -> "04/15" */
export const fd = (d) => (d ? d.slice(5).replace('-', '/') : '—');

export const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const todayStr = () => ymd(new Date());

/** Apps Script sends dates as UTC ISO strings; shift to IST and return YYYY-MM-DD ('' if unparseable). */
export function istDate(v) {
  const d = new Date(v);
  if (isNaN(d.getTime())) return '';
  const ist = new Date(d.getTime() + 5.5 * 60 * 60 * 1000);
  return `${ist.getUTCFullYear()}-${pad(ist.getUTCMonth() + 1)}-${pad(ist.getUTCDate())}`;
}

/** Monday of the week containing a YYYY-MM-DD date. */
export function getWeekMonday(dateStr) {
  if (!dateStr) return '';
  const p = dateStr.split('-');
  if (p.length < 3) return dateStr;
  const d = new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  return ymd(d);
}

/** "2026-04-13" -> "Apr 13 - Apr 19" */
export function weekLabel(monday, sep = ' - ') {
  const [y, m, d] = monday.split('-').map(Number);
  const d1 = new Date(y, m - 1, d);
  const d2 = new Date(y, m - 1, d + 6);
  return `${MONTH_NAMES[d1.getMonth()]} ${d1.getDate()}${sep}${MONTH_NAMES[d2.getMonth()]} ${d2.getDate()}`;
}

export const sumBy = (rows, key) => rows.reduce((a, r) => a + (r[key] || 0), 0);

/** Count occurrences keyed by fn(row); returns [key, count] sorted desc. */
export function countBy(rows, fn) {
  const m = {};
  rows.forEach((r) => {
    const k = fn(r);
    if (k) m[k] = (m[k] || 0) + 1;
  });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

export const inRange = (date, from, to) => !((from && date < from) || (to && date > to));

export function lsGet(key) {
  try { return localStorage.getItem(key); } catch { return null; }
}
export function lsSet(key, value) {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}
