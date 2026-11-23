import { useLayoutEffect, useRef, useState } from 'react';
import { fmt } from '../lib/util';
import { useTooltip } from './Tooltip';

function useWidth(fallback) {
  const ref = useRef(null);
  const [w, setW] = useState(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setW(el.getBoundingClientRect().width);
    const ro = new ResizeObserver(([entry]) => setW(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w || fallback];
}

const NoData = ({ children }) => (
  <p style={{ color: 'var(--m2)', padding: 20, fontSize: 12, textAlign: 'center' }}>{children}</p>
);

/**
 * Grouped vertical bars.
 * datasets: [{ label, data[], color, vf?(value, i), yf?(value) }]
 */
export function BarChart({ labels, datasets, height = 200, money = false }) {
  const [ref, W] = useWidth(680);
  const { show, hide } = useTooltip();
  if (!labels || !labels.length) {
    return <div className="cw" ref={ref} style={{ minHeight: height }}><NoData>No data in selected range</NoData></div>;
  }

  // Rotated (-45deg) labels extend diagonally *below* their tick, not above
  // it — a long label needs real room reserved in the bottom margin or its
  // tail spills out past the card. Size that margin off the longest label
  // instead of a fixed guess, and grow the chart to fit it rather than
  // shrinking the plot area.
  const CHAR_W = 5.4;
  const maxLabelLen = labels.reduce((m, l) => Math.max(m, String(l).length), 0);
  const labelTail = Math.ceil(maxLabelLen * CHAR_W * Math.SQRT1_2);
  const P = { t: 8, r: 10, b: Math.min(100, Math.max(40, labelTail + 22)), l: 55 };
  const cH = height - P.t;
  const totalHeight = P.t + cH + P.b;
  const wrap = (children) => <div className="cw" ref={ref} style={{ minHeight: totalHeight }}>{children}</div>;
  const cW = W - P.l - P.r;
  const maxV = Math.max(1, ...datasets.flatMap((d) => d.data));
  const bW = Math.min(((cW / labels.length) * 0.8) / datasets.length, 34);
  const axisFmt = (n) => {
    if (n === 0) return '0';
    if (money) return fmt(n);
    return n >= 1000 ? (n / 1000).toFixed(1) + 'K' : Math.round(n);
  };

  // Past ~18 bars every x label piles into a knot, so only show every Nth.
  const labelStep = Math.max(1, Math.ceil(labels.length / 18));

  return wrap(
    <svg width={W} height={totalHeight} style={{ overflow: 'visible' }}>
      {[0, 1, 2, 3, 4].map((i) => {
        const y = P.t + cH - (i / 4) * cH, v = (maxV * i) / 4;
        return (
          <g key={i}>
            <line x1={P.l} y1={y | 0} x2={P.l + cW} y2={y | 0} stroke="var(--b2)" strokeWidth="1" />
            <text x={P.l - 4} y={(y + 4) | 0} textAnchor="end" fill="var(--m2)" fontSize="9" fontFamily="system-ui">
              {datasets[0]?.yf ? datasets[0].yf(v) : axisFmt(v)}
            </text>
          </g>
        );
      })}
      {datasets.map((d, di) => labels.map((lbl, i) => {
        const v = d.data[i] || 0, bH = Math.max((v / maxV) * cH, 0);
        if (bH <= 0) return null;
        const x = P.l + i * (cW / labels.length) + (cW / labels.length - datasets.length * bW) / 2 + di * bW;
        const tv = d.vf ? d.vf(v, i) : axisFmt(v);
        return (
          <rect key={`${di}-${i}`} x={x} y={P.t + cH - bH} width={bW} height={bH} fill={d.color} rx="3" opacity=".88"
            style={{ cursor: 'pointer' }}
            onMouseEnter={(e) => show(e, <><b>{lbl}</b><br />{d.label || ''}: {tv}</>)} onMouseLeave={hide} />
        );
      }))}
      {labels.map((lbl, i) => {
        if (i % labelStep !== 0 && i !== labels.length - 1) return null;
        const x = (P.l + i * (cW / labels.length) + cW / labels.length / 2) | 0, ty = P.t + cH + 13;
        return (
          <text key={i} x={x} y={ty} textAnchor="end" fill="var(--m)" fontSize="9" fontFamily="system-ui" transform={`rotate(-45,${x},${ty})`}>{lbl}</text>
        );
      })}
      <line x1={P.l} y1={P.t} x2={P.l} y2={P.t + cH} stroke="var(--m2)" strokeWidth="1" />
      <line x1={P.l} y1={P.t + cH} x2={P.l + cW} y2={P.t + cH} stroke="var(--m2)" strokeWidth="1" />
    </svg>,
  );
}

const CHAR_W = 5.7, MIN_L = 90, MAX_L = 230, ROW_H = 32;

/** Horizontal bars with a label gutter sized to the longest label (long ones truncate; full text in tooltip). */
export function HBarChart({ labels, values, colors, vf, minHeight }) {
  const [ref, W] = useWidth(500);
  const { show, hide } = useTooltip();
  const wrap = (children) => <div className="cw" ref={ref} style={{ minHeight }}>{children}</div>;
  if (!labels || !labels.length) return wrap(<NoData>No data</NoData>);

  const maxV = Math.max(1, ...values);
  const maxLen = labels.reduce((m, l) => Math.max(m, String(l).length), 0);
  const gutter = Math.min(MAX_L, Math.max(MIN_L, Math.round(maxLen * CHAR_W) + 16));
  const allowed = Math.max(4, Math.floor((gutter - 14) / CHAR_W));
  const trunc = (l) => { l = String(l); return l.length > allowed ? l.slice(0, allowed - 1) + '…' : l; };
  const P = { l: gutter, r: 55, t: 4 };
  const palette = Array.isArray(colors) ? colors : [colors];

  return wrap(
    <svg width={W} height={labels.length * ROW_H + P.t * 2}>
      {labels.map((lbl, i) => {
        const y = P.t + i * ROW_H, bw = ((values[i] || 0) / maxV) * (W - P.l - P.r);
        const tv = vf ? vf(values[i]) : '' + Math.round(values[i]);
        return (
          <g key={i}>
            <text x={P.l - 7} y={y + ROW_H / 2 + 4} textAnchor="end" fill="var(--m)" fontSize="10" fontFamily="system-ui">
              <title>{lbl}</title>{trunc(lbl)}
            </text>
            <rect x={P.l} y={y + 5} width={Math.max(bw, 3)} height={ROW_H - 12} fill={palette[i % palette.length]} rx="3" opacity=".85"
              style={{ cursor: 'pointer' }} onMouseEnter={(e) => show(e, `${lbl}: ${tv}`)} onMouseLeave={hide} />
            <text x={P.l + bw + 7} y={y + ROW_H / 2 + 4} fill="var(--t2)" fontSize="10" fontFamily="system-ui">{tv}</text>
          </g>
        );
      })}
    </svg>,
  );
}
