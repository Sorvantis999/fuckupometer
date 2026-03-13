export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  async function fetchQuote(ticker) {
    const r = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
      { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; fuckupometer/1.0)', 'Accept': 'application/json' } }
    );
    if (!r.ok) throw new Error(`Yahoo Finance returned ${r.status} for ${ticker}`);
    const data = await r.json();
    const meta = data?.chart?.result?.[0]?.meta;
    if (!meta) throw new Error(`No data for ${ticker}`);
    const price    = meta.regularMarketPrice;
    const prev     = meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? price;
    const change   = price - prev;
    const changePct = prev ? (change / prev) * 100 : 0;
    return {
      price:     price.toFixed(2),
      prevClose: prev.toFixed(2),
      change:    change.toFixed(2),
      changePct: changePct.toFixed(2),
      dayHigh:   meta.regularMarketDayHigh?.toFixed(2),
      dayLow:    meta.regularMarketDayLow?.toFixed(2),
    };
  }

  try {
    const [wti, brent] = await Promise.all([fetchQuote('CL=F'), fetchQuote('BZ=F')]);

    const INAUGURATION_PRICE = 76.0;
    const ALL_TIME_PEAK      = 119.48;
    const BRENT_INAUG        = 79.0;

    const price = parseFloat(wti.price);

    res.json({
      ...wti,
      inaugurationPrice:    INAUGURATION_PRICE,
      peakPrice:            ALL_TIME_PEAK,
      sinceInauguration:    (price - INAUGURATION_PRICE).toFixed(2),
      sinceInaugurationPct: (((price - INAUGURATION_PRICE) / INAUGURATION_PRICE) * 100).toFixed(1),
      fuckupFactor:         Math.min(100, Math.max(0, ((price - INAUGURATION_PRICE) / (ALL_TIME_PEAK - INAUGURATION_PRICE)) * 100)).toFixed(1),
      brent: {
        ...brent,
        sinceInaugPct: (((parseFloat(brent.price) - BRENT_INAUG) / BRENT_INAUG) * 100).toFixed(1),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
