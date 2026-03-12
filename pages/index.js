import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';

const EVENTS = [
  { date: 'Jan 1', label: 'Pre-inauguration. WTI: ~$70. Trump promises $40 oil.', color: '#639922', price: 70 },
  { date: 'Jan 20', label: 'Inauguration Day. "Drill baby drill." WTI: ~$76.', color: '#3B6D11', price: 76 },
  { date: 'Feb 10', label: 'US-Iran talks in Oman calm markets briefly. WTI dips to ~$63.', color: '#BA7517', price: 63 },
  { date: 'Feb 25', label: 'Strait of Hormuz traffic severely disrupted. Tankers rerouting.', color: '#BA7517', price: 78 },
  { date: 'Mar 9', label: '🔥 Israel bombs 30 Iranian oil depots. WTI rockets to $119.48 — a 3.75-year high. Trump says it\'ll be "over soon."', color: '#E24B4A', price: 119.48 },
  { date: 'Mar 11', label: 'IEA releases 400M barrels emergency reserves — largest in history. Missiles hit 3 vessels in the Strait anyway.', color: '#993C1D', price: 87.25 },
  { date: 'Mar 12', label: 'Today. The war is apparently not over.', color: '#E24B4A', price: null },
];

function GaugeMeter({ fuckupFactor, price }) {
  const MIN_PRICE = 76;
  const MAX_PRICE = 125;
  const pct = Math.min(100, Math.max(0, ((price - MIN_PRICE) / (MAX_PRICE - MIN_PRICE)) * 100));

  const zones = [
    { label: 'Normal', range: '< $80', color: '#639922' },
    { label: 'Elevated', range: '$80–95', color: '#BA7517' },
    { label: 'Chaos', range: '$95–110', color: '#D85A30' },
    { label: 'Full send', range: '$110+', color: '#E24B4A' },
  ];

  return (
    <div style={{ margin: '2rem 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '13px', color: '#888' }}>Fuckupometer™ reading</span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: pct > 50 ? '#E24B4A' : '#639922' }}>
          {fuckupFactor}% of max recorded chaos
        </span>
      </div>
      <div style={{
        height: '20px', borderRadius: '10px', position: 'relative',
        background: 'linear-gradient(90deg, #C0DD97 0%, #FAC775 45%, #F09595 72%, #E24B4A 100%)',
        overflow: 'visible'
      }}>
        <div style={{
          position: 'absolute', top: '-5px',
          left: `calc(${pct}% - 2px)`,
          width: '4px', height: '30px',
          background: '#111', borderRadius: '2px',
          transition: 'left 1s ease',
          boxShadow: '0 0 0 2px white',
        }} />
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
        {zones.map(z => (
          <div key={z.label} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#666' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: z.color, display: 'inline-block' }} />
            <span>{z.label} <span style={{ color: '#aaa' }}>({z.range})</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/oil');
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      setData(json);
      setLastUpdated(new Date());
      setError(null);
    } catch (e) {
      setError('Failed to fetch live price — markets may be closed.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const price = data ? parseFloat(data.price) : 96.34;
  const fuckupFactor = data ? parseFloat(data.fuckupFactor) : 46.1;
  const sinceInaugPct = data ? parseFloat(data.sinceInaugurationPct) : 26.8;
  const isUp = data ? parseFloat(data.change) >= 0 : true;

  const getRating = (pct) => {
    if (pct >= 75) return { label: 'MAXIMUM FUCKUP', color: '#E24B4A' };
    if (pct >= 50) return { label: 'SIGNIFICANT FUCKUP', color: '#D85A30' };
    if (pct >= 25) return { label: 'ELEVATED FUCKUP', color: '#BA7517' };
    return { label: 'MANAGEABLE FUCKUP', color: '#639922' };
  };

  const rating = getRating(fuckupFactor);

  return (
    <>
      <Head>
        <title>Trump Fuckupometer™ — Live Oil Price Tracker</title>
        <meta name="description" content="Tracking WTI crude oil prices since Inauguration Day 2026. For when 'drill baby drill' meets reality." />
        <meta property="og:title" content="Trump Fuckupometer™" />
        <meta property="og:description" content={`WTI crude: $${price.toFixed(2)}/bbl — ${sinceInaugPct.toFixed(1)}% higher than on Inauguration Day.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛢️</text></svg>" />
      </Head>

      <div style={{
        minHeight: '100vh',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        background: '#fafaf8',
        color: '#1a1a18',
        padding: '0',
      }}>

        {/* Header */}
        <div style={{ borderBottom: '0.5px solid #e0dfd8', background: '#fff', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '12px', color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase' }}>The Long Memo</span>
          </div>
          <div style={{ fontSize: '12px', color: '#aaa' }}>
            {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Loading...'}
            <button onClick={fetchData} style={{
              marginLeft: '8px', background: 'none', border: '0.5px solid #ddd',
              borderRadius: '4px', padding: '2px 8px', fontSize: '11px', cursor: 'pointer', color: '#888'
            }}>↻</button>
          </div>
        </div>

        <div style={{ maxWidth: '780px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Title block */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'inline-block', fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em',
              padding: '3px 10px', borderRadius: '20px',
              background: '#fcebeb', color: '#a32d2d',
              textTransform: 'uppercase', marginBottom: '12px'
            }}>
              Live market tracker
            </div>
            <h1 style={{ fontSize: '2.6rem', fontWeight: 700, margin: '0 0 8px', lineHeight: 1.15, letterSpacing: '-0.02em' }}>
              Trump Fuckupometer™
            </h1>
            <p style={{ fontSize: '1.05rem', color: '#666', margin: 0, lineHeight: 1.6 }}>
              WTI crude oil, indexed to Inauguration Day 2026.<br />
              <em>For when "drill baby drill" meets reality.</em>
            </p>
          </div>

          {/* Live price hero */}
          {error && (
            <div style={{ background: '#fff8e6', border: '0.5px solid #fac775', borderRadius: '8px', padding: '10px 14px', marginBottom: '1.5rem', fontSize: '13px', color: '#854f0b' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px', marginBottom: '1.5rem' }}>
            {/* Live price */}
            <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>WTI crude — live</p>
              <p style={{ margin: '0 0 4px', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', color: loading ? '#ccc' : '#1a1a18' }}>
                ${loading ? '—' : parseFloat(data?.price).toFixed(2)}
              </p>
              {data && (
                <p style={{ margin: 0, fontSize: '12px', color: isUp ? '#a32d2d' : '#3B6D11' }}>
                  {isUp ? '▲' : '▼'} ${Math.abs(parseFloat(data.change)).toFixed(2)} ({isUp ? '+' : ''}{data.changePct}%) today
                </p>
              )}
            </div>

            {/* Since inauguration */}
            <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>Since Jan 20 inauguration</p>
              <p style={{ margin: '0 0 4px', fontSize: '2rem', fontWeight: 600, letterSpacing: '-0.02em', color: '#a32d2d' }}>
                +{data ? data.sinceInaugurationPct : '~27'}%
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#a32d2d' }}>
                +${data ? data.sinceInauguration : '~20'} vs baseline $76
              </p>
            </div>

            {/* Rating */}
            <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.1rem 1.2rem' }}>
              <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#888' }}>Current fuckup level</p>
              <p style={{ margin: '0 0 4px', fontSize: '1.1rem', fontWeight: 600, color: rating.color, lineHeight: 1.3 }}>
                {rating.label}
              </p>
              <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>
                Peak: $119.48 (Mar 9)
              </p>
            </div>
          </div>

          {/* Gauge */}
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <GaugeMeter fuckupFactor={fuckupFactor} price={price} />

            {/* Inauguration promise callout */}
            <div style={{
              borderTop: '0.5px solid #f0efe8', marginTop: '1rem', paddingTop: '1rem',
              fontSize: '13px', color: '#666', fontStyle: 'italic', lineHeight: 1.6
            }}>
              "We're going to get the price of energy down... get it down fast... we're going to drill, baby, drill."
              <span style={{ color: '#aaa', fontStyle: 'normal' }}> — Donald J. Trump, Jan 20, 2026</span>
              <br />
              <span style={{ color: '#a32d2d', fontStyle: 'normal' }}>WTI on that day: ~$76. Today: ${price.toFixed(2)}.</span>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 1.25rem' }}>
              How we got here
            </h2>
            {EVENTS.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '12px', marginBottom: '14px', alignItems: 'flex-start' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: e.color, flexShrink: 0, marginTop: '4px' }} />
                <div>
                  <span style={{ fontSize: '12px', color: '#aaa', display: 'inline-block', minWidth: '44px', marginRight: '8px' }}>{e.date}</span>
                  <span style={{ fontSize: '13.5px', color: '#333', lineHeight: 1.55 }}>
                    {e.label}
                    {e.price && e.price !== price && <span style={{ color: '#aaa' }}> WTI: ${e.price}</span>}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Context / analysis blurb */}
          <div style={{ background: '#fff', border: '0.5px solid #e0dfd8', borderRadius: '12px', padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '14px', fontWeight: 500, color: '#888', letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 1rem' }}>
              Why this matters
            </h2>
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#444', margin: '0 0 1rem' }}>
              The Strait of Hormuz handles approximately 20% of global oil flow. The effective closure, triggered by the US-Iran conflict that began in late February, has caused a supply shock that US domestic production cannot remedy. The "shale patch" surrendered drilling capacity when oil sat at $55 in late 2025 — those rigs don't come back in weeks.
            </p>
            <p style={{ fontSize: '14px', lineHeight: 1.75, color: '#444', margin: 0 }}>
              The IEA's 400M barrel emergency release — the largest in history — stabilized prices briefly before fresh Hormuz attacks pushed them back up. The EIA now forecasts Brent above $95 through Q2 2026, before declining if the conflict resolves. Gas prices are following crude with their usual "rockets and feathers" dynamic.
            </p>
          </div>

          {/* CTA */}
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ fontSize: '14px', color: '#888', marginBottom: '12px' }}>
              Want the actual analysis? Read <strong>The Long Memo</strong>.
            </p>
            <a href="https://thelongmemo.substack.com" target="_blank" rel="noopener noreferrer" style={{
              display: 'inline-block', padding: '10px 24px', background: '#1a1a18', color: '#fff',
              borderRadius: '8px', fontSize: '14px', fontWeight: 500, textDecoration: 'none',
              letterSpacing: '0.01em'
            }}>
              Read The Long Memo →
            </a>
          </div>

          {/* Footer */}
          <div style={{ borderTop: '0.5px solid #e0dfd8', paddingTop: '1rem', fontSize: '11px', color: '#bbb', lineHeight: 1.7 }}>
            Data: WTI crude futures (CL=F) via Yahoo Finance. Refreshes every 5 minutes. Inauguration baseline ~$76 WTI. Crisis peak $119.48 confirmed Mar 9, 2026.
            Not financial advice. Obviously. This is a gag. A very accurate gag. &nbsp;·&nbsp; <a href="https://thelongmemo.substack.com" style={{ color: '#bbb' }}>The Long Memo</a>
          </div>
        </div>
      </div>
    </>
  );
}
