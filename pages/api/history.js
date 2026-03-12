export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  try {
    const response = await fetch(
      'https://query1.finance.yahoo.com/v8/finance/chart/CL=F?interval=1d&range=1mo',
      { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
    );
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error('No data');

    const timestamps = result.timestamp;
    const closes = result.indicators.quote[0].close;

    const points = timestamps.map((ts, i) => ({
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      close: closes[i] ? parseFloat(closes[i].toFixed(2)) : null,
    })).filter(p => p.close !== null);

    res.json({ points });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
