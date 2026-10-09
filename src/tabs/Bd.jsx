import { useState } from 'react';
import { useFlash } from '../components/Flash';
import {
  Card, EmptyRow, FilterGroup, FilterLabel, FilterRow, Metric, MetricGrid, MonoCount, Select, Table, Tierbar, Badge,
} from '../components/ui';
import { fd, inRange, lsGet, lsSet, pct } from '../lib/util';

const PHASE_COLOR = { Cold: '#3b82f6', Hot: '#f97316', Converted: '#22c55e', Unknown: '#888' };
const PHASES = ['Cold', 'Hot', 'Converted'];
const PHASE_LABEL = { Cold: '❄️ Cold', Hot: '🔥 Hot', Converted: '✅ Converted' };
const mdSlash = (d) => d.slice(5).replace('-', '/');
const leadId = (b) => (b.company + b.name).replace(/\s+/g, '_');

/** Per-lead "converted?" dropdown + done tick, persisted in this browser only. */
function LeadRow({ b }) {
  const flash = useFlash();
  const convKey = 'conv_' + leadId(b), tickKey = 'tick_' + leadId(b);
  const [conv, setConv] = useState(() => lsGet(convKey) || '');
  const [tick, setTick] = useState(() => lsGet(tickKey) === 'true');
  const col = PHASE_COLOR[b.phase] || '#888';
  const save = (key, value) => { lsSet(key, value); flash('selection saved locally'); };

  return (
    <tr>
      <td>{fd(b.date)}</td>
      <td style={{ color: '#fff' }}>{b.company || '—'}</td>
      <td style={{ color: '#ddd' }}>{b.name}</td>
      <td><Badge kind="poc">{b.poc || '—'}</Badge></td>
      <td style={{ color: '#aaa' }}>{b.source.trim() || '—'}</td>
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
        <input type="checkbox" checked={tick} style={{ cursor: 'pointer', width: 16, height: 16, accentColor: '#22c55e' }}
          onChange={(e) => { setTick(e.target.checked); save(tickKey, String(e.target.checked)); }} />
      </td>
      <td style={{ color: '#eab308', fontSize: 11 }}>{b.followup ? '⏰ ' + mdSlash(b.followup) : '—'}</td>
      <td style={{ color: '#aaa', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.remarks}</td>
    </tr>
  );
}

function PipelineCard({ leads }) {
  return leads.length ? leads.map((b, i) => (
    <div key={i} style={{ background: 'var(--s2)', borderRadius: 8, padding: 10, marginBottom: 8 }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 3 }}>{b.company || b.name}</div>
      {b.company && <div style={{ fontSize: 11, color: '#aaa', marginBottom: 3 }}>{b.name}</div>}
      <div style={{ fontSize: 10, color: 'var(--m)', display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
        <span>📅 {mdSlash(b.date)}</span>
        {b.poc && <span>👤 {b.poc}</span>}
        {b.source && <span style={{ background: 'rgba(124,58,237,.15)', color: '#a78bfa', padding: '1px 5px', borderRadius: 3 }}>{b.source.trim()}</span>}
      </div>
      {b.remarks && (
        <div style={{ fontSize: 10, color: '#aaa', marginTop: 5, paddingTop: 5, borderTop: '1px solid rgba(255,255,255,.05)' }}>
          {b.remarks.slice(0, 60) + (b.remarks.length > 60 ? '…' : '')}
        </div>
      )}
      {b.followup && <div style={{ fontSize: 10, color: '#eab308', marginTop: 3 }}>⏰ Follow-up: {mdSlash(b.followup)}</div>}
    </div>
  )) : <div style={{ color: 'var(--m)', fontSize: 12, textAlign: 'center', padding: 16 }}>No leads</div>;
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
            <Card key={ph} style={{ borderTop: `2px solid ${col}` }} title={PHASE_LABEL[ph]}
              right={<span style={{ background: col + '22', color: col, padding: '2px 8px', borderRadius: 10, fontSize: 11, fontWeight: 600 }}>{leads.length}</span>}>
              <PipelineCard leads={leads} />
            </Card>
          );
        })}
      </div>
      <div className="g1">
        <Card title="All Conversations">
          <Table head={['Date', 'Company', 'Contact', 'POC', 'Source', 'Phase', { label: 'Converted?', style: { width: 100 } }, { label: '✔', style: { width: 40, textAlign: 'center' } }, 'Follow-up', 'Remarks']}>
            {bd.length ? bd.map((b, i) => <LeadRow key={`${leadId(b)}-${i}`} b={b} />) : <EmptyRow cols={10}>No leads found</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}
