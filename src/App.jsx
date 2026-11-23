import { useEffect, useMemo, useState } from 'react';
import { TooltipProvider } from './components/Tooltip';
import { FlashProvider, useFlashState } from './components/Flash';
import { Metric, MetricGrid, ThemeToggle } from './components/ui';
import { useDashboardData } from './hooks/useDashboardData';
import { deriveView } from './lib/selectors';
import { fmt, pct, pctDec, sumBy, todayStr } from './lib/util';
import Overview from './tabs/Overview';
import Sales from './tabs/Sales';
import Mails from './tabs/Mails';
import { Ads, InMails } from './tabs/AdsInmails';
import Ccbd from './tabs/Ccbd';
import Samples from './tabs/Samples';
import Recurring from './tabs/Recurring';
import Bd from './tabs/Bd';
import Diwali from './tabs/Diwali';
import { PendingSamples, PendingSales } from './tabs/Pending';

const RANGES = [['all', 'All'], ['mtd', 'MTD'], ['30', '30d'], ['7', '7d'], ['today', 'Today']];

function rangeDates(key) {
  const today = todayStr();
  if (key === 'all') return ['', ''];
  if (key === 'today') return [today, today];
  if (key === 'mtd') return [today.slice(0, 8) + '01', today];
  const d = new Date(today);
  d.setUTCDate(d.getUTCDate() - (+key - 1));
  return [d.toISOString().slice(0, 10), today];
}

export default function App() {
  const { data, status, lastUpdated, ready, isLoading, sampleTier } = useDashboardData();
  const [flashMsg, flash] = useFlashState();

  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') === 'light' ? 'light' : 'dark'; } catch (e) { return 'dark'; }
  });
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) { /* ignore */ }
  }, [theme]);
  const toggleTheme = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  const [tab, setTab] = useState('ov');
  const [range, setRange] = useState('all'); // null once a date input is edited by hand
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [mtype, setMtype] = useState('all');
  const [mYear, setMYear] = useState('all');
  const [mMonth, setMMonth] = useState('all');

  const filters = useMemo(() => ({ from, to }), [from, to]);
  const mail = { mtype, setMtype, mYear, setMYear, mMonth, setMMonth };
  const view = useMemo(
    () => deriveView(data, { from, to, mtype, mYear, mMonth }),
    [data, from, to, mtype, mYear, mMonth],
  );

  const pickRange = (key) => { const [f, t] = rangeDates(key); setRange(key); setFrom(f); setTo(t); };
  const editDate = (setter) => (e) => { setRange(null); setter(e.target.value); };

  const { sales, ads, mlRows } = view;
  const del = sumBy(mlRows, 'del'), open = sumBy(mlRows, 'open'), resp = sumBy(mlRows, 'resp');
  const converted = ads.filter((a) => a.conv === 'Yes').length;
  const v = (x) => (ready ? x : '—');

  const tabs = [
    ['ov', 'Overview'], ['sales', 'Sales'], ['mails', 'Mails'], ['ads', 'Ads'], ['inmails', 'InMails'],
    ['ccbd', 'CCBD Leads'], ['samples', 'Sample Data'], ['recurring', 'Recurring Clients'],
    ['bd', 'Active Conversations'], ['diwali', 'Diwali'], ['pend', 'Pending Delivery'], ['pendsales', 'Pending Sales'],
  ];
  const panes = {
    ov: <Overview view={view} loading={isLoading('ov')} ready={ready} />,
    sales: <Sales view={view} loading={isLoading('sales')} />,
    mails: <Mails data={data} view={view} mail={mail} loading={isLoading('mails')} />,
    ads: <Ads view={view} loading={isLoading('ads')} />,
    inmails: <InMails data={data} loading={isLoading('inmails')} />,
    ccbd: <Ccbd data={data} filters={filters} loading={isLoading('ccbd')} />,
    samples: <Samples data={data} filters={filters} tierLabel={sampleTier} />,
    recurring: <Recurring data={data} loading={isLoading('recurring')} />,
    bd: <Bd data={data} filters={filters} loading={isLoading('bd')} />,
    diwali: <Diwali data={data} filters={filters} loading={isLoading('diwali')} />,
    pend: <PendingSamples data={data} filters={filters} loading={isLoading('pend')} />,
    pendsales: <PendingSales data={data} filters={filters} loading={isLoading('pendsales')} />,
  };

  const fi = (sales.length + ads.length) + ' records';

  return (
    <TooltipProvider>
      <FlashProvider value={flash}>
        <div className="bar">
          <div className="logo">SNACKIBLE <em>/ B2B</em></div>
          <div className="bar-right">
            <div className="stl">
              <div className={`dot${status.loading ? ' loading' : ''}`} />
              <span>{flashMsg ?? status.text}</span>
            </div>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>
        <div className="wrap">
          <div className="ph">
            <div>
              <p className="pt">B2B Dashboard <span className="v-badge">v5.0 Live</span></p>
              <p className="ps">Mails · Sales · Ads · InMails · <em>{lastUpdated ? 'Updated ' + lastUpdated.toLocaleTimeString() : '—'}</em></p>
            </div>
            <div className="df">
              <span className="fl">Range</span>
              <input type="date" className="di" value={from} onChange={editDate(setFrom)} />
              <span style={{ color: 'var(--m)', fontSize: 11 }}>→</span>
              <input type="date" className="di" value={to} onChange={editDate(setTo)} />
              {RANGES.map(([key, label]) => (
                <button key={key} className={`qb${range === key ? ' on' : ''}`} onClick={() => pickRange(key)}>{label}</button>
              ))}
              <span style={{ fontSize: 11, color: 'var(--m)', fontFamily: 'monospace' }}>{v(fi)}</span>
            </div>
          </div>

          <MetricGrid>
            <Metric cls="gn" label="Total B2B Sales" value={v(fmt(sales.reduce((a, s) => a + s.amt, 0)))} sub={v(`${sales.length} orders`)} />
            <Metric cls="bl" label="Emails Delivered" value={v(del.toLocaleString())} sub={v(`${pctDec(open, del)} open rate`)} />
            <Metric cls="or" label="Email Responses" value={v(resp)} sub={v(`${pctDec(resp, del)} response rate`)} />
            <Metric cls="ye" label="Ads Leads" value={v(ads.length)} sub={v(`${converted} converted · ${pct(converted, ads.length || 1)}`)} />
            <Metric label="InMails Sent" value={v(data.inmails.length)}
              sub={v(`FM: ${data.inmails.filter((i) => i.ind === 'FM').length} · IT: ${data.inmails.filter((i) => i.ind === 'IT').length}`)} />
          </MetricGrid>

          <div className="tabs-wrap">
            <div className="tabs">
              {tabs.map(([id, label]) => (
                <div key={id} className={`tab${tab === id ? ' on' : ''}`} onClick={() => setTab(id)}
                  style={id === 'diwali' ? { color: tab === id ? undefined : 'var(--or)', fontWeight: 600 } : undefined}>
                  {id === 'diwali' && <span className="tab-dot" />}
                  {label}
                </div>
              ))}
            </div>
          </div>

          {/* Every pane stays mounted (just hidden) so per-tab filters survive tab switches. */}
          {tabs.map(([id]) => (
            <div key={id} className={`tp${tab === id ? ' on' : ''}`}>{panes[id]}</div>
          ))}
        </div>
      </FlashProvider>
    </TooltipProvider>
  );
}
