#!/usr/bin/env node
/**
 * scripts/fetch-prices.js
 *
 * Fetches WTI, Brent, AAA national gas, and watchlist commodities (NG, RBOB,
 * wheat, corn, fertilizer) from Yahoo Finance + AAA, with Stooq as a per-symbol
 * fallback. Writes the combined result to public/data/prices.json.
 *
 * This script is meant to run in GitHub Actions (ubuntu-latest, node 20+).
 * GitHub Actions runner IPs are not blocked by Yahoo / Stooq the way Vercel's
 * Lambda IP space is, which is why this lives in CI rather than the Next.js
 * /api routes. The /api routes still try Yahoo/Stooq directly first, and only
 * read this static file via raw.githubusercontent.com when both upstreams fail.
 */

'use strict';

const fs = require('node:fs');
const path = require('node:path');

const YF_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'application/json',
  Referer: 'https://finance.yahoo.com/',
};

const STOOQ_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

/* ─── Yahoo / Stooq quote fetchers ─── */

async function fetchYahoo(symbol) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
  const r = await fetch(url, { headers: YF_HEADERS });
  if (!r.ok) throw new Error(`Yahoo ${symbol} HTTP ${r.status}`);
  const json = await r.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || !meta.regularMarketPrice) throw new Error(`Yahoo ${symbol} no price`);
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price,
    prev,
    change,
    changePct,
    dayHigh: meta.regularMarketDayHigh ?? null,
    dayLow: meta.regularMarketDayLow ?? null,
    marketState: meta.marketState ?? 'CLOSED',
    lastTradeISO: meta.regularMarketTime ? new Date(meta.regularMarketTime * 1000).toISOString() : null,
    source: 'yahoo',
  };
}

async function fetchStooq(ticker) {
  const url = `https://stooq.com/q/l/?s=${ticker}&f=sd2t2ohlcp&h&e=csv`;
  const r = await fetch(url, { headers: STOOQ_HEADERS });
  if (!r.ok) throw new Error(`Stooq ${ticker} HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error(`Stooq ${ticker} no rows`);
  const headers = lines[0].split(',');
  const values = lines[1].split(',');
  const row = {};
  headers.forEach((h, i) => {
    row[h.trim()] = (values[i] || '').trim();
  });
  if (!row.Close || row.Close === 'N/D') throw new Error(`Stooq ${ticker} N/D`);
  const price = parseFloat(row.Close);
  const prev = parseFloat(row.Prev || row.Close);
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price,
    prev,
    change,
    changePct,
    dayHigh: row.High ? parseFloat(row.High) : null,
    dayLow: row.Low ? parseFloat(row.Low) : null,
    marketState: 'CLOSED',
    lastTradeISO: row.Date ? new Date(row.Date + 'T23:00:00Z').toISOString() : null,
    source: 'stooq',
  };
}

async function fetchWithFallback(yahooSymbol, stooqTicker) {
  try {
    return await fetchYahoo(yahooSymbol);
  } catch (e) {
    console.error(`  Yahoo failed for ${yahooSymbol}: ${e.message} — trying Stooq`);
    return await fetchStooq(stooqTicker);
  }
}

/* ─── AAA national average gas ─── */

async function fetchAAAGasPrice() {
  try {
    const r = await fetch('https://gasprices.aaa.com/', {
      headers: { 'User-Agent': YF_HEADERS['User-Agent'] },
    });
    if (!r.ok) return null;
    const html = await r.text();
    const match = html.match(/price-text[^>]*>[\s\S]*?\$([345]\.\d{2,3})/);
    return match ? parseFloat(match[1]) : null;
  } catch {
    return null;
  }
}

/* ─── Build the oil section in the API's exact response shape ─── */

function buildOilPayload(wti, brent, retailGasPrice) {
  const INAUGURATION_PRICE = 76.0;
  const FUCKUP_CEILING = 130.0;
  const CONFLICT_PEAK_ACTUAL = 119.48;
  const BRENT_INAUG = 79.0;

  const primary = wti ?? brent;
  const price = primary.price;
  const marketOpen = primary.marketState === 'REGULAR';

  const fmt = (n, d = 2) => parseFloat(Number(n).toFixed(d));

  return {
    price: fmt(price),
    prevClose: fmt(primary.prev),
    change: fmt(primary.change),
    changePct: fmt(primary.changePct),
    dayHigh: primary.dayHigh != null ? fmt(primary.dayHigh) : null,
    dayLow: primary.dayLow != null ? fmt(primary.dayLow) : null,
    marketState: primary.marketState,
    lastTradeISO: primary.lastTradeISO,
    source: primary.source,
    primarySource: wti ? 'wti' : 'brent_fallback',
    inaugurationPrice: INAUGURATION_PRICE,
    peakPrice: FUCKUP_CEILING,
    conflictPeakActual: CONFLICT_PEAK_ACTUAL,
    sinceInauguration: fmt(price - INAUGURATION_PRICE),
    sinceInaugurationPct: fmt(((price - INAUGURATION_PRICE) / INAUGURATION_PRICE) * 100, 1),
    fuckupFactor: fmt(
      Math.min(100, Math.max(0, ((price - INAUGURATION_PRICE) / (FUCKUP_CEILING - INAUGURATION_PRICE)) * 100)),
      1
    ),
    marketOpen,
    brent: brent
      ? {
          price: fmt(brent.price),
          prevClose: fmt(brent.prev),
          change: fmt(brent.change),
          changePct: fmt(brent.changePct),
          dayHigh: brent.dayHigh != null ? fmt(brent.dayHigh) : null,
          dayLow: brent.dayLow != null ? fmt(brent.dayLow) : null,
          marketState: brent.marketState,
          lastTradeISO: brent.lastTradeISO,
          source: brent.source,
          sinceInaugPct: fmt(((brent.price - BRENT_INAUG) / BRENT_INAUG) * 100, 1),
        }
      : null,
    retailGasPrice: retailGasPrice ?? null,
    timestamp: new Date().toISOString(),
  };
}

/* ─── Build the commodities section in the API's exact response shape ─── */

const COMMODITIES_LIST = [
  { yahoo: 'NG=F', stooq: 'ng.f', label: 'Natural Gas', unit: '$/MMBtu', inaugBaseline: 3.22, decimals: 3 },
  { yahoo: 'RB=F', stooq: 'rb.f', label: 'Gasoline (RBOB)', unit: '$/gal', inaugBaseline: 2.10, decimals: 4 },
  { yahoo: 'ZW=F', stooq: 'zw.f', label: 'Wheat', unit: 'cents/bu', inaugBaseline: 535, decimals: 2 },
  { yahoo: 'ZC=F', stooq: 'zc.f', label: 'Corn', unit: 'cents/bu', inaugBaseline: 450, decimals: 2 },
  { yahoo: 'CF', stooq: 'cf.us', label: 'Fertilizer', unit: '$/sh', inaugBaseline: 110, decimals: 2 },
];

async function buildCommodities() {
  const settled = await Promise.allSettled(COMMODITIES_LIST.map((c) => fetchWithFallback(c.yahoo, c.stooq)));
  return settled
    .map((s, i) => {
      const c = COMMODITIES_LIST[i];
      const q = s.status === 'fulfilled' ? s.value : null;
      if (!q) return null;
      const fmt = (n, d) => parseFloat(Number(n).toFixed(d));
      return {
        ticker: c.yahoo,
        label: c.label,
        unit: c.unit,
        inaugBaseline: c.inaugBaseline,
        decimals: c.decimals,
        price: fmt(q.price, c.decimals),
        prev: fmt(q.prev, c.decimals),
        change: fmt(q.change, c.decimals),
        changePct: fmt(q.changePct, 2),
        sinceInaugPct: fmt(((q.price - c.inaugBaseline) / c.inaugBaseline) * 100, 1),
      };
    })
    .filter(Boolean);
}

/* ─── Main ─── */

async function main() {
  console.log('Fetching oil...');
  const oilSettled = await Promise.allSettled([
    fetchWithFallback('CL=F', 'cl.f'),
    fetchWithFallback('BZ=F', 'cb.f'),
    fetchAAAGasPrice(),
  ]);
  const wti = oilSettled[0].status === 'fulfilled' ? oilSettled[0].value : null;
  const brent = oilSettled[1].status === 'fulfilled' ? oilSettled[1].value : null;
  const retailGas = oilSettled[2].status === 'fulfilled' ? oilSettled[2].value : null;

  if (!wti && !brent) {
    console.error('FAIL: both WTI and Brent failed; refusing to write degraded data');
    console.error(`  WTI err: ${oilSettled[0].reason?.message ?? 'n/a'}`);
    console.error(`  Brent err: ${oilSettled[1].reason?.message ?? 'n/a'}`);
    process.exit(1);
  }

  const oilPayload = buildOilPayload(wti, brent, retailGas);
  console.log(`  WTI=${oilPayload.price} Brent=${oilPayload.brent?.price ?? 'n/a'} retailGas=${retailGas ?? 'n/a'}`);

  console.log('Fetching commodities...');
  const commodities = await buildCommodities();
  console.log(`  Got ${commodities.length}/${COMMODITIES_LIST.length} commodities`);
  for (const c of commodities) console.log(`    ${c.label}: ${c.price} ${c.unit}`);

  const out = {
    updatedAt: new Date().toISOString(),
    oil: oilPayload,
    commodities,
  };

  const outDir = path.join(process.cwd(), 'public', 'data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'prices.json');
  fs.writeFileSync(outPath, JSON.stringify(out, null, 2) + '\n');
  console.log(`\nWrote ${outPath} (${fs.statSync(outPath).size} bytes)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
