import { useState, useEffect, useCallback, useRef } from 'react';
import Head from 'next/head';
import Script from 'next/script';

/* ─── Brand tokens ───────────────────────────────────────────────────────────── */
const T = {
  bg:        '#F5F0E6',
  bgCard:    '#FFFFFF',
  bgTint:    '#EDE8DC',
  border:    '#CEC8B8',
  borderDk:  '#B0A898',
  ink:       '#1C1410',
  inkMid:    '#6B6258',
  inkMuted:  '#9C9590',
  slate:     '#2B4870',
  slateDk:   '#1A2535',
  slateMid:  '#3D5F8F',
  slateLt:   '#4E709C',
  slatePale: '#E8EDF5',
  terra:     '#B85C38',
  terraM:    '#C97A5E',
  terraPale: '#F5E8E2',
  red:       '#C0392B',
  green:     '#2E7D4F',
  amber:     '#B8860B',
};

const FONTS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Source+Serif+4:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: ${T.bg}; }
  ::selection { background: ${T.terraPale}; }
  ::-webkit-scrollbar { width: 6px; background: ${T.bg}; }
  ::-webkit-scrollbar-thumb { background: ${T.border}; border-radius: 3px; }
`;

/* War started Feb 28, 2026 — Pentagon counts elapsed days (Feb 28 = Day 0) */
const WAR_START = new Date('2026-02-28T00:00:00Z');
function getDayCount() {
  const now = new Date();
  return Math.max(0, Math.floor((now - WAR_START) / (1000 * 60 * 60 * 24)));
}

/* ─── Trump Said vs Reality ──────────────────────────────────────────────────── */
const TRUMP_SAID = [
  {
    date: 'Jan 20, 2025',
    said: '"We\'re going to get the price of energy down — drill, baby, drill."',
    reality: 'WTI on inauguration day: $76. Today: live above. A very small price to pay.',
  },
  {
    date: 'Mar 1, 2026',
    said: '"Whatever it takes, we projected four to five weeks."',
    reality: 'Day 2 of the war. He has since said it will be over "very soon" approximately nine times.',
  },
  {
    date: 'Mar 9, 2026',
    said: '"It will be over soon."',
    reality: 'WTI hit $119.48 that day. Iran appointed a new Supreme Leader. Markets did not agree.',
  },
  {
    date: 'Mar 10, 2026',
    said: '"I\'m thinking about taking over the Strait of Hormuz."',
    reality: 'Iran mined it instead. 95% drop in ship transits. The thinking continues.',
  },
  {
    date: 'Mar 11, 2026',
    said: '"We won."',
    reality: 'Day 12. Three more vessels struck in the Strait on the same day.',
  },
  {
    date: 'Mar 13, 2026',
    said: '"Iran will take years to rebuild."',
    reality: 'Khamenei simultaneously vowed to keep the Hormuz blockade in place. Oil: still above $100.',
  },
];

/* ─── Hormuz stat ────────────────────────────────────────────────────────────── */
const HORMUZ = {
  dropPct: 95,
  kplerDropPct: 92,
  src: 'S&P Global Market Intelligence (95%, week of Mar 1); Kpler vessel tracking (92%, week of Mar 12)',
  shipsStruck: 13,
  shipsSrc: 'USNI News, Mar 10',
};

const EVENTS_2025 = [
  { date: 'Jan 20', tier: 'baseline', label: 'Inauguration. "We\'re going to get the price of energy down — drill, baby, drill." WTI: ~$76. Simultaneously, the US begins amassing the largest air power armada in the Middle East since the 2003 Iraq invasion.' },
  { date: 'Jun 13', tier: 'critical', label: 'Israel launches multipronged strikes on Iran\'s nuclear facilities, military sites, and senior commanders. Brent spikes 8.8% intraday to ~$75.5. Iran retaliates with missile attacks on Israel.' },
  { date: 'Jun 22', tier: 'critical', label: 'US B-2 bombers and Tomahawk missiles strike Fordow, Natanz, and Isfahan nuclear facilities — "Operation Midnight Hammer." First direct US attack on Iranian territory since 1988. WTI briefly touches low $80s, then retraces.' },
  { date: 'Jun 23', tier: 'neutral',  label: 'Ceasefire announced. Oil closes down. Markets read it as contained. Iran parliament voted to close the Strait — Supreme National Security Council declines. For now.' },
  { date: 'Oct',    tier: 'neutral',  label: 'Ceasefire holds. WTI settles back into the $60s. OPEC+ floods the market. "Drill baby drill" is working great in a world where supply exceeds demand.' },
  { date: 'Nov–Dec', tier: 'neutral', label: 'WTI crashes to ~$55 — lowest in four years. Shale patch surrenders. Dallas Fed: producers need $65 to profitably drill. Rigs stop. Nobody talks about this later.' },
  { date: 'Dec 28', tier: 'critical', label: 'Protests erupt across Iran. BNEF notes rising call skew in WTI options — traders quietly pricing upside risk. Oil climbs above $66. No war premium yet. Just a whisper.' },
];

const EVENTS_2026 = [
  { date: 'Jan 12', tier: 'critical', label: 'Trump announces 25% tariff on any country doing business with Iran, "effective immediately." Brent options skews spike nearly 19 points. The ceasefire is still technically in place.' },
  { date: 'Feb 10', tier: 'neutral',  label: 'US–Iran nuclear talks in Oman. Markets briefly believe it. WTI dips to $63. The military buildup in the Gulf continues regardless.' },
  { date: 'Feb 27', tier: 'neutral',  label: 'EIA reports US crude inventories rose 3.5M barrels the prior week. WTI closes at ~$67. A White House source later says Trump\'s "energy team had a strong game plan to keep markets stable well before Operation Epic Fury began."' },
  { date: 'Feb 28', tier: 'critical', label: 'Operation Epic Fury begins. ~900 US–Israeli strikes in the first 12 hours. Khamenei killed. IRGC announces the Strait of Hormuz is closed and will set any ship that tries to pass on fire.' },
  { date: 'Mar 1',  tier: 'critical', label: 'First 3 US KIA confirmed. Iran launches massive retaliatory barrage across the Gulf. OPEC+ raises production quota 220k bpd — 60% above the expected adjustment — to "mute upside pressure." It does not.' },
  { date: 'Mar 2',  tier: 'critical', label: 'US embassy Kuwait struck. Girls school in Minab hit — 148–180 dead (disputed). QatarEnergy ceases LNG production from its 77 mtpa Ras Laffan facility. 6 more US KIA in Kuwait.' },
  { date: 'Mar 3',  tier: 'critical', label: 'Goldman Sachs estimates a $14/bbl war premium now embedded in prices. Iraq\'s southern oilfields collapse 70% to 1.3M bpd. Kuwait and UAE announce precautionary production cuts.' },
  { date: 'Mar 9',  tier: 'peak',     label: 'Israel bombs 30 Iranian oil depots. WTI spikes to $119.48 — a 3.75-year high. Mojtaba Khamenei appointed new Supreme Leader: markets read it as Tehran digging in. Trump: "It will be over soon."' },
  { date: 'Mar 10', tier: 'critical', label: 'Trump says he is "thinking about taking over" the Strait of Hormuz. Floats lifting Russia oil sanctions to ease prices. Iran FM calls it "Operation Epic Mistake" and posts that commodities are "skyrocketing." Saudi Arabia quietly shuts Safaniya and Zuluf offshore fields.' },
  { date: 'Mar 11', tier: 'critical', label: 'IEA releases 400M barrels — largest emergency reserve release in history. G7 finance ministers convene on coordinated response. Three more vessels struck in the Strait regardless.' },
  { date: 'Mar 12', tier: 'critical', label: 'Mojtaba Khamenei issues first statement as Supreme Leader — read by a state TV anchor over a still photo; he has not been seen in public since Feb 28, fueling speculation he was wounded in the strikes that killed his father. Vows Strait stays closed, threatens US bases in the region, and signals Iran is studying "other fronts where the enemy has little experience." WTI surges ~10% on the day to ~$96 on the statement. UK Defence Secretary confirms Iran is laying mines in the Strait. 3.2 million Iranians displaced.' },
  { date: 'Mar 13', tier: 'critical', label: 'US military aerial refueling tanker crashes in western Iraq, killing four of six crew. CENTCOM confirms rescue operations underway for two survivors. Largest single US military loss of the conflict to date.' },
  { date: 'Mar 13', tier: 'critical', label: 'Oil holds above $100 per barrel despite IEA 400M-barrel emergency reserve release and US Treasury sanctions waiver on stranded Russian seaborne crude. Neither measure moves prices. Analysts: structural Hormuz closure cannot be papered over by reserve releases.' },
  { date: 'Mar 13', tier: 'critical', label: 'Trump vows to hit Iran "very hard over the next week," claiming US strikes have damaged Iran so badly it will "take years to rebuild." Iran\'s new Supreme Leader Mojtaba Khamenei simultaneously issues first public statement vowing to maintain the Hormuz blockade — directly contradicting Trump\'s framing of a war approaching resolution.' },
  { date: 'Mar 13', tier: 'today',    label: 'Today. Live price above. Day 13. The war is apparently not over.' },
];

const tierDot = { baseline: T.green, neutral: T.amber, critical: T.terra, peak: T.red, today: T.red };

const BILL = [
  { label: 'US KIA',          value: '13',       sub: '6 killed Kuwait (Mar 1), 1 non-combat (Mar 9), 6 killed KC-135 crash Iraq (Mar 13). CNN confirms all aboard lost.', src: 'CENTCOM / CNN, Mar 13' },
  { label: 'US WIA',          value: '~140',     sub: '108 returned to duty; 8 remain severe', src: 'Pentagon, Mar 10' },
  { label: 'Iranian dead',    value: '1,348+',   sub: "Per Iran's UN representative. HRANA estimates up to 7,000. Trump administration claims 32,000.", src: 'Al Jazeera / UN, Mar 13' },
  { label: 'Iranian injured', value: '17,000+',  sub: "Confirmed by Iran's UN representative Amir Saeid Iravani", src: 'Al Jazeera, Mar 13' },
  { label: 'Lebanon dead',    value: '687',      sub: 'Since Israel renewed widespread attacks Mar 2. Includes 98 children.', src: 'Lebanon Information Minister, Mar 13' },
  { label: 'Minab school',    value: '148–180',  sub: 'Girls school, Minab, near Bandar Abbas. US disputes intentionality.', src: 'Iranian govt / Britannica (disputed)' },
  { label: 'Ships struck',    value: '20+',      sub: 'Vessels hit in Strait of Hormuz and Persian Gulf since Feb 28. Includes tankers, cargo, and one US-flagged vessel.', src: 'UKMTO / Reuters / Al Jazeera' },
  { label: 'Gulf civilians',  value: 'Dozens',   sub: 'UAE, Kuwait, Saudi Arabia, Bahrain — Iranian retaliatory strikes', src: 'Reuters / official statements' },
];

/* ─── Gauge ─────────────────────────────────────────────────────────────────── */
function Gauge({ pct }) {
  const p = Math.min(100, Math.max(0, pct));
  const zones = [
    { threshold: 0,   label: 'Not fucked up',                    color: T.green   },
    { threshold: 25,  label: 'More than a little fucked up',      color: T.amber   },
    { threshold: 50,  label: 'Significantly fucked up',           color: T.terra   },
    { threshold: 75,  label: 'Very fucked up',                    color: T.red     },
    { threshold: 100, label: 'Completely unbelievably fucked up', color: '#7B0000' },
  ];
  const activeIdx = zones.reduce((best, z, i) => (p >= z.threshold ? i : best), 0);
  return (
    <div style={{ width: '100%', padding: '0.25rem 0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <span style={{ display: 'inline-block', fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.5rem', fontStyle: 'italic', color: zones[activeIdx].color, borderBottom: `2px solid ${zones[activeIdx].color}`, paddingBottom: '2px', letterSpacing: '-0.01em' }}>
          {zones[activeIdx].label}
        </span>
      </div>
      <div style={{ position: 'relative', height: '16px', borderRadius: '2px', background: T.bgTint, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${T.green}22 0%, ${T.amber}22 25%, ${T.terra}33 50%, ${T.red}33 75%, #7B000044 100%)` }}/>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p}%`, background: `linear-gradient(90deg, ${T.green}, ${zones[activeIdx].color})`, opacity: 0.85, transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)' }}/>
        {[25, 50, 75].map(x => (
          <div key={x} style={{ position: 'absolute', left: `${x}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.6)' }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {zones.map((z, i) => (
          <div key={i} style={{ fontSize: '10px', fontFamily: "'Source Serif 4', Georgia, serif", color: i === activeIdx ? z.color : T.inkMuted, fontWeight: i === activeIdx ? 600 : 400, textAlign: i === 0 ? 'left' : i === zones.length - 1 ? 'right' : 'center', flex: 1, lineHeight: 1.3, letterSpacing: '0.01em' }}>
            {z.label}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '12px', color: T.inkMuted, letterSpacing: '0.04em' }}>
          Current reading: <strong style={{ color: zones[activeIdx].color }}>{p.toFixed(1)}%</strong> of maximum recorded fuckup
        </span>
      </div>
    </div>
  );
}

/* ─── Oil Chart ──────────────────────────────────────────────────────────────── */
function OilChart({ chartReady }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  useEffect(() => {
    if (!chartReady || !canvasRef.current) return;
    let cancelled = false;
    fetch('/api/history').then(r => r.json()).then(data => {
      if (cancelled || !data.points || !canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const labels = data.points.map(p => {
        const d = new Date(p.date + 'T12:00:00Z');
        return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;
      });
      const values = data.points.map(p => p.close);

      /* Scenario annotations */
      const scenarios = [
        { x: labels.length - 1, y: 85,  label: 'Ceasefire tomorrow', color: T.green },
        { x: labels.length - 1, y: 105, label: 'War +30 days',       color: T.amber },
        { x: labels.length - 1, y: 130, label: 'Hormuz closed 90d',  color: T.red   },
      ];

      chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'WTI $/bbl',
              data: values,
              borderColor: T.terra,
              backgroundColor: `${T.terra}12`,
              borderWidth: 2,
              pointRadius: 2.5,
              pointBackgroundColor: T.terra,
              tension: 0.35,
              fill: true,
            },
            {
              label: 'Inauguration baseline ($76)',
              data: labels.map(() => 76),
              borderColor: T.green,
              borderWidth: 1.5,
              borderDash: [4, 4],
              pointRadius: 0,
              fill: false,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => c.dataset.label.includes('baseline') ? ' Inaug. baseline: $76' : ` $${c.parsed.y.toFixed(2)}/bbl` } },
            annotation: window.ChartAnnotation ? {
              annotations: {
                ceasefire: { type: 'line', yMin: 85, yMax: 85, borderColor: T.green, borderWidth: 1, borderDash: [3,3], label: { display: true, content: 'Ceasefire ~$85', color: T.green, font: { size: 9 }, position: 'end' } },
                warPlus30: { type: 'line', yMin: 105, yMax: 105, borderColor: T.amber, borderWidth: 1, borderDash: [3,3], label: { display: true, content: 'War +30d ~$105', color: T.amber, font: { size: 9 }, position: 'end' } },
                hormuz90:  { type: 'line', yMin: 130, yMax: 130, borderColor: T.red, borderWidth: 1, borderDash: [3,3], label: { display: true, content: 'Hormuz closed 90d ~$130', color: T.red, font: { size: 9 }, position: 'end' } },
              }
            } : undefined,
          },
          scales: {
            y: {
              min: 55, max: 135,
              ticks: { callback: v => '$'+v, color: T.inkMuted, font: { size: 11, family: "'Source Serif 4', Georgia, serif" } },
              grid: { color: `${T.border}` },
              border: { color: T.border },
            },
            x: {
              ticks: { color: T.inkMuted, font: { size: 10, family: "'Source Serif 4', Georgia, serif" }, maxRotation: 30, autoSkip: true, maxTicksLimit: 12 },
              grid: { display: false },
              border: { color: T.border },
            },
          },
        },
      });
    });
    return () => { cancelled = true; };
  }, [chartReady]);
  return <div style={{ position: 'relative', width: '100%', height: '200px' }}><canvas ref={canvasRef}/></div>;
}

/* ─── Commodity Card ─────────────────────────────────────────────────────────── */
function CommodityCard({ c }) {
  const isUp  = c.changePct >= 0;
  const since = c.sinceInaugPct >= 0;
  return (
    <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderTop: `3px solid ${since ? T.terra : T.green}`, borderRadius: '2px', padding: '0.9rem 1rem' }}>
      <p style={{ margin: '0 0 2px', fontSize: '11px', fontFamily: "'Source Serif 4', Georgia, serif", color: T.inkMuted, letterSpacing: '0.04em', textTransform: 'uppercase' }}>{c.label}</p>
      {c.note && <p style={{ margin: '0 0 6px', fontSize: '10px', fontFamily: "'Source Serif 4', Georgia, serif", color: T.inkMuted, fontStyle: 'italic' }}>{c.note}</p>}
      <p style={{ margin: '0 0 4px', fontSize: '1.4rem', fontFamily: "'DM Serif Display', Georgia, serif", color: T.ink, lineHeight: 1 }}>
        {c.unit === '$/gal' ? `$${c.price}` : c.unit.startsWith('cents') ? `${c.price}¢` : `$${c.price}`}
      </p>
      <p style={{ margin: '0 0 1px', fontSize: '11px', fontFamily: "'Source Serif 4', Georgia, serif", color: isUp ? T.red : T.green }}>
        {isUp ? '▲' : '▼'} {Math.abs(c.changePct)}% today
      </p>
      <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: `1px solid ${T.border}` }}>
        <span style={{ fontSize: '11px', fontFamily: "'Source Serif 4', Georgia, serif", fontWeight: 600, color: since ? T.terra : T.green }}>
          {since ? '+' : ''}{c.sinceInaugPct}% since 1/20/25
        </span>
      </div>
    </div>
  );
}

/* ─── Gas Calculator ─────────────────────────────────────────────────────────── */
function GasCalc({ rbobPrice }) {
  const [mpg,   setMpg]   = useState(28);
  const [miles, setMiles] = useState(1000); /* ~avg American driver: 12k miles/year */

  /* RBOB futures → retail pump price: add ~$1.00 for federal/state taxes + retail margin */
  const RETAIL_MARKUP   = 1.00;
  const INAUG_RETAIL    = 3.13;  /* EIA national avg retail Jan 20, 2025 */
  const currentRetail   = rbobPrice ? parseFloat((rbobPrice + RETAIL_MARKUP).toFixed(2)) : 3.72;
  const extraPerGal     = currentRetail - INAUG_RETAIL;
  const galPerMonth     = miles / mpg;
  const extraPerMonth   = (extraPerGal * galPerMonth).toFixed(2);
  const extraPerYear    = (extraPerGal * galPerMonth * 12).toFixed(0);

  const serif = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.25rem' }}>
        <div>
          <label style={{ ...serif, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMuted, display: 'block', marginBottom: '6px' }}>
            Your MPG
          </label>
          <input
            type="number" value={mpg} min={10} max={80}
            onChange={e => setMpg(Math.max(1, parseFloat(e.target.value) || 1))}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: '2px', background: T.bgTint, ...serif, fontSize: '1.1rem', color: T.ink, outline: 'none' }}
          />
        </div>
        <div>
          <label style={{ ...serif, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMuted, display: 'block', marginBottom: '6px' }}>
            Miles / month
          </label>
          <input
            type="number" value={miles} min={100} max={5000}
            onChange={e => setMiles(Math.max(1, parseFloat(e.target.value) || 1))}
            style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.border}`, borderRadius: '2px', background: T.bgTint, ...serif, fontSize: '1.1rem', color: T.ink, outline: 'none' }}
          />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: T.border, borderRadius: '2px', overflow: 'hidden', marginBottom: '10px' }}>
        <div style={{ background: T.bgCard, padding: '1rem 1.25rem' }}>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkMuted }}>Pump price now</p>
          <p style={{ ...display, margin: 0, fontSize: '2rem', color: T.red, lineHeight: 1 }}>
            ${currentRetail.toFixed(2)}
          </p>
          <p style={{ ...serif, margin: '4px 0 0', fontSize: '11px', color: T.inkMuted }}>vs. $3.13 on 1/20/25</p>
        </div>
        <div style={{ background: T.bgCard, padding: '1rem 1.25rem' }}>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkMuted }}>Extra / month</p>
          <p style={{ ...display, margin: 0, fontSize: '2rem', color: parseFloat(extraPerMonth) > 0 ? T.red : T.green, lineHeight: 1 }}>
            ${extraPerMonth}
          </p>
          <p style={{ ...serif, margin: '4px 0 0', fontSize: '11px', color: T.inkMuted }}>at your mileage</p>
        </div>
        <div style={{ background: T.bgCard, padding: '1rem 1.25rem' }}>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkMuted }}>Annualized</p>
          <p style={{ ...display, margin: 0, fontSize: '2rem', color: parseFloat(extraPerYear) > 0 ? T.red : T.green, lineHeight: 1 }}>
            ${parseInt(extraPerYear).toLocaleString()}
          </p>
          <p style={{ ...serif, margin: '4px 0 0', fontSize: '11px', color: T.inkMuted }}>per year</p>
        </div>
      </div>
      <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: 0, fontStyle: 'italic', lineHeight: 1.7 }}>
        Pump price = RBOB futures + $1.00 (federal/state taxes + retail margin). Inauguration baseline: $3.13/gal (EIA national avg, Jan 20, 2025).
        Average US driver: ~1,000 miles/month, ~28 MPG. EIA projects retail gas could approach $5.00/gal in Q2 if Hormuz closure persists (JPMorgan, Mar 11).
      </p>
    </div>
  );
}

/* ─── Broader Cost Impact ────────────────────────────────────────────────────── */
function BroaderImpact() {
  const serif = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };

  /* Based on:
     - Fed Board research: 10% oil increase → food CPI +0.3%, core CPI +0.1% (FEDS Notes, Dec 2023)
     - WTI up ~25% from inauguration ($76 → $95+)
     - Average US household grocery spend: ~$550/month (BLS CES 2024)
     - JPMorgan/Goldman: airfare CPI up to 20% on jet fuel costs (CNBC, Mar 11)
     - Fertilizer (natural gas derivative): already embedded in food supply chain
  */
  const IMPACTS = [
    {
      label: 'Groceries',
      est: '+$15–30/mo',
      estColor: '#C0392B',
      note: 'Oil up ~25% from inaug → food CPI +~0.75%. Applied to avg household spend of ~$550/mo. Fertilizer (nat gas derivative) adds further upward pressure with 1–2 season lag.',
      src: 'Fed Board FEDS Notes, Dec 2023; BLS Consumer Expenditure Survey',
    },
    {
      label: 'Airfares',
      est: '+15–20%',
      estColor: '#C0392B',
      note: 'Jet fuel is ~25–30% of airline operating cost. With crude at $95+, JPMorgan projects airfare CPI could rise from 2.2% to ~20% if sustained through Q2.',
      src: 'JPMorgan Private Bank via CNBC, Mar 11, 2026',
    },
    {
      label: 'Consumables',
      est: '+$5–12/mo',
      estColor: '#B85C38',
      note: 'Petroleum is a primary input for plastics, packaging, cleaning products, and synthetic fibers. Core CPI +~0.25% at current oil levels; household impact ~$5–12/mo across consumables.',
      src: 'Fed Board FEDS Notes, Dec 2023; EIA oil-to-consumer analysis',
    },
    {
      label: 'Durables',
      est: '1–2% costlier',
      estColor: '#B8860B',
      note: 'Appliances, vehicles, electronics: oil price increases raise PPI (producer prices) faster than CPI. PPI pass-through to retail durables typically runs 3–6 months. Effect building.',
      src: 'ScienceDirect: Oil price shocks and inflation, 2025',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#CEC8B8', borderRadius: '2px', overflow: 'hidden' }}>
      {IMPACTS.map((item, i) => (
        <div key={i} style={{ background: '#FFFFFF', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
            <p style={{ ...serif, margin: 0, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9C9590' }}>{item.label}</p>
            <span style={{ ...display, fontSize: '1.1rem', color: item.estColor, lineHeight: 1 }}>{item.est}</span>
          </div>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '11px', color: '#6B6258', lineHeight: 1.6 }}>{item.note}</p>
          <p style={{ ...serif, margin: 0, fontSize: '10px', color: '#9C9590', fontStyle: 'italic' }}>{item.src}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Share Card ─────────────────────────────────────────────────────────────── */
function ShareCard({ price, sinceInaugPct, fuckupFactor, dayCount, onClose }) {
  const serif = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,20,16,0.72)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: T.slateDk, border: `1px solid rgba(255,255,255,0.1)`, borderTop: `4px solid ${T.terra}`, borderRadius: '4px', padding: '2rem', maxWidth: '480px', width: '100%' }}>
        <div style={{ ...serif, fontSize: '10px', letterSpacing: '0.2em', color: T.terraM, textTransform: 'uppercase', marginBottom: '0.5rem' }}>
          Trump Fuckupometer™ — The Long Memo
        </div>
        <div style={{ ...display, fontSize: '1.3rem', fontStyle: 'italic', color: '#F5F1EB', marginBottom: '1.5rem' }}>
          Day {dayCount} of Operation Epic Fury
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1px', background: 'rgba(255,255,255,0.1)', marginBottom: '1.5rem' }}>
          {[
            { label: 'WTI Crude', value: `$${price}`, color: '#F5F1EB' },
            { label: 'Since 1/20/25', value: `+${sinceInaugPct}%`, color: T.terraM },
            { label: 'Fuckup Level', value: `${fuckupFactor}%`, color: T.red },
          ].map((m, i) => (
            <div key={i} style={{ background: T.slateDk, padding: '0.9rem 1rem' }}>
              <p style={{ ...serif, margin: '0 0 4px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(245,241,235,0.45)' }}>{m.label}</p>
              <p style={{ ...display, margin: 0, fontSize: '1.4rem', color: m.color, lineHeight: 1 }}>{m.value}</p>
            </div>
          ))}
        </div>
        <div style={{ ...serif, fontSize: '11px', color: 'rgba(245,241,235,0.5)', marginBottom: '1.25rem', fontStyle: 'italic' }}>
          "We&apos;re going to get the price of energy down — drill, baby, drill." — Trump, Jan 20, 2025
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <a href={`https://twitter.com/intent/tweet?text=Day%20${dayCount}%20of%20Operation%20Epic%20Fury.%20WTI%3A%20%24${price}%2Fbbl%20(%2B${sinceInaugPct}%25%20since%20inauguration).%20%22Drill%20baby%20drill.%22%20%F0%9F%9B%A2%EF%B8%8F&url=https%3A%2F%2Ffuckupometer.thelongmemo.com`}
            target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', padding: '8px 18px', background: 'transparent', color: T.terraM, border: `1px solid ${T.terra}`, borderRadius: '2px', fontSize: '11px', textDecoration: 'none', ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Share on X →
          </a>
          <button onClick={onClose}
            style={{ padding: '8px 18px', background: 'transparent', color: 'rgba(245,241,235,0.4)', border: `1px solid rgba(255,255,255,0.1)`, borderRadius: '2px', fontSize: '11px', cursor: 'pointer', ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default function Home() {
  const [data,        setData]        = useState(null);
  const [commodities, setCommodities] = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error,       setError]       = useState(null);
  const [chartReady,  setChartReady]  = useState(false);
  const [showShare,   setShowShare]   = useState(false);
  const [dayCount,    setDayCount]    = useState(getDayCount());

  useEffect(() => {
    const t = setInterval(() => setDayCount(getDayCount()), 60000);
    return () => clearInterval(t);
  }, []);

  const fetchAll = useCallback(async () => {
    try {
      const [oilRes, comRes] = await Promise.all([fetch('/api/oil'), fetch('/api/commodities')]);
      const [oil, com] = await Promise.all([oilRes.json(), comRes.json()]);
      setData(oil); setCommodities(com.commodities);
      setLastUpdated(new Date()); setError(null);
    } catch { setError('Live data unavailable — markets may be closed.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchAll();
    const t = setInterval(fetchAll, 5 * 60 * 1000);
    return () => clearInterval(t);
  }, [fetchAll]);

  const price        = data ? parseFloat(data.price) : 96.34;
  const fuckupFactor = data ? parseFloat(data.fuckupFactor) : 47;
  const isUp         = data ? parseFloat(data.change) >= 0 : true;

  /* Current gas price from commodities */
  const gasPrice = commodities ? parseFloat(commodities.find(c => c.ticker === 'RB=F')?.price || 3.85) : 3.85;

  const section = {
    background: T.bgCard,
    border: `1px solid ${T.border}`,
    borderRadius: '2px',
    padding: '1.5rem',
    marginBottom: '1.25rem',
  };

  const sectionHead = {
    fontFamily: "'Source Serif 4', Georgia, serif",
    fontSize: '10px',
    letterSpacing: '0.18em',
    color: T.terra,
    textTransform: 'uppercase',
    margin: '0 0 1.25rem',
    paddingBottom: '0.75rem',
    borderBottom: `1px solid ${T.border}`,
  };

  const serif = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };

  return (
    <>
      <Head>
        <title>Trump Fuckupometer™ — The Long Memo</title>
        <meta name="description" content="For when 'drill baby drill' meets a little excursion/war. Live WTI crude index vs. Inauguration Day 2025." />
        <meta property="og:title" content="Trump Fuckupometer™ — The Long Memo" />
        <meta property="og:description" content={`Day ${dayCount}. WTI crude: $${price.toFixed(2)}/bbl — ${data?.sinceInaugurationPct ?? '~27'}% above the Inauguration Day baseline.`} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>{FONTS}</style>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🛢️</text></svg>"/>
      </Head>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js" onReady={() => setChartReady(true)}/>

      {showShare && (
        <ShareCard
          price={price.toFixed(2)}
          sinceInaugPct={data?.sinceInaugurationPct ?? '~27'}
          fuckupFactor={fuckupFactor.toFixed(1)}
          dayCount={dayCount}
          onClose={() => setShowShare(false)}
        />
      )}

      <div style={{ minHeight: '100vh', background: T.bg, color: T.ink }}>

        {/* Masthead */}
        <div style={{ background: T.slateDk, borderTop: `3px solid ${T.terra}`, borderBottom: `1px solid rgba(255,255,255,0.08)` }}>
          <div style={{ maxWidth: '860px', margin: '0 auto', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '56px' }}>
            <a href="https://thelongmemo.com" target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
              <img src="/tlm-logo.png" alt="TLM" style={{ height: '34px', width: '34px', borderRadius: '3px', flexShrink: 0 }}/>
              <img src="/tlm-wordmark-dark.png" alt="The Long Memo" style={{ height: '22px', opacity: 0.92 }}/>
            </a>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontFamily: "'DM Sans', system-ui, sans-serif", fontSize: '11px' }}>
              {lastUpdated && <span style={{ color: 'rgba(245,240,230,0.38)', letterSpacing: '0.04em' }}>Updated {lastUpdated.toLocaleTimeString()}</span>}
              <button onClick={() => setShowShare(true)} style={{ background: 'none', border: `1px solid rgba(184,92,56,0.5)`, borderRadius: '2px', padding: '3px 11px', fontSize: '10px', cursor: 'pointer', color: T.terraM, fontFamily: 'inherit', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Share
              </button>
              <button onClick={fetchAll} style={{ background: 'none', border: `1px solid rgba(184,92,56,0.5)`, borderRadius: '2px', padding: '3px 11px', fontSize: '10px', cursor: 'pointer', color: T.terraM, fontFamily: 'inherit', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Refresh
              </button>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '860px', margin: '0 auto', padding: '2rem 1.5rem' }}>

          {/* Title block */}
          <div style={{ borderBottom: `1px solid ${T.border}`, marginBottom: '2rem', paddingBottom: '1.75rem' }}>
            <div style={{ ...serif, fontSize: '10px', letterSpacing: '0.22em', color: T.terra, textTransform: 'uppercase', marginBottom: '0.75rem' }}>
              Live Market Intelligence · Operation Epic Fury
            </div>

            <h1 style={{ ...display, fontSize: 'clamp(2.6rem, 7vw, 4.2rem)', fontStyle: 'italic', margin: '0 0 0.5rem', lineHeight: 1.05, color: T.ink, letterSpacing: '-0.02em' }}>
              Trump Fuckupometer™
            </h1>
            <p style={{ ...serif, fontSize: '1.05rem', fontStyle: 'italic', color: T.inkMid, margin: '0 0 1rem', lineHeight: 1.7, fontWeight: 300 }}>
              For when &quot;drill baby drill&quot; meets a little excursion/war.
            </p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMuted, margin: 0, lineHeight: 1.7 }}>
              WTI crude oil indexed to Inauguration Day 2025 (baseline ~$76/bbl). Prices refresh every five minutes.
              Casualty figures sourced from Pentagon statements, Al Jazeera, Britannica, HRANA, and USNI News — all open source.
            </p>
          </div>

          {/* Day counter — styled band between title and metrics */}
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '10px', background: T.slateDk, borderLeft: `4px solid ${T.red}`, borderRadius: '2px', padding: '10px 22px 10px 18px' }}>
              <span style={{ ...display, fontSize: 'clamp(1.8rem, 4vw, 2.4rem)', fontStyle: 'italic', color: T.red, lineHeight: 1 }}>Day {dayCount}</span>
              <span style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.65)', letterSpacing: '0.06em' }}>of Operation Epic Fury</span>
              <span style={{ ...serif, fontSize: '11px', color: 'rgba(245,241,235,0.35)', letterSpacing: '0.04em', fontStyle: 'italic' }}>· commenced Feb 28, 2026</span>
            </div>
          </div>

          {error && (
            <div style={{ background: '#FEF3EE', border: `1px solid ${T.terraPale}`, borderRadius: '2px', padding: '10px 14px', marginBottom: '1.25rem', ...serif, fontSize: '13px', color: T.terra }}>
              {error}
            </div>
          )}

          {/* Hero metrics — 4 col */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '1px', background: T.border, border: `1px solid ${T.border}`, marginBottom: '1.25rem', borderRadius: '2px', overflow: 'hidden' }}>
            {[
              {
                eyebrow: 'WTI crude — live',
                value: loading ? '—' : `$${parseFloat(data?.price).toFixed(2)}`,
                sub: data ? `${isUp ? '▲' : '▼'} $${Math.abs(parseFloat(data.change)).toFixed(2)} (${isUp?'+':''}${data.changePct}%) today` : null,
                valueColor: T.ink,
                subColor: isUp ? T.red : T.green,
              },
              {
                eyebrow: 'Brent crude — live',
                value: loading ? '—' : `$${parseFloat(data?.brent?.price ?? 0).toFixed(2)}`,
                sub: data?.brent ? `${parseFloat(data.brent.change) >= 0 ? '▲' : '▼'} $${Math.abs(parseFloat(data.brent.change)).toFixed(2)} (${parseFloat(data.brent.change) >= 0 ? '+' : ''}${data.brent.changePct}%) today` : null,
                valueColor: T.ink,
                subColor: parseFloat(data?.brent?.change ?? 0) >= 0 ? T.red : T.green,
                sinceInaugPct: data?.brent?.sinceInaugPct,
              },
              {
                eyebrow: 'Since 1/20/25',
                value: `+${data ? data.sinceInaugurationPct : '~27'}%`,
                sub: `+$${data ? data.sinceInauguration : '~20'} above the $76 baseline`,
                valueColor: T.terra,
                subColor: T.terra,
              },
              {
                eyebrow: 'Crisis peak — Mar 9',
                value: '$119.48',
                sub: 'Israel strikes 30 Iranian oil depots',
                valueColor: T.red,
                subColor: T.inkMuted,
              },
            ].map((m, i) => (
              <div key={i} style={{ background: T.bgCard, padding: '1.25rem 1.5rem' }}>
                <p style={{ ...serif, margin: '0 0 6px', fontSize: '10px', letterSpacing: '0.15em', color: T.terra, textTransform: 'uppercase' }}>{m.eyebrow}</p>
                <p style={{ ...display, margin: '0 0 4px', fontSize: '2rem', lineHeight: 1.1, color: m.valueColor }}>{m.value}</p>
                {m.sub && <p style={{ ...serif, margin: 0, fontSize: '12px', color: m.subColor }}>{m.sub}</p>}
                {m.sinceInaugPct !== undefined && (
                  <p style={{ ...serif, margin: '4px 0 0', fontSize: '11px', fontWeight: 600, color: parseFloat(m.sinceInaugPct) >= 0 ? T.terra : T.green }}>
                    {parseFloat(m.sinceInaugPct) >= 0 ? '+' : ''}{m.sinceInaugPct}% since 1/20/25
                  </p>
                )}
              </div>
            ))}
          </div>

          {/* Strait of Hormuz stat bar */}
          <div style={{ background: T.slateDk, border: `1px solid rgba(255,255,255,0.06)`, borderLeft: `4px solid ${T.red}`, borderRadius: '2px', padding: '1rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <p style={{ ...serif, margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: T.red }}>Strait of Hormuz — Transit Collapse</p>
              <p style={{ ...serif, margin: 0, fontSize: '13px', color: 'rgba(245,241,235,0.7)', lineHeight: 1.6 }}>
                Tanker transits down <strong style={{ color: T.red }}>{HORMUZ.dropPct}%</strong> week of Mar 1 (S&P Global); <strong style={{ color: T.red }}>{HORMUZ.kplerDropPct}%</strong> week of Mar 12 (Kpler).
                Western commercial traffic has since approached zero. &nbsp;<strong style={{ color: T.red }}>{HORMUZ.shipsStruck}+</strong> commercial vessels struck since Feb 28.
              </p>
            </div>
            <div style={{ ...serif, fontSize: '10px', color: 'rgba(245,241,235,0.35)', fontStyle: 'italic', flexShrink: 0 }}>
              {HORMUZ.shipsSrc}
            </div>
          </div>

          {/* Gauge */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>Fuckupometer™ — Real-Time Reading</p>
            <Gauge pct={fuckupFactor}/>
            <div style={{ borderTop: `1px solid ${T.border}`, marginTop: '1.25rem', paddingTop: '1.25rem' }}>
              <p style={{ ...serif, fontSize: '14px', fontStyle: 'italic', color: T.inkMid, lineHeight: 1.8, margin: '0 0 6px' }}>
                &quot;We&apos;re going to get the price of energy down… get it down fast… we&apos;re going to drill, baby, drill.&quot;
              </p>
              <p style={{ ...serif, fontSize: '12px', color: T.inkMuted, margin: 0 }}>
                — Donald J. Trump, Inauguration Day, January 20, 2025. &nbsp;
                <span style={{ color: T.terra, fontWeight: 600 }}>WTI that day: ~$76. Today: ${price.toFixed(2)}.</span>
              </p>
            </div>
          </div>

          {/* Trump Said vs Reality */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead, color: T.red }}>Trump Said vs. Reality</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              A running log. The gap between the statement and the situation tends to widen over time.
            </p>
            {TRUMP_SAID.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr', gap: '1rem', padding: '12px 0', borderBottom: i < TRUMP_SAID.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'flex-start' }}>
                <span style={{ ...serif, fontSize: '10px', color: T.inkMuted, letterSpacing: '0.04em', paddingTop: '2px' }}>{item.date}</span>
                <div>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.slateMid }}>He said</p>
                  <p style={{ ...serif, margin: 0, fontSize: '12px', color: T.ink, lineHeight: 1.6, fontStyle: 'italic' }}>{item.said}</p>
                </div>
                <div>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.red }}>Reality</p>
                  <p style={{ ...serif, margin: 0, fontSize: '12px', color: T.inkMid, lineHeight: 1.6 }}>{item.reality}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Two-column: Chart + Butcher's bill */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

            {/* Chart */}
            <div style={{ ...section, marginBottom: 0 }}>
              <p style={{ ...sectionHead }}>WTI Crude — 30-Day Price</p>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', ...serif, fontSize: '11px', color: T.inkMuted }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '16px', height: '2px', background: T.terra, display: 'inline-block', borderRadius: '1px' }}/>
                  WTI price
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <span style={{ width: '16px', borderTop: `2px dashed ${T.green}`, display: 'inline-block' }}/>
                  Inaug. baseline ($76)
                </span>
              </div>
              <OilChart chartReady={chartReady}/>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', ...serif, fontSize: '10px', color: T.inkMuted }}>
                <span>30 days ago</span><span>Today</span>
              </div>
              {/* Scenario legend */}
              <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: `1px solid ${T.border}` }}>
                <p style={{ ...serif, margin: '0 0 6px', fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.inkMuted }}>Analyst scenarios</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {[
                    { label: 'Ceasefire tomorrow', price: '~$85', color: T.green },
                    { label: 'War continues 30 days', price: '~$105', color: T.amber },
                    { label: 'Hormuz closed 90 days', price: '~$130', color: T.red },
                  ].map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '20px', borderTop: `2px dashed ${s.color}`, display: 'inline-block', flexShrink: 0 }}/>
                      <span style={{ ...serif, fontSize: '11px', color: T.inkMid }}>{s.label}</span>
                      <span style={{ ...serif, fontSize: '11px', color: s.color, fontWeight: 600, marginLeft: 'auto' }}>{s.price}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Butcher's Bill */}
            <div style={{ ...section, marginBottom: 0 }}>
              <p style={{ ...sectionHead, color: T.red }}>Butcher&apos;s Bill — Op. Epic Fury</p>
              <p style={{ ...serif, fontSize: '11px', color: T.inkMuted, margin: '0 0 1rem', fontStyle: 'italic' }}>
                Commenced Feb 28, 2026. Status: ongoing.
              </p>
              {BILL.map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: i < BILL.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'flex-start' }}>
                  <div style={{ minWidth: '100px' }}>
                    <span style={{ ...serif, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: T.inkMuted }}>{item.label}</span>
                  </div>
                  <div style={{ minWidth: '60px' }}>
                    <span style={{ ...display, fontSize: '1.15rem', color: T.red, lineHeight: 1 }}>{item.value}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ ...serif, margin: '0 0 2px', fontSize: '11px', color: T.inkMid, lineHeight: 1.5 }}>{item.sub}</p>
                    <p style={{ ...serif, margin: 0, fontSize: '10px', color: T.inkMuted, fontStyle: 'italic' }}>{item.src}</p>
                  </div>
                </div>
              ))}
              <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.6 }}>
                Iranian casualty figures remain heavily disputed between US government statements, Iranian state media, and independent monitors.
              </p>
            </div>
          </div>

          {/* War economy */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>War Economy Dashboard</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              What else moves when a Strait closes and a president promises cheap energy.
            </p>
            {commodities ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1px', background: T.border, borderRadius: '2px', overflow: 'hidden' }}>
                {commodities.map((c, i) => <CommodityCard key={i} c={c}/>)}
              </div>
            ) : (
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', ...serif, fontSize: '13px', color: T.inkMuted }}>
                Loading commodity data…
              </div>
            )}
            <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.6 }}>
              Fertilizer tracked via CF Industries (NYSE: CF) — largest US urea producer. Urea is an OTC market with no liquid exchange-traded futures.
              All inauguration baselines estimated from January 20, 2025 market close.
            </p>
          </div>

          {/* Gas calculator */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>What This Is Costing You</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              Enter your vehicle specs. We&apos;ll tell you what the &quot;excursion&quot; in Iran is actually costing you at the pump vs. inauguration day.
            </p>
            <GasCalc rbobPrice={commodities ? parseFloat(commodities.find(c => c.ticker === "RB=F")?.price || 2.72) : 2.72}/>
          </div>

          {/* Broader economic impact */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>Beyond the Pump — What Else This Is Costing You</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              Oil is embedded in the price of nearly everything. These estimates apply Fed research pass-through rates to the current ~25% WTI increase from the inauguration baseline.
              Effects on food and core goods build slowly — the full impact typically runs 2–4 quarters behind the oil shock itself.
            </p>
            <BroaderImpact/>
            <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.7 }}>
              Estimates derived from Federal Reserve Board (FEDS Notes, Dec 2023) oil pass-through research: 10% oil increase → food CPI +0.3%, core CPI +0.1%.
              Applied to WTI increase of ~25% since Jan 20, 2025. Household dollar estimates use BLS Consumer Expenditure Survey averages.
              Airfare estimate from JPMorgan Private Bank via CNBC, Mar 11, 2026. These are estimates, not precise forecasts.
            </p>
          </div>

          {/* Incident log */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>Incident Log</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
              <span style={{ ...serif, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.terra, fontWeight: 600 }}>2025</span>
              <div style={{ flex: 1, height: '1px', background: T.border }}/>
            </div>
            {EVENTS_2025.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', padding: '10px 0', borderBottom: `1px solid ${T.border}`, alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tierDot[e.tier], flexShrink: 0, marginTop: '6px' }}/>
                <span style={{ ...serif, fontSize: '11px', color: T.inkMuted, minWidth: '52px', paddingTop: '1px', letterSpacing: '0.04em' }}>{e.date}</span>
                <span style={{ ...serif, fontSize: '13px', color: T.inkMid, lineHeight: 1.65 }}>{e.label}</span>
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 4px' }}>
              <span style={{ ...serif, fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: T.terra, fontWeight: 600 }}>2026</span>
              <div style={{ flex: 1, height: '1px', background: T.border }}/>
            </div>
            {EVENTS_2026.map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: '14px', padding: '10px 0', borderBottom: i < EVENTS_2026.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'flex-start' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: tierDot[e.tier], flexShrink: 0, marginTop: '6px' }}/>
                <span style={{ ...serif, fontSize: '11px', color: T.inkMuted, minWidth: '52px', paddingTop: '1px', letterSpacing: '0.04em' }}>{e.date}</span>
                <span style={{ ...serif, fontSize: '13px', color: T.inkMid, lineHeight: 1.65 }}>{e.label}</span>
              </div>
            ))}
          </div>

          {/* Analysis */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>Why This Matters</p>
            <p style={{ ...serif, fontSize: '14px', color: T.inkMid, lineHeight: 1.85, margin: '0 0 1rem', fontWeight: 300 }}>
              The Strait of Hormuz handles approximately 20% of global oil flow. Its effective closure — triggered by the US–Iran
              conflict that began February 28 — has produced a supply shock that US domestic production cannot remedy on any
              relevant timeline. The shale patch surrendered drilling capacity when oil sat at $55 in late 2025. Those rigs do
              not return in weeks.
            </p>
            <p style={{ ...serif, fontSize: '14px', color: T.inkMid, lineHeight: 1.85, margin: 0, fontWeight: 300 }}>
              The IEA&apos;s 400-million-barrel emergency release — the largest in history — stabilized prices briefly before fresh
              Hormuz attacks pushed them back up. The EIA now forecasts Brent above $95 through Q2 2026. Fertilizer prices matter
              because urea is a natural gas derivative: energy shocks travel directly into food production costs with a one-to-two
              season lag.
            </p>
          </div>

          {/* CTA */}
          <div style={{ background: T.slateDk, borderRadius: '2px', padding: '2rem', textAlign: 'center', marginBottom: '1.25rem', borderTop: `3px solid ${T.terra}` }}>
            <p style={{ ...display, fontSize: '1.5rem', fontStyle: 'italic', color: '#F5F1EB', margin: '0 0 8px' }}>
              Want the actual analysis?
            </p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMuted, margin: '0 0 1.25rem' }}>
              Read The Long Memo — institutional analysis for people who need to know what&apos;s actually happening.
            </p>
            <a href="https://thelongmemo.com" target="_blank" rel="noopener noreferrer"
              style={{ display: 'inline-block', padding: '10px 28px', background: 'transparent', color: T.terraPale, border: `1px solid ${T.terra}`, borderRadius: '2px', fontSize: '12px', fontWeight: 400, textDecoration: 'none', ...serif, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Read The Long Memo →
            </a>
          </div>

          {/* Footer */}
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1.25rem' }}>
            <p style={{ ...serif, fontSize: '11px', color: T.inkMuted, lineHeight: 1.8, margin: '0 0 10px' }}>
              Data: WTI (CL=F), Brent (BZ=F), Natural Gas (NG=F), Gasoline (RB=F), Wheat (ZW=F), Corn (ZC=F), CF Industries (CF) via Yahoo Finance.
              Refreshes every five minutes. Not financial advice. This is a gag. A very accurate gag.
              &nbsp;·&nbsp;
              <a href="https://thelongmemo.com" style={{ color: T.inkMuted }}>The Long Memo</a>
              &nbsp;·&nbsp;
              <em>Heckuva job, Trumpy!</em>
            </p>
            <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, textAlign: 'center', letterSpacing: '0.06em', margin: 0 }}>
              FOR SATIRICAL PURPOSES ONLY // NOT AFFILIATED WITH THE UNITED STATES GOVERNMENT
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
