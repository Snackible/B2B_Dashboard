import { useMemo, useState } from 'react';
import { BarChart, HBarChart } from '../components/charts';
import {
  Badge, Card, EmptyRow, FilterGroup, FilterLabel, Metric, MetricGrid, MonoCount, Select, Table, Tierbar,
} from '../components/ui';
import { PENDING_ALLOWED_POCS } from '../config';
import { fd, inRange, todayStr, ymd } from '../lib/util';

const BLUES = ['var(--bl)', '#6d28d9', '#5b21b6', '#4c1d95', '#1d4ed8', '#1e40af'];
const ellipsis = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const companyOf = (s) => (s.company || s.client || '').trim();
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
const sortDesc = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]);

export function PendingSamples({ data, filters, loading }) {
  const { from, to } = filters;
  const [pocFilter, setPocFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const src = useMemo(
    () => data.pendingSamples.filter((s) => PENDING_ALLOWED_POCS.some((p) => String(s.poc || '').toLowerCase().trim() === p.toLowerCase())),
    [data.pendingSamples],
  );
  const pocOptions = useMemo(
    () => PENDING_ALLOWED_POCS.filter((ap) => src.some((s) => s.poc.toLowerCase() === ap.toLowerCase())).sort(),
    [src],
  );
  // A company with more than one pending sample counts as BAU (repeat), otherwise Unique.
  const companyCount = useMemo(() => {
    const m = {};
    src.forEach((s) => { const c = companyOf(s); if (c) m[c] = (m[c] || 0) + 1; });
    return m;
  }, [src]);
  const isBau = (s) => companyCount[companyOf(s)] > 1;

  const sm = src.filter((s) => {
    if (!inRange(s.date, from, to)) return false;
    if (pocFilter !== 'all' && s.poc !== pocFilter) return false;
    if (typeFilter === 'bau') return isBau(s);
    if (typeFilter === 'unique') return !isBau(s);
    return true;
  });

  const today = todayStr();
  const todaySamples = src.filter((s) => s.date === today);
  const todayByPoc = {};
  todaySamples.forEach((s) => { const p = s.poc || 'Unknown'; todayByPoc[p] = (todayByPoc[p] || 0) + 1; });
  const todayPocStr = Object.entries(todayByPoc).map(([p, n]) => `${p}: ${n}`).join(', ') || 'None today';

  const byProd = {}, byPoc = {}, byDate = {};
  sm.forEach((s) => {
    const prod = s.product || 'Unknown', poc = s.poc || 'Unknown';
    byProd[prod] = (byProd[prod] || 0) + (s.qty || 1);
    byPoc[poc] = (byPoc[poc] || 0) + 1;
    if (s.date) byDate[s.date] = (byDate[s.date] || 0) + 1;
  });
  const prods = sortDesc(byProd), pocs = sortDesc(byPoc), dates = Object.keys(byDate).sort();
  const weekStr = daysAgo(7), monthStr = daysAgo(30);
  const avg = (since, days) => Math.round((src.filter((s) => s.date >= since).length / days) * 10) / 10;

  let bau = 0, unique = 0;
  const seen = new Set();
  sm.forEach((s) => {
    const c = companyOf(s);
    if (!c || seen.has(c)) return;
    seen.add(c);
    if (companyCount[c] > 1) bau++; else unique++;
  });

  const rows = sm.slice().sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  const p6 = prods.slice(0, 6);

  return (
    <>
      <Tierbar show={loading}>Loading pending delivery data…</Tierbar>
      <MetricGrid cols={4}>
        <Metric cls="bl" label="Total Pending" value={sm.length} sub={`${sm.length} samples in range`} />
        <Metric cls="gn" label="Today's Samples" value={todaySamples.length} sub={todayPocStr} />
        <Metric cls="ye" label="BAU Clients" value={bau} sub="repeat companies" />
        <Metric cls="or" label="Unique Clients" value={unique} sub="first-time only" />
      </MetricGrid>
      <MetricGrid cols={4}>
        <Metric cls="bl" label="Weekly Avg" value={avg(weekStr, 7) + '/day'} sub="last 7 days" />
        <Metric cls="bl" label="Monthly Avg" value={avg(monthStr, 30) + '/day'} sub="last 30 days" />
        <Metric cls="bl" label="Most Sent Box" value={prods[0] ? prods[0][0].slice(0, 28) : '—'} valueStyle={{ fontSize: 13 }} sub={prods[0] ? `${prods[0][1]} units` : '—'} />
        <Metric cls="bl" label="Top POC" value={pocs[0] ? pocs[0][0] : '—'} valueStyle={{ fontSize: 14 }} sub="most active" />
      </MetricGrid>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <FilterGroup>
          <FilterLabel>POC</FilterLabel>
          <Select value={pocFilter} onChange={setPocFilter} options={[['all', 'All POCs'], ...pocOptions]} />
          <FilterLabel>Company Type</FilterLabel>
          <Select value={typeFilter} onChange={setTypeFilter} options={[['all', 'All'], ['bau', 'BAU only'], ['unique', 'Unique only']]} />
        </FilterGroup>
      </div>
      <div className="g3">
        <Card title="Samples by Date">
          <BarChart labels={dates.map(fd)} datasets={[{ label: 'Samples', data: dates.map((d) => byDate[d]), color: 'var(--bl)', vf: (v) => v }]} height={180} />
        </Card>
        <Card title="Top Products Sent">
          <HBarChart labels={p6.map((p) => p[0].slice(0, 24))} values={p6.map((p) => p[1])} colors={BLUES} vf={(v) => v + ' units'} minHeight={180} />
        </Card>
        <Card title="Samples by POC">
          <HBarChart labels={pocs.map((p) => p[0])} values={pocs.map((p) => p[1])} colors={['var(--ac2)', 'var(--ac)', '#6d28d9', '#5b21b6']} minHeight={180} />
        </Card>
      </div>
      <div className="g1">
        <Card title="All Pending Samples" right={<MonoCount>{sm.length} samples shown</MonoCount>}>
          <Table head={['Ref', 'Date', 'Product', 'Size', 'Qty', 'Client', 'Company', 'POC', 'Type', 'Dispatch']}>
            {rows.length ? rows.map((s, i) => {
              const bauRow = isBau(s);
              return (
                <tr key={i}>
                  <td style={{ fontFamily: 'monospace', color: 'var(--ac2)', fontSize: 11 }}>{s.ref || '—'}</td>
                  <td>{fd(s.date)}</td>
                  <td style={{ color: 'var(--t)', maxWidth: 200, ...ellipsis }}>{s.product || '—'}</td>
                  <td style={{ color: 'var(--m)' }}>{s.grammage || '—'}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--gr)' }}>{s.qty || 1}</td>
                  <td style={{ color: 'var(--t2)' }}>{s.client || '—'}</td>
                  <td style={{ color: 'var(--t2)', maxWidth: 140, ...ellipsis }}>{companyOf(s) || '—'}</td>
                  <td><Badge kind="poc">{s.poc || '—'}</Badge></td>
                  <td><Badge kind={bauRow ? 'inbound' : 'yes'}>{bauRow ? 'BAU' : 'Unique'}</Badge></td>
                  <td style={{ color: 'var(--m)' }}>{s.dispatch || '—'}</td>
                </tr>
              );
            }) : <EmptyRow cols={10}>No pending samples in range</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}

export function PendingSales({ data, filters, loading }) {
  const { from, to } = filters;
  const rows = data.pendingSales.filter((s) => inRange(s.poDate, from, to));
  return (
    <>
      <Tierbar show={loading}>Loading pending sales data…</Tierbar>
      <div className="g1">
        <Card title="Pending Sales Orders" right={<MonoCount>{rows.length} orders</MonoCount>}>
          <Table head={['Ref No.', 'PO Date', 'Order Date', 'POC', 'Client', { label: 'Gross Sales', style: { textAlign: 'right' } }, 'POC Name', 'Contact']}>
            {rows.length ? rows.map((s, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--ac2)', fontSize: 11 }}>{s.ref || '—'}</td>
                <td>{fd(s.poDate)}</td>
                <td>{fd(s.orderDate)}</td>
                <td><Badge kind="poc">{s.poc || '—'}</Badge></td>
                <td style={{ color: 'var(--t)', maxWidth: 200, ...ellipsis }}>{s.client || '—'}</td>
                <td style={{ textAlign: 'right', color: 'var(--gr)', fontFamily: 'monospace' }}>₹{Number(s.gross || 0).toLocaleString()}</td>
                <td style={{ color: 'var(--m)' }}>{s.pocName || '—'}</td>
                <td style={{ color: 'var(--m)', fontFamily: 'monospace' }}>{s.contact || '—'}</td>
              </tr>
            )) : <EmptyRow cols={8}>No sales orders in range</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}
