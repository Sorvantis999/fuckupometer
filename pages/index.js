import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';

const EVENTS = [
  { date: 'Jan 1',  color: '#639922', label: 'Pre-inauguration. WTI: ~$70. Trump promises $40 oil.', price: 70 },
  { date: 'Jan 20', color: '#3B6D11', label: 'Inauguration. "Drill baby drill." WTI: ~$76.', price: 76 },
  { date: 'Feb 10', color: '#BA7517', label: 'US-Iran nuclear talks in Oman briefly calm markets. WTI dips to ~$63.', price: 63 },
  { date: 'Feb 25', color: '#BA7517', label: 'Strait of Hormuz traffic severely disrupted. Tankers rerouting.', price: 78 },
  { date: 'Mar 9',  color: '#E24B4A', label: "🔥 Israel bombs 30 Iranian oil depots. WTI rockets to $119.48 — a 3.75-year high. Trump says it'll be \"over soon.\"", price: 119.48 },
  { date: 'Mar 11', color: '#993C1D', label: 'IEA releases 400M barrels emergency reserves — largest in history. Missiles hit 3 more vessels in the Strait anyway.', price: 87.25 },
  { date: 'Mar 12', color: '#E24B4A', label: 'Today. The war is apparently not over.', price: null },
];

function Thermometer({ fuckupFactor }) {
  const pct = Math.min(100, Math.max(0, fuckupFactor));
  const mercuryColor = pct < 30 ? '#639922' : pct < 55 ? '#BA7517' : pct < 80 ? '#D85A30' : '#E24B4A';

  const tubeTop = 20;
  const tubeBottom = 240;
  const tubeH = tubeBottom - tubeTop;
  const mercuryH = (pct / 100) * tubeH;
  const mercuryY = tubeBottom - mercuryH;

  const ticks = [
    { pct: 100, label: 'Completely unbelievably fucked up' },
    { pct: 75,  label: 'Very fucked up' },
    { pct: 50,  label: 'Significantly fucked up' },
    { pct: 25,  label: 'A little fucked up' },
    { pct: 0,   label: 'Not fucked up' },
  ];

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '0.5rem 0' }}>
      <svg width="52" height="290" viewBox="0 0 52 290" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
        <defs>
          <clipPath id="tubeClip">
            <rect x="18" y={tubeTop} width="14" height={tubeH + 16} rx="7"/>
          </clipPath>
        </defs>
        {/* Tube background */}
        <rect x="18" y={tubeTop} width="14" height={tubeH + 16} rx="7" fill="#f0efe8" stroke="#cccbc4" strokeWidth="1.5"/>
        {/* Mercury */}
        <rect
          x="20" y={mercuryY}
          width="10"
          height={tubeH - (mercuryY - tubeTop) + 20}
          fill={mercuryColor}
          clipPath="url(#tubeClip)"
          style={{ transition: 'y 1.2s ease, height 1.2s ease, fill 0.8s ease' }}
        />
        {/* Bulb outline */}
        <circle cx="25" cy={tubeBottom + 28} r="18" fill="#f0efe8" stroke="#cccbc4" strokeWidth="1.5"/>
        {/* Bulb fill */}
        <circle cx="25" cy={tubeBottom + 28} r="13" fill={mercuryColor} style={{ transition: 'fill 0.8s ease' }}/>
        {/* Shine on bulb */}
        <ellipse cx="20" cy={tubeBottom + 23} rx="4" ry="3" fill="rgba(255,255,255,0.25)"/>
        {/* Tick marks */}
        {ticks.map(t => {
          const y = tubeBottom - (t.pct / 100) * tubeH;
          return <line key={t.pct} x1="18" y1={y} x2="13" y2={y} stroke="#aaa" strokeWidth="1.5" strokeLinecap="round"/>;
        })}
      </svg>

      {/* Tick labels — positioned to align with tick marks */}
      <div style={{ position: 'relative', height: '260px', flex: 1 }}>
        {ticks.map(t => {
          const topPx = tubeTop + (1 - t.pct / 100) * tubeH - 7;
          return (
            <div key={t.pct} style={{
              position: 'absolute',
              top: `${topPx}px`,
              fontSize: '12px',
              color: t.pct === 100 ? '#a32d2d' : t.pct === 0 ? '#3B6D11' : '#888',
              fontWeight: t.pct === 100 || t.pct === 0 ? 500 : 400,
              lineHeight: 1.3,
            }}>
              {t.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function OilChart({ chartReady }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!chartReady || !canvasRef.current) return;
    let cancelled = false;
    fetch('/api/history')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data.points || !canvasRef.current) return;
        if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
        const labels = data.points.map(p => {
          const d = new Date(p.date + 'T12:00:00Z');
          return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;
        });
        const values = data.points.map(p => p.close);
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new window.Chart(ctx, {
          type: 'line',
          data: {
            labels,
            datasets: [
              {
                label: 'WTI $/bbl',
                data: values,
                borderColor: '#E24B4A',
                backgroundColor: 'rgba(226,75,74,0.07)',
                borderWidth: 2.5,
                pointRadius: 3,
                pointBackgroundColor: '#E24B4A',
                tension: 0.35,
                fill: true,
              },
              {
                label: 'Inauguration baseline ($76)',
                data: labels.map(() => 76),
                borderColor: '#639922',
                borderWidth: 1.5,
                borderDash: [5, 4],
                pointRadius: 0,
                fill: false,
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: c => c.dataset.label.includes('baseline')
                    ? ' Inaug. baseline: $76'
                    : ` $${c.parsed.y.toFixed(2)}/bbl`,
                }
              }
            },
            scales: {
              y: {
                min: 55, max: 130,
                ticks: { callback: v => '$' + v, color: '#888780', font: { size: 11 } },
                grid: { color: 'rgba(0,0,0,0.05)' },
              },
              x: {
                ticks: { color: '#888780', font: { size: 10 }, maxRotation: 30, autoSkip: true, maxTicksLimit: 12 },
                grid: { display: false },
              }
            }
          }
        });
      });
    return () => { cancelled = true; };
  }, [chartReady]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '220px' }}>
      <canvas ref={canvasRef}/>
    </div>
  );
}

function CommodityCard({ c }) {
  const isUp = c.changePct >= 0;
  const sinceUp = c.sinceInaugPct >= 0;
  return (
    <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '10px', padding: '0.85rem 1rem' }}>
      <p style={{ margin: '0 0 1px', fontSize: '12px', color: '#888', lineHeight: 1.3 }}>{c.label}</p>
      {c.note && <p style={{ margin: '0 0 4px', fontSize: '10px', color: '#ccc', fontStyle: 'italic' }}>{c.note}</p>}
      <p style={{ margin: '0 0 3px', fontSize: '1.25rem', fontWeight: 600, letterSpacing: '-0.01em' }}>
        {c.unit === '$/gal' ? `$${c.price}` : c.unit.startsWith('cents') ? `${c.price}¢` : `$${c.price}`}
        <span style={{ fontSize: '11px', fontWeight: 400, color: '#aaa', marginLeft: '3px' }}>{c.unit}</span>
      </p>
      <p style={{ margin: '0 0 1px', fontSize: '11px', color: isUp ? '#a32d2d' : '#3B6D11' }}>
        {isUp ? '▲' : '▼'} {Math.abs(c.changePct)}% today
      </p>
      <p style={{ margin: 0, fontSize: '11px', fontWeight: 500, color: sinceUp ? '#a32d2d' : '#3B6D11' }}>
        {sinceUp ? '+' : ''}{c.sinceInaugPct}% since inaug.
      </p>
    </div>
  );
}

export default function Home() {
  const [data, setData]             = useState(null);
  const [commodities, setCommodities] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError]           = useState(null);
  const [chartReady, setChartReady] = useState(false);

  const fetchAll = useCallback(async () => {
    try {
      const [oilRes, comRes] = await Promise.all([fetch('/api/oil'), fetch('/api/commodities')]);
      const [oil, com] = await Promise.all([oilRes.json(), comRes.json()]);
      setData(oil);
      setCommodities(com.commodities);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Failed to fetch live prices — markets may be closed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const price        = data ? parseFloat(data.price) : 96.34;
  const fuckupFactor = data ? parseFloat(data.fuckupFactor) : 47;
  const isUp         = data ? parseFloat(data.change) >= 0 : true;

  const getRating = p => {
    if (p >= 75) return { label: 'MAXIMUM FUCKUP',     color: '#E24B4A' };
    if (p >= 50) return { label: 'SIGNIFICANT FUCKUP', color: '#D85A30' };
    if (p >= 25) return { label: 'ELEVATED FUCKUP',    color: '#BA7517' };
    return             { label: 'MANAGEABLE FUCKUP',   color: '#639922' };
  };
  const rating = getRating(fuckupFactor);
  const card = { background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.25rem 1.5rem' };

  return (
    <>
      <Head>
        <title>Trump Fuckupometer™ — Live Oil Price Tracker</title>
        <meta name="description" content="For when 'drill baby drill' meets a little excursion/war." />
        <meta property="og:title" content="Trump Fuckupometer™" />
        <meta property="og:description" content={`WTI crude: $${price.toFixed(2)}/bbl — ${data?.sinceInaugurationPct ?? '~27'}% higher than on Inauguration Day.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛢️</text></svg>"/>
      </Head>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" onReady={() => setChartReady(true)}/>

      <div style={{ minHeight: '100vh', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', background: '#fafaf8', color: '#1a1a18' }}>

        <div style={{ borderBottom: '0.5px solid #e0dfd8', background: '#fff', padding: '0.85rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '12px', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>The Long Memo</span>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            <button onClick={fetchAll} style={{ marginLeft: '8px', background: 'none', border: '0.5px solid #ddd', borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: '#888' }}>↻</button>
          </div>
        </div>

        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'inline-block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em', padding: '3px 10px', borderRadius: '20px', background: '#fcebeb', color: '#a32d2d', textTransform: 'uppercase', marginBottom: '12px' }}>Live market tracker</div>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>Trump Fuckupometer™</h1>
            <p style={{ fontSize: '1.05rem', color: '#666', margin: 0, lineHeight: 1.6 }}>
              WTI crude oil, indexed to Inauguration Day 2026.<br/>
              <em>For when "drill baby drill" meets a little excursion/war.</em>
            </p>
          </div>

          {error && <div style={{ background: '#fff8e6', border: '0.5px solid #fac775', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '13px', color: '#854f0b' }}>{error}</div>}

          {/* Hero metrics */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
            <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>WTI crude — live</p>
              <p style={{ margin: '0 0 4px', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', color: loading ? '#ccc' : '#1a1a18' }}>${loading ? '—' : parseFloat(data?.price).toFixed(2)}</p>
              {data && <p style={{ margin: 0, fontSize: '12px', color: isUp ? '#a32d2d' : '#3B6D11' }}>{isUp ? '▲' : '▼'} ${Math.abs(parseFloat(data.change)).toFixed(2)} ({isUp ? '+' : ''}{data.changePct}%) today</p>}
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>Since Jan 20 inauguration</p>
              <p style={{ margin: '0 0 4px', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#a32d2d' }}>+{data ? data.sinceInaugurationPct : '~27'}%</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#a32d2d' }}>+${data ? data.sinceInauguration : '~20'} vs baseline $76</p>
            </div>
            <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>Current fuckup level</p>
              <p style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 600, color: rating.color, lineHeight: 1.3 }}>{rating.label}</p>
              <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>Peak: $119.48 (Mar 9)</p>
            </div>
          </div>

          {/* Thermometer */}
          <div style={{ ...card, marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>Fuckupometer™</h2>
            <Thermometer fuckupFactor={fuckupFactor}/>
            <div style={{ borderTop: '0.5px solid #f0efe8', marginTop: '1rem', paddingTop: '1rem', fontSize: '13px', color: '#666', fontStyle: 'italic', lineHeight: 1.6 }}>
              "We're going to get the price of energy down... get it down fast... we're going to drill, baby, drill."
              <span style={{ color: '#aaa', fontStyle: 'normal' }}> — Donald J. Trump, Jan 20, 2026</span>
              <br/>
              <span style={{ color: '#a32d2d', fontStyle: 'normal' }}>WTI on that day: ~$76. Today: ${price.toFixed(2)}.</span>
            </div>
          </div>

          {/* 30-day chart */}
          <div style={{ ...card, marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '8px' }}>
              <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: 0 }}>WTI crude — 30-day price</h2>
              <div style={{ display: 'flex', gap: '14px', fontSize: '11px', color: '#888' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '16px', height: '2.5px', background: '#E24B4A', display: 'inline-block', borderRadius: '2px' }}></span>WTI price
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '16px', borderTop: '2px dashed #639922', display: 'inline-block' }}></span>Inaug. baseline ($76)
                </span>
              </div>
            </div>
            <OilChart chartReady={chartReady}/>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: '#ccc' }}>
              <span>30 days ago</span><span>Today</span>
            </div>
          </div>

          {/* War economy commodities */}
          <div style={{ ...card, marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 6px' }}>War economy dashboard</h2>
            <p style={{ fontSize: '13px', color: '#aaa', margin: '0 0 1rem', lineHeight: 1.6 }}>What else moves when a Strait closes and a president promises cheap energy.</p>
            {commodities ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                {commodities.map((c, i) => <CommodityCard key={i} c={c}/>)}
              </div>
            ) : (
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', color: '#ccc' }}>Loading commodities…</div>
            )}
            <p style={{ fontSize: '10px', color: '#ccc', margin: '12px 0 0', lineHeight: 1.5 }}>
              Fertilizer tracked via CF Industries (NYSE: CF) — largest US urea producer. Urea is an OTC market with no liquid exchange-traded futures. All inauguration baselines estimated from Jan 20, 2026 market close.
            </p>
          </div>

          {/* Timeline */}
          <div style={{ ...card, marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 1.25rem' }}>How we got here</h2>
            {EVENTS.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: e.color, flexShrink: 0, marginTop: '4px' }}/>
                <div>
                  <span style={{ fontSize: '12px', color: '#aaa', display: 'inline-block', minWidth: '44px', marginRight: '8px' }}>{e.date}</span>
                  <span style={{ fontSize: '13.5px', color: '#333', lineHeight: 1.55 }}>
                    {e.label}
                    {e.price && <span style={{ color: '#bbb' }}> WTI: ${e.price}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Context */}
          <div style={{ ...card, marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '13px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 1rem' }}>Why this matters</h2>
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#444', margin: '0 0 1rem' }}>
              The Strait of Hormuz handles approximately 20% of global oil flow. The effective closure has caused a supply shock US domestic production cannot remedy. The "shale patch" surrendered drilling capacity when oil sat at $55 in late 2025 — those rigs don't come back in weeks.
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#444', margin: 0 }}>
              The IEA's 400M barrel emergency release stabilized prices briefly before fresh Hormuz attacks pushed them back up. The EIA forecasts Brent above $95 through Q2 2026. Fertilizer prices matter because urea is a natural gas derivative — energy price shocks travel straight into your food supply.
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>Want the actual analysis? Read <strong>The Long Memo</strong>.</p>
            <a href="https://thelongmemo.substack.com" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', padding: '10px 24px', background: '#1a1a18', color: '#fff', borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
              Read The Long Memo →
            </a>
          </div>

          <div style={{ borderTop: '0.5px solid #e0dfd8', paddingTop: '1rem', fontSize: '11px', color: '#bbb', lineHeight: 1.7 }}>
            Data: WTI (CL=F), Natural Gas (NG=F), Gasoline (RB=F), Wheat (ZW=F), Corn (ZC=F), CF Industries (CF) via Yahoo Finance. Refreshes every 5 min. Not financial advice. This is a gag. A very accurate gag. &nbsp;·&nbsp; <a href="https://thelongmemo.substack.com" style={{ color: '#bbb' }}>The Long Memo</a>
          </div>
        </div>
      </div>
    </>
  );
}
