// Pure functions turning raw Apps Script tab dumps ([[cell, …], …]) into dashboard rows.
import { istDate, ymd, pct } from './util';

const str = (v) => String(v || '').trim();
const emptyCounts = (extra) => ({ del: 0, open: 0, click: 0, resp: 0, bounce: 0, ...extra });
const byDateAsc = (a, b) => a.date.localeCompare(b.date);

/** dd/mm/yy(yy) -> YYYY-MM-DD, otherwise any Date-parseable string -> IST date. */
function parseDmyOrDate(raw) {
  if (!raw) return '';
  const s = String(raw).trim();
  if (s.includes('/')) {
    const p = s.split('/');
    if (p.length < 3) return '';
    return (p[2].length === 2 ? '20' + p[2] : p[2]) + '-' + p[1].padStart(2, '0') + '-' + p[0].padStart(2, '0');
  }
  return istDate(s);
}

export function parseSales(raw) {
  const key = Object.keys(raw).find((k) => {
    const kl = k.toLowerCase();
    return kl.includes('sale') || kl.includes('active order');
  }) || 'Sales_Log';
  if (!raw[key]) return null;
  const rows = raw[key].slice(1).map((r) => {
    if (!str(r[1]).toLowerCase().includes('inst')) return null;
    const poc = str(r[4] || r[3]);
    if (poc.toLowerCase() === 'aditi') return null;
    const date = parseDmyOrDate(r[2] || r[3]);
    const amt = parseFloat(String(r[6] || r[7] || r[8] || r[5] || '0').replace(/[^\d.-]/g, ''));
    if (!date || isNaN(amt) || amt === 0) return null;
    return { ref: String(r[0] || '—'), date, client: str(r[5] || r[4] || '—'), poc: poc || '—', type: str(r[1] || 'Inst Order'), amt };
  }).filter(Boolean);
  return rows.length ? rows : null;
}

const MAIL_EVENT = { 'Email Delivered': 'del', 'Email Opened': 'open', 'Email Clicked': 'click', RESPONDED: 'resp', BOUNCED: 'bounce' };

export function parseMasterLog(log) {
  const byDate = {}, byInd = {}, primary = {}, followup = {}, byIndDate = {};
  const firstHeader = {};
  log.forEach((r) => {
    if (!r || !r[0]) return;
    const ind = str(r[0]);
    if (!firstHeader[ind]) firstHeader[ind] = str(r[2]);
  });

  log.forEach((r) => {
    if (!r || !r[3]) return;
    const key = MAIL_EVENT[str(r[3])];
    if (!key) return;
    const ind = str(r[0]);
    const isPrimary = str(r[2]) === firstHeader[ind];

    let date = '';
    if (r[4] && typeof r[4] === 'string' && r[4].length >= 8) date = istDate(r[4]);
    if (!date || date < '2020-01-01') date = '2026-04-15';

    (byDate[date] ||= emptyCounts({ date }))[key]++;
    const split = isPrimary ? primary : followup;
    (split[date] ||= emptyCounts({ date }))[key]++;

    const indClean = ind
      .replace(/^N\(\d+\)[-–]\s*/, '').replace(/^O\(\d+\)[-–]\s*/, '')
      .replace(/^[NO][-–]\s*/, '').replace(/^0[-–]\s*/, '')
      .replace(/[-–]\s*\d+\/\d+\/\d+\s*$/, '').trim();
    if (!indClean) return;
    (byInd[indClean] ||= emptyCounts({ ind: indClean }))[key]++;
    (byIndDate[indClean + '|' + date] ||= emptyCounts({ ind: indClean, date }))[key]++;
  });

  return {
    byDate: Object.values(byDate).sort(byDateAsc),
    byInd: Object.values(byInd).filter((i) => i.del > 0),
    primary: Object.values(primary).sort(byDateAsc),
    followup: Object.values(followup).sort(byDateAsc),
    byIndDate: Object.values(byIndDate),
  };
}

export function parseAds(raw) {
  const key = Object.keys(raw).find((k) => {
    const c = k.toLowerCase().replace(/\s+/g, '');
    return c.includes('ads_log') || c === 'adslog';
  }) || 'Ads_Log';
  if (!raw[key]) return null;
  const rows = raw[key].slice(1).map((r) => {
    const client = str(r[1]);
    if (!client || client === '—') return null;
    let date = '';
    const dStr = r[4] ? String(r[4]).trim() : '';
    if (dStr.includes('/')) {
      const p = dStr.split('/');
      if (p.length >= 3) {
        const yr = p[2].length === 2 ? '20' + p[2] : p[2];
        const first = parseInt(p[0]), second = parseInt(p[1]);
        // dd/mm when the first part can't be a month, otherwise mm/dd
        date = first > 12
          ? `${yr}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`
          : `${yr}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
      }
    } else if (dStr) {
      date = istDate(dStr);
    }
    if (!date) date = ymd(new Date());
    const val = parseFloat(String(r[11] || r[10] || r[6] || '').replace(/[^\d.-]/g, '')) || null;
    return {
      date, client, type: str(r[8] || r[7] || 'Inbound') || 'Inbound', poc: str(r[9] || '—'),
      lead: str(r[13] || 'Cold'), conv: str(r[12] || '—'), val,
    };
  }).filter(Boolean);
  return rows.length ? rows : null;
}

export function parseInmails(raw) {
  const key = Object.keys(raw).find((k) => k.toLowerCase().replace(/\s+/g, '') === 'inmails') || 'InMails ';
  if (!raw[key]) return null;
  const rows = raw[key].slice(1).map((r, i) => {
    const company = str(r[2]);
    if (!company) return null;
    return { n: i + 1, ind: str(r[1] || '—'), company, role: str(r[3] || '—'), poc: str(r[4] || '—') };
  }).filter(Boolean);
  return rows.length ? rows : null;
}

export function parsePendingSales(rows) {
  return rows.filter((r) => r[0]).map((r) => ({
    ref: str(r[0]), poDate: r[1] ? istDate(String(r[1])) : '', orderDate: r[2] ? istDate(String(r[2])) : '',
    poc: str(r[3]), client: str(r[4]), gross: parseFloat(r[5]) || 0, pocName: str(r[6]), contact: str(r[7]),
  }));
}

export function parseCcbd(rows) {
  return rows.filter((r) => r[2] || r[1]).map((r) => ({
    sr: str(r[0]), date: r[1] ? istDate(String(r[1])) : '', name: str(r[2]),
    phone: str(r[3]).replace(/\.0$/, ''), city: str(r[4]), remarks: str(r[5]),
    urgency: str(r[6]), conversion: str(r[11]), poc: str(r[9]),
  }));
}

export function parseCcbdFestive(rows) {
  return rows.slice(1).filter((r) => r[0] || r[2]).map((r) => ({
    sr: str(r[0]), date: r[1] ? istDate(String(r[1])) : '', name: str(r[2]),
    phone: str(r[3]).replace(/\.0$/, ''), platform: str(r[4]), quality: str(r[5]), remark: str(r[6]), poc: str(r[7]),
  }));
}

export function parsePendingSamples(rows) {
  return rows.filter((r) => r[0] || r[6]).map((r) => {
    let date = '';
    if (r[2]) {
      date = istDate(r[2]);
      if (!date && typeof r[2] === 'string' && r[2].length >= 8) date = r[2].slice(0, 10);
    }
    return {
      ref: str(r[0]), poc: str(r[1]), date, product: str(r[3]), grammage: str(r[4]), qty: parseFloat(r[5]) || 1,
      client: str(r[6]), contact: str(r[7]), location: str(r[8]), company: str(r[9]), dispatch: str(r[10]),
    };
  });
}

// ── Noor Database (mail-merge tracker) ────────────────────────────────────
const MONTHS = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
// Header labels look like "Previous Merge - 30 Jul 26"; pull the trailing date out.
function parseMergeHeaderDate(label) {
  const m = String(label || '').match(/(\d{1,2})\s+([A-Za-z]{3,})\s+(\d{2,4})/);
  if (!m) return '';
  const day = parseInt(m[1], 10), mon = MONTHS[m[2].slice(0, 3).toLowerCase()];
  let yr = m[3];
  if (mon === undefined || isNaN(day)) return '';
  if (yr.length === 2) yr = '20' + yr;
  const d = new Date(parseInt(yr, 10), mon, day);
  return isNaN(d.getTime()) ? '' : ymd(d);
}
// Status is cumulative per merge column (SENT < OPENED < CLICKED < RESPONDED);
// BOUNCED means the send failed, so it's counted separately and not as a delivery.
const STATUS_LEVELS = { EMAIL_SENT: 0, EMAIL_OPENED: 1, EMAIL_CLICKED: 2, RESPONDED: 3, EMAIL_RESPONDED: 3 };

export function parseNoor(raw) {
  const agg = {};
  Object.keys(raw).forEach((tab) => {
    const values = raw[tab] || [];
    if (!values.length) return;
    const mergeCols = [];
    (values[0] || []).forEach((label, i) => {
      if (/previous merge/i.test(str(label))) {
        const date = parseMergeHeaderDate(str(label));
        if (date) mergeCols.push({ idx: i, date });
      }
    });
    if (!mergeCols.length) return;
    values.slice(1).forEach((row) => {
      if (!row) return;
      const company = row[3] != null ? String(row[3]).trim() : '';
      const email = row[4] != null ? String(row[4]).trim() : '';
      if (!company && !email) return; // blank spacer row
      mergeCols.forEach((mc) => {
        const status = row[mc.idx] != null ? String(row[mc.idx]).trim().toUpperCase() : '';
        if (!status) return;
        const a = (agg[mc.date] ||= emptyCounts({ date: mc.date }));
        if (status === 'BOUNCED') { a.bounce++; return; }
        const lvl = STATUS_LEVELS[status];
        if (lvl === undefined) return;
        a.del++;
        if (lvl >= 1) a.open++;
        if (lvl >= 2) a.click++;
        if (lvl >= 3) a.resp++;
      });
    });
  });
  return Object.values(agg).sort(byDateAsc);
}

// ── BD sheet ──────────────────────────────────────────────────────────────
export function parseBd(rows) {
  return rows.slice(1).filter((r) => r[0] || r[1]).map((r) => {
    let date = '';
    if (r[0]) {
      date = istDate(r[0]);
      if (!date && typeof r[0] === 'string' && r[0].length >= 8) {
        date = r[0].replace(/(\d+)\/(\d+)\/(\d+)/, (m, d, mo, y) => (y.length === 2 ? '20' + y : y) + '-' + mo.padStart(2, '0') + '-' + d.padStart(2, '0'));
      }
    }
    return {
      date, company: str(r[1]), name: str(r[2]), contact: str(r[3]), location: str(r[4]), poc: str(r[5]),
      remarks: str(r[6]), source: str(r[7]), phase: str(r[10]) || 'Unknown', followup: str(r[12]),
    };
  });
}

export function parseRecurring(rows) {
  return rows.slice(1).filter((r) => r[0] || r[1]).map((r) => ({
    client: str(r[0]), poc: str(r[1]), phone: str(r[2]), location: str(r[3]),
    revenue: str(r[4]), orders: str(r[5]), dates: str(r[6]),
  }));
}

// ── Diwali sheet ──────────────────────────────────────────────────────────
export function parseDiwali(dw) {
  const liRaw = dw['LinkedIn Tracker'] || [];
  let liStart = 0;
  for (let i = 0; i < liRaw.length; i++) {
    if (str(liRaw[i][0]) === 'First Name') { liStart = i + 1; break; }
  }
  const linkedin = liRaw.slice(liStart || 4).filter((r) => r[0] || r[2]).map((r) => {
    const flag = str(r[6]).toLowerCase();
    return {
      name: (String(r[0] || '') + ' ' + String(r[1] || '')).trim() || '—',
      company: String(r[2] || '—'), position: String(r[3] || '—'), sent: flag === 'yes' || flag === 'sent',
    };
  });

  const ccRaw = dw['Cold Calls Tracker'] || [];
  let ccStart = 0;
  for (let i = 0; i < ccRaw.length; i++) {
    const c0 = str(ccRaw[i][0]).toLowerCase(), c1 = str(ccRaw[i][1]).toLowerCase();
    if (c0 === 'company' || c0 === 's.no' || c0 === 's no' || c1 === 'company') { ccStart = i + 1; break; }
  }
  const coldCalls = ccRaw.slice(ccStart || 4).filter((r) => r[0] || r[2]).map((r) => ({
    company: String(r[2] || '—'), calledBy: String(r[10] || r[6] || '—'),
    followUp: String(r[6] || '—'), status: String(r[11] || '—'),
  }));

  const tgtRaw = dw['Sample Box'] || [];
  let targets = null; // null = tab empty / missing
  if (tgtRaw.length) {
    let tgtStart = 0;
    for (let i = 0; i < Math.min(10, tgtRaw.length); i++) {
      const rowStr = String(tgtRaw[i].join('')).toLowerCase();
      if (rowStr.includes('company') || rowStr.includes('industry')) { tgtStart = i + 1; break; }
    }
    targets = tgtRaw.slice(tgtStart).filter((r) => r.join('').trim() !== '').map((r) => {
      const poc = str(r[6] || r[7] || '—'), contact = str(r[8] || r[9] || '—');
      const chartInd = str(r[1] || r[0]);
      return {
        company: str(r[2] || r[1] || r[3] || '—'), industry: str(r[1] || r[0] || '—'),
        chartIndustry: !chartInd || chartInd === '—' ? 'Ungrouped / Other' : chartInd,
        trigger: str(r[4] || r[5] || '—'), poc, contact,
        hasPoc: !!poc && poc !== '—', hasContact: !!contact && contact !== '—',
      };
    });
  }

  const emailMap = {};
  let curInd = '';
  (dw['Email Tracker'] || []).slice(1).forEach((r) => {
    const indRaw = str(r[1]);
    if (indRaw) curInd = indRaw;
    if (!curInd) return;
    const m = (emailMap[curInd] ||= { industry: curInd, totalSent: 0, responses: 0 });
    m.totalSent += parseFloat(r[9]) || 0;
    m.responses += parseFloat(r[10]) || 0;
  });

  return {
    linkedin, coldCalls, targets, tabKeys: Object.keys(dw),
    email: Object.values(emailMap).filter((m) => m.totalSent > 0),
  };
}

/** Cold-call outcome buckets used by the Diwali cold-call tiles. */
export function coldCallStats(cc) {
  let pos = 0, no = 0, fu = 0;
  cc.forEach((r) => {
    const s = r.status.trim().toLowerCase();
    if (s.includes('interested') && !s.includes('not')) pos++;
    else if (s.includes('share') || s.includes('catalogue') || s.includes('call done') || s.includes('b2b')) pos++;
    else if (s.includes('not interested')) no++;
    else if (s.includes('not picked up') || s.includes('not connected') || s.includes('invalid')) fu++;
  });
  const done = cc.filter((r) => { const s = r.status.trim().toLowerCase(); return s && s !== 'not picked up' && s !== 'not connected'; }).length;
  return { pos, no, fu, done, noPct: pct(no, cc.length) };
}

// ── Samples sheet ─────────────────────────────────────────────────────────
const SAMPLE_REQUESTERS = ['siya', 'mahi', 'bhoomika', 'dhyana'];

export function parseSamples(raw) {
  const keys = Object.keys(raw);
  const sheetName = keys.find((k) => k.toLowerCase().includes('recent'))
    || keys.slice().reverse().find((k) => k.toLowerCase().includes('sample')) || keys[0];
  let poc = '', date = '', client = '—';
  return (raw[sheetName] || []).slice(1).map((r) => {
    const reqBy = str(r[2]);
    if (reqBy) {
      client = '—';
      const hit = SAMPLE_REQUESTERS.find((a) => reqBy.toLowerCase().includes(a));
      poc = hit ? hit.charAt(0).toUpperCase() + hit.slice(1) : '';
    }
    if (r[3] && String(r[3]).trim() !== '') {
      const d = parseDmyOrDate(r[3]);
      if (d) date = d;
    }
    const clientRaw = str(r[11]);
    if (clientRaw) client = clientRaw;
    if (!poc || !date || date.length < 8) return null;
    const product = str(r[8] || r[4]);
    const qty = parseInt(r[10] || r[5]) || 1;
    if (!product || product.toLowerCase() === 'q' || product.toLowerCase() === 'dipsters list') return null;
    return { date, product, client, qty, req_by: poc, dispatch: '' };
  }).filter(Boolean);
}
