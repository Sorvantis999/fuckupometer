// oil.js — WTI + Brent with Yahoo Finance (query2) primary + Stooq fallback
// Per-symbol error isolation: one failing never kills the other

const YF_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Referer': 'https://finance.yahoo.com/',
};

const STOOQ_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
};

async function fetchYahoo(symbol) {
  const url = `https://query2.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1m&range=1d`;
  const r = await fetch(url, { headers: YF_HEADERS });
  if (!r.ok) throw new Error(`Yahoo ${symbol} HTTP ${r.status}`);
  const json = await r.json();
  const meta = json?.chart?.result?.[0]?.meta;
  if (!meta || !meta.regularMarketPrice) throw new Error(`Yahoo ${symbol} no price`);

  const price = meta.regularMarketPrice;
  const prev  = meta.chartPreviousClose ?? meta.previousClose ?? price;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  const marketState = meta.marketState ?? 'CLOSED';
  const lastTradeISO = meta.regularMarketTime
    ? new Date(meta.regularMarketTime * 1000).toISOString()
    : null;

  return {
    price:       price.toFixed(2),
    prevClose:   prev.toFixed(2),
    change:      change.toFixed(2),
    changePct:   changePct.toFixed(2),
    dayHigh:     meta.regularMarketDayHigh?.toFixed(2) ?? null,
    dayLow:      meta.regularMarketDayLow?.toFixed(2)  ?? null,
    marketState,
    lastTradeISO,
    source: 'yahoo',
  };
}

async function fetchStooq(ticker) {
  const url = `https://stooq.com/q/l/?s=${ticker}&f=sd2t2ohlcp&h&e=csv`;
  const r = await fetch(url, { headers: STOOQ_HEADERS });
  if (!r.ok) throw new Error(`Stooq ${ticker} HTTP ${r.status}`);
  const text = await r.text();
  const lines = text.trim().split('\n');
  if (lines.length < 2) throw new Error(`Stooq ${ticker} no data rows`);
  const headers = lines[0].split(',');
  const values  = lines[1].split(',');
  const row = {};
  headers.forEach((h, i) => { row[h.trim()] = (values[i] || '').trim(); });
  if (!row.Close || row.Close === 'N/D') throw new Error(`Stooq ${ticker} N/D`);

  const price = parseFloat(row.Close);
  const prev  = parseFloat(row.Prev || row.Close);
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  const settleDateStr = row.Date;
  const settleDate = settleDateStr ? new Date(settleDateStr + 'T23:00:00Z') : null;

  return {
    price:       price.toFixed(2),
    prevClose:   prev.toFixed(2),
    change:      change.toFixed(2),
    changePct:   changePct.toFixed(2),
    dayHigh:     row.High  ? parseFloat(row.High).toFixed(2)  : null,
    dayLow:      row.Low   ? parseFloat(row.Low).toFixed(2)   : null,
    marketState: 'CLOSED',
    lastTradeISO: settleDate ? settleDate.toISOString() : null,
    source: 'stooq',
  };
}

async function fetchAAAGasPrice() {
  try {
    const r = await fetch('https://gasprices.aaa.com/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' },
    });
    if (!r.ok) return null;
    const html = await r.text();
    const match = html.match(/price-text[^>]*>[\s\S]*?\$(3\.\d{2,3})/);
    if (!match) return null;
    return parseFloat(match[1]);
  } catch {
    return null;
  }
}

async function fetchWithFallback(yahooSymbol, stooqTicker) {
  try {
    return await fetchYahoo(yahooSymbol);
  } catch (yahooErr) {
    console.error(`Yahoo failed for ${yahooSymbol}: ${yahooErr.message} — trying Stooq`);
    return await fetchStooq(stooqTicker);
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=180, stale-while-revalidate=300');

  try {
    const [wti, brent, retailGasPrice] = await Promise.all([
      fetchWithFallback('CL=F', 'cl.f'),
      fetchWithFallback('BZ=F', 'cb.f'),
      fetchAAAGasPrice(),
    ]);

    const INAUGURATION_PRICE = 76.0;
    const ALL_TIME_PEAK      = 119.48;
    const BRENT_INAUG        = 79.0;

    const price = parseFloat(wti.price);
    const marketOpen = wti.marketState === 'REGULAR';

    res.json({
      ...wti,
      inaugurationPrice:    INAUGURATION_PRICE,
      peakPrice:            ALL_TIME_PEAK,
      sinceInauguration:    (price - INAUGURATION_PRICE).toFixed(2),
      sinceInaugurationPct: (((price - INAUGURATION_PRICE) / INAUGURATION_PRICE) * 100).toFixed(1),
      fuckupFactor:         Math.min(100, Math.max(0, ((price - INAUGURATION_PRICE) / (ALL_TIME_PEAK - INAUGURATION_PRICE)) * 100)).toFixed(1),
      marketOpen,
      brent: {
        ...brent,
        sinceInaugPct: (((parseFloat(brent.price) - BRENT_INAUG) / BRENT_INAUG) * 100).toFixed(1),
      },
      retailGasPrice: retailGasPrice ?? null,  /* AAA national average retail $/gal */
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
