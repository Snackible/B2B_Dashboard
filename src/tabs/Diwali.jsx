import { useState } from 'react';
import { HBarChart } from '../components/charts';
import { Badge, Card, EmptyRow, Metric, MetricGrid, SubTabs, Table, Tierbar } from '../components/ui';
import { coldCallStats } from '../lib/parsers';
import { inRange, pct } from '../lib/util';

const BAR_COLORS = ['var(--or)', 'var(--bl)', 'var(--ac)', 'var(--gr)', 'var(--ye)'];

function Overview({ data, from, to }) {
  const { linkedin, coldCalls, targets, email } = data.diwali;

  // With a date filter active, derive industry totals from Master_Log; otherwise use the Email Tracker totals.
  const filtered = (() => {
    const m = {};
    data.mlIndDate.forEach((r) => {
      if (!r.ind.toLowerCase().includes('diwali') || !inRange(r.date, from, to)) return;
      const e = (m[r.ind] ||= { industry: r.ind, totalSent: 0, opened: 0, clicked: 0, responses: 0 });
      e.totalSent += r.del; e.opened += r.open; e.clicked += r.click; e.responses += r.resp;
    });
    return Object.values(m).filter((x) => x.totalSent > 0);
  })();
  const source = from || to ? filtered : email;
  const sorted = source.slice().sort((a, b) => b.totalSent - a.totalSent);
  const sent = source.reduce((a, m) => a + m.totalSent, 0);
  const resp = email.reduce((a, m) => a + m.responses, 0); // responses always come from the tracker
  const maxV = sorted.length ? sorted[0].totalSent : 1;
  const liSent = linkedin.filter((l) => l.sent).length;
  const ccDone = coldCallStats(coldCalls).done;
  const tgtWithPoc = targets ? targets.filter((t) => t.hasPoc).length : 0;
  const dash = (v) => v > 0 ? v.toLocaleString() : '—';

  return (
    <>
      <MetricGrid cols={5}>
        <Metric cls="bl" label="Emails Sent" value={sent.toLocaleString()} sub="Diwali Campaign" />
        <Metric cls="gn" label="Responses" value={resp.toLocaleString()} sub={`${pct(resp, sent)} avg response`} />
        <Metric cls="or" label="LinkedIn Leads" value={linkedin.length} sub={`${liSent} InMails sent`} />
        <Metric cls="ye" label="Cold Calls" value={coldCalls.length} sub={`${ccDone} connects`} />
        <Metric cls="pu" label="Sample Targets" value={targets ? targets.length : '—'}
          sub={targets ? `${tgtWithPoc} POCs found (${pct(tgtWithPoc, targets.length || 1)})` : '—'} />
      </MetricGrid>
      <div className="g2">
        <Card title="Email Volume by Industry">
          {sorted.length ? sorted.slice(0, 5).map((m, i) => (
            <div className="frow" key={m.industry}>
              <span className="flbl" style={{ width: 170, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.industry}</span>
              <div className="fwrap">
                <div className="fbar" style={{ width: Math.max((m.totalSent / maxV) * 100, 2) + '%', background: BAR_COLORS[i % BAR_COLORS.length] }}>{m.totalSent.toLocaleString()}</div>
              </div>
            </div>
          )) : <div style={{ color: 'var(--m2)', fontSize: 11, textAlign: 'center', padding: 20 }}>No data</div>}
        </Card>
        <Card title="Cold Call Outcomes (Jun 8)"><div /></Card>
      </div>
      <div className="g1">
        <Card title="Diwali Email Tracker">
          <Table head={['Industry', 'Delivered', 'Opened', 'Clicked', 'Responses', 'Rate']}>
            {sorted.length ? sorted.map((m) => (
              <tr key={m.industry}>
                <td style={{ color: 'var(--t)', fontWeight: 600 }}>{m.industry}</td>
                <td>{m.totalSent.toLocaleString()}</td>
                <td>{dash(m.opened || 0)}</td>
                <td>{dash(m.clicked || 0)}</td>
                <td>{dash(m.responses || 0)}</td>
                <td><Badge kind="warm">{pct(m.responses || 0, m.totalSent)}</Badge></td>
              </tr>
            )) : <EmptyRow cols={6}>No Diwali Email Tracker data found</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}

function LinkedInCalls({ data }) {
  const { linkedin, coldCalls } = data.diwali;
  const liSent = linkedin.filter((l) => l.sent).length;
  const cc = coldCallStats(coldCalls);
  return (
    <>
      <MetricGrid cols={3} style={{ marginBottom: 14 }}>
        <Metric cls="bl" label="Total Leads" value={linkedin.length} sub="LinkedIn mapped" />
        <Metric cls="gn" label="InMails Sent" value={liSent} sub={`${pct(liSent, linkedin.length)} coverage`} />
        <Metric cls="or" label="Pending" value={linkedin.length - liSent} sub="to be sent" />
      </MetricGrid>
      <MetricGrid cols={4}>
        <Metric cls="bl" label="Total Calls (Jun 8)" value={coldCalls.length} sub="Vanshika & Mahi" />
        <Metric cls="gn" label="Positive Outcomes" value={cc.pos} sub="catalogue / connects" />
        <Metric cls="re" label="Not Interested" value={cc.no} sub={`${cc.noPct} rejection rate`} />
        <Metric cls="or" label="Follow-Up Needed" value={cc.fu} sub="not picked up" />
      </MetricGrid>
      <div className="g2">
        <Card title="LinkedIn Leads Pipeline">
          <Table maxHeight={500} head={['Name', 'Company', 'Position', 'InMail']}>
            {linkedin.length ? linkedin.map((l, i) => (
              <tr key={i}>
                <td style={{ color: 'var(--t)' }}>{l.name}</td>
                <td style={{ color: 'var(--ac2)' }}>{l.company}</td>
                <td>{l.position}</td>
                <td><Badge kind={l.sent ? 'yes' : 'cold'}>{l.sent ? 'Sent' : 'Pending'}</Badge></td>
              </tr>
            )) : <EmptyRow cols={4}>No LinkedIn data</EmptyRow>}
          </Table>
        </Card>
        <Card title="Cold Call Log (June 8)">
          <Table maxHeight={500} head={['Company', 'Called By', 'Follow Up', 'Status']}>
            {coldCalls.length ? coldCalls.map((c, i) => {
              const s = c.status.toLowerCase();
              const kind = s.includes('interested') && !s.includes('not') ? 'yes' : s.includes('not') ? 'no' : 'cold';
              return (
                <tr key={i}>
                  <td style={{ color: 'var(--t)' }}>{c.company}</td>
                  <td>{c.calledBy}</td>
                  <td>{c.followUp}</td>
                  <td><Badge kind={kind}>{c.status}</Badge></td>
                </tr>
              );
            }) : <EmptyRow cols={4}>No call data</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}

function Targets({ data }) {
  const { targets, tabKeys } = data.diwali;
  const list = targets || [];
  const withPoc = list.filter((t) => t.hasPoc).length;
  const withNum = list.filter((t) => t.hasContact).length;
  const ind = {};
  list.forEach((t) => { ind[t.chartIndustry] = (ind[t.chartIndustry] || 0) + 1; });
  const indEntries = Object.entries(ind).sort((a, b) => b[1] - a[1]);
  const denom = list.length || 1;

  return (
    <>
      <MetricGrid cols={4} style={{ marginBottom: 14 }}>
        <Metric cls="or" label="Total Target Companies" value={targets ? list.length : '—'} sub="Across industries" />
        <Metric cls="gn" label="POC Identified" value={targets ? withPoc : '—'} sub={targets ? `${pct(withPoc, denom)} coverage` : '—'} />
        <Metric cls="bl" label="Contact Number Available" value={targets ? withNum : '—'} sub={targets ? `${pct(withNum, denom)} dialable` : '—'} />
        <Metric cls="re" label="No POC Yet" value={targets ? list.length - withPoc : '—'} sub="Need sourcing" />
      </MetricGrid>
      <div className="g1">
        <Card title="Industry Distribution" right={<span style={{ fontSize: 11, color: 'var(--or)', background: 'rgba(249,115,22,0.1)', padding: '2px 8px', borderRadius: 10 }}>2026 Triggers mapped</span>}>
          <HBarChart labels={indEntries.map((e) => e[0])} values={indEntries.map((e) => e[1])} colors={['var(--m2)', 'var(--bl)', 'var(--or)', 'var(--gr)', 'var(--ac)', '#0ea5e9']} minHeight={180} />
        </Card>
      </div>
      <div className="g1">
        <Card title="Sample Box Targets — Full Pipeline (Top Tier)">
          <Table maxHeight={600} head={['#', 'Company', 'Industry', '2026 Trigger', 'POC', 'Contact', 'POC Status']}>
            {targets === null
              ? <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--re)', padding: 20 }}>Data empty! API only sent these tabs: {tabKeys.join(', ') || 'None'}</td></tr>
              : list.length ? list.map((t, i) => {
                const status = t.hasPoc && t.hasContact ? 'Identified' : t.hasPoc ? 'No number' : 'No POC';
                const kind = t.hasPoc && t.hasContact ? 'yes' : t.hasPoc ? 'warm' : 'no';
                return (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    <td style={{ color: 'var(--t)' }}>{t.company}</td>
                    <td>{t.industry}</td>
                    <td>{t.trigger}</td>
                    <td style={{ color: 'var(--ac2)' }}>{t.poc}</td>
                    <td>{t.contact}</td>
                    <td><Badge kind={kind}>{status}</Badge></td>
                  </tr>
                );
              }) : <EmptyRow cols={7}>Headers found, but no rows below them!</EmptyRow>}
          </Table>
        </Card>
      </div>
    </>
  );
}

export default function Diwali({ data, filters, loading }) {
  const [sub, setSub] = useState('ov');
  return (
    <>
      <Tierbar show={loading}>Loading Diwali campaign data…</Tierbar>
      <SubTabs tabs={[['ov', 'Overview & Emails'], ['li', 'LinkedIn & Cold Calls'], ['tgt', 'Sample Targets (105)']]} value={sub} onChange={setSub} />
      {sub === 'ov' && <Overview data={data} {...filters} />}
      {sub === 'li' && <LinkedInCalls data={data} />}
      {sub === 'tgt' && <Targets data={data} />}
    </>
  );
}
