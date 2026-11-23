import { useMemo, useState } from 'react';
import { BarChart, HBarChart } from '../components/charts';
import {
  Card, FilterGroup, FilterLabel, Metric, MetricGrid, MONTH_OPTIONS, Select, Tierbar, yearOptions,
} from '../components/ui';
import { MONTH_NAMES, fd, getWeekMonday, pct, pctDec, sumBy, weekLabel } from '../lib/util';
import { combinedByDate, yearsIn } from '../lib/selectors';

const EVENTS = [
  { id: 'del', label: 'Delivered', color: 'var(--bl)' },
  { id: 'open', label: 'Opened', color: 'var(--ac)' },
  { id: 'click', label: 'Clicked', color: 'var(--or)' },
  { id: 'resp', label: 'Responded', color: 'var(--gr)' },
];
const EVENT_OPTIONS = [['all', 'All Events'], ...EVENTS.map((e) => [e.id, e.label])];
const TYPE_BUTTONS = [['all', 'All Mails'], ['primary', 'Primary'], ['followup', 'Follow-ups']];
const TYPE_LABEL = { all: 'Showing all mails', primary: 'Showing primary mails only', followup: 'Showing follow-up mails only' };

function groupSum(rows, keyOf) {
  const m = {};
  rows.forEach((r) => {
    const k = keyOf(r.date);
    const g = (m[k] ||= { date: k, del: 0, open: 0, click: 0, resp: 0 });
    ['del', 'open', 'click', 'resp'].forEach((f) => { g[f] += r[f] || 0; });
  });
  return Object.values(m).sort((a, b) => a.date.localeCompare(b.date));
}

export default function Mails({ data, view, mail, loading }) {
  const { mlRows } = view;
  const { mtype, setMtype, mYear, setMYear, mMonth, setMMonth } = mail;
  const [evFilter, setEvFilter] = useState('all');
  const years = useMemo(() => yearsIn(combinedByDate(data)), [data]);
  const year = years.includes(mYear) ? mYear : 'all';

  const del = sumBy(mlRows, 'del'), open = sumBy(mlRows, 'open'), click = sumBy(mlRows, 'click');
  const resp = sumBy(mlRows, 'resp'), bounce = sumBy(mlRows, 'bounce');

  const datasetsFor = (rows) => (evFilter === 'all' ? EVENTS : EVENTS.filter((e) => e.id === evFilter)).map((ev) => ({
    label: ev.label, color: ev.color, data: rows.map((r) => r[ev.id] || 0),
    vf: ev.id === 'del' ? (v) => v.toLocaleString() : (v, i) => `${v.toLocaleString()} (${pctDec(v, rows[i].del)} rate)`,
  }));

  // Raw last 7 days, weekly totals for the recent weeks, monthly totals for the recent months.
  const last7 = mlRows.slice(-7);
  const weeks = groupSum(mlRows, getWeekMonday).slice(-10);
  const months = groupSum(mlRows, (d) => d.slice(0, 7)).slice(-6);

  const ind = data.mlByInd;
  const tot = (k) => ind.reduce((a, m) => a + m[k], 0);
  const rateCell = (n, d) => <>{n.toLocaleString()} <span className="rate">{pctDec(n, d)}</span></>;

  return (
    <>
      <Tierbar show={loading}>Loading email data…</Tierbar>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <FilterGroup>
          <FilterLabel>Mail Type</FilterLabel>
          {TYPE_BUTTONS.map(([id, label]) => (
            <button key={id} className={`qb${mtype === id ? ' on' : ''}`} onClick={() => setMtype(id)}>{label}</button>
          ))}
        </FilterGroup>
        <FilterGroup>
          <FilterLabel>Year</FilterLabel>
          <Select value={year} onChange={setMYear} options={yearOptions(years)} />
          <FilterLabel>Month</FilterLabel>
          <Select value={mMonth} onChange={setMMonth} options={MONTH_OPTIONS} />
        </FilterGroup>
        <span style={{ fontSize: 11, color: 'var(--m)', padding: '8px 12px', background: 'var(--s)', border: '1px solid var(--b)', borderRadius: 8 }}>
          {TYPE_LABEL[mtype]}
        </span>
      </div>
      <MetricGrid cols={5}>
        <Metric cls="bl" label="Delivered" value={del.toLocaleString()} sub={`${mlRows.length} days`} />
        <Metric label="Opened" value={open.toLocaleString()} sub={`${pctDec(open, del)} open rate`} />
        <Metric cls="or" label="Clicked" value={click.toLocaleString()} sub={`${pctDec(click, del)} click rate`} />
        <Metric cls="gn" label="Responded" value={resp.toLocaleString()} sub={`${pctDec(resp, del)} resp rate`} />
        <Metric cls="re" label="Bounced" value={bounce.toLocaleString()} sub={`${pctDec(bounce, del)} bounce rate`} />
      </MetricGrid>
      <div className="g2" style={{ alignItems: 'start' }}>
        <Card title="Email Events" right={<Select value={evFilter} onChange={setEvFilter} options={EVENT_OPTIONS} style={{ fontSize: 11, padding: '4px 8px' }} />}>
          {[
            ['Last 7 Days', last7.map((r) => fd(r.date)), last7],
            ['Last Few Weeks', weeks.map((r) => weekLabel(r.date, '-')), weeks],
            ['Last Few Months', months.map((r) => { const p = r.date.split('-'); return `${MONTH_NAMES[+p[1] - 1]} ${p[0]}`; }), months],
          ].map(([title, labels, rows], i) => (
            <div key={title} style={{ marginBottom: i < 2 ? 16 : 0 }}>
              <div style={{ fontSize: 11, color: 'var(--m)', marginBottom: 6, fontWeight: 600 }}>{title}</div>
              <BarChart labels={labels} datasets={datasetsFor(rows)} height={140} />
            </div>
          ))}
        </Card>
        <Card title="Open Rate by Industry">
          <HBarChart
            labels={ind.map((m) => m.ind)} values={ind.map((m) => +pct(m.open, m.del).replace('%', ''))}
            colors={['var(--ac)', '#6d28d9', '#5b21b6', '#4c1d95']} vf={(v) => v + '% open'} minHeight={240}
          />
        </Card>
      </div>
      <div className="g1">
        <Card title="Performance by Industry">
          <div className="mrow mhdr"><span>Industry</span><span>Delivered</span><span>Opened</span><span>Clicked</span><span>Responded</span></div>
          {ind.map((m) => (
            <div className="mrow" key={m.ind}>
              <span style={{ color: 'var(--t2)' }}>{m.ind}</span>
              <span>{m.del.toLocaleString()}</span>
              <span>{rateCell(m.open, m.del)}</span>
              <span>{rateCell(m.click, m.del)}</span>
              <span>{rateCell(m.resp, m.del)}</span>
            </div>
          ))}
          <div className="mrow" style={{ fontWeight: 600, color: 'var(--t)', borderTop: '1px solid var(--b)', marginTop: 6, paddingTop: 10 }}>
            <span>TOTAL</span>
            <span>{tot('del').toLocaleString()}</span>
            <span>{rateCell(tot('open'), tot('del'))}</span>
            <span>{rateCell(tot('click'), tot('del'))}</span>
            <span>{rateCell(tot('resp'), tot('del'))}</span>
          </div>
        </Card>
      </div>
    </>
  );
}
