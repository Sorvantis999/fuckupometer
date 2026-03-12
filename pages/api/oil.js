export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1d',
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; fuckupometer/1.0)',
          'Accept': 'application/json',
        }
      }
    );

    if (!response.ok) throw new Error(`Yahoo Finance returned ${response.status}`);

    const data = await response.json();
    const result = data?.chart?.result?.[0];

    if (!result) throw new Error('No data in response');

    const meta = result.meta;
    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose ?? meta.regularMarketPreviousClose ?? price;
    const dayHigh = meta.regularMarketDayHigh;
    const dayLow = meta.regularMarketDayLow;
    const change = price - prevClose;
    const changePct = prevClose ? (change / prevClose) * 100 : 0;

    const INAUGURATION_PRICE = 76.0;
    const ALL_TIME_PEAK = 119.48;

    res.json({
      price: price.toFixed(2),
      prevClose: prevClose.toFixed(2),
      change: change.toFixed(2),
      changePct: changePct.toFixed(2),
      dayHigh: dayHigh?.toFixed(2),
      dayLow: dayLow?.toFixed(2),
      inaugurationPrice: INAUGURATION_PRICE,
      peakPrice: ALL_TIME_PEAK,
      sinceInauguration: (price - INAUGURATION_PRICE).toFixed(2),
      sinceInaugurationPct: (((price - INAUGURATION_PRICE) / INAUGURATION_PRICE) * 100).toFixed(1),
      fuckupFactor: Math.min(100, Math.max(0, ((price - INAUGURATION_PRICE) / (ALL_TIME_PEAK - INAUGURATION_PRICE)) * 100)).toFixed(1),
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
