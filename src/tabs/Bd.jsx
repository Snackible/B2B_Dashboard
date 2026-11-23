import { useState } from 'react';
import { useFlash } from '../components/Flash';
import {
  Card, EmptyRow, FilterGroup, FilterLabel, FilterRow, Metric, MetricGrid, MonoCount, Select, Table, Tierbar, Badge,
} from '../components/ui';
import { fd, inRange, lsGet, lsSet, pct } from '../lib/util';

const PHASE_COLOR = { Cold: 'var(--bl)', Hot: 'var(--or)', Converted: 'var(--gr)', Unknown: 'var(--m)' };
const PHASES = ['Cold', 'Hot', 'Converted'];
const mdSlash = (d) => d.slice(5).replace('-', '/');
const leadId = (b) => (b.company + b.name).replace(/\s+/g, '_');

/** Small colored dot in place of an emoji, for phase/column headers. */
const Dot = ({ color }) => (
  <span style={{
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: color, marginRight: 7, flexShrink: 0,
  }} />
);

/** Per-lead "converted?" dropdown + done tick, persisted in this browser only. */
function LeadRow({ b }) {
  const flash = useFlash();
  const convKey = 'conv_' + leadId(b), tickKey = 'tick_' + leadId(b);
  const [conv, setConv] = useState(() => lsGet(convKey) || '');
  const [tick, setTick] = useState(() => lsGet(tickKey) === 'true');
  const col = PHASE_COLOR[b.phase] || 'var(--m)';
  const save = (key, value) => { lsSet(key, value); flash('selection saved locally'); };

  return (
    <tr>
      <td>{fd(b.date)}</td>
      <td style={{ color: 'var(--t)' }}>{b.company || '—'}</td>
      <td style={{ color: 'var(--t2)' }}>{b.name}</td>
      <td><Badge kind="poc">{b.poc || '—'}</Badge></td>
      <td style={{ color: 'var(--m)' }}>{b.source.trim() || '—'}</td>
      <td>
        <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 600, background: col + '22', color: col }}>{b.phase}</span>
      </td>
      <td>
        <select className="di" value={conv} style={{ fontSize: 10, padding: '2px 4px', height: 22, width: 70, background: 'var(--s2)', borderColor: 'var(--b)' }}
          onChange={(e) => { setConv(e.target.value); save(convKey, e.target.value); }}>
          <option value="">—</option><option value="Yes">Yes</option><option value="No">No</option>
        </select>
      </td>
      <td style={{ textAlign: 'center' }}>
        <input type="checkbox" checked={tick} style={{ cursor: 'pointer', width: 16, height: 16, accentColor: 'var(--gr)' }}
          onChange={(e) => { setTick(e.target.checked); save(tickKey, String(e.target.checked)); }} />
      </td>
      <td style={{ color: 'var(--ye)', fontSize: 11 }}>{b.followup ? mdSlash(b.followup) : '—'}</td>
      <td style={{ color: 'var(--m)', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.remarks}</td>
    </tr>
  );
}

function PipelineCard({ leads }) {
  if (!leads.length) return <div className="nd">No leads</div>;
  return (
    <div className="leadcol">
      <div className="lead-stack">
        {leads.map((b, i) => (
          <div key={i} className="lead-card">
            <div className="lead-top">
              <span className="lead-name">{b.company || b.name}</span>
              {b.followup && <span className="lead-followup">Follow-up {mdSlash(b.followup)}</span>}
            </div>
            {b.company && <div className="lead-contact">{b.name}</div>}
            <div className="lead-meta">
              <span>{mdSlash(b.date)}</span>
              {b.poc && <><span className="sep">·</span><span>{b.poc}</span></>}
              {b.source && <span className="lead-chip">{b.source.trim()}</span>}
            </div>
            {b.remarks && <div className="lead-remarks">{b.remarks}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Bd({ data, filters, loading }) {
  const { from, to } = filters;
  const [phase, setPhase] = useState('all');
  const [source, setSource] = useState('all');
  const [poc, setPoc] = useState('all');

  const bd = data.bd.filter((b) => inRange(b.date, from, to)
    && (phase === 'all' || b.phase === phase)
    && (source === 'all' || b.source.trim() === source)
    && (poc === 'all' || b.poc === poc));
  const n = (ph) => bd.filter((b) => b.phase === ph).length;

  return (
    <>
      <Tierbar show={loading}>Loading conversations data…</Tierbar>
      <MetricGrid cols={4}>
        <Metric cls="ye" label="Total Leads" value={bd.length} sub={`${bd.length} leads in range`} />
        <Metric cls="re" label="Cold" value={n('Cold')} sub={`${pct(n('Cold'), bd.length || 1)} of leads`} />
        <Metric cls="or" label="Hot" value={n('Hot')} sub={`${pct(n('Hot'), bd.length || 1)} of leads`} />
        <Metric cls="gn" label="Converted" value={n('Converted')} sub={`${pct(n('Converted'), bd.length || 1)} conv rate`} />
      </MetricGrid>
      <FilterRow>
        <FilterGroup>
          <FilterLabel>Phase</FilterLabel>
          <Select value={phase} onChange={setPhase} options={[['all', 'All Phases'], ...PHASES]} />
          <FilterLabel>Source</FilterLabel>
          <Select value={source} onChange={setSource} options={[['all', 'All Sources'], 'Shopify', 'CC BD', 'Email']} />
          <FilterLabel>POC</FilterLabel>
          <Select value={poc} onChange={setPoc} options={[['all', 'All POCs'], 'Siya', 'Manjari']} />
        </FilterGroup>
        <MonoCount>{bd.length} leads shown</MonoCount>
      </FilterRow>
      <div className="g3" style={{ marginBottom: 14 }}>
        {PHASES.map((ph) => {
          const leads = bd.filter((b) => b.phase === ph), col = PHASE_COLOR[ph];
          return (
            <Card key={ph} style={{ borderTop: `2px solid ${col}` }} title={<><Dot color={col} />{ph}</>}
              right={<span style={{ background: col + '22', color: col, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{leads.length}</span>}>
              <PipelineCard leads={leads} />
            </Card>
          );
        })}
      </div>
      <div className="g1">
        <Card title="All Conversations">
          <Table head={['Date', 'Company', 'Contact', 'POC', 'Source', 'Phase', { label: 'Converted?', style: { width: 100 } }, { label: 'Done', style: { width: 40, textAlign: 'center' } }, 'Follow-up', 'Remarks']}>
            {bd.length ? bd.map((b, i) => <LeadRow key={`${leadId(b)}-${i}`} b={b} />) : <EmptyRow cols={10}>No leads found</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}
