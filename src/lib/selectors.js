import { inRange } from './util';

const KEYS = ['del', 'open', 'click', 'resp', 'bounce'];

/** Master_Log daily totals with the Noor mail-merge sends folded in, so "All Mails" covers every campaign. */
export function combinedByDate(data) {
  if (!data.noorByDate.length) return data.mlByDate;
  const map = {};
  [...data.mlByDate, ...data.noorByDate].forEach((d) => {
    const m = (map[d.date] ||= { date: d.date, del: 0, open: 0, click: 0, resp: 0, bounce: 0 });
    KEYS.forEach((k) => { m[k] += d[k] || 0; });
  });
  return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
}

export const yearsIn = (rows) => [...new Set(rows.map((r) => r.date && r.date.slice(0, 4)).filter(Boolean))].sort();

/** Daily mail rows after the Mails-tab type/year/month filters and the global date range. */
export function selectMailRows(data, { from, to, mtype, mYear, mMonth }) {
  const all = combinedByDate(data);
  let src = mtype === 'primary' ? data.mlPrimary : mtype === 'followup' ? data.mlFollowup : all;
  if (!src.length) src = data.mlByDate;
  const year = yearsIn(all).includes(mYear) ? mYear : 'all';
  if (!from && !to && year === 'all' && mMonth === 'all') return src;
  return src.filter((d) => inRange(d.date, from, to)
    && (year === 'all' || d.date.slice(0, 4) === year)
    && (mMonth === 'all' || d.date.slice(5, 7) === mMonth));
}

export function deriveView(data, filters) {
  const { from, to } = filters;
  return {
    sales: data.sales.filter((s) => inRange(s.date, from, to)),
    ads: data.ads.filter((a) => inRange(a.date, from, to)),
    mlRows: selectMailRows(data, filters),
  };
}
