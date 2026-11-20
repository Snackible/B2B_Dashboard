import { useMemo } from 'react';
import { BarChart, HBarChart } from '../components/charts';
import { Card, Tierbar } from '../components/ui';
import { fmt, pct, pctDec, sumBy, getWeekMonday, weekLabel } from '../lib/util';

export function weeklySales(sales) {
  const byWeek = {};
  sales.forEach((s) => {
    const wk = getWeekMonday(s.date);
    byWeek[wk] = (byWeek[wk] || 0) + s.amt;
  });
  const weeks = Object.keys(byWeek).sort();
  return { labels: weeks.map((w) => weekLabel(w)), values: weeks.map((w) => byWeek[w]) };
}

export function salesByPoc(sales) {
  const m = {};
  sales.forEach((s) => { m[s.poc] = (m[s.poc] || 0) + s.amt; });
  return Object.entries(m).sort((a, b) => b[1] - a[1]);
}

export default function Overview({ view, loading, ready }) {
  const { sales, ads, mlRows } = view;
  const week = useMemo(() => weeklySales(sales), [sales]);
  const pocs = useMemo(() => salesByPoc(sales), [sales]);

  const del = sumBy(mlRows, 'del'), open = sumBy(mlRows, 'open'), click = sumBy(mlRows, 'click');
  const resp = sumBy(mlRows, 'resp'), bounce = sumBy(mlRows, 'bounce');
  const v = (x) => (ready ? x : '—');

  const types = [['Inbound', ads.filter((a) => a.type === 'Inbound').length], ['CCBD', ads.filter((a) => a.type === 'CCBD').length]].filter((e) => e[1] > 0);
  const conv = [
    ['Converted', ads.filter((a) => a.conv === 'Yes').length],
    ['Not Converted', ads.filter((a) => a.conv === 'No').length],
    ['Pending', ads.filter((a) => a.conv === '—').length],
  ].filter((e) => e[1] > 0);

  const funnel = [
    { label: 'Opened', n: open, color: 'var(--ac)', cardColor: 'var(--ac2)' },
    { label: 'Clicked', n: click, color: 'var(--or)', cardColor: 'var(--or)' },
    { label: 'Responded', n: resp, color: 'var(--gr)', cardColor: 'var(--gr)' },
  ];

  return (
    <>
      <Tierbar show={loading}>Loading overview data…</Tierbar>
      <div className="g2">
        <Card title="Email Funnel">
          <div className="fg">
            <div className="fc">
              <div className="fcv" style={{ color: 'var(--bl)' }}>{v(del.toLocaleString())}</div>
              <div className="fcl">Delivered</div>
              <div className="fcr">100%</div>
            </div>
            {funnel.map((f) => (
              <div className="fc" key={f.label}>
                <div className="fcv" style={{ color: f.cardColor }}>{v(f.n)}</div>
                <div className="fcl">{f.label}</div>
                <div className="fcr">{v(pctDec(f.n, del))}</div>
              </div>
            ))}
          </div>
          <div className="frow">
            <span className="flbl">Delivered</span>
            <div className="fwrap"><div className="fbar" style={{ width: '100%', background: 'var(--bl)' }}>{v(del.toLocaleString())}</div></div>
            <span className="fpct">100%</span>
          </div>
          {[...funnel, { label: 'Bounced', n: bounce, color: 'var(--re)' }].map((f) => (
            <div className="frow" key={f.label}>
              <span className="flbl">{f.label}</span>
              <div className="fwrap">
                <div className="fbar" style={{ background: f.color, width: ready ? Math.min(del > 0 ? (f.n / del) * 100 : 0, 100) + '%' : undefined }}>{v(f.n)}</div>
              </div>
              <span className="fpct">{v(pct(f.n, del))}</span>
            </div>
          ))}
        </Card>
        <Card title="Sales by Date (₹)">
          <BarChart labels={week.labels} datasets={[{ label: 'Weekly Sales', data: week.values, color: 'var(--gr)', vf: fmt }]} height={220} money />
        </Card>
      </div>
      <div className="g3">
        <Card title="Ads — Lead Source">
          <HBarChart labels={types.map((t) => t[0])} values={types.map((t) => t[1])} colors={['var(--bl)', 'var(--ac)']} minHeight={160} />
        </Card>
        <Card title="Ads — Conversion">
          <HBarChart labels={conv.map((t) => t[0])} values={conv.map((t) => t[1])} colors={['var(--gr)', 'var(--re)', 'var(--m)']} minHeight={160} />
        </Card>
        <Card title="Sales by POC">
          <HBarChart labels={pocs.map((p) => p[0])} values={pocs.map((p) => p[1])} colors={['var(--ac2)', 'var(--ac)', '#6d28d9', '#5b21b6']} vf={fmt} minHeight={160} />
        </Card>
      </div>
    </>
  );
}
