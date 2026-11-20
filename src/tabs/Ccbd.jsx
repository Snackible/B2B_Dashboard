import { useMemo, useState } from 'react';
import { BarChart, HBarChart } from '../components/charts';
import {
  Badge, Card, Count, EmptyRow, FilterGroup, FilterLabel, FilterRow, Metric, MetricGrid, MonoCount, Select, SubTabs, Table, Tierbar,
} from '../components/ui';
import { countBy, fd, inRange, pct } from '../lib/util';

const dateSeries = (rows) => {
  const m = {};
  rows.forEach((r) => { if (r.date) m[r.date] = (m[r.date] || 0) + 1; });
  const dates = Object.keys(m).sort();
  return { labels: dates.map(fd), values: dates.map((d) => m[d]) };
};

function Inbound({ data, from, to }) {
  const [urgency, setUrgency] = useState('all');
  const [poc, setPoc] = useState('all');
  const pocs = useMemo(() => [...new Set(data.ccbd.map((r) => r.poc).filter(Boolean))], [data.ccbd]);

  const rows = data.ccbd.filter((r) => {
    if (!inRange(r.date, from, to)) return false;
    const urgent = r.urgency.toLowerCase() === 'urgent';
    if (urgency === 'urgent' && !urgent) return false;
    if (urgency === 'non-urgent' && urgent) return false;
    return poc === 'all' || r.poc === poc;
  });
  const urgent = rows.filter((r) => r.urgency.toLowerCase() === 'urgent').length;
  const converted = rows.filter((r) => { const c = r.conversion.toLowerCase(); return c === 'yes' || c === 'converted'; }).length;
  const cities = countBy(rows, (r) => r.city);
  const topCity = cities[0];
  const byDate = dateSeries(rows);
  const top8 = cities.slice(0, 8);

  return (
    <>
      <MetricGrid cols={4}>
        <Metric cls="bl" label="Total B2B Leads" value={rows.length} sub={`${rows.length} leads in range`} />
        <Metric cls="or" label="Urgent" value={urgent} sub={`${pct(urgent, rows.length)} of leads`} />
        <Metric cls="gn" label="Converted" value={converted} sub={`${pct(converted, rows.length)} conv rate`} />
        <Metric cls="ye" label="Top City" value={topCity ? topCity[0].slice(0, 18) : '—'} valueStyle={{ fontSize: 14 }} sub={topCity ? `${topCity[1]} leads` : '—'} />
      </MetricGrid>
      <FilterRow>
        <FilterGroup>
          <FilterLabel>Urgency</FilterLabel>
          <Select value={urgency} onChange={setUrgency} options={[['all', 'All'], ['urgent', 'Urgent'], ['non-urgent', 'Non-Urgent']]} />
          <FilterLabel>POC</FilterLabel>
          <Select value={poc} onChange={setPoc} options={[['all', 'All POCs'], ...pocs]} />
        </FilterGroup>
        <MonoCount>{rows.length} leads shown</MonoCount>
      </FilterRow>
      <div className="g2">
        <Card title="Leads by Date">
          <BarChart labels={byDate.labels} datasets={[{ label: 'Leads', data: byDate.values, color: 'var(--bl)', vf: (v) => v }]} height={180} />
        </Card>
        <Card title="Leads by City">
          <HBarChart
            labels={top8.map((c) => c[0].slice(0, 20))} values={top8.map((c) => c[1])}
            colors={['var(--bl)', '#6d28d9', '#5b21b6', '#4c1d95', '#1d4ed8', '#1e40af', '#1e3a8a', '#0ea5e9']} minHeight={180}
          />
        </Card>
      </div>
      <div className="g1">
        <Card title="All B2B Inbound Leads" right={<Count>{rows.length} leads</Count>}>
          <Table maxHeight={600} head={['#', 'Date', 'Name', 'Phone', 'City', 'Remarks', 'Urgency', 'Conversion', 'POC']}>
            {rows.length ? rows.map((r, i) => {
              const cl = r.conversion.toLowerCase();
              return (
                <tr key={i}>
                  <td style={{ color: 'var(--m)' }}>{r.sr}</td>
                  <td>{fd(r.date)}</td>
                  <td style={{ color: 'var(--t)' }}>{r.name}</td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--ac2)' }}>{r.phone}</td>
                  <td>{r.city}</td>
                  <td title={r.remarks} style={{ color: 'var(--m)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.remarks}</td>
                  <td>{r.urgency.toLowerCase() === 'urgent' ? <Badge kind="urgent">Urgent</Badge> : <Badge kind="cold">{r.urgency || '—'}</Badge>}</td>
                  <td>
                    {cl === 'yes' || cl === 'converted' ? <Badge kind="yes">Yes</Badge>
                      : cl === 'no' ? <Badge kind="no">No</Badge>
                        : <span style={{ color: 'var(--m)' }}>{r.conversion || '—'}</span>}
                  </td>
                  <td>{r.poc ? <Badge kind="poc">{r.poc}</Badge> : '—'}</td>
                </tr>
              );
            }) : <EmptyRow cols={9}>No B2B inbound leads in range</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}

function Festive({ data, from, to }) {
  const fest = data.ccbdFestive.filter((r) => inRange(r.date, from, to));
  const platforms = countBy(fest, (r) => r.platform);
  const pocs = countBy(fest, (r) => r.poc.trim());
  const suitable = fest.filter((r) => { const q = (r.quality || '').toLowerCase().trim(); return q && q !== 'not suitable'; }).length;
  const byDate = dateSeries(fest);
  return (
    <>
      <MetricGrid cols={4}>
        <Metric cls="bl" label="Total Festive Leads" value={fest.length} sub="festive campaign" />
        <Metric cls="or" label="Top Platform" value={platforms[0] ? platforms[0][0] : '—'} valueStyle={{ fontSize: 14 }} sub={platforms[0] ? `${platforms[0][1]} leads` : '—'} />
        <Metric cls="ye" label="Quality Breakdown" value={`${suitable} / ${fest.length}`} valueStyle={{ fontSize: 18 }} sub="suitable vs not suitable" />
        <Metric cls="gn" label="Top POC" value={pocs[0] ? pocs[0][0] : '—'} valueStyle={{ fontSize: 14 }} sub={pocs[0] ? `${pocs[0][1]} leads` : '—'} />
      </MetricGrid>
      <div className="g2">
        <Card title="Festive Leads by Date">
          <BarChart labels={byDate.labels} datasets={[{ label: 'Leads', data: byDate.values, color: 'var(--or)', vf: (v) => v }]} height={180} />
        </Card>
        <Card title="Leads by Platform">
          <HBarChart labels={platforms.map((p) => p[0])} values={platforms.map((p) => p[1])} colors={['var(--or)', 'var(--bl)', 'var(--ac)', 'var(--gr)', 'var(--ye)']} minHeight={180} />
        </Card>
      </div>
    </>
  );
}

export default function Ccbd({ data, filters, loading }) {
  const [sub, setSub] = useState('inbound');
  return (
    <>
      <Tierbar show={loading}>Loading CCBD leads…</Tierbar>
      <SubTabs tabs={[['inbound', '📞 Inbound Leads'], ['festive', '🎉 Festive Leads']]} value={sub} onChange={setSub} />
      {sub === 'inbound' ? <Inbound data={data} {...filters} /> : <Festive data={data} {...filters} />}
    </>
  );
}
