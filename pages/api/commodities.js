const COMMODITIES = [
  { ticker: 'NG=F',  label: 'Natural Gas',      unit: '$/MMBtu',  inaugBaseline: 3.22,  decimals: 3 },
  { ticker: 'RB=F',  label: 'Gasoline (RBOB)',   unit: '$/gal',    inaugBaseline: 2.10,  decimals: 4 },
  { ticker: 'ZW=F',  label: 'Wheat',             unit: 'cents/bu', inaugBaseline: 535,   decimals: 2 },
  { ticker: 'ZC=F',  label: 'Corn',              unit: 'cents/bu', inaugBaseline: 450,   decimals: 2 },
  { ticker: 'CF',    label: 'Fertilizer (CF Ind.)', unit: '$/sh',  inaugBaseline: 110,   decimals: 2, note: 'Urea proxy — CF Industries stock' },
];

async function fetchTicker(ticker, decimals) {
  const res = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=1d`,
    { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
  );
  const data = await res.json();
  const meta = data?.chart?.result?.[0]?.meta;
  if (!meta) return null;
  const price = meta.regularMarketPrice;
  const prev = meta.chartPreviousClose ?? price;
  const change = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price: parseFloat(price.toFixed(decimals)),
    prev: parseFloat(prev.toFixed(decimals)),
    change: parseFloat(change.toFixed(decimals)),
    changePct: parseFloat(changePct.toFixed(2)),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const results = await Promise.all(
      COMMODITIES.map(async (c) => {
        const quote = await fetchTicker(c.ticker, c.decimals);
        if (!quote) return null;
        const sinceInaugPct = ((quote.price - c.inaugBaseline) / c.inaugBaseline * 100).toFixed(1);
        return { ...c, ...quote, sinceInaugPct: parseFloat(sinceInaugPct) };
      })
    );

    res.json({ commodities: results.filter(Boolean) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
