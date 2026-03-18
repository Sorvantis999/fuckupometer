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
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50%       { opacity: 0.4; transform: scale(0.7); }
  }
  .live-counter { font-variant-numeric: tabular-nums; letter-spacing: -0.02em; }
`;

/* War started Feb 28, 2026 — Feb 28 = Day 1 (inclusive, consistent with media/Pentagon usage)
   Pentagon 'Day 6' briefing = Mar 5, which is 6 days inclusive from Feb 28. */
const WAR_START = new Date('2026-02-28T00:00:00Z');
function getDayCount() {
  const now = new Date();
  return Math.max(1, Math.floor((now - WAR_START) / (1000 * 60 * 60 * 24)) + 1);
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
  {
    date: 'Mar 13, 2026',
    said: '"Moments ago, at my direction, CENTCOM executed one of the most powerful bombing raids in the history of the Middle East, and totally obliterated every MILITARY target in Iran\'s crown jewel, Kharg Island."',
    reality: "Iran's deputy governor of Bushehr province: oil exports 'continuing as normal.' No casualties. No oil infrastructure damaged. Iran immediately warned it would target UAE ports in retaliation. The IRGC informed the UAE that US hideouts are 'legitimate targets.'",
  },
  {
    date: 'Mar 13, 2026',
    said: '"Iran is totally defeated and wants a deal" — but not one he "would accept."',
    reality: "Iran's Parliament Speaker warned the country would 'abandon all restraint' if its islands are attacked. Mojtaba Khamenei has not been seen publicly since Feb 28. His statement was read by a TV anchor over a still photo. Hegseth: he is 'wounded and likely disfigured.' The Strait remains closed. Day 14.",
  },
  {
    date: 'Mar 14, 2026',
    said: '"We have already destroyed 100% of Iran\'s Military capability."',
    reality: "In the same Truth Social post, Trump acknowledged Iran can still 'send a drone or two, drop a mine, or deliver a close range missile.' He then asked China, France, Japan, South Korea, and the UK to send warships to keep the Strait open. None confirmed. China and the UK specifically declined when asked by CNN. Iran's FM: the US is 'begging others, even China.' The Strait remains closed. Day 15.",
  },
  {
    date: 'Mar 15, 2026',
    said: '"Iran wants to make a deal."',
    reality: "Iran FM Araghchi on CBS the same day: \"No, we never asked for a ceasefire, and we have never asked even for negotiation. We are ready to defend ourselves as long as it takes.\" IRGC spokesman simultaneously announced its weapons cache is \"mostly intact\" and that the missiles used so far are \"from a decade ago\" — Iran has not yet deployed its newer-generation arsenal. Day 16.",
  },
  {
    date: 'Mar 16, 2026',
    said: '"We have literally destroyed everything on Kharg Island except for its oil facilities."',
    reality: "At the same Kennedy Center board meeting, Trump left the door open to hitting the oil infrastructure \"a few more times just for fun.\" CENTCOM confirmed they deliberately avoided the oil infrastructure. The two US mine-countermeasure ships (USS Tulsa, USS Santa Barbara) — the vessels required for Strait clearance operations — were photographed in Malaysia, 3,500 miles from the Gulf. The Strait remains closed to US-aligned shipping. Iran FM: \"The Strait is open, but closed to our enemies.\" Day 17.",
  },
  {
    date: 'Mar 17, 2026',
    said: '"This is a paper tiger we\'re dealing with."',
    reality: "Day 18. Iran\'s Parliament Speaker Qalibaf simultaneously told state TV the Strait \"cannot be the same as before and return to its previous conditions\" and that \"there is no longer any security.\" He also revealed Iran redesigned its weapons systems after June 2025: \"They think they can destroy our facilities with bombers, but they don\'t know that our design has completely changed.\" Iran has fired approximately 700 missiles and 3,600 drones since Feb 28 and says it hasn\'t deployed its newer arsenal.",
  },
  {
    date: 'Mar 17, 2026',
    said: '"Numerous countries have told me they\'re on the way" to help secure the Strait.',
    reality: "No countries confirmed or named. The EU formally decided against expanding naval operations. NATO said the Strait is outside the alliance\'s area of action. Australia and Japan said they are not sending ships. The UK gave no specifics. Meanwhile: Iran\'s FM quietly reached out to Trump\'s Middle East envoy to reopen a diplomatic channel. Trump told senior White House officials he does not want to negotiate now. The Strait remains closed. Day 18.",
  },
  {
    date: 'Mar 18, 2026',
    said: '"Do you mind if I take a little excursion? Because we have to do something. And it\'ll be a short-term excursion."',
    reality: "Day 19. Confirmed at a Capitol Hill lunch honoring the Irish PM. On the same day: Iran\'s Intelligence Minister killed by Israel. Iran issues named evacuation warnings for Saudi, UAE, and Qatar energy infrastructure. South Pars — the world\'s largest gas field — struck for the first time. Brent hits $108.60. Iran\'s FM: \"I do not know why the Americans and Israelis still have not understood this point.\" Joe Kent, Trump\'s NCC Director, resigns, stating Iran \"posed no imminent threat to our nation.\"",
  },
];

/* ─── Hormuz stat ────────────────────────────────────────────────────────────── */
/* Status as of Mar 16: Effectively closed to US/Western-allied shipping.
   Iran selectively allowing passage for China-linked, Pakistan, India, Turkey vessels
   transacted in yuan or under bilateral arrangement. First full transit (Karachi, PAK-flagged)
   confirmed Mar 16. Insurance withdrawn for Western operators Mar 5 — commercially unnavigable
   for most operators regardless of military risk. */
const HORMUZ = {
  dropPct: 95,
  kplerDropPct: 92,
  src: 'S&P Global (95%, week of Mar 1); Kpler (92%, week of Mar 12); Bloomberg Mar 10',
  shipsStruck: 21,
  shipsSrc: 'UKMTO / Reuters / Al Jazeera, Mar 17',
};

/* ─── War cost data (CSIS, Pentagon, Penn Wharton) ──────────────────────────── */
/* Pentagon confirmed $11.3B for first 6 days (Mar 5 briefing to Congress).
   CSIS Day 12 update (Mar 12): $16.5B total → implied $867M/day for days 7–12.
   Penn Wharton (Smetters): ~$800M/day sustained. Fortune/John Phillips: ~$1B/day.
   We use $870M/day as midpoint of CSIS-derived and Penn Wharton estimates. */
const WAR_COST_DAY6_B   = 11.3;  /* Pentagon briefing to Congress, Mar 5 */
const WAR_COST_DAY6     = 6;
const WAR_COST_DAILY_B  = 0.87;  /* ~$870M/day sustained: CSIS Day 12 total $16.5B minus Pentagon Day 6 $11.3B = $5.2B / 6 days (CSIS, Mar 12) */
const PWBM_MIDPOINT_B   = 65;    /* Penn Wharton midpoint direct cost, 2-month scenario */
const PWBM_TOTAL_B      = 180;   /* Penn Wharton total economic impact, midpoint */
const US_HOUSEHOLDS     = 132;   /* million — US Census 2024 */
const WAR_COST_PER_SEC  = (WAR_COST_DAILY_B * 1e9) / 86400; /* ~$10,069/sec sustained */

function getWarCostEstimate(dayCount) {
  const sustainedDays = Math.max(0, dayCount - WAR_COST_DAY6);
  return (WAR_COST_DAY6_B + sustainedDays * WAR_COST_DAILY_B).toFixed(1);
}

/* Live cost counter — ticks every second */
function useLiveCost(dayCount) {
  const base = WAR_COST_DAY6_B * 1e9 + Math.max(0, dayCount - WAR_COST_DAY6) * WAR_COST_DAILY_B * 1e9;
  const [cost, setCost] = useState(base);
  useEffect(() => {
    const t = setInterval(() => setCost(c => c + WAR_COST_PER_SEC), 1000);
    return () => clearInterval(t);
  }, [dayCount]);
  return cost;
}

function fmtCost(n) {
  const b = n / 1e9;
  return b >= 1000 ? `$${(b/1000).toFixed(2)}T` : `$${b.toFixed(2)}B`;
}

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
  { date: 'Mar 13', tier: 'critical', label: 'US military aerial refueling tanker (KC-135) crashes in western Iraq, killing all six crew members aboard. All confirmed lost — the largest single US military loss of the conflict to date. Pentagon confirms 13 US KIA total.' },
  { date: 'Mar 13', tier: 'critical', label: 'Oil holds above $100 per barrel despite IEA 400M-barrel emergency reserve release and US Treasury sanctions waiver on stranded Russian seaborne crude. Neither measure moves prices. Analysts: structural Hormuz closure cannot be papered over by reserve releases.' },
  { date: 'Mar 13', tier: 'critical', label: 'Trump vows to hit Iran "very hard over the next week," claiming US strikes have damaged Iran so badly it will "take years to rebuild." Iran\'s new Supreme Leader Mojtaba Khamenei simultaneously issues first public statement vowing to maintain the Hormuz blockade — directly contradicting Trump\'s framing of a war approaching resolution.' },
  { date: 'Mar 13', tier: 'critical', label: 'Trump announces US struck Kharg Island — Iran\'s main crude export hub, handling ~90% of its oil exports — in "one of the most powerful bombing raids in the history of the Middle East." CENTCOM confirms 90+ military targets hit, oil infrastructure deliberately preserved as leverage. Iranian official: exports "continuing as normal." No casualties reported on island.' },
  { date: 'Mar 13', tier: 'critical', label: 'Hegseth announces Iranian drone launches are "down 95%" — then declares today will be the "highest volume of strikes yet." US has now struck over 6,000 targets in 13 days. Hegseth says Mojtaba Khamenei is "wounded and likely disfigured." JD Vance: "We know he\'s hurt." Iran has not produced public footage of its new Supreme Leader since Feb 28.' },
  { date: 'Mar 13', tier: 'critical', label: 'Trump: "Iran is totally defeated and wants a deal" — but not one he "would accept." Iran\'s Parliament Speaker simultaneously warns the country will "abandon all restraint" if Iranian islands are attacked. The Strait remains mined. The IRGC informs the UAE that US hideouts are "legitimate targets." Dubai building struck by debris from interception.' },
  { date: 'Mar 14', tier: 'critical', label: 'Brent closes Friday at $103.14 (+2.67%). WTI: $98.71 (+3.11%). National gas average: $3.68/gal — up 23% since Feb 28, per AAA. 31st Marine Expeditionary Unit (USS Tripoli) ordered to the Middle East. Analysts note it\'s the unit you\'d want for a potential Kharg Island seizure or nuclear site operation.' },
  { date: 'Mar 14', tier: 'critical', label: 'Iran\'s ambassador to India confirms some Indian-flagged vessels are being allowed through the Strait — provided cargo is traded in Chinese yuan. First partial opening since Feb 28. The US did not negotiate this. China did.' },
  { date: 'Mar 14', tier: 'critical', label: 'UAE Ministry of Defense: 9 ballistic missiles and 33 drones launched from Iran. Debris from an intercepted drone hits Fujairah port — an oil export hub explicitly outside the Strait. Iran\'s IRGC formally designates UAE ports as legitimate targets, urging civilians to evacuate.' },
  { date: 'Mar 14', tier: 'critical', label: 'US Navy extends USS Nimitz service life to March 2027 — was scheduled for decommission this May. The extension is a direct consequence of the carrier gap exposed when the Ford was sent to the Caribbean for Venezuela, leaving no carrier in the Middle East when Iran erupted.' },
  { date: 'Mar 14', tier: 'critical', label: 'Zelensky: Russia has supplied Iran with intelligence and drones used against US forces. Iran\'s FM Araghchi: "good cooperation with these countries, politically, economically, even militarily." Neither confirms nor denies specifics.' },
  { date: 'Mar 15', tier: 'critical', label: 'Trump: "We have already destroyed 100% of Iran\'s Military capability" — then asked China, France, Japan, South Korea, and the UK to send warships. None confirmed. Iran warns any country joining the coalition faces retaliation. US and Israel strike multiple sites in Isfahan. Iranian attacks reported in central Israel and US bases in Iraq and Kuwait. Day 16. The war is apparently not over.' },
  { date: 'Mar 16', tier: 'critical',   label: 'Dubai International Airport suspends all flights after an Iranian drone strikes a fuel tank near the terminal. Emirates cancels dozens of routes. Flights resume on a limited schedule by midday. A second fire breaks out at an industrial zone in Fujairah following a separate drone strike. Abu Dhabi: a missile hits a car, killing a Palestinian resident.' },
  { date: 'Mar 16', tier: 'critical',   label: 'IRGC spokesman Brigadier-General Naini: the weapons cache is "mostly intact." The missiles used in the war so far are "from a decade ago." Iran has not yet deployed its newer-generation arsenal. Day 17 — and Tehran is telling you it has been holding back.' },
  { date: 'Mar 16', tier: 'critical',   label: 'Iran FM Araghchi on CBS: "No, we never asked for a ceasefire, and we have never asked even for negotiation. We are ready to defend ourselves as long as it takes." Direct contradiction of Trump\'s repeated claim that Iran "wants a deal."' },
  { date: 'Mar 16', tier: 'critical',   label: 'First confirmed Strait of Hormuz transit since the war began: Pakistan-flagged tanker Karachi clears the strait sailing close to Iran\'s coastline, cargo traded in Chinese yuan, under implicit Iranian naval escort. The US did not arrange this. Pakistan and China did. Iran FM: "The Strait is open, but closed to our enemies, to those who carried out this cowardly aggression against us and to their allies."' },
  { date: 'Mar 16', tier: 'critical',   label: 'USS Tulsa and USS Santa Barbara — the two US Navy mine-countermeasure ships assigned to the Persian Gulf before the war — photographed in Butterworth port, Penang, Malaysia. 3,500 miles from the Gulf. These are the vessels required for Strait clearance operations. They are not in the Strait.' },
  { date: 'Mar 16', tier: 'critical',   label: 'Israel strikes a facility in central Tehran it says was developing capabilities to attack satellites. US and Israeli strikes continue across Tehran, Hamadan, and Isfahan. Saudi Arabia intercepts 37 drones in its Eastern province. CENTCOM: 100+ Iranian naval vessels destroyed, 6,000+ combat flights flown since Feb 28. Iranian casualties per Iranian Red Crescent: 1,444 killed, 18,551 injured. Brent: ~$105/bbl.' },
  { date: 'Mar 17', tier: 'today',   label: 'Amnesty International publishes investigation confirming US responsibility for the Minab girls\' school strike — at least 170 killed, more than 160 of them schoolgirls. A 3-day-old infant and his 2-year-old sister killed in a US-Israeli strike on their home in Arak, along with their mother and grandmother, per IRGC. ACLED has documented nearly 2,000 distinct events across 29 of Iran\'s 31 provinces since Feb 28. Iranian internet blackout enters Day 18, per Netblocks.' },
  { date: 'Mar 17', tier: 'today',   label: 'Iran Parliament Speaker Qalibaf on state TV: the Strait of Hormuz \"cannot be the same as before and return to its previous conditions\" and \"there is no longer any security.\" Reveals Iran redesigned its weapons systems after June 2025: \"They think they can destroy our facilities with bombers, but they don\'t know that our design has completely changed.\" Kpler analyst: even if war ended today, 1–3 months to reopen the Strait.' },
  { date: 'Mar 17', tier: 'today',   label: 'Israel announces the killing of Gholamreza Soleimani — head of the IRGC Basij force, the internal suppression unit deployed against protesters. Iran does not confirm. Israel also claims the killing of Ali Larijani, former parliament speaker and senior security figure. Iran has not confirmed.' },
  { date: 'Mar 17', tier: 'critical',   label: 'A fire aboard the USS Gerald R. Ford burned for 30+ hours last week, leaving dozens of crew members with smoke inhalation, per the New York Times. The Ford is the carrier previously repositioned to the Caribbean for Venezuela operations — the gap that forced the USS Nimitz service life extension through March 2027. The Ford is now operating in theater while damaged.' },
  { date: 'Mar 17', tier: 'critical',   label: 'UAE Shah gas field — the world\'s largest ultra-sour gas development — remains suspended after a drone attack sparked a fire. Fujairah Oil Industry Zone struck again. A tanker struck at anchor 23 nautical miles east of Fujairah — the 21st vessel incident since Feb 28 per UKMTO. Iran warns oil could reach $200/bbl if Strait closure continues. Brent: $102.36. WTI: $95.55. Day 18.' },
  { date: 'Mar 18', tier: 'today',   label: 'Israel strikes South Pars gas field — coordinated with the US — hitting Asaluyeh processing facilities in Bushehr province. South Pars is the world\'s largest natural gas reserve (est. 1,800 trillion cubic feet), shared between Iran and Qatar. It accounts for 70–75% of Iran\'s total gas output and the majority of its LNG exports. Qatar\'s North Dome — the same field — supplies roughly one-fifth of global LNG. Brent spikes to $108.60 (+5%). European gas benchmark up 7.9%. Bloomberg\'s Javier Blas: "Both sides are now targeting upstream oil and natural gas assets. Is this an attempt to escalate to de-escalate? Or is it simply a sign that escalation is spiraling out of control?" Marks the first strike on upstream energy production assets since the war began. Day 19.' },
  { date: 'Mar 18', tier: 'today',   label: 'Following the South Pars strike, Iran issues named evacuation warnings for Gulf energy infrastructure, declaring it "will be targeted in the coming hours": Saudi Arabia\'s Samref Refinery and Jubail Petrochemical Complex; UAE\'s Al Hosn Gas Field; Qatar\'s Mesaieed Petrochemical Complex, Mesaieed Holding Company, and Ras Laffan Refinery. Iran\'s semi-official Fars: attacks on Iran\'s energy infrastructure "will not go unanswered, and Iran\'s response will target enemy infrastructure previously thought to be safe." Qatar FM: targeting energy infrastructure "constitutes a threat to global energy security." Rapidan Energy: "The question now is whether Tehran shifts from signaling to targeting critical components that could take months, if not years, to repair."' },
  { date: 'Mar 18', tier: 'today',   label: 'Israel confirms killing of Iranian Intelligence Minister Esmail Khatib — sanctioned by the US and EU for cyber operations against Western targets. Netanyahu and Defense Minister Katz have now granted the IDF standing authorization to eliminate additional senior Iranian officials with no case-by-case approval required. Israel\'s decapitation campaign is, in Katz\'s framing, on autopilot. Iran\'s FM Araghchi: "I do not know why the Americans and the Israelis still have not understood this point. The Islamic Republic of Iran has a strong political structure with established political, economic, and social [institutions]."' },
  { date: 'Mar 18', tier: 'today',   label: 'Iran launches missile barrage at Israel. Two Israeli civilians — a man and woman — killed by shrapnel in Ramat Gan, near Tel Aviv, per Magen David Adom. Saudi Arabia, Qatar, Kuwait, and UAE air defenses simultaneously engaged Iranian drones and ballistic missiles. Israel launches limited ground operations in southern Lebanon against Hezbollah. At least 6 killed in Israeli strikes on Beirut.' },
  { date: 'Mar 18', tier: 'today',   label: 'Joe Kent, Trump\'s Director of the National Counterterrorism Center, resigns — stating Iran "posed no imminent threat to our nation." Kent is the first senior Trump administration official to publicly break with the president over the war. The EU\'s top diplomat: "nobody is ready to put their people in harm\'s way in the Strait of Hormuz." Trump, at a Capitol Hill lunch honoring the Irish PM, describes the war as a "little excursion" he asked chief of staff Susie Wiles if she "minded."' },
  { date: 'Mar 18', tier: 'today',   label: 'Hormuz transit data: 8 non-Iranian vessels detected transiting Monday per AIS — nearly double recent daily figures (Windward). All assessed as permission-based transits through Iranian territorial waters: Chinese, Indian, Pakistani-flagged. Western shipping remains shut out. US separately drops GBU-72 5,000-lb bunker-buster bombs on hardened Iranian missile sites along the Strait coastline — first combat use against hardened targets of this type. Brent closes near $108. WTI near $100. Day 19.' },
];

const tierDot = { baseline: T.green, neutral: T.amber, critical: T.terra, peak: T.red, today: T.red };

/* ─── Structural floor conditions ───────────────────────────────────────────── */
/* Each condition holds until explicitly reversed by a named, observable event.
   Floors stack additively. Current floor = sum of all active contributions.
   Ceiling: $150+ sustained oil or nuclear weapons use = 96–100.
   Floor calibrated so all-active = ~55 (Significantly → Very Fucked Up boundary).
   Events push score above floor; score decays 0.5pts/quiet day back toward floor. */
const FLOOR_CONDITIONS = [
  { id: 'hormuz',       label: 'Hormuz closed to Western/US-aligned shipping',  contribution: 18, active: true,  reversal: 'Confirmed Western-flagged commercial transit without Iranian escort or yuan settlement' },
  { id: 'kinetic',      label: 'Active kinetic operations ongoing (both sides)', contribution: 8,  active: true,  reversal: '72-hour cessation of strikes confirmed by both CENTCOM and IRGC' },
  { id: 'mineclear',    label: 'No US mine-clearance capability in theater',     contribution: 7,  active: true,  reversal: 'USS Tulsa or USS Santa Barbara confirmed operating in the Persian Gulf' },
  { id: 'negotiations', label: 'Iran publicly refusing negotiations',            contribution: 6,  active: true,  reversal: 'FM-level statement accepting ceasefire talks — not Trump claiming they want a deal' },
  { id: 'coalition',    label: 'No allied coalition for Hormuz reopening',       contribution: 5,  active: true,  reversal: 'Two or more named nations confirm warships en route for escort operations' },
  { id: 'yuan',         label: 'Yuan-denominated transit arrangement in place',  contribution: 5,  active: true,  reversal: 'Arrangement formally dissolved or Western vessels granted equivalent access' },
  { id: 'arsenal',      label: "Iran's newer-generation arsenal undeployed",     contribution: 4,  active: true,  reversal: 'IRGC confirms or deploys — score rises on deployment, floor condition removed' },
  { id: 'dissent',      label: 'US internal dissent confirmed public (Kent)',     contribution: 2,  active: true,  reversal: 'Confirmed replacement, no further senior public resignations' },
];

const CURRENT_FLOOR = FLOOR_CONDITIONS.filter(c => c.active).reduce((s, c) => s + c.contribution, 0);

/* ─── Daily XY assessments ───────────────────────────────────────────────────── */
/* X = Fuckedness (0–100). Scale: 0–20 fine; 21–40 more than a little; 41–60 significantly;
   61–80 very; 81–95 completely unbelievably; 96–100 reserved ($150+/nuclear).
   Floor all-active = 55. Events push above; decays 0.5pt/quiet day.
   Y = Ease of Unfuckability (1–10; 10=walk it back tomorrow, 1=chiseled in rock).
   Y is TLM Assessment — updated daily with evidence. */
const DAILY_ASSESSMENTS = [
  { day: 1,  date: 'Feb 28', x: 28, y: 7.0,
    xNote: 'War commenced. Floor conditions activating but not yet locked in. WTI +15% intraday. No structural foreclosure yet.',
    yNote: 'Path theoretically open. Ceasefire achievable with political will if either side blinked in week one. Back-channels intact.' },
  { day: 2,  date: 'Mar 1',  x: 33, y: 6.5,
    xNote: 'First 6 US KIA in Kuwait. OPEC+ response fails. QatarEnergy halts Ras Laffan LNG. Gulf targets expanding.',
    yNote: 'Back-channels structurally intact. Iran hasn\'t formalized closure posture yet. Window exists but starting to close.' },
  { day: 3,  date: 'Mar 2',  x: 37, y: 6.0,
    xNote: 'Kuwait embassy struck. Girls school Minab hit (148–180 dead). Iraq southern oilfields collapse 70%.',
    yNote: 'Civilian casualty scale beginning to complicate US domestic political path home. Still reversible with political will.' },
  { day: 4,  date: 'Mar 3',  x: 40, y: 5.5,
    xNote: 'Goldman Sachs: $14/bbl war premium embedded. Kuwait and UAE announce precautionary production cuts.',
    yNote: 'Economic pressure theoretically creates negotiation incentive. In practice, Iran has endured 40 years of sanctions without blinking.' },
  { day: 8,  date: 'Mar 7',  x: 44, y: 5.0,
    xNote: 'War settling into operational pattern. Hormuz commercially closed — P&I war risk insurance withdrawn Mar 5.',
    yNote: 'Insurance withdrawal is structural, not declaratory. Market reality forming independently of political decisions.' },
  { day: 9,  date: 'Mar 8',  x: 48, y: 5.0,
    xNote: 'IRGC formally confirms selective Hormuz closure — strategic formalization of what had been tactical.',
    yNote: 'Formalization is worse than the original closure. Ad hoc threats can be walked back. Official policy requires a face-saving construct to reverse.' },
  { day: 10, date: 'Mar 9',  x: 56, y: 4.5,
    xNote: 'WTI hits $119.48 — 3.75yr high. Mojtaba Khamenei appointed Supreme Leader. Markets read Tehran digging in.',
    yNote: 'New Supreme Leader whose entire legitimacy rests on not blinking. Negotiating flexibility is existential risk for him, not mere political inconvenience.' },
  { day: 11, date: 'Mar 10', x: 58, y: 4.5,
    xNote: 'Trump floats Hormuz takeover. Iran mines strait. Yuan transit arrangement emerging. Saudi Safaniya/Zuluf fields shut.',
    yNote: 'Yuan transit structure beginning to form as commercial reality — not a policy decision that gets reversed at a summit.' },
  { day: 12, date: 'Mar 11', x: 59, y: 4.0,
    xNote: 'IEA 400M barrel release — largest in history — fails to move price. G7 finance ministers convene. Three more vessels struck.',
    yNote: 'Reserve release failure signals structural supply problem, not a liquidity problem. Fix difficulty rising — cannot be papered over.' },
  { day: 13, date: 'Mar 12', x: 61, y: 4.0,
    xNote: 'Mojtaba first statement — vows Strait stays closed, threatens US bases. UK confirms Iran laying mines. 3.2M Iranians displaced.',
    yNote: 'New leadership\'s first public posture is maximalist. No back-channel signals. Larijani still alive — path technically exists.' },
  { day: 14, date: 'Mar 13', x: 63, y: 3.5,
    xNote: 'KC-135 crash — 6 KIA. Oil above $100 despite all interventions. Kharg struck. Hegseth contradicts himself in one briefing.',
    yNote: 'Larijani still alive and warning publicly — still most credible interlocutor. Channels technically open. Getting harder to use.' },
  { day: 15, date: 'Mar 14', x: 64, y: 3.5,
    xNote: 'Brent closes $103. India-Iran yuan transit confirmed. 31st MEU ordered to theater. UAE formally targeted by IRGC.',
    yNote: 'Yuan transit now confirmed commercial arrangement — infrastructure forming around the blockade. Structural hardening accelerating.' },
  { day: 16, date: 'Mar 15', x: 65, y: 3.5,
    xNote: 'Trump claims 100% military capability destroyed, simultaneously asks 5 nations for warships. None confirm. EU rejects.',
    yNote: 'US credibility gap widening. Harder to lead a coalition you\'ve already alienated. EU posture calcifying into policy.' },
  { day: 17, date: 'Mar 16', x: 65, y: 3.5,
    xNote: 'Mine-clearance ships photographed in Malaysia — 3,500mi away. First PAK transit yuan-denominated. Dubai airport struck.',
    yNote: 'Mine-clearance gap is now a confirmed physical constraint — not just political. Cannot be solved by a phone call or a summit.' },
  { day: 18, date: 'Mar 17', x: 66, y: 3.5,
    xNote: 'Amnesty confirms Minab school (170+ killed). Larijani and Soleimani killed by Israeli strikes. Qalibaf: Hormuz "cannot return to previous conditions."',
    yNote: 'Larijani eliminated — most credible interlocutor gone. Qalibaf statement signals Iranian institutional consensus: the closure is permanent.' },
  { day: 19, date: 'Mar 18', x: 68, y: 3.5,
    xNote: 'South Pars struck — first upstream energy asset. Brent $108.60 (+5%). Iran names Gulf infrastructure targets. Khatib killed. Kent resigns.',
    yNote: 'TLM Assessment Day 19: 3.5/10. Path exists but losing lanes, not just getting longer. No architect of a deal on either side. South Pars strike likely eliminates Iranian economic incentive to negotiate short-term.' },
];

const BILL = [
  { label: 'US KIA',          value: '13',       sub: '6 killed Kuwait (Mar 1), 1 non-combat (Mar 9), 6 killed KC-135 crash Iraq (Mar 13). CNN confirms all aboard lost.', src: 'CENTCOM / CNN, Mar 13' },
  { label: 'US WIA',          value: '~140',     sub: '108 returned to duty; 8 remain severe', src: 'Pentagon, Mar 10' },
  { label: 'Iranian dead',    value: '1,444+',   sub: "Per Iranian Red Crescent (Mar 16). HRANA estimates up to 7,000. Trump administration claims 32,000.", src: 'Iranian Red Crescent / Al Jazeera, Mar 16' },
  { label: 'Iranian injured', value: '18,551+',  sub: "Per Iranian Red Crescent Society as of March 16.", src: 'Iranian Red Crescent, Mar 16' },
  { label: 'Lebanon dead',    value: '779+',     sub: 'Since Israel renewed widespread attacks Mar 2. Includes 98 children. At least 6 more killed in Beirut strikes Mar 18.', src: 'Lebanon Health Ministry / ABC News, Mar 18' },
  { label: 'Lebanon injured',  value: '1,957+',   sub: 'Since Israel renewed widespread attacks Mar 2. 24 additional injured in Mar 18 Beirut strikes.', src: 'Lebanon Health Ministry / ABC News, Mar 18' },
  { label: 'Israel dead',      value: '16',       sub: '14 civilians, 2 soldiers killed by Iranian missile/drone strikes since Feb 28. Two killed (man and woman) by shrapnel in Ramat Gan, Mar 18.', src: 'Magen David Adom / ABC News, Mar 18' },
  { label: 'Minab school',    value: '170+',     sub: 'Girls school, Minab. Amnesty International investigation (Mar 17) confirms US responsibility — at least 170 killed, 160+ of them schoolgirls. US has not acknowledged civilian casualties.', src: 'Amnesty International, Mar 17; Iranian govt / Britannica' },
  { label: 'Ships struck',    value: '21+',      sub: 'Vessels hit in Strait of Hormuz and Persian Gulf since Feb 28. Includes tankers, cargo, and one US-flagged vessel. Latest: tanker struck at anchor 23nm east of Fujairah, Mar 17.', src: 'UKMTO / Reuters / Al Jazeera, Mar 17' },
  { label: 'Gulf civilians',  value: 'Dozens',   sub: 'UAE, Kuwait, Saudi Arabia, Bahrain — Iranian retaliatory strikes', src: 'Reuters / official statements' },
];

/* ─── Oil price journey visual ───────────────────────────────────────────────── */
function OilJourney({ price }) {
  const MIN = 55, MAX = 145;
  const pct           = v => Math.min(100, Math.max(0, ((v - MIN) / (MAX - MIN)) * 100));
  const inaugPct      = pct(76);
  const conflictPct   = pct(119.48);  /* Mar 9 actual peak */
  const thresholdPct  = pct(130);     /* structural demand destruction threshold */
  const nowPct        = pct(price || 95);
  const serif    = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display  = { fontFamily: "'DM Serif Display', Georgia, serif" };
  return (
    <div style={{ padding: '1.25rem 1.5rem 1rem' }}>
      <p style={{ ...serif, margin: '0 0 1.25rem', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: T.terra }}>
        WTI Price Journey — Inauguration to Now
      </p>
      {/* Track */}
      <div style={{ position: 'relative', height: '44px', marginBottom: '4px' }}>
        <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: '4px', background: T.bgTint, borderRadius: '2px', transform: 'translateY(-50%)', border: `1px solid ${T.border}` }}/>
        {/* $130+ zone highlight */}
        <div style={{ position: 'absolute', top: '50%', left: `${thresholdPct}%`, right: 0, height: '4px', background: `${T.red}33`, borderRadius: '0 2px 2px 0', transform: 'translateY(-50%)' }}/>
        {/* Filled progress bar */}
        <div style={{ position: 'absolute', top: '50%', left: 0, width: `${nowPct}%`, height: '4px', background: `linear-gradient(90deg, ${T.green}, ${T.amber} 40%, ${T.terra} 65%, ${T.red})`, borderRadius: '2px', transform: 'translateY(-50%)', transition: 'width 1s ease' }}/>
        {/* Inauguration marker */}
        <div style={{ position: 'absolute', left: `${inaugPct}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ width: '3px', height: '20px', background: T.green, borderRadius: '2px' }}/>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: T.green, border: `2px solid ${T.bgCard}`, marginTop: '-5px' }}/>
        </div>
        {/* Mar 9 actual conflict peak */}
        <div style={{ position: 'absolute', left: `${conflictPct}%`, top: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ ...display, fontSize: '8px', color: T.terra, whiteSpace: 'nowrap', marginBottom: '2px' }}>MAR 9</span>
          <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: T.terra, border: `2px solid ${T.bgCard}` }}/>
        </div>
        {/* $130 behavioral inflection marker — line only, no label */}
        <div style={{ position: 'absolute', left: `${thresholdPct}%`, top: 0, bottom: 0 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, width: '2px', background: T.red, opacity: 0.7, borderRadius: '1px' }}/>
        </div>
        {/* Now marker */}
        <div style={{ position: 'absolute', left: `${nowPct}%`, top: '50%', transform: 'translate(-50%, -50%)' }}>
          <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: T.terra, border: `3px solid ${T.bgCard}`, boxShadow: `0 0 0 3px ${T.terra}44` }}/>
        </div>
      </div>
      {/* Labels */}
      <div style={{ position: 'relative', height: '40px' }}>
        {[
          { pct: inaugPct,     label: '$76',      sub: '1/20/25',  color: T.green },
          { pct: conflictPct,  label: '$119.48',  sub: 'Mar 9',    color: T.terra },
          { pct: thresholdPct, label: '$130',      sub: 'Inflection', color: T.red },
          { pct: nowPct,       label: `$${(price || 95).toFixed(2)}`, sub: 'NOW', color: T.terra },
        ].map((m, i) => (
          <div key={i} style={{ position: 'absolute', left: `${m.pct}%`, transform: 'translateX(-50%)', textAlign: 'center' }}>
            <p style={{ ...display, margin: 0, fontSize: '1rem', color: m.color, lineHeight: 1 }}>{m.label}</p>
            <p style={{ ...serif, margin: '2px 0 0', fontSize: '9px', color: T.inkMuted, whiteSpace: 'nowrap' }}>{m.sub}</p>
          </div>
        ))}
      </div>
      <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: '8px 0 0', fontStyle: 'italic' }}>
        Scale: ${MIN}–${MAX}/bbl · WTI (CL=F) via Yahoo Finance ·
        <span style={{ color: T.red }}> $130 = behavioral inflection — structural demand destruction begins</span>
      </p>
    </div>
  );
}

/* ─── Hormuz visual bar ──────────────────────────────────────────────────────── */
function HormuzVisualBar() {
  const serif   = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };
  const closedPct = 95;   /* to US/Western-allied shipping */
  const selectivePct = 5; /* selective access — yuan-denominated, China/India/Pakistan/Turkey */
  return (
    <div style={{ padding: '1rem 1.5rem', borderTop: `1px solid ${T.border}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' }}>
        <p style={{ ...serif, margin: 0, fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: T.red }}>Hormuz — Transit Status</p>
        <p style={{ ...serif, margin: 0, fontSize: '10px', color: T.inkMuted, fontStyle: 'italic' }}>S&P Global / Kpler / Bloomberg</p>
      </div>
      <div style={{ position: 'relative', height: '32px', background: T.bgTint, borderRadius: '2px', overflow: 'hidden', border: `1px solid ${T.border}`, marginBottom: '6px' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${closedPct}%`, background: `linear-gradient(90deg, ${T.red}cc, ${T.red}88)`, display: 'flex', alignItems: 'center', paddingLeft: '12px' }}>
          <span style={{ ...display, fontSize: '1rem', color: 'rgba(255,255,255,0.95)', fontStyle: 'italic' }}>Closed to US &amp; Western-allied shipping</span>
        </div>
        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${selectivePct}%`, background: `${T.amber}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ ...serif, fontSize: '8px', color: T.amber, textAlign: 'center', lineHeight: 1.2 }}>CN/IN/<br/>PK/TR</span>
        </div>
      </div>
      <p style={{ ...serif, margin: '0 0 3px', fontSize: '11px', color: T.inkMid }}>
        <strong style={{ color: T.red }}>{HORMUZ.shipsStruck}+</strong> commercial vessels struck since Feb 28 &nbsp;·&nbsp;
        <span style={{ color: T.inkMuted, fontStyle: 'italic' }}>{HORMUZ.shipsSrc}</span>
      </p>
      <p style={{ ...serif, margin: 0, fontSize: '10px', color: T.inkMuted, fontStyle: 'italic' }}>
        Iran selectively allowing passage for China, India, Pakistan, Turkey vessels — yuan-denominated or by bilateral arrangement.
        P&amp;I war risk insurance withdrawn for Western operators Mar 5. First confirmed Western-neutral transit: PAK-flagged <em>Karachi</em>, Mar 16.
        The US did not arrange this. China did.
      </p>
    </div>
  );
}

/* ─── Market state label ─────────────────────────────────────────────────────── */
/* Oil futures (CL=F, BZ=F) trade nearly 24/5: Sun 6 PM – Fri 5 PM ET.
   Yahoo Finance returns REGULAR only during official pit/electronic session hours.
   PRE and POST both mean live prices — never show "closed" for those states. */
function mktLabel(state) {
  if (state === 'REGULAR') return 'live';
  if (state === 'PRE')     return 'pre-mkt · active';
  if (state === 'POST')    return 'post-mkt · active';
  return 'last close';
}

/* ─── XY Trajectory Plot ─────────────────────────────────────────────────────── */
function FuckupXYPlot({ chartReady }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  const serif   = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };

  useEffect(() => {
    if (!chartReady || !canvasRef.current) return;
    if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }

    const n = DAILY_ASSESSMENTS.length;

    /* Quadrant background plugin */
    const quadrantPlugin = {
      id: 'quadrants',
      beforeDraw(chart) {
        const { ctx, chartArea: { left, right, top, bottom }, scales } = chart;
        const xMid = scales.x.getPixelForValue(50);
        const yMid = scales.y.getPixelForValue(5.5);
        ctx.save();
        /* TL — low fuckedness, easy to fix: Fine */
        ctx.fillStyle = `${T.green}18`;
        ctx.fillRect(left, top, xMid - left, yMid - top);
        /* TR — high fuckedness, easy to fix: Bad Day */
        ctx.fillStyle = `${T.amber}18`;
        ctx.fillRect(xMid, top, right - xMid, yMid - top);
        /* BL — low fuckedness, hard to fix: Quietly Deteriorating */
        ctx.fillStyle = `${T.amber}22`;
        ctx.fillRect(left, yMid, xMid - left, bottom - yMid);
        /* BR — high fuckedness, hard to fix: Cooked */
        ctx.fillStyle = `${T.red}1A`;
        ctx.fillRect(xMid, yMid, right - xMid, bottom - yMid);
        /* Midpoint lines */
        ctx.strokeStyle = `${T.border}`;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(xMid, top); ctx.lineTo(xMid, bottom); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(left, yMid); ctx.lineTo(right, yMid); ctx.stroke();
        ctx.restore();
      },
    };

    chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
      type: 'scatter',
      plugins: [quadrantPlugin],
      data: {
        datasets: [
          {
            label: 'Trajectory',
            data: DAILY_ASSESSMENTS.map(d => ({ x: d.x, y: d.y })),
            showLine: true,
            tension: 0.35,
            borderColor: `${T.terra}99`,
            borderWidth: 2,
            pointRadius: DAILY_ASSESSMENTS.map((_, i) => i === n - 1 ? 10 : 4),
            pointHoverRadius: DAILY_ASSESSMENTS.map((_, i) => i === n - 1 ? 13 : 7),
            pointBackgroundColor: DAILY_ASSESSMENTS.map((_, i) => i === n - 1 ? T.red : T.terra),
            pointBorderColor: DAILY_ASSESSMENTS.map((_, i) => i === n - 1 ? '#fff' : T.bgCard),
            pointBorderWidth: DAILY_ASSESSMENTS.map((_, i) => i === n - 1 ? 3 : 1.5),
            fill: false,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: T.slateDk,
            titleColor: T.terraM,
            bodyColor: 'rgba(245,241,235,0.85)',
            borderColor: `${T.terra}55`,
            borderWidth: 1,
            padding: 12,
            callbacks: {
              title: (items) => {
                const d = DAILY_ASSESSMENTS[items[0].dataIndex];
                return `Day ${d.day} — ${d.date}`;
              },
              label: () => null,
              afterLabel: () => null,
              beforeBody: (items) => {
                const d = DAILY_ASSESSMENTS[items[0].dataIndex];
                return [
                  `Fuckedness: ${d.x}/100   Unfuckability: ${d.y}/10`,
                  '',
                  `State: ${d.xNote}`,
                  '',
                  `Fix: ${d.yNote}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            min: 0, max: 100,
            title: {
              display: true,
              text: 'How Fucked Is It →',
              color: T.terra,
              font: { family: "'Source Serif 4', Georgia, serif", size: 11, style: 'italic' },
            },
            ticks: {
              color: T.inkMuted,
              font: { size: 10, family: "'Source Serif 4', Georgia, serif" },
              callback: v => v === 0 ? 'Fine' : v === 41 ? 'Significantly' : v === 61 ? 'Very' : v === 81 ? 'Completely' : v === 100 ? '☢' : '',
            },
            grid: { color: `${T.border}88` },
            border: { color: T.border },
          },
          y: {
            min: 1, max: 10,
            title: {
              display: true,
              text: '← Ease of Unfuckability',
              color: T.slateMid,
              font: { family: "'Source Serif 4', Georgia, serif", size: 11, style: 'italic' },
            },
            ticks: {
              color: T.inkMuted,
              font: { size: 10, family: "'Source Serif 4', Georgia, serif" },
              callback: v => v === 1 ? 'Chiseled in rock' : v === 5 ? 'Hard' : v === 10 ? 'Easy' : v,
            },
            grid: { color: `${T.border}88` },
            border: { color: T.border },
          },
        },
      },
    });
    return () => { if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; } };
  }, [chartReady]);

  const latest = DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1];

  return (
    <div>
      {/* Quadrant label overlay — positioned relative to chart area */}
      <div style={{ position: 'relative', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: T.border, borderRadius: '2px', overflow: 'hidden', marginBottom: '12px' }}>
          {[
            { label: 'Fine',                   sub: 'Low fuckedness · Easy to fix',    color: T.green,   dim: false },
            { label: 'Bad Day',                sub: 'High fuckedness · Easy to fix',   color: T.amber,   dim: false },
            { label: 'Quietly Deteriorating',  sub: 'Low fuckedness · Hard to fix',    color: T.amber,   dim: false },
            { label: 'Cooked',                 sub: 'High fuckedness · Hard to fix',   color: T.red,     dim: true  },
          ].map((q, i) => (
            <div key={i} style={{ background: q.dim ? `${T.red}08` : T.bgCard, padding: '8px 14px', borderLeft: `3px solid ${q.color}` }}>
              <span style={{ ...display, fontSize: '0.85rem', fontStyle: 'italic', color: q.color }}>{q.label}</span>
              <span style={{ ...serif, fontSize: '10px', color: T.inkMuted, marginLeft: '8px' }}>{q.sub}</span>
            </div>
          ))}
        </div>
        <div style={{ position: 'relative', width: '100%', height: '340px' }}>
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Current reading strip */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: T.border, borderRadius: '2px', overflow: 'hidden', marginTop: '12px' }}>
        <div style={{ background: T.bgCard, padding: '1rem 1.25rem', borderTop: `3px solid ${T.terra}` }}>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkMuted }}>Day {latest.day} — Fuckedness</p>
          <p style={{ ...display, margin: '0 0 6px', fontSize: '2rem', color: T.red, lineHeight: 1 }}>{latest.x}<span style={{ fontSize: '1rem', color: T.inkMuted }}>/100</span></p>
          <p style={{ ...serif, margin: 0, fontSize: '11px', color: T.inkMid, lineHeight: 1.6 }}>{latest.xNote}</p>
        </div>
        <div style={{ background: T.bgCard, padding: '1rem 1.25rem', borderTop: `3px solid ${T.slateMid}` }}>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.inkMuted }}>Day {latest.day} — Ease of Unfuckability</p>
          <p style={{ ...display, margin: '0 0 6px', fontSize: '2rem', color: T.slateMid, lineHeight: 1 }}>{latest.y}<span style={{ fontSize: '1rem', color: T.inkMuted }}>/10</span></p>
          <p style={{ ...serif, margin: 0, fontSize: '11px', color: T.inkMid, lineHeight: 1.6 }}>{latest.yNote}</p>
        </div>
      </div>

      {/* Floor conditions */}
      <div style={{ marginTop: '12px', padding: '1rem 1.25rem', background: T.bgTint, border: `1px solid ${T.border}`, borderRadius: '2px' }}>
        <p style={{ ...serif, margin: '0 0 8px', fontSize: '10px', letterSpacing: '0.16em', textTransform: 'uppercase', color: T.terra }}>
          Structural Floor: {CURRENT_FLOOR}/100 — conditions holding score above "Very Fucked Up"
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px' }}>
          {FLOOR_CONDITIONS.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '3px 0' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.active ? T.red : T.green, flexShrink: 0, marginTop: '4px' }}/>
              <div>
                <span style={{ ...serif, fontSize: '11px', color: c.active ? T.inkMid : T.inkMuted }}>
                  {c.label} <span style={{ color: T.terra, fontWeight: 600 }}>+{c.contribution}</span>
                </span>
                {c.active && (
                  <p style={{ ...serif, margin: '1px 0 0', fontSize: '10px', color: T.inkMuted, fontStyle: 'italic', lineHeight: 1.4 }}>
                    Reversal: {c.reversal}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: '8px 0 0', fontStyle: 'italic', lineHeight: 1.7 }}>
        X axis (Fuckedness): structural floor conditions (all-active floor = 55) + event push above floor, decaying 0.5pts/quiet day.
        Y axis (Ease of Unfuckability): TLM Assessment — updated daily with evidence. 10 = adults in the room fix it tomorrow. 1 = chiseled in rock.
        Score ceiling: $150+ sustained oil or nuclear weapons use = 96–100. Hover each point for full rationale.
      </p>
    </div>
  );
}

/* ─── Gauge ─────────────────────────────────────────────────────────────────── */
function Gauge({ pct, accentColor }) {
  const p = Math.min(100, Math.max(0, pct));
  const zones = [
    { threshold: 0,   label: 'Not fucked up',                    color: T.green   },
    { threshold: 21,  label: 'More than a little fucked up',      color: T.amber   },
    { threshold: 41,  label: 'Significantly fucked up',           color: T.terra   },
    { threshold: 61,  label: 'Very fucked up',                    color: T.red     },
    { threshold: 81,  label: 'Completely unbelievably fucked up', color: '#7B0000' },
  ];
  const activeIdx = zones.reduce((best, z, i) => (p >= z.threshold ? i : best), 0);
  const fillEnd = accentColor || zones[activeIdx].color;
  return (
    <div style={{ width: '100%', padding: '0.25rem 0 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
        <span style={{ display: 'inline-block', fontFamily: "'DM Serif Display', Georgia, serif", fontSize: '1.5rem', fontStyle: 'italic', color: fillEnd, borderBottom: `2px solid ${fillEnd}`, paddingBottom: '2px', letterSpacing: '-0.01em' }}>
          {zones[activeIdx].label}
        </span>
      </div>
      <div style={{ position: 'relative', height: '16px', borderRadius: '2px', background: T.bgTint, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${T.green}22 0%, ${T.amber}22 21%, ${T.terra}33 41%, ${T.red}33 61%, #7B000044 81%)` }}/>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${p}%`, background: `linear-gradient(90deg, ${T.green}, ${fillEnd})`, opacity: 0.85, transition: 'width 1.4s cubic-bezier(0.4,0,0.2,1)' }}/>
        {[21, 41, 61, 81].map(x => (
          <div key={x} style={{ position: 'absolute', left: `${x}%`, top: 0, bottom: 0, width: '1px', background: 'rgba(255,255,255,0.6)' }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
        {zones.map((z, i) => (
          <div key={i} style={{ fontSize: '10px', fontFamily: "'Source Serif 4', Georgia, serif", color: i === activeIdx ? fillEnd : T.inkMuted, fontWeight: i === activeIdx ? 600 : 400, textAlign: i === 0 ? 'left' : i === zones.length - 1 ? 'right' : 'center', flex: 1, lineHeight: 1.3, letterSpacing: '0.01em' }}>
            {z.label}
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', marginTop: '10px' }}>
        <span style={{ fontFamily: "'Source Serif 4', Georgia, serif", fontSize: '12px', color: T.inkMuted, letterSpacing: '0.04em' }}>
          Current reading: <strong style={{ color: fillEnd }}>{p.toFixed(1)}/100</strong>
        </span>
      </div>
    </div>
  );
}

/* ─── Oil Chart ──────────────────────────────────────────────────────────────── */
/* shared history fetch — returns { points, brentPoints } */
let _historyCache = null;
function fetchHistory() {
  if (_historyCache) return _historyCache;
  _historyCache = fetch('/api/history').then(r => r.json()).catch(() => ({ points: [], brentPoints: [] }));
  return _historyCache;
}

function PriceChart({ chartReady, dataKey, color, baseline, baselineLabel, yMin, yMax, showScenarios, tooltipLabel }) {
  const canvasRef = useRef(null);
  const chartRef  = useRef(null);
  useEffect(() => {
    if (!chartReady || !canvasRef.current) return;
    let cancelled = false;
    fetchHistory().then(data => {
      const pts = data[dataKey];
      if (cancelled || !pts || !pts.length || !canvasRef.current) return;
      if (chartRef.current) { chartRef.current.destroy(); chartRef.current = null; }
      const labels = pts.map(p => {
        const d = new Date(p.date + 'T12:00:00Z');
        return `${d.getUTCMonth()+1}/${d.getUTCDate()}`;
      });
      const values = pts.map(p => p.close);
      const n = labels.length;

      const datasets = [
        {
          label: tooltipLabel,
          data: values,
          borderColor: color,
          backgroundColor: `${color}12`,
          borderWidth: 2,
          pointRadius: 2.5,
          pointBackgroundColor: color,
          tension: 0.35,
          fill: true,
        },
        {
          label: baselineLabel,
          data: labels.map(() => baseline),
          borderColor: T.green,
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false,
        },
      ];

      if (showScenarios) {
        datasets.push(
          { label: 'Ceasefire ~$85',                    data: labels.map(() => 85),  borderColor: T.green, borderWidth: 1.5, borderDash: [6, 3], pointRadius: 0, fill: false },
          { label: 'War continues +30d ~$105',          data: labels.map(() => 105), borderColor: T.amber, borderWidth: 1.5, borderDash: [6, 3], pointRadius: 0, fill: false },
          { label: '$130 — Structural demand destruction', data: labels.map(() => 130), borderColor: T.red,   borderWidth: 2,   borderDash: [6, 3], pointRadius: 0, fill: false },
        );
      }

      chartRef.current = new window.Chart(canvasRef.current.getContext('2d'), {
        type: 'line',
        data: { labels, datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: c => ` $${c.parsed.y.toFixed(2)}/bbl — ${c.dataset.label}` } },
          },
          scales: {
            y: {
              min: yMin, max: yMax,
              ticks: { callback: v => '$'+v, color: T.inkMuted, font: { size: 11, family: "'Source Serif 4', Georgia, serif" } },
              grid: { color: T.border },
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
  }, [chartReady, dataKey]);
  return <div style={{ position: 'relative', width: '100%', height: '200px' }}><canvas ref={canvasRef}/></div>;
}

function OilChart({ chartReady }) {
  return <PriceChart chartReady={chartReady} dataKey="points" color={T.terra}
    baseline={76} baselineLabel="Inauguration baseline ($76)" tooltipLabel="WTI crude"
    yMin={55} yMax={145} showScenarios={true} />;
}

function BrentChart({ chartReady }) {
  return <PriceChart chartReady={chartReady} dataKey="brentPoints" color={T.slateMid}
    baseline={79} baselineLabel="Inauguration baseline ($79)" tooltipLabel="Brent crude"
    yMin={55} yMax={145} showScenarios={false} />;
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



/* ─── Average American Cost ─────────────────────────────────────────────────── */
function AverageAmericanCost({ liveCost }) {
  const serif = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };

  const warCostB  = liveCost / 1e9;
  const perHH     = ((warCostB * 1000) / US_HOUSEHOLDS).toFixed(0);
  const pwbmPerHH = ((PWBM_MIDPOINT_B * 1000) / US_HOUSEHOLDS).toFixed(0);
  const totPerHH  = ((PWBM_TOTAL_B * 1000) / US_HOUSEHOLDS).toFixed(0);

  const items = [
    {
      label: 'War cost to date',
      value: fmtCost(liveCost),
      sub: 'Pentagon confirmed $11.3B for first 6 days. CSIS Day 12 update: $16.5B total — implying ~$870M/day sustained. Penn Wharton: ~$800M/day. Live estimate — ticking.',
      src: 'Pentagon briefing to Congress, Mar 5; CSIS Mar 12 update; Penn Wharton / Fortune, Mar 11',
      color: '#C0392B',
      live: true,
    },
    {
      label: 'Your household share — so far',
      value: `$${parseInt(perHH).toLocaleString()}`,
      sub: `${US_HOUSEHOLDS}M US households. At ${fmtCost(liveCost)} total, each household's share of the unbudgeted cost.`,
      src: 'US Census 2024; calculation by The Long Memo',
      color: '#C0392B',
      live: false,
    },
    {
      label: 'Projected direct cost (Penn Wharton)',
      value: `$${PWBM_MIDPOINT_B}B`,
      sub: 'Penn Wharton Budget Model midpoint for a 2-month campaign. Range: $40B–$95B direct.',
      src: 'Penn Wharton Budget Model / Fortune, Mar 3, 2026',
      color: '#B85C38',
      live: false,
    },
    {
      label: 'Your household share — projected',
      value: `$${parseInt(pwbmPerHH).toLocaleString()}`,
      sub: `At Penn Wharton's $${PWBM_MIDPOINT_B}B midpoint. Total economic impact estimate reaches $180B — $${parseInt(totPerHH).toLocaleString()}/household.`,
      src: 'Penn Wharton Budget Model; calculation by The Long Memo',
      color: '#B85C38',
      live: false,
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: '#CEC8B8', borderRadius: '2px', overflow: 'hidden' }}>
      {items.map((item, i) => (
        <div key={i} style={{ background: '#FFFFFF', padding: '1.25rem 1.5rem', borderTop: `3px solid ${item.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <p style={{ ...serif, margin: 0, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: '#9C9590' }}>{item.label}</p>
            {item.live && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C0392B', display: 'inline-block', animation: 'pulse-dot 1s ease-in-out infinite' }}/>
                <span style={{ ...serif, fontSize: '9px', color: '#C0392B', letterSpacing: '0.08em' }}>LIVE</span>
              </span>
            )}
          </div>
          <p className="live-counter" style={{ ...display, margin: '0 0 6px', fontSize: '2rem', color: item.color, lineHeight: 1 }}>{item.value}</p>
          <p style={{ ...serif, margin: '0 0 4px', fontSize: '11px', color: '#6B6258', lineHeight: 1.6 }}>{item.sub}</p>
          <p style={{ ...serif, margin: 0, fontSize: '10px', color: '#9C9590', fontStyle: 'italic' }}>{item.src}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── What It Could Buy ──────────────────────────────────────────────────────── */
function WhatItCouldBuy({ liveCost }) {
  const serif = { fontFamily: "'Source Serif 4', Georgia, serif" };
  const display = { fontFamily: "'DM Serif Display', Georgia, serif" };

  const warCostB = liveCost / 1e9;

  const ITEMS = [
    {
      icon: '🏥',
      category: 'Healthcare',
      headline: `${Math.round(liveCost / 6000).toLocaleString()}`,
      unit: 'people covered',
      detail: 'Average ACA marketplace premium with subsidy: ~$6,000/year/person. At current war cost, this covers a full year of health insurance for that many Americans.',
      src: 'KFF Health Insurance Marketplace Calculator 2025',
      color: '#2E7D4F',
    },
    {
      icon: '🏫',
      category: 'Public Education',
      headline: `${Math.round(liveCost / 69000).toLocaleString()}`,
      unit: 'teacher-years',
      detail: 'Average US public school teacher salary: ~$69,000/year (NEA 2024). War cost to date could fund that many teachers for one full school year.',
      src: 'NEA Rankings & Estimates 2024; calculation by The Long Memo',
      color: '#2B4870',
    },
    {
      icon: '🌉',
      category: 'Infrastructure',
      headline: `${(warCostB / 2600 * 100).toFixed(1)}%`,
      unit: 'of the ASCE infrastructure gap',
      detail: 'ASCE estimates a $2.6 trillion infrastructure investment gap over 10 years. The war cost to date covers that fraction of the total unfunded need.',
      src: 'ASCE 2025 Infrastructure Report Card',
      color: '#B85C38',
    },
    {
      icon: '💰',
      category: 'Working American Tax Relief',
      headline: `$${Math.round(liveCost / 100e6).toLocaleString()}`,
      unit: 'per working American',
      detail: 'Roughly 100 million working Americans file taxes. The war cost to date divided equally would deliver that much per filer.',
      src: 'IRS Statistics of Income 2024; calculation by The Long Memo',
      color: '#B8860B',
    },
    {
      icon: '🍽️',
      category: 'Food Security (SNAP)',
      headline: `${Math.round(liveCost / 2400).toLocaleString()}`,
      unit: 'families fed for a year',
      detail: "Average SNAP benefit: ~$2,400/year for a family of four. War cost to date could fund that many families' food assistance for one year.",
      src: 'USDA FNS SNAP Data 2025; calculation by The Long Memo',
      color: '#C0392B',
    },
    {
      icon: '🎓',
      category: 'Federal Student Aid',
      headline: `${Math.round(liveCost / 7395).toLocaleString()}`,
      unit: 'Pell Grants',
      detail: 'Maximum Pell Grant award: $7,395 for 2025–26. War cost to date could fund that many maximum-award grants.',
      src: 'Federal Student Aid 2025–26 Award Year; calculation by The Long Memo',
      color: '#1A2535',
    },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1px', background: '#CEC8B8', borderRadius: '2px', overflow: 'hidden' }}>
      {ITEMS.map((item, i) => (
        <div key={i} style={{ background: '#FFFFFF', padding: '1.25rem', borderTop: `3px solid ${item.color}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
            <p style={{ ...serif, margin: 0, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9C9590' }}>{item.category}</p>
          </div>
          <p className="live-counter" style={{ ...display, margin: '0 0 2px', fontSize: '1.6rem', color: item.color, lineHeight: 1 }}>{item.headline}</p>
          <p style={{ ...serif, margin: '0 0 8px', fontSize: '11px', color: '#6B6258', fontWeight: 600 }}>{item.unit}</p>
          <p style={{ ...serif, margin: '0 0 6px', fontSize: '11px', color: '#6B6258', lineHeight: 1.6 }}>{item.detail}</p>
          <p style={{ ...serif, margin: 0, fontSize: '10px', color: '#9C9590', fontStyle: 'italic' }}>{item.src}</p>
        </div>
      ))}
    </div>
  );
}

/* ─── Gas Calculator ─────────────────────────────────────────────────────────── */
function GasCalc({ rbobPrice, retailGasPrice }) {
  const [mpg,   setMpg]   = useState(28);
  const [miles, setMiles] = useState(1000); /* ~avg American driver: 12k miles/year */

  /* RBOB futures → retail pump price: add ~$1.00 for federal/state taxes + retail margin */
  const INAUG_RETAIL    = 3.13;  /* EIA national avg retail Jan 20, 2025 */
  /* Prefer AAA retail direct; fall back to RBOB futures + $1.00 markup */
  const currentRetail   = retailGasPrice
    ? parseFloat(retailGasPrice.toFixed(2))
    : rbobPrice ? parseFloat((rbobPrice + 1.00).toFixed(2)) : 3.72;
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
        Pump price sourced from AAA national average when available; falls back to RBOB futures + $1.00 markup. Inauguration baseline: $3.13/gal (EIA national avg, Jan 20, 2025).
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

  const liveCost = useLiveCost(dayCount);

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
              WTI crude oil indexed to Inauguration Day 2025 (baseline ~$76/bbl). Last trade: {data?.lastTradeISO ? new Date(data.lastTradeISO).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York', timeZoneName: 'short' }) : 'loading…'}. {data ? (data.marketState === 'REGULAR' ? 'Market open — refreshes every 3 min.' : data.marketState === 'CLOSED' ? 'Market closed — showing last settlement price.' : 'Futures active — refreshes every 3 min.') : ''}
              Casualty figures sourced from Pentagon statements, Al Jazeera, Britannica, HRANA, and USNI News — all open source.
            </p>
          </div>

          {/* Day counter — clean centered red type, no banner */}
          <div style={{ marginBottom: '2rem', paddingBottom: '2rem', borderBottom: `1px solid ${T.border}`, textAlign: 'center' }}>
            <p style={{ ...display, fontSize: 'clamp(1.3rem, 3vw, 1.75rem)', fontStyle: 'italic', color: T.red, margin: 0, letterSpacing: '-0.01em' }}>
              Day {dayCount} of Operation Epic Fury &nbsp;·&nbsp; Commenced Feb 28, 2026
            </p>
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
                eyebrow: `WTI crude — ${data ? mktLabel(data.marketState) : '—'}`,
                value: loading ? '—' : `$${parseFloat(data?.price).toFixed(2)}`,
                sub: data ? `${isUp ? '▲' : '▼'} $${Math.abs(parseFloat(data.change)).toFixed(2)} (${isUp?'+':''}${data.changePct}%) vs prior close` : null,
                valueColor: T.ink,
                subColor: isUp ? T.red : T.green,
              },
              {
                eyebrow: `Brent crude — ${data?.brent ? mktLabel(data.brent.marketState) : '—'}`,
                value: loading ? '—' : `$${parseFloat(data?.brent?.price ?? 0).toFixed(2)}`,
                sub: data?.brent ? `${parseFloat(data.brent.change) >= 0 ? '▲' : '▼'} $${Math.abs(parseFloat(data.brent.change)).toFixed(2)} (${parseFloat(data.brent.change) >= 0 ? '+' : ''}${data.brent.changePct}%) vs prior close` : null,
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
                sub: 'Conflict high · $10.52 from inflection',
                valueColor: T.terra,
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

          {/* Oil price journey visual */}
          <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: '2px', marginBottom: '1.25rem', overflow: 'hidden' }}>
            <OilJourney price={price}/>
            <HormuzVisualBar/>
          </div>

          {/* Dual Fuckupometer — Market vs Geopolitical */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>Fuckupometer™ — Dual Reading</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.5rem', lineHeight: 1.7 }}>
              Two instruments measuring different things. When they diverge — when markets price less fuckedness than
              the structural picture warrants — that gap is the signal. It is also usually temporary.
            </p>

            {/* Two gauges side by side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: T.border, borderRadius: '2px', overflow: 'hidden', marginBottom: '1px' }}>

              {/* Left — Market Fuckedness */}
              <div style={{ background: T.bgCard, padding: '1.25rem 1.5rem', borderTop: `3px solid ${T.terra}` }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: T.terra }}>Market Fuckedness™</p>
                  <p style={{ ...serif, margin: 0, fontSize: '11px', color: T.inkMuted, fontStyle: 'italic' }}>
                    WTI crude vs. inauguration baseline · real-time · no editorial judgment
                  </p>
                </div>
                <Gauge pct={fuckupFactor}/>
                <p style={{ ...serif, fontSize: '11px', color: T.inkMuted, margin: '10px 0 0', lineHeight: 1.6 }}>
                  Formula: <span style={{ fontFamily: 'monospace', fontSize: '10px', color: T.inkMid }}>(WTI − $76) ÷ ($130 − $76) × 100</span>.
                  Ceiling = $130 — structural demand destruction threshold. Moves with every tick.
                  Current WTI: <strong style={{ color: T.terra }}>${price.toFixed(2)}</strong>.
                </p>
              </div>

              {/* Right — Geopolitical Fuckedness */}
              <div style={{ background: T.bgCard, padding: '1.25rem 1.5rem', borderTop: `3px solid ${T.slateMid}` }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ ...serif, margin: '0 0 2px', fontSize: '10px', letterSpacing: '0.18em', textTransform: 'uppercase', color: T.slateMid }}>Geopolitical Fuckedness™</p>
                  <p style={{ ...serif, margin: 0, fontSize: '11px', color: T.inkMuted, fontStyle: 'italic' }}>
                    Structural floor + event scoring · updated daily · TLM Assessment
                  </p>
                </div>
                <Gauge pct={DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1].x} accentColor={T.slateMid}/>
                <p style={{ ...serif, fontSize: '11px', color: T.inkMuted, margin: '10px 0 0', lineHeight: 1.6 }}>
                  Floor: <strong style={{ color: T.slateMid }}>{CURRENT_FLOOR}/100</strong> (structural conditions, all active).
                  Event push today: <strong style={{ color: T.slateMid }}>+{DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1].x - CURRENT_FLOOR}</strong>.
                  Ceiling = $150+ sustained oil or nuclear use. Does not reset on a tweet.
                </p>
              </div>
            </div>

            {/* Divergence signal */}
            {(() => {
              const geo  = DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1].x;
              const mkt  = parseFloat(fuckupFactor);
              const diff = geo - mkt;
              const absDiff = Math.abs(diff);
              const isUnderpriced = diff > 0;
              const isOverpriced  = diff < 0;
              const isAligned     = absDiff < 5;
              const signalColor   = isAligned ? T.green : isUnderpriced ? T.red : T.amber;
              const signalLabel   = isAligned
                ? 'Aligned — markets and structural reality broadly agree'
                : isUnderpriced
                ? `Market under-pricing structural risk by ${absDiff.toFixed(1)} points`
                : `Market over-pricing vs. structural picture by ${absDiff.toFixed(1)} points`;
              const signalBody = isAligned
                ? 'No significant divergence between what markets are pricing and what the structural situation warrants. Rare.'
                : isUnderpriced
                ? 'The gap between market pricing and structural reality is the number to watch. Markets reprice when they can no longer ignore what analysts have been measuring. The Strait is still closed. The mine-clearance ships are still in Malaysia.'
                : 'Markets are pricing more fear than the structural picture currently warrants. Could mean a relief rally is coming — or that traders see something the structural model hasn\'t captured yet.';
              return (
                <div style={{ background: `${signalColor}0D`, border: `1px solid ${signalColor}44`, borderRadius: '2px', padding: '1rem 1.25rem', marginTop: '1px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: signalColor, flexShrink: 0 }}/>
                    <p style={{ ...serif, margin: 0, fontSize: '10px', letterSpacing: '0.14em', textTransform: 'uppercase', color: signalColor, fontWeight: 600 }}>
                      Divergence Signal — {signalLabel}
                    </p>
                  </div>
                  <p style={{ ...serif, margin: 0, fontSize: '12px', color: T.inkMid, lineHeight: 1.7 }}>{signalBody}</p>
                </div>
              );
            })()}

            {/* Drill quote — moved here from old gauge location */}
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

          {/* XY Trajectory */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>War Trajectory — State vs. Reversibility</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              Each dot is a day. X axis: geopolitical fuckedness — structural floor plus event scoring.
              Y axis: ease of unfuckability — TLM Assessment, updated daily with evidence.
              The trail is the argument. Hover each point for the full rationale on both axes.
            </p>
            <FuckupXYPlot chartReady={chartReady}/>
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

          {/* Two-column: Charts + Butcher's bill */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

            {/* Left col: WTI + Brent stacked */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

              {/* WTI chart */}
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
                      { label: '$130 — Structural demand destruction', price: 'Threshold', color: T.red },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '20px', borderTop: `${i === 2 ? '2.5px' : '2px'} dashed ${s.color}`, display: 'inline-block', flexShrink: 0 }}/>
                        <span style={{ ...serif, fontSize: '11px', color: i === 2 ? T.red : T.inkMid, fontWeight: i === 2 ? 600 : 400 }}>{s.label}</span>
                        <span style={{ ...serif, fontSize: '11px', color: s.color, fontWeight: 600, marginLeft: 'auto' }}>{s.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Brent chart */}
              <div style={{ ...section, marginBottom: 0 }}>
                <p style={{ ...sectionHead }}>Brent Crude — 30-Day Price</p>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '12px', ...serif, fontSize: '11px', color: T.inkMuted }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '16px', height: '2px', background: T.slateMid, display: 'inline-block', borderRadius: '1px' }}/>
                    Brent price
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: '16px', borderTop: `2px dashed ${T.green}`, display: 'inline-block' }}/>
                    Inaug. baseline ($79)
                  </span>
                </div>
                <BrentChart chartReady={chartReady}/>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', ...serif, fontSize: '10px', color: T.inkMuted }}>
                  <span>30 days ago</span><span>Today</span>
                </div>
                <p style={{ ...serif, margin: '8px 0 0', fontSize: '10px', color: T.inkMuted, fontStyle: 'italic' }}>
                  Brent (BZ=F) — global benchmark, typically $3–5 above WTI
                </p>
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

          {/* Average American cost */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead, color: T.red }}>What This Is Costing the Average American</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              The Pentagon confirmed $11.3 billion spent in the first six days. Penn Wharton projects $40–95 billion for a two-month campaign.
              Here is what that means per household — and what those dollars could have done instead.
            </p>
            <AverageAmericanCost liveCost={liveCost}/>
            <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.7 }}>
              Household share calculated by dividing unbudgeted war cost by 132 million US households (Census 2024). Penn Wharton Budget Model range:
              $40B–$95B direct; $50B–$210B total economic impact. Senator Coons has noted the Pentagon figure is likely an undercount.
            </p>
          </div>

          {/* What it could buy */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>What {fmtCost(liveCost)} Would Have Bought</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              At the current estimated war cost — Day {dayCount}, running total — here is what the same dollars could alternatively fund.
              Not an argument about whether the war was justified. Just arithmetic.
            </p>
            <WhatItCouldBuy liveCost={liveCost}/>
            <p style={{ ...serif, fontSize: '10px', color: T.inkMuted, margin: '10px 0 0', fontStyle: 'italic', lineHeight: 1.7 }}>
              All comparisons use the current estimated war cost to date (Day {dayCount}). Sources listed per card. These are illustrative dollar-for-dollar
              comparisons — not policy proposals. The Long Memo does not take positions on whether the war should be fought. We do math.
            </p>
          </div>

          {/* Gas calculator */}
          <div style={{ ...section }}>
            <p style={{ ...sectionHead }}>What This Is Costing You</p>
            <p style={{ ...serif, fontSize: '13px', color: T.inkMid, margin: '0 0 1.25rem', lineHeight: 1.7 }}>
              Enter your vehicle specs. We&apos;ll tell you what the &quot;excursion&quot; in Iran is actually costing you at the pump vs. inauguration day.
            </p>
            <GasCalc rbobPrice={commodities ? parseFloat(commodities.find(c => c.ticker === "RB=F")?.price || 2.72) : 2.72} retailGasPrice={data?.retailGasPrice ?? null}/>
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
              Refreshes every 3 min when market is open; shows last settlement price when closed (futures trade Sun 6 PM – Fri 5 PM ET). Not financial advice. This is a gag. A very accurate gag.
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
