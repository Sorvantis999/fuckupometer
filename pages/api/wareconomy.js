// wareconomy.js — Gold, DXY, defense contractors, European TTF gas via stooq

const ASSETS = [
  // Gold futures
  { ticker: 'gc.f',   key: 'gold',  label: 'Gold',                  unit: '$/oz',    inaugBaseline: 2736,  warBaseline: 2900,  decimals: 2 },
  // US Dollar Index
  { ticker: 'dxy.f',  key: 'dxy',   label: 'US Dollar Index',        unit: 'index',   inaugBaseline: 109.2, warBaseline: 105.9, decimals: 2 },
  // Defense contractors
  { ticker: 'rtx.us', key: 'rtx',   label: 'Raytheon Technologies',  unit: '$/sh',    inaugBaseline: 117.0, warBaseline: 127.5, decimals: 2 },
  { ticker: 'lmt.us', key: 'lmt',   label: 'Lockheed Martin',        unit: '$/sh',    inaugBaseline: 529.0, warBaseline: 548.0, decimals: 2 },
  { ticker: 'noc.us', key: 'noc',   label: 'Northrop Grumman',       unit: '$/sh',    inaugBaseline: 497.0, warBaseline: 508.0, decimals: 2 },
  // European TTF natural gas (Dutch TTF front-month)
  { ticker: 'ttf.f',  key: 'ttf',   label: 'European TTF Gas',       unit: '€/MWh',   inaugBaseline: 45.8,  warBaseline: 38.4,  decimals: 2 },
];

const STOOQ_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
};

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
  const price     = parseFloat(row.Close);
  const prev      = parseFloat(row.Prev || row.Close);
  const change    = price - prev;
  const changePct = prev ? (change / prev) * 100 : 0;
  return {
    price:     parseFloat(price.toFixed(decimals)),
    prev:      parseFloat(prev.toFixed(decimals)),
    change:    parseFloat(change.toFixed(decimals)),
    changePct: parseFloat(changePct.toFixed(2)),
  };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');

  try {
    const results = {};

    await Promise.all(
      ASSETS.map(async (a) => {
        const quote = await fetchStooq(a.ticker, a.decimals);
        if (!quote) return;
        const sinceInaugPct  = ((quote.price - a.inaugBaseline) / a.inaugBaseline * 100).toFixed(1);
        const sinceWarPct    = ((quote.price - a.warBaseline)   / a.warBaseline   * 100).toFixed(1);
        const sinceInaugAbs  = (quote.price - a.inaugBaseline).toFixed(a.decimals);
        const sinceWarAbs    = (quote.price - a.warBaseline).toFixed(a.decimals);
        results[a.key] = {
          label:         a.label,
          unit:          a.unit,
          inaugBaseline: a.inaugBaseline,
          warBaseline:   a.warBaseline,
          ...quote,
          sinceInaugPct:  parseFloat(sinceInaugPct),
          sinceWarPct:    parseFloat(sinceWarPct),
          sinceInaugAbs:  parseFloat(sinceInaugAbs),
          sinceWarAbs:    parseFloat(sinceWarAbs),
        };
      })
    );

    res.json({ warEconomy: results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
