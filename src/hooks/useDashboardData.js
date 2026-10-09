import { useEffect, useState } from 'react';
import {
  SHEET_URL, LEGACY_URL, NOOR_URL, BD_URL, DIWALI_URL, SAMPLES_URL, SAMPLE_TIERS,
} from '../config';
import {
  parseSales, parseMasterLog, parseAds, parseInmails, parsePendingSales, parseCcbd, parseCcbdFestive,
  parsePendingSamples, parseNoor, parseBd, parseRecurring, parseDiwali, parseSamples,
} from '../lib/parsers';

const INITIAL = {
  sales: [], ads: [], inmails: [],
  mlByDate: [], mlByInd: [], mlPrimary: [], mlFollowup: [], mlIndDate: [], noorByDate: [],
  ccbd: [], ccbdFestive: [], pendingSales: [], pendingSamples: [],
  bd: [], recurring: [], samples: [],
  diwali: { linkedin: [], coldCalls: [], targets: null, tabKeys: [], email: [] },
};

// Each source feeds one or more tabs; a tab's loading banner stays up until every source feeding it settles.
const SOURCES = ['sheet', 'legacy', 'noor', 'bd', 'diwali'];
export const BAR_SOURCES = {
  ov: ['sheet', 'legacy'],
  sales: ['sheet'],
  mails: ['legacy', 'noor'],
  ads: ['legacy'],
  inmails: ['legacy'],
  ccbd: ['legacy'],
  pendsales: ['legacy'],
  pend: ['legacy'],
  recurring: ['bd'],
  bd: ['bd'],
  diwali: ['diwali'],
};

function getJson(url, signal, { timeout, params = '' } = {}) {
  const ctrl = new AbortController();
  const abort = () => ctrl.abort();
  signal.addEventListener('abort', abort);
  const timer = timeout ? setTimeout(abort, timeout) : null;
  return fetch(`${url}?t=${Date.now()}${params}`, { cache: 'no-store', redirect: 'follow', signal: ctrl.signal })
    .then((r) => r.json())
    .finally(() => {
      clearTimeout(timer);
      signal.removeEventListener('abort', abort);
    });
}

export function useDashboardData() {
  const [data, setData] = useState(INITIAL);
  const [pending, setPending] = useState(() => new Set(SOURCES));
  const [status, setStatus] = useState({ text: 'loading live data…', loading: true });
  const [lastUpdated, setLastUpdated] = useState(null);
  const [sampleTier, setSampleTier] = useState(SAMPLE_TIERS[0].label); // null once all tiers settle

  useEffect(() => {
    const ctrl = new AbortController();
    const { signal } = ctrl;
    const patch = (p) => { setData((d) => ({ ...d, ...p })); setLastUpdated(new Date()); };
    const settle = (src) => setPending((s) => { const n = new Set(s); n.delete(src); return n; });
    // Aborted fetches come from effect cleanup (unmount / StrictMode), not real failures.
    const onFail = (src, msg, extra) => (e) => {
      if (signal.aborted) return;
      console.warn(msg, e);
      extra?.();
      settle(src);
    };

    getJson(SHEET_URL, signal, { timeout: 60000 })
      .then((raw) => {
        const sales = parseSales(raw);
        if (sales) patch({ sales });
        setStatus({ text: 'live · google sheets', loading: false });
        settle('sheet');
      })
      .catch(onFail('sheet', 'SHEET_URL fetch error', () => setStatus({ text: 'cached data (fetch failed)', loading: false })));

    // One fetch feeds Mails / Ads / InMails / CCBD / Pending Sales / Pending Delivery.
    getJson(LEGACY_URL, signal, { timeout: 60000 })
      .then((raw) => {
        const p = {};
        if (raw.Master_Log) {
          const ml = parseMasterLog(raw.Master_Log);
          Object.assign(p, { mlByDate: ml.byDate, mlByInd: ml.byInd, mlPrimary: ml.primary, mlFollowup: ml.followup, mlIndDate: ml.byIndDate });
        }
        const ads = parseAds(raw); if (ads) p.ads = ads;
        const inmails = parseInmails(raw); if (inmails) p.inmails = inmails;
        if (raw.Pending_Sales) p.pendingSales = parsePendingSales(raw.Pending_Sales);
        if (raw.CCBD_BAU) p.ccbd = parseCcbd(raw.CCBD_BAU);
        if (raw.CCBD_Festive) p.ccbdFestive = parseCcbdFestive(raw.CCBD_Festive);
        p.pendingSamples = parsePendingSamples(raw.Pending_Delivery || []);
        patch(p);
        settle('legacy');
      })
      .catch(onFail('legacy', 'LEGACY_URL fetch error'));

    getJson(NOOR_URL, signal)
      .then((raw) => { patch({ noorByDate: parseNoor(raw) }); settle('noor'); })
      .catch(onFail('noor', 'Noor Database fetch failed'));

    getJson(BD_URL, signal)
      .then((raw) => {
        patch({ bd: parseBd(raw.Sheet1 || []), recurring: parseRecurring(raw['Recurring clients'] || []) });
        settle('bd');
      })
      .catch(onFail('bd', 'BD fetch failed'));

    getJson(DIWALI_URL, signal)
      .then((raw) => { patch({ diwali: parseDiwali(raw) }); settle('diwali'); })
      .catch(onFail('diwali', 'Diwali extras fetch failed'));

    // Small-to-large sample tiers; each renders as soon as it lands.
    (async function loadTiers() {
      for (const tier of SAMPLE_TIERS) {
        if (signal.aborted) return;
        setSampleTier(tier.label);
        try {
          const raw = await getJson(SAMPLES_URL, signal, { params: tier.limit ? `&limit=${tier.limit}` : '' });
          const samples = parseSamples(raw);
          if (samples.length) patch({ samples });
        } catch (e) {
          if (signal.aborted) return;
          console.warn(`Samples tier "${tier.key}" failed`, e);
        }
      }
      setSampleTier(null);
    })();

    return () => ctrl.abort();
  }, []);

  const isLoading = (bar) => BAR_SOURCES[bar].some((s) => pending.has(s));
  const ready = lastUpdated !== null;

  return { data, status, lastUpdated, ready, isLoading, sampleTier };
}
