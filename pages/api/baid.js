/* ─── BAID (Baltic Dirty Tanker Index) scraper ──────────────────────────────
   Source: StockQ.org — clean HTML table, no JS wall, no Cloudflare.
   Falls back to last known value if scrape fails.
   Published once per trading day by Baltic Exchange (London).
   ─────────────────────────────────────────────────────────────────────────── */

const FALLBACK = 2849;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=7200');

  try {
    const response = await fetch('https://en.stockq.org/index/BDTI.php', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();

    /* StockQ renders the index value as the first large number in the table.
       Pattern: a cell containing a plain number like "2849.00" */
    const match = html.match(/>\s*([\d,]+\.?\d*)\s*<\/td>/);
    if (!match) throw new Error('Parse failed — table structure may have changed');

    const value = parseFloat(match[1].replace(/,/g, ''));
    if (isNaN(value) || value < 100) throw new Error('Implausible value');

    /* Extract change if present */
    const changeMatch = html.match(/>\s*([-+]?[\d,]+\.?\d*)\s*<\/td>[\s\S]*?>\s*([-+]?[\d.]+%)\s*<\/td>/);
    const change    = changeMatch ? parseFloat(changeMatch[1].replace(/,/g, '')) : null;
    const changePct = changeMatch ? changeMatch[2] : null;

    res.status(200).json({
      value,
      change,
      changePct,
      source: 'StockQ / Baltic Exchange',
      asOf: new Date().toISOString(),
      fallback: false,
    });
  } catch (err) {
    console.error('BAID scrape error:', err.message);
    res.status(200).json({
      value: FALLBACK,
      change: null,
      changePct: null,
      source: 'StockQ / Baltic Exchange (cached)',
      asOf: null,
      fallback: true,
    });
  }
}
