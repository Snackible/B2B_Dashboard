export const Metric = ({ cls = '', label, value, sub, valueStyle, style }) => (
  <div className={`mc ${cls}`.trim()} style={style}>
    <div className="ml">{label}</div>
    <div className="mv" style={valueStyle}>{value}</div>
    {sub !== undefined && <div className="ms">{sub}</div>}
  </div>
);

export const MetricGrid = ({ cols, children, style }) => (
  <div className="mg" style={{ gridTemplateColumns: cols ? `repeat(${cols},1fr)` : undefined, ...style }}>{children}</div>
);

export const Card = ({ title, right, children, style }) => (
  <div className="cc" style={style}>
    <div className="ch"><div className="ct">{title}</div>{right}</div>
    {children}
  </div>
);

export const Count = ({ children }) => <span style={{ fontSize: 11, color: 'var(--m)' }}>{children}</span>;
export const MonoCount = ({ children }) => (
  <span style={{ fontSize: 11, color: 'var(--m)', fontFamily: 'monospace' }}>{children}</span>
);

export const Badge = ({ kind = '', children }) => <span className={`badge ${kind}`.trim()}>{children}</span>;

export const Tierbar = ({ show = true, children }) => show && (
  <div className="tierbar"><span className="spin" /><span>{children}</span></div>
);

export const EmptyRow = ({ cols, children }) => (
  <tr><td colSpan={cols} style={{ textAlign: 'center', color: 'var(--m2)', padding: 20 }}>{children}</td></tr>
);

export const Table = ({ head, children, maxHeight }) => {
  const table = (
    <table className="tbl">
      <thead>
        <tr>{head.map((h, i) => (typeof h === 'string' ? <th key={i}>{h}</th> : <th key={i} style={h.style}>{h.label}</th>))}</tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
  return <div className="tbl-wrap" style={maxHeight ? { maxHeight, overflowY: 'auto' } : undefined}>{table}</div>;
};

/** <select className="di"> whose options are [value, label] pairs or plain strings. */
export const Select = ({ value, onChange, options, style }) => (
  <select className="di" value={value} onChange={(e) => onChange(e.target.value)} style={style}>
    {options.map((o) => {
      const [v, l] = Array.isArray(o) ? o : [o, o];
      return <option key={v} value={v}>{l}</option>;
    })}
  </select>
);

export const FilterGroup = ({ children }) => <div className="df" style={{ gap: 6 }}>{children}</div>;
export const FilterLabel = ({ children }) => <span className="fl">{children}</span>;
export const FilterRow = ({ children }) => (
  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
);

export const MONTH_OPTIONS = [
  ['all', 'All Months'], ['01', 'Jan'], ['02', 'Feb'], ['03', 'Mar'], ['04', 'Apr'], ['05', 'May'], ['06', 'Jun'],
  ['07', 'Jul'], ['08', 'Aug'], ['09', 'Sep'], ['10', 'Oct'], ['11', 'Nov'], ['12', 'Dec'],
];

export const yearOptions = (years) => [['all', 'All Years'], ...years.map((y) => [y, y])];

export const SubTabs = ({ tabs, value, onChange }) => (
  <div className="sub-tabs">
    {tabs.map(([id, label]) => (
      <button key={id} className={`qb${value === id ? ' on' : ''}`} onClick={() => onChange(id)}>{label}</button>
    ))}
  </div>
);

export const ThemeToggle = ({ theme, onToggle }) => (
  <button
    className="theme-toggle"
    onClick={onToggle}
    aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
  >
    {theme === 'light' ? (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )}
  </button>
);
