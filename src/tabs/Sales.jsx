import { useMemo, useState } from 'react';
import { BarChart, HBarChart } from '../components/charts';
import { Badge, Card, Count, EmptyRow, Metric, MetricGrid, Select, Table, Tierbar } from '../components/ui';
import { fd, fmt } from '../lib/util';
import { salesByPoc, weeklySales } from './Overview';

const SORTS = [['date-desc', 'Newest First'], ['amt-desc', 'Amount: High to Low'], ['amt-asc', 'Amount: Low to High']];

export default function Sales({ view, loading }) {
  const { sales } = view;
  const [sort, setSort] = useState('date-desc');
  const week = useMemo(() => weeklySales(sales), [sales]);
  const pocs = useMemo(() => salesByPoc(sales), [sales]);

  const total = sales.reduce((a, s) => a + s.amt, 0);
  const avg = sales.length ? total / sales.length : 0;
  const top = pocs[0];
  const top5 = sales.slice().sort((a, b) => b.amt - a.amt).slice(0, 5);

  const rows = useMemo(() => {
    const r = sales.slice();
    if (sort === 'amt-desc') r.sort((a, b) => b.amt - a.amt);
    else if (sort === 'amt-asc') r.sort((a, b) => a.amt - b.amt);
    else r.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    return r;
  }, [sales, sort]);

  return (
    <>
      <Tierbar show={loading}>Loading sales data…</Tierbar>
      <MetricGrid cols={4}>
        <Metric cls="gn" label="Total Revenue" value={fmt(total)} sub={`${sales.length} orders`} />
        <Metric cls="gn" label="Avg Order Value" value={fmt(avg)} sub="per order" />
        <Metric cls="gn" label="Top POC" value={top ? top[0] : '—'} sub={top ? fmt(top[1]) : ' '} />
        <div className="mc gn">
          <div className="ml">Top 5 Orders</div>
          <div style={{ marginTop: 4, display: 'flex', flexDirection: 'column', gap: 5 }}>
            {top5.length ? top5.map((s, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, alignItems: 'center' }}>
                <span style={{ color: 'var(--t)' }} title={s.client || ''}>
                  {s.client ? s.client.slice(0, 18) + (s.client.length > 18 ? '…' : '') : 'Unknown'}
                </span>
                <span style={{ color: 'var(--gr)', fontFamily: 'monospace', fontWeight: 600 }}>{fmt(s.amt)}</span>
              </div>
            )) : <div style={{ color: 'var(--m2)', fontSize: 11, textAlign: 'center', padding: '10px 0' }}>No orders</div>}
          </div>
        </div>
      </MetricGrid>
      <div className="g2">
        <Card title="Revenue by POC">
          <HBarChart labels={pocs.map((p) => p[0])} values={pocs.map((p) => p[1])} colors={['var(--gr)', '#16a34a', '#15803d', '#166534']} vf={fmt} minHeight={180} />
        </Card>
        <Card title="Daily Revenue">
          <BarChart labels={week.labels} datasets={[{ label: 'Weekly Revenue', data: week.values, color: 'var(--gr)', vf: fmt }]} height={180} money />
        </Card>
      </div>
      <div className="g1">
        <Card
          title={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>All Orders <Count>{sales.length} orders in range</Count></span>}
          right={<Select value={sort} onChange={setSort} options={SORTS} style={{ fontSize: 11, padding: '4px 8px' }} />}
        >
          <Table head={['Ref', 'Date', 'Client', 'POC', 'Type', { label: 'Amount', style: { textAlign: 'right' } }]}>
            {rows.length ? rows.map((s, i) => (
              <tr key={i}>
                <td style={{ fontFamily: 'monospace', color: 'var(--ac2)' }}>{s.ref}</td>
                <td>{fd(s.date)}</td>
                <td style={{ color: 'var(--t)' }}>{s.client}</td>
                <td><Badge kind="poc">{s.poc}</Badge></td>
                <td style={{ color: 'var(--m)' }}>{s.type}</td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: 'var(--gr)', fontWeight: 600 }}>{fmt(s.amt)}</td>
              </tr>
            )) : <EmptyRow cols={6}>No orders in selected range</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}
