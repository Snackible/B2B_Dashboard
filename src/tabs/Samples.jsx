import { useMemo, useState } from 'react';
import { BarChart, HBarChart } from '../components/charts';
import {
  Badge, Card, Count, EmptyRow, FilterGroup, FilterLabel, FilterRow, Metric, MetricGrid, MonoCount, MONTH_OPTIONS, Select, Table, Tierbar, yearOptions,
} from '../components/ui';
import { MONTH_NAMES, fd, inRange, todayStr } from '../lib/util';
import { yearsIn } from '../lib/selectors';

const PRODUCTS = [
  ['all', 'All Products'],
  ['Cheesy Jalepeno Dip with Piri Piri Ragi Chips', 'Cheesy Jalepeno Dip'],
  ['Peri Peri Ragi Chips', 'Peri Peri Ragi Chips'],
  ['Piri piri ragi chips', 'Piri piri ragi chips'],
  ['Nacho cheese Jowar puffs', 'Nacho Cheese Jowar Puffs'],
  ['Biscuit Sticks with Butterscotch Dip', 'Biscuit Sticks Butterscotch'],
  ['Baked Pizza Sticks with a Cheesy Jalapeno Dip', 'Baked Pizza Sticks'],
  ['Best Seller Box of 10', 'Best Seller Box'],
  ['Cheese Dosa Khakhra', 'Cheese Dosa Khakhra'],
  ['Pistachio Dip with Biscuit sticks', 'Pistachio Dipsters'],
];
const REQUESTERS = [['all', 'All'], 'Siya', 'Mahi', 'Bhoomika', 'Dhyana'];
const BLUES = ['#3b82f6', '#6d28d9', '#5b21b6', '#4c1d95', '#1d4ed8', '#1e40af', '#1e3a8a'];
const rowStyle = { display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '7px 4px', borderBottom: '1px solid rgba(255,255,255,.04)' };
const emptyStyle = { color: '#555', fontSize: 12, textAlign: 'center', padding: 20 };
const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);

export default function Samples({ data, filters, tierLabel }) {
  const { from, to } = filters;
  const [prod, setProd] = useState('all');
  const [by, setBy] = useState('all');
  const [yearSel, setYear] = useState('all');
  const [month, setMonth] = useState('all');
  const all = data.samples;
  const years = useMemo(() => yearsIn(all), [all]);
  const year = years.includes(yearSel) ? yearSel : 'all';

  const sm = useMemo(() => all.filter((s) => {
    if (!inRange(s.date, from, to)) return false;
    if (prod !== 'all' && !s.product.toLowerCase().includes(prod.toLowerCase().slice(0, 15))) return false;
    if (by !== 'all' && s.req_by.toLowerCase() !== by.toLowerCase()) return false;
    if (year !== 'all' && s.date.slice(0, 4) !== year) return false;
    return month === 'all' || s.date.slice(5, 7) === month;
  }), [all, from, to, prod, by, year, month]);

  const { grouped, topProds, topBy, clients, uniqueClients } = useMemo(() => {
    const byProd = {}, byReq = {}, clientCounts = {}, groups = {};
    sm.forEach((s) => {
      if (s.product) byProd[s.product] = (byProd[s.product] || 0) + s.qty;
      if (s.req_by) byReq[s.req_by] = (byReq[s.req_by] || 0) + 1;
      if (s.client && s.client !== '—') clientCounts[s.client] = (clientCounts[s.client] || 0) + 1;
      const key = `${s.date}|${s.client}|${s.req_by}`;
      const g = (groups[key] ||= { date: s.date, client: s.client, req_by: s.req_by, totalQty: 0, products: [] });
      g.products.push(`${s.product} (${s.qty})`);
      g.totalQty += s.qty;
    });
    return {
      grouped: Object.values(groups).sort((a, b) => b.date.localeCompare(a.date)),
      topProds: top(byProd), topBy: top(byReq)[0], clients: top(clientCounts),
      uniqueClients: new Set(sm.map((s) => s.client).filter(Boolean)).size,
    };
  }, [sm]);

  const today = todayStr();
  const todaySamples = all.filter((s) => s.date === today);
  const todayQty = todaySamples.reduce((a, s) => a + (s.qty || 1), 0);

  // Daily bars for short spans; monthly once the span exceeds ~2 months.
  const dates = sm.map((s) => s.date).filter(Boolean).sort();
  const spanDays = dates.length ? (new Date(dates[dates.length - 1]) - new Date(dates[0])) / 86400000 : 0;
  const chart = useMemo(() => {
    const key = month !== 'all' || spanDays <= 62 ? (s) => s.date : (s) => s.date.slice(0, 7);
    const m = {};
    sm.forEach((s) => { m[key(s)] = (m[key(s)] || 0) + 1; });
    const keys = Object.keys(m).sort();
    const labels = month !== 'all' || spanDays <= 62
      ? keys.map(fd)
      : keys.map((k) => `${MONTH_NAMES[parseInt(k.slice(5, 7), 10) - 1]}'${k.slice(2, 4)}`);
    return { labels, values: keys.map((k) => m[k]) };
  }, [sm, month, spanDays]);

  const p7 = topProds.slice(0, 7);

  return (
    <>
      <Tierbar show={!!tierLabel}>{tierLabel}</Tierbar>
      <MetricGrid cols={5}>
        <Metric cls="bl" label="Total Samples" value={sm.length} sub={`${sm.length} items in range`} />
        <Metric cls="gn" label="Sent Today" value={todaySamples.length} sub={`${todayQty} units`} />
        <Metric cls="bl" label="Unique Clients" value={uniqueClients} sub="recipients" />
        <Metric cls="bl" label="Most Sent" value={topProds[0] ? topProds[0][0].slice(0, 22) : '—'} valueStyle={{ fontSize: 13 }} sub={topProds[0] ? `${topProds[0][1]} units` : '—'} />
        <Metric cls="bl" label="Requested By" value={topBy ? topBy[0] : '—'} valueStyle={{ fontSize: 14 }} sub="most active" />
      </MetricGrid>
      <FilterRow>
        <FilterGroup>
          <FilterLabel>Product</FilterLabel>
          <Select value={prod} onChange={setProd} options={PRODUCTS} style={{ minWidth: 200 }} />
          <FilterLabel>By</FilterLabel>
          <Select value={by} onChange={setBy} options={REQUESTERS} />
          <FilterLabel>Year</FilterLabel>
          <Select value={year} onChange={setYear} options={yearOptions(years)} />
          <FilterLabel>Month</FilterLabel>
          <Select value={month} onChange={setMonth} options={MONTH_OPTIONS} />
        </FilterGroup>
        <MonoCount>{grouped.length} requests shown</MonoCount>
      </FilterRow>
      <div className="g2">
        <Card title="Samples by Date">
          <BarChart labels={chart.labels} datasets={[{ label: 'Items', data: chart.values, color: '#3b82f6', vf: (v) => v }]} height={180} />
        </Card>
        <Card title="Top Products Sampled">
          <HBarChart labels={p7.map((p) => p[0].slice(0, 22))} values={p7.map((p) => p[1])} colors={BLUES} minHeight={180} />
        </Card>
      </div>
      <div className="g2">
        <Card title="Unique Clients" right={<Count>{clients.length} clients</Count>}>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {clients.length ? clients.map(([name, n]) => (
              <div key={name} style={rowStyle}>
                <span style={{ color: '#fff' }}>{name}</span>
                <span style={{ color: '#a78bfa', fontFamily: 'monospace' }}>{n} req{n !== 1 ? 's' : ''}</span>
              </div>
            )) : <div style={emptyStyle}>No clients in range</div>}
          </div>
        </Card>
        <Card title="Sent Today" right={<Count>{todaySamples.length} sent today</Count>}>
          <div style={{ maxHeight: 280, overflowY: 'auto' }}>
            {todaySamples.length ? todaySamples.map((s, i) => {
              const ellipsis = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
              return (
                <div key={i} style={{ ...rowStyle, gap: 8 }}>
                  <span title={s.product || ''} style={{ color: '#fff', maxWidth: '50%', ...ellipsis }}>{s.product || '—'}</span>
                  <span style={{ color: '#ddd', maxWidth: '30%', ...ellipsis }}>{s.client || '—'}</span>
                  <span style={{ color: '#a78bfa', fontFamily: 'monospace', flexShrink: 0 }}>x{s.qty || 1}</span>
                </div>
              );
            }) : <div style={emptyStyle}>No samples sent today</div>}
          </div>
        </Card>
      </div>
      <div className="g1">
        <Card title="All Sample Requests">
          <Table head={['Date', 'Product Sampled', 'Client', 'Qty', 'Requested By', 'Dispatch']}>
            {grouped.length ? grouped.map((g, i) => {
              const top = { verticalAlign: 'top', paddingTop: 12 };
              return (
                <tr key={i}>
                  <td style={top}>{fd(g.date)}</td>
                  <td style={{ color: '#fff', lineHeight: 1.6, ...top }}>{g.products.map((p, j) => <div key={j}>• {p}</div>)}</td>
                  <td style={{ color: '#ddd', ...top }}>{g.client || '—'}</td>
                  <td style={{ fontFamily: 'monospace', color: '#a78bfa', fontWeight: 600, ...top }}>{g.totalQty}</td>
                  <td style={top}><Badge kind="poc">{g.req_by}</Badge></td>
                  <td style={{ color: '#aaa', ...top }}>—</td>
                </tr>
              );
            }) : <EmptyRow cols={6}>No samples in selected range</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}
