import { Badge, Card, Count, EmptyRow, Metric, MetricGrid, Table, Tierbar } from '../components/ui';
import { fd, fmt, pct } from '../lib/util';

export function Ads({ view, loading }) {
  const { ads } = view;
  const total = ads.length;
  const inbound = ads.filter((a) => a.type === 'Inbound').length;
  const ccbd = ads.filter((a) => a.type === 'CCBD').length;
  const conv = ads.filter((a) => a.conv === 'Yes').length;
  return (
    <>
      <Tierbar show={loading}>Loading ads data…</Tierbar>
      <MetricGrid cols={4}>
        <Metric cls="ye" label="Total Leads" value={total} sub="from ads" />
        <Metric cls="ye" label="Inbound" value={inbound} sub={`${pct(inbound, total || 1)} of leads`} />
        <Metric cls="ye" label="CCBD" value={ccbd} sub={`${pct(ccbd, total || 1)} of leads`} />
        <Metric cls="gn" label="Converted" value={conv} sub={`${pct(conv, total || 1)} conv rate`} />
      </MetricGrid>
      <div className="g1">
        <Card title="All Leads" right={<Count>{total} leads in range</Count>}>
          <Table head={['Date', 'Client', 'Source', 'POC', 'Lead Type', 'Converted', { label: 'Order Value', style: { textAlign: 'right' } }]}>
            {ads.length ? ads.map((a, i) => (
              <tr key={i}>
                <td>{fd(a.date)}</td>
                <td style={{ color: '#fff' }}>{a.client}</td>
                <td><Badge kind={a.type.toLowerCase()}>{a.type}</Badge></td>
                <td><Badge kind="poc">{a.poc}</Badge></td>
                <td><Badge kind={a.lead.toLowerCase()}>{a.lead}</Badge></td>
                <td><Badge kind={a.conv === 'Yes' ? 'yes' : a.conv === 'No' ? 'no' : ''}>{a.conv || '—'}</Badge></td>
                <td style={{ textAlign: 'right', fontFamily: 'monospace', color: '#22c55e' }}>{a.val ? fmt(a.val) : '—'}</td>
              </tr>
            )) : <EmptyRow cols={7}>No leads in selected range</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}

export function InMails({ data, loading }) {
  const rows = data.inmails;
  return (
    <>
      <Tierbar show={loading}>Loading InMails data…</Tierbar>
      <MetricGrid cols={3}>
        <Metric cls="bl" label="Total Contacts" value={rows.length} sub="LinkedIn InMails" />
        <Metric cls="bl" label="Facility Mgmt" value={rows.filter((i) => i.ind === 'FM').length} sub="FM industry" />
        <Metric cls="bl" label="IT Industry" value={rows.filter((i) => i.ind === 'IT').length} sub="IT sector" />
      </MetricGrid>
      <div className="g1">
        <Card title="InMail Contact List">
          <Table head={['#', 'Industry', 'Company', 'Role', 'Contact']}>
            {rows.length ? rows.map((m) => (
              <tr key={m.n}>
                <td style={{ color: '#888' }}>{m.n}</td>
                <td><Badge kind={m.ind === 'FM' ? 'inbound' : 'ccbd'}>{m.ind}</Badge></td>
                <td style={{ color: '#fff' }}>{m.company}</td>
                <td style={{ color: '#aaa' }}>{m.role}</td>
                <td style={{ color: '#a78bfa' }}>{m.poc}</td>
              </tr>
            )) : <EmptyRow cols={5}>No InMail data found in sheet</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}
