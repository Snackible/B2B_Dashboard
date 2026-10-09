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
  <tr><td colSpan={cols} style={{ textAlign: 'center', color: '#555', padding: 20 }}>{children}</td></tr>
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
  return maxHeight ? <div style={{ maxHeight, overflowY: 'auto' }}>{table}</div> : table;
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
