import { Badge, Card, Count, Metric, MetricGrid, Table, Tierbar } from '../components/ui';
import { fmt } from '../lib/util';

const revenueOf = (r) => parseFloat(String(r.revenue).replace(/[₹,]/g, '')) || 0;

export default function Recurring({ data, loading }) {
  const rows = data.recurring;
  const byPoc = {};
  let total = 0;
  rows.forEach((r) => {
    const rev = revenueOf(r);
    total += rev;
    if (r.poc) byPoc[r.poc] = (byPoc[r.poc] || 0) + rev;
  });
  const topPoc = Object.keys(byPoc).sort((a, b) => byPoc[b] - byPoc[a])[0] || '—';

  return (
    <>
      <Tierbar show={loading}>Loading recurring clients…</Tierbar>
      <MetricGrid cols={3}>
        <Metric cls="gn" label="Total Recurring" value={rows.length} sub="clients" />
        <Metric cls="gn" label="Total Revenue" value={total > 0 ? fmt(total) : '—'} sub="from recurring" />
        <Metric cls="gn" label="Top POC" value={topPoc} sub={byPoc[topPoc] ? fmt(byPoc[topPoc]) : '—'} />
      </MetricGrid>
      <div className="g1">
        <Card title="Recurring Clients" right={<Count>{rows.length} clients</Count>}>
          <Table head={['Client Name', 'POC', 'Phone', 'Location', { label: 'Total Orders', style: { textAlign: 'center' } }, 'Order History', { label: 'Revenue', style: { textAlign: 'right' } }]}>
            {rows.length ? rows.map((r, i) => {
              const rev = revenueOf(r);
              return (
                <tr key={i}>
                  <td>{r.client}</td>
                  <td><Badge kind="poc">{r.poc}</Badge></td>
                  <td>{r.phone}</td>
                  <td>{r.location}</td>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{r.orders}</td>
                  <td style={{ fontFamily: 'monospace', color: '#a78bfa', fontSize: 11 }}>{r.dates}</td>
                  <td style={{ textAlign: 'right', color: 'var(--gr)', fontFamily: 'monospace' }}>{rev ? fmt(rev) : '—'}</td>
                </tr>
              );
            }) : <tr><td colSpan={7} className="nd">No recurring clients found</td></tr>}
          </Table>
        </Card>
      </div>
    </>
  );
}
