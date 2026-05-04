// commodities.js — commodity quotes via Yahoo (primary) + Stooq (per-symbol
// fallback) + raw.githubusercontent.com static-JSON last-resort fallback.
//
// Same triple-layered resilience pattern as oil.js: when both Yahoo and Stooq
// IP-block Vercel egress simultaneously, we serve the hourly-refreshed JSON
// produced by the update-prices GitHub Action.

const RAW_PRICES_URL =
  'https://raw.githubusercontent.com/SorvantisCo/fuckupometer/main/public/data/prices.json';

const COMMODITIES = [
  { yahoo: 'NG=F', stooq: 'ng.f',  label: 'Natural Gas',     unit: '$/MMBtu', inaugBaseline: 3.22,  decimals: 3 },
  { yahoo: 'RB=F', stooq: 'rb.f',  label: 'Gasoline (RBOB)', unit: '$/gal',   inaugBaseline: 2.10,  decimals: 4 },
  { yahoo: 'ZW=F', stooq: 'zw.f',  label: 'Wheat',           unit: 'cents/bu', inaugBaseline: 535,  decimals: 2 },
  { yahoo: 'ZC=F', stooq: 'zc.f',  label: 'Corn',            unit: 'cents/bu', inaugBaseline: 450,  decimals: 2 },
  { yahoo: 'CF',   stooq: 'cf.us', label: 'Fertilizer',      unit: '$/sh',    inaugBaseline: 110,   decimals: 2 },
];

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com/',
};

const STOOQ_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

async function fetchYahoo(symbol, decimals) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=5d`;
  const r = await fetch(url, { headers: YF_HEADERS });
  if (!r.ok) return null;
  const json = await r.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || !meta.regularMarketPrice) return null;
  const price = meta.regularMarketPrice;
  const prev  = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price:     parseFloat(price.toFixed(decimals)),
    prev:      parseFloat(prev.toFixed(decimals)),
    change:    parseFloat(change.toFixed(decimals)),
    changePct: parseFloat(changePct.toFixed(2)),
  };
}

async function fetchStooq(ticker, decimals) {
  const url = `https://stooq.com/q/l/?s=${ticker}&f=sd2t2ohlcp&h&e=csv`;
  const r = await fetch(url, { headers: STOOQ_HEADERS });
  if (!r.ok) return null;
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) return null;
  const headers = lines[0].split(',');
  const values  = lines[1].split(',');
  const row = {};
  headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
  if (!row.Close || row.Close === 'N/D') return null;
  const price    = parseFloat(row.Close);
  const prev     = parseFloat(row.Prev || row.Close);
  const change   = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price:     parseFloat(price.toFixed(decimals)),
    prev:      parseFloat(prev.toFixed(decimals)),
    change:    parseFloat(change.toFixed(decimals)),
    changePct: parseFloat(changePct.toFixed(2)),
  };
}

async function fetchOne(c) {
  /* Yahoo first; on null/throw, fall through to Stooq. Never throw upward. */
  try {
    const y = await fetchYahoo(c.yahoo, c.decimals);
    if (y) return y;
  } catch { /* fall through */ }
  try {
    return await fetchStooq(c.stooq, c.decimals);
  } catch {
    return null;
  }
}

/**
 * Read the cached prices.json published by the GitHub Action.
 * Returns the commodities array only on success.
 */
async function fetchStaticFallback() {
  try {
    const r = await fetch(RAW_PRICES_URL, {
      headers: { 'User-Agent': 'fuckupometer-api/1.0' },
    });
    if (!r.ok) return null;
    const data = await r.json();
    if (!Array.isArray(data?.commodities) || data.commodities.length === 0) return null;
    return data;
  } catch {
    return null;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const settled = await Promise.allSettled(COMMODITIES.map(c => fetchOne(c)));
    const results = settled.map((s, i) => {
      const c = COMMODITIES[i];
      const quote = s.status === 'fulfilled' ? s.value : null;
      if (!quote) return null;
      const sinceInaugPct = ((quote.price - c.inaugBaseline) / c.inaugBaseline * 100).toFixed(1);
      /* Keep the Yahoo-style ticker on the response so the front-end keeps working */
      return {
        ticker: c.yahoo,
        label: c.label,
        unit: c.unit,
        inaugBaseline: c.inaugBaseline,
        decimals: c.decimals,
        ...quote,
        sinceInaugPct: parseFloat(sinceInaugPct),
      };
    }).filter(Boolean);

    /* If every commodity failed → fall back to static JSON. */
    if (results.length === 0) {
      const fallback = await fetchStaticFallback();
      if (fallback) {
        return res.json({
          commodities: fallback.commodities,
          cached: true,
          cachedAt: fallback.updatedAt,
        });
      }
    }

    res.json({ commodities: results });
  } catch (err) {
    /* Last-ditch attempt at static fallback before erroring out */
    const fallback = await fetchStaticFallback();
    if (fallback) {
      return res.json({
        commodities: fallback.commodities,
        cached: true,
        cachedAt: fallback.updatedAt,
      });
    }
    res.status(500).json({ error: err.message });
  }
}
