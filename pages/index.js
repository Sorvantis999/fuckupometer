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
// Day counter uses fixed UTC-5 (CDT) offset — flips at Central midnight, immune to DST math
function getDayCount() {
  const now = new Date();
  const ctMs = now.getTime() - 5 * 60 * 60 * 1000;
  const ct = new Date(ctMs);
  const todayUTC = Date.UTC(ct.getUTCFullYear(), ct.getUTCMonth(), ct.getUTCDate());
  const startUTC = Date.UTC(2026, 1, 28); // Feb 28 anchored at CDT midnight
  return Math.max(1, Math.floor((todayUTC - startUTC) / (1000 * 60 * 60 * 24)) + 1);
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
  {
    date: 'Mar 19, 2026',
    said: '\"Israel, out of anger for what has taken place in the Middle East, has violently lashed out at a major facility known as South Pars Gas Field in Iran... The United States knew nothing about this particular attack, and the country of Qatar was in no way, shape, or form, involved with it.\"',
    reality: "Axios reported within hours that the South Pars strike was US-approved and coordinated with the White House before execution — directly contradicting Trump\'s public statement. Iran, not knowing this, struck Qatar\'s Ras Laffan LNG complex — the world\'s largest — in direct retaliation for a strike the US publicly disavowed but secretly greenlit. Al Udeid Air Base, hosting 10,000 US troops, is in Qatar. Saudi FM Faisal bin Farhan: \"What little trust there was has completely been shattered.\" Brent: above $110. Day 20.",
  },
  {
    date: 'Mar 21, 2026',
    said: '\"We are getting very close to meeting our objectives as we consider winding down our great Military efforts in the Middle East with respect to the Terrorist Regime of Iran.\"',
    reality: "Officials confirmed on the same day that thousands more US troops are heading to the region. Brent settled at $112.19 — the highest of the war. The DIA\'s internal assessment, now circulating in the Pentagon, determined Iran could keep the Strait closed 1–6 months. A senior Iranian official dismissed the Truth Social post as \'Trump\'s psychological operations to control the markets.\' The Axios Kharg Island story published the same day: the White House is considering a ground operation to occupy or blockade the island. \'We need about a month to weaken the Iranians more with strikes, take the island and then get them by the balls and use it for negotiations.\' Day 22.",
  },
  {
    date: 'Mar 22, 2026',
    said: '"If Iran doesn\'t FULLY OPEN, WITHOUT THREAT, the Strait of Hormuz, within 48 HOURS from this exact point in time, the United States of America will hit and obliterate their various POWER PLANTS, STARTING WITH THE BIGGEST ONE FIRST!"',
    reality: 'The 48-hour deadline elapsed without US action on power plants. Iranian state TV ran the graphic: "Trump, fearing Iran\'s response, backed down from his 48-hour ultimatum." Iran\'s Parliament Speaker Qalibaf warned that if power plants were hit, regional energy infrastructure could be "irreversibly destroyed." Iran\'s National Defence Council announced it would mine "all communication lines in the Persian Gulf" if Iranian coasts or islands were attacked. Trump then announced a 5-day delay, citing "productive conversations." Tehran confirmed no talks had occurred. Day 24.',
  },
  {
    date: 'Mar 23, 2026',
    said: '"I am pleased to report that the United States of America, and the country of Iran, have had, over the last two days, very good and productive conversations regarding a complete and total resolution of our hostilities in the Middle East."',
    reality: 'Tehran has not confirmed any talks took place. Iran\'s state broadcaster IRIB ran a graphic: "Trump, fearing Iran\'s response, backed down." Semi-official Fars and Mehr agencies: Iran\'s warnings "led Trump to back down." US-Israeli strikes on Tehran infrastructure continued on the same day the pause was announced. CENTCOM struck a turbine engine production facility in Qom (drone/aircraft components) on Day 24. The Strait of Hormuz remains closed. Day 24.',
  },
  {
    date: 'Mar 24, 2026',
    said: '"We have major points of agreement, I would say, almost all points of agreement." Iran "wants to make a deal." The Strait could reopen "very soon" and oil would "drop like a rock" once a deal is finalized.',
    reality: 'Iran fired a new missile barrage at Tel Aviv on the same day — a missile struck a residential street in central Israel, search and rescue deployed across multiple areas. IRGC dismissed Trump as "deceptive," saying his behavior won\'t "distract us from the battlefield." Parliament Speaker Ghalibaf: Trump is spreading "fake news to influence financial and oil markets." A senior Iranian FM official confirmed to CBS that Iran received US points "through mediators" — but denied direct talks had occurred. Israeli Defense Minister Katz: "We continue striking Iran with full force." An Israeli official to CNN: deal "does not appear to be tangible right now." Brent bounced back above $100. Day 25.',
  },
  {
    date: 'Mar 25, 2026',
    said: '"Iran is in negotiations right now" and is "keen to reach a peace agreement."',
    reality: 'Iran FM Araghchi said the same day that Iran "has not engaged in talks to end the war and does not plan to." Iran formally rejected the US 15-point peace proposal delivered via Pakistan and countered with five conditions — including war reparations and recognition of Iranian sovereignty over the Strait of Hormuz. The sovereignty demand is not a negotiating position; it is a demand that the US accept permanent Iranian control over 20% of global oil flow. Oil dipped briefly on Trump\'s claims, the third market correction of a Trump diplomatic announcement this war.',
  },
  {
    date: 'Mar 26, 2026',
    said: '"Iran gave us a present" — 8 oil tankers allowed through the Strait. "I said, \'Well, I guess we\'re dealing with the right people.\'" Proof of good-faith negotiating partners.',
    reality: 'The tankers were Pakistani-flagged vessels transiting under Iran\'s existing yuan-denominated arrangement — the same transit structure China and Pakistan negotiated without US involvement, active since Day 10. Iran FM Araghchi told state television on the same day that Iran "has not engaged in talks to end the war and does not plan to." The Strait remained closed to Western shipping. Iran\'s Parliament was simultaneously passing tollbooth legislation to institutionalize the closure. What Trump called a diplomatic signal was a commercial transaction he did not arrange.',
  },
  {
    date: 'Mar 26, 2026',
    said: '"As per Iranian Government request, please let this statement serve to represent that I am pausing the period of Energy Plant destruction by 10 Days to Monday, April 6, 2026." Talks are "going very well."',
    reality: 'The third extension of the original 48-hour ultimatum first issued Day 23. Iran FM Araghchi told state television simultaneously that Iran "has not engaged in talks to end the war and does not plan to." At the same Cabinet meeting, Trump said he doesn\'t "know if we\'re willing" to make a deal with Iran — in the same news cycle as his claim that talks were going very well. Iran\'s Parliament simultaneously began formalizing fees for Strait of Hormuz passage. The Strait remains closed. Day 27.',
  },
  {
    date: 'Mar 26, 2026',
    said: '"Taking Iran\'s oil" is "an option." — Cabinet meeting.',
    reality: 'Said at the same Cabinet meeting in which Trump also announced the third deadline extension, said he doesn\'t know if he\'s willing to make a deal, and revealed Iran\'s "present" (8 oil tankers) as proof he was "dealing with the right people." Bloomberg, published the following morning: "The negotiations amounted to an exchange of demands that neither side could expect the other to accept." The US proposal required Iran to commit to never pursuing nuclear weapons. Iran\'s counter required war reparations and Hormuz sovereignty. Day 27–28.',
  },
  {
    date: 'Mar 27–29, 2026',
    said: 'Recurring claim: "Talks are going very well." "Almost all points of agreement." Iran "wants to make a deal." (Multiple Truth Social posts and Cabinet statements, Days 24–30)',
    reality: 'Iran FM Araghchi made the same denial at least four times across the same period on Iranian state television: "No, we never asked for a ceasefire," "we have never asked even for negotiation," "no negotiations have happened with the enemy until now, and we do not plan on any negotiations." The pattern: Trump announces progress, Araghchi appears on state TV within hours to deny it. This happened after the Pakistan proposal (Day 26), after the 5-day pause (Day 24), after the third deadline extension (Day 27), and again on Day 28. Markets corrected Trump\'s diplomatic announcements three separate times. The Houthis entered the war on Day 29. The USS Tripoli — an amphibious assault ship — arrived in theater on Day 30.',
  },
  {
    date: 'Mar 30, 2026',
    said: '"Maybe we take Kharg Island, maybe we don\'t. We have a lot of options." "It would also mean we had to be there for a while." — Financial Times.',
    reality: 'Said in the same interview where Trump claimed Iran agreed to "most of" the US demands and "We\'ll make a deal with them, I\'m pretty sure." Brent surged 3.5% to $116+ on the Kharg statement. Iran has been moving air defenses to the island for weeks. A ground operation on Kharg would be a new structural floor condition. Trump publicly weighed a ground invasion of Iran\'s main oil export hub and claimed imminent diplomatic resolution in the same 24-hour cycle. Day 31.',
  },
  {
    date: 'Mar 30, 2026',
    said: '"Iran has had regime change." Iran agreed to "most of" the 15-point demands. "We\'ll make a deal with them, I\'m pretty sure."',
    reality: 'Ghalibaf said the same day Iranian forces are "waiting" for a US ground invasion. Iranian politicians are pushing NPT withdrawal. Iran\'s FM has denied any talks at least four times. US-Israeli strikes hit Tehran\'s power grid on the same day. "Regime change," "deal is coming," and "maybe we seize Kharg" are three simultaneous positions that cannot all be true. Day 31.',
  },

  {
    date: 'Mar 31, 2026',
    said: 'The US is in "serious discussions" with a "new" regime in Iran. Iran has already had "regime change." Iran gave the US "20 boatloads of oil" shipping Monday "to prove they\'re serious." "Having very good meetings, both directly and indirectly."',
    reality: 'Iran\'s government spokesperson called US demands "largely excessive, unrealistic and unreasonable" the same day. Iran\'s FM Araghchi said it is "high time" for US forces to leave Gulf state bases. Iran launched its 87th wave of regional attacks on Day 32 — this one from its navy, the same navy Trump and CENTCOM have repeatedly claimed is destroyed. "Regime change" framing contradicted by Ghalibaf\'s simultaneous warning that Iranian forces are "waiting" for a US ground invasion. The "20 boatloads of oil" were Pakistani-flagged vessels transiting under Iran\'s existing arrangement. Day 32.',
  },
  {
    date: 'Mar 31, 2026',
    said: '"If a deal is not shortly reached, I will have no choice but to completely obliterate all of Iran\'s energy sources, including its electric plants and oil wells." — Truth Social.',
    reality: 'Brent crude rose 2.47% to $107.92 on the statement. This is the fourth version of an escalatory ultimatum Trump has issued since Day 23: (1) 48-hour power plant threat, (2) 5-day extension, (3) 10-day extension to April 6, (4) new "completely obliterate energy sources" threat. The original power plant deadline has been extended twice. April 6 is now six days away. Iran\'s parliament speaker said forces are "waiting" for a US ground invasion. Day 32.',
  },
  {
    date: 'Apr 1, 2026',
    said: '"We are on track to complete all of America\'s military objectives shortly, very shortly. We are going to hit them extremely hard over the next two to three weeks." "We are gonna finish the job. We are getting very close." — first primetime address to the nation on the Iran war.',
    reality: 'The 20-minute speech offered four points Trump has made daily since Day 11: the war is necessary, already won, must continue, will end soon. Analysts: "I failed to grasp what he was trying to do and convey. It was really a repetition of everything that he had said in the past." Quincy Institute VP Trita Parsi: "I did not detect anything new. It reveals that he really does not have a plan." Trump threatened to bring Iran "back to the Stone Ages." No exit strategy, no deal framework, no Hormuz resolution path was offered. NATO allies Spain, France, and Italy formally restricted US military operations the same day — the first formal alliance constraint on US warfighting since the conflict began. Iran FM at "zero trust." Oil spiked 4–5% post-speech. Day 33.',
  },

  {
    date: 'Apr 3, 2026',
    said: '"Iran\'s New Regime President asked us for a ceasefire."',
    reality: 'Iran FM Araghchi denied any such request within hours — told Al Jazeera there are "zero" trust and "no negotiations," only message exchanges with Witkoff. Within 24 hours of Trump\'s ceasefire claim, US-Israeli forces struck the B1 bridge in Karaj, killing 8 civilians on a national holiday. Trump used the false claim to frame escalation as a response to Iranian bad faith. Day 35.',
  },
  {
    date: 'Apr 6, 2026',
    said: '"Iran is an active, willing participant" in negotiations to end the war, with talks "going well."',
    reality: 'FM Araghchi stated the same day: "no talks have happened with the enemy until now, and we do not plan on any negotiations." Iran simultaneously rejected a 45-day ceasefire offered by three-party mediators (Egypt, Pakistan, Turkey) and demanded only a permanent peace settlement. Day 38.',
  },
  {
    date: 'Apr 7, 2026',
    said: '"A whole civilization will die tonight, never to be brought back again." Truth Social, morning of Apr 7.',
    reality: 'US forces struck 50+ military targets on Kharg Island ahead of the deadline and deliberately avoided oil infrastructure. VP Vance described the strikes as "not a change in strategy." Iran\'s military dismissed the rhetoric as "delusional" and "baseless." Day 39.',
  },

  {
    date: 'Apr 7, 2026',
    said: '"We have already met and exceeded all Military objectives, and are very far along with a definitive Agreement concerning Longterm PEACE with Iran."',
    reality: 'Statement made the same evening US forces struck Kharg Island for the first time — Iran\'s primary oil export hub handling ~90% of crude exports. The Strait of Hormuz remained closed. Iran\'s SNSC response conditioned Hormuz access on IRGC coordination, not pre-war free transit. Iran\'s 10-point proposal was accepted as a "workable basis" — not an agreement. Talks scheduled for Friday. Day 39.',
  },
  {
    date: 'Apr 8, 2026',
    said: '"A BIG DAY FOR WORLD PEACE!" "Almost all of the various points of past contention have been agreed to between the United States and Iran." Iran\'s 10-point proposal is "a workable basis on which to negotiate."',
    reality: "Iran\'s Supreme National Security Council\'s simultaneous official statement: \"This is not the end of the war.\" VP Vance called the agreement a \"fragile truce.\" Within hours of the ceasefire announcement: Kuwait was hit by 28 drone attacks, UAE by 35, Qatar intercepted 7 missiles. Saudi Arabia\'s East-West pipeline struck by drone. The Strait of Hormuz remained physically closed — ship traffic did not increase above the wartime pace. Spot Brent cargo: $124.68 — $30 above the June futures that collapsed 13%. 187 tankers with 172 million barrels stranded inside the Gulf per Kpler. Iran\'s Parliament Speaker: 3 violations confirmed within hours, negotiations \"unreasonable.\" Day 40.",
  },
  {
    date: 'Apr 8, 2026',
    said: '"There will be no enrichment of Uranium, and the United States will, working with Iran, dig up and remove all of the deeply buried Nuclear \'Dust.\'"',
    reality: "Iran\'s 10-point proposal — which Trump simultaneously called \"a workable basis\" — explicitly includes \"Acceptance of enrichment\" as Clause 3. Parliament Speaker Qalibaf publicly confirmed enrichment was in the proposal. Press Secretary Leavitt said a first 10-point plan was \"thrown in the garbage\" and a second, \"more condensed\" version was accepted — but Iran\'s published version and Trump\'s red line are mutually exclusive. Leavitt simultaneously confirmed enrichment remains a US \"red line.\" Iran\'s FM confirmed Clause 3 stands. Both sides are announcing a different deal. Day 40.",
  },


  {
    date: 'Apr 9, 2026',
    said: '"In the meantime our great Military is Loading Up and Resting, looking forward, actually, to its next Conquest."',
    reality: 'Posted on Truth Social during an active two-week ceasefire. The Strait of Hormuz remained physically blocked — 4 tanker transits recorded Day 40, no material improvement (Kpler). Islamabad talks had not yet occurred. The "conquest" framing, used while calling for peace, directly mirrors the dual-track posture Iran\'s IRGC-affiliated media described: the US committed to non-aggression in the 10-point plan while actively maintaining maximum military pressure. Iran\'s ambassador to Pakistan deleted a premature delegation-arrival post the same day, signaling internal disarray in the Iranian negotiating position. Day 41.',
  },

  {
    date: 'Apr 8, 2026',
    said: '"Remember, they\'ve been conquered. They have no military."',
    reality: 'Iran\'s Hormuz blockade continued to choke 20% of global oil through ceasefire Day 1. UAE confirmed Hormuz access remained "restricted, conditioned and controlled." Iran arrived at Islamabad talks demanding Hormuz sovereignty and nuclear rights — the leverage posture of a party that does not believe it has lost. Day 39–44.',
  },
  {
    date: 'Apr 12, 2026',
    said: '"Whether we make a deal or not makes no difference to me."',
    reality: 'The US dispatched the Vice President, the Special Envoy for Peace, and the president\'s son-in-law to 21 hours of negotiations in Islamabad — the highest-level US-Iran direct engagement since 1979. Trump issued three separate military ultimatums to Iran over 45 days. The deal evidently made a difference. Day 44.',
  },

  {
    date: 'Apr 13, 2026',
    said: '"Warning: If any of these ships come anywhere close to our BLOCKADE, they will be immediately ELIMINATED."',
    reality: 'Declared during an active two-week ceasefire with 9 days remaining. Legal experts confirmed the blockade constitutes a belligerent right under the laws of war, effectively ending the ceasefire. Iran called it "illegal" and "piracy." Trump simultaneously told reporters "They\'re doing no business" — while the ceasefire had not formally expired and mediators were still active. Day 45.',
  },
  {
    date: 'Apr 17, 2026',
    said: '"Iran has agreed to never close the Strait of Hormuz again."',
    reality: 'Iran\'s Araghchi declared Hormuz open "for the remaining period of the ceasefire" — a temporary, conditional gesture explicitly tied to the Lebanon truce, set to expire April 21. No agreement on permanent Hormuz status has been signed. Day 49.',
  },
  {
    date: 'Apr 17, 2026',
    said: '"Iran has agreed to stop backing terrorist groups, including Hezbollah and Hamas."',
    reality: 'A senior Iranian official directly disputed Trump\'s characterization, stating there is "no ambiguity regarding any part of the negotiations" and that Iran had made no such commitment. Iran\'s positions on armed group support remain publicly unchanged. Day 49.',
  },
  {
    date: 'Apr 20, 2026',
    said: '"Iran decided to fire bullets yesterday in the Strait of Hormuz — A Total Violation of our Ceasefire Agreement!"',
    reality: 'Iran\'s military responded that the US violated the ceasefire by boarding and seizing the Iranian cargo ship Touska in the Sea of Oman, calling it "armed piracy" and vowing retaliation. Both sides claimed the other fired first. Day 52.',
  },
  {
    date: 'Apr 21, 2026',
    said: '"I expect to be bombing because I think that\'s a better attitude to go in with. We\'re ready to go."',
    reality: 'Hours later, Trump announced an open-ended ceasefire extension — the opposite of bombing — citing Iran\'s "seriously fractured" government. His stated expectation of bombing did not materialize. Day 53.',
  },
];

/* ─── Hormuz stat ────────────────────────────────────────────────────────────── */
/* Status as of Mar 19: Effectively closed to US/Western-aligned shipping.
   Iran selectively allowing passage for China-linked, Pakistan, India, Turkey vessels
   transacted in yuan or under bilateral arrangement. First full transit (Karachi, PAK-flagged)
   confirmed Mar 16. Insurance withdrawn for Western operators Mar 5 — commercially unnavigable
   for most operators regardless of military risk. */
const HORMUZ = {
  dropPct: 95,
  kplerDropPct: 92,
  src: 'S&P Global (95%, week of Mar 1); Kpler (92%, week of Mar 12); Bloomberg Mar 10',
  shipsStruck: 26,
  shipsSrc: 'Al Jazeera Apr 14 (22 confirmed) / Windward Maritime AI Apr 18-19 / UKMTO',
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
  { date: 'Mar 17', tier: 'critical',   label: 'Amnesty International publishes investigation confirming US responsibility for the Minab girls\' school strike — at least 170 killed, more than 160 of them schoolgirls. A 3-day-old infant and his 2-year-old sister killed in a US-Israeli strike on their home in Arak, along with their mother and grandmother, per IRGC. ACLED has documented nearly 2,000 distinct events across 29 of Iran\'s 31 provinces since Feb 28. Iranian internet blackout enters Day 18, per Netblocks.' },
  { date: 'Mar 17', tier: 'critical',   label: 'Iran Parliament Speaker Qalibaf on state TV: the Strait of Hormuz \"cannot be the same as before and return to its previous conditions\" and \"there is no longer any security.\" Reveals Iran redesigned its weapons systems after June 2025: \"They think they can destroy our facilities with bombers, but they don\'t know that our design has completely changed.\" Kpler analyst: even if war ended today, 1–3 months to reopen the Strait.' },
  { date: 'Mar 17', tier: 'critical',   label: 'Israel announces the killing of Gholamreza Soleimani — head of the IRGC Basij force, the internal suppression unit deployed against protesters. Iran does not confirm. Israel also claims the killing of Ali Larijani, former parliament speaker and senior security figure. Iran has not confirmed.' },
  { date: 'Mar 17', tier: 'critical',   label: 'A fire aboard the USS Gerald R. Ford burned for 30+ hours last week, leaving dozens of crew members with smoke inhalation, per the New York Times. The Ford is the carrier previously repositioned to the Caribbean for Venezuela operations — the gap that forced the USS Nimitz service life extension through March 2027. The Ford is now operating in theater while damaged.' },
  { date: 'Mar 17', tier: 'critical',   label: 'UAE Shah gas field — the world\'s largest ultra-sour gas development — remains suspended after a drone attack sparked a fire. Fujairah Oil Industry Zone struck again. A tanker struck at anchor 23 nautical miles east of Fujairah — the 21st vessel incident since Feb 28 per UKMTO. Iran warns oil could reach $200/bbl if Strait closure continues. Brent: $102.36. WTI: $95.55. Day 18.' },
  { date: 'Mar 18', tier: 'critical',   label: 'Israel strikes South Pars gas field — coordinated with the US — hitting Asaluyeh processing facilities in Bushehr province. South Pars is the world\'s largest natural gas reserve (est. 1,800 trillion cubic feet), shared between Iran and Qatar. It accounts for 70–75% of Iran\'s total gas output and the majority of its LNG exports. Qatar\'s North Dome — the same field — supplies roughly one-fifth of global LNG. Brent spikes to $108.60 (+5%). European gas benchmark up 7.9%. Bloomberg\'s Javier Blas: "Both sides are now targeting upstream oil and natural gas assets. Is this an attempt to escalate to de-escalate? Or is it simply a sign that escalation is spiraling out of control?" Marks the first strike on upstream energy production assets since the war began. Day 19.' },
  { date: 'Mar 18', tier: 'critical',   label: 'Following the South Pars strike, Iran issues named evacuation warnings for Gulf energy infrastructure, declaring it "will be targeted in the coming hours": Saudi Arabia\'s Samref Refinery and Jubail Petrochemical Complex; UAE\'s Al Hosn Gas Field; Qatar\'s Mesaieed Petrochemical Complex, Mesaieed Holding Company, and Ras Laffan Refinery. Iran\'s semi-official Fars: attacks on Iran\'s energy infrastructure "will not go unanswered, and Iran\'s response will target enemy infrastructure previously thought to be safe." Qatar FM: targeting energy infrastructure "constitutes a threat to global energy security." Rapidan Energy: "The question now is whether Tehran shifts from signaling to targeting critical components that could take months, if not years, to repair."' },
  { date: 'Mar 18', tier: 'critical',   label: 'Israel confirms killing of Iranian Intelligence Minister Esmail Khatib — sanctioned by the US and EU for cyber operations against Western targets. Netanyahu and Defense Minister Katz have now granted the IDF standing authorization to eliminate additional senior Iranian officials with no case-by-case approval required. Israel\'s decapitation campaign is, in Katz\'s framing, on autopilot. Iran\'s FM Araghchi: "I do not know why the Americans and the Israelis still have not understood this point. The Islamic Republic of Iran has a strong political structure with established political, economic, and social [institutions]."' },
  { date: 'Mar 18', tier: 'critical',   label: 'Iran launches missile barrage at Israel. Two Israeli civilians — a man and woman — killed by shrapnel in Ramat Gan, near Tel Aviv, per Magen David Adom. Saudi Arabia, Qatar, Kuwait, and UAE air defenses simultaneously engaged Iranian drones and ballistic missiles. Israel launches limited ground operations in southern Lebanon against Hezbollah. At least 6 killed in Israeli strikes on Beirut.' },
  { date: 'Mar 18', tier: 'critical',   label: 'Joe Kent, Trump\'s Director of the National Counterterrorism Center, resigns — stating Iran "posed no imminent threat to our nation." Kent is the first senior Trump administration official to publicly break with the president over the war. The EU\'s top diplomat: "nobody is ready to put their people in harm\'s way in the Strait of Hormuz." Trump, at a Capitol Hill lunch honoring the Irish PM, describes the war as a "little excursion" he asked chief of staff Susie Wiles if she "minded."' },
  { date: 'Mar 18', tier: 'critical', label: 'Hormuz transit data: 8 non-Iranian vessels detected transiting Monday per AIS — nearly double recent daily figures (Windward). All assessed as permission-based transits through Iranian territorial waters: Chinese, Indian, Pakistani-flagged. Western shipping remains shut out. US separately drops GBU-72 5,000-lb bunker-buster bombs on hardened Iranian missile sites along the Strait coastline — first combat use against hardened targets of this type. Brent closes near $108. WTI near $100. Day 19.' },
  { date: 'Mar 19', tier: 'critical',   label: 'Iran follows through on named threats: strikes Qatar\'s Ras Laffan LNG complex (world\'s largest), UAE gas fields, Saudi oil refinery, and Kuwait\'s Mina Al-Ahmadi refinery — one of the largest in the Middle East. Direct retaliation for Israel\'s South Pars strike. Gulf energy infrastructure war is now a confirmed exchange, not a threat. Brent above $110 — up 50% since Feb 28. Day 20.' },
  { date: 'Mar 19', tier: 'critical',   label: 'Axios: South Pars strike was US-approved and coordinated with the White House before execution — directly contradicting Trump\'s Truth Social post claiming "The United States knew nothing about this particular attack." Qatar was struck in retaliation for a US operation the US publicly disavowed. Al Udeid Air Base, hosting 10,000 US troops, is in Qatar. Saudi FM Faisal bin Farhan: "What little trust there was has completely been shattered, on multiple levels. The patience being exhibited is not unlimited."' },
  { date: 'Mar 19', tier: 'critical',   label: 'Trump Truth Social: "The United States of America, with or without the help or consent of Israel, will massively blow up the entirety of the South Pars Gas Field at an amount of strength and power that Iran has never seen or witnessed before" — conditional on further Iranian attacks on Qatar\'s LNG. The field is shared with Qatar. Trump simultaneously claimed the US "knew nothing" about the strike that triggered this retaliation cycle. Japan PM Takaichi visits White House — first allied leader since the Hormuz ask. Japan has no plans to send warships.' },
  { date: 'Mar 19', tier: 'critical',   label: 'Fed SEP (Mar 18): hawkish hold confirmed. Funds rate held 3.5–3.75%. Core PCE revised to 2.7% from 2.5%. One cut projected for 2026 — explicitly conditional on inflation progress. Powell: "If we don\'t see that progress, you won\'t see the rate cut." CME FedWatch: no cut priced in 2026. Oxford Economics: war poses a "stagflationary shock." The Fed cannot cushion the domestic political fallout — no rate cut bridge to the midterms.' },
  { date: 'Mar 20', tier: 'critical',   label: 'Israel strikes Tehran as Iranians mark Nowruz, the Persian New Year. Explosions heard across the capital. Within one hour, sirens sound twice in Tel Aviv as two separate Iranian missile barrages trigger air defense responses. Iran\'s IRGC insists the war continues and that Iran is still building missiles. Day 21.' },
  { date: 'Mar 20', tier: 'critical',   label: 'Kuwait\'s Mina Al-Ahmadi refinery struck by Iranian drones for the second consecutive day. 730,000 bpd capacity. Several units shut down, no casualties. The refinery was already hit on Day 20. Meanwhile: Bahrain warehouse fire from intercepted missile shrapnel; Saudi Arabia shoots down drones targeting the Eastern Province; heavy explosions over Dubai as air defenses engage incoming fire during Eid al-Fitr.' },
  { date: 'Mar 20', tier: 'critical',   label: 'IRGC spokesman Brigadier-General Ali Mohammad Naeini appears on Iranian state television to insist Iran is "still building missiles" and that Netanyahu\'s claim Iran can no longer produce them is false: "These people expect the war to continue until the enemy is completely exhausted." Iranian state television then reports Naeini was killed in an airstrike during or shortly after the broadcast. Pentagon confirms 7,000+ targets struck across Iran.' },
  { date: 'Mar 20', tier: 'critical',   label: 'Qatar LNG damage scope confirmed: the Mar 19 strike damaged 17% of Qatar\'s LNG capacity. Pearl GTL — the world\'s largest gas-to-liquids plant, operated by Shell — was damaged in the first attack. Repairs projected at 3–5 years. Qatar\'s $30B+ expansion (six new LNG trains by 2027) now in doubt. Israel pledges no further strikes on South Pars — the day after its strike triggered the worst disruption to global gas supply in decades. Brent eases to ~$108 after surging to $116.38 on Day 20.' },
  { date: 'Mar 20', tier: 'critical',   label: 'The Washington Post reports the Pentagon is requesting an additional $200 billion in war supplemental funding. Defense Secretary Hegseth declines to confirm or deny the figure, and declines to characterize it as a ceiling. Day 21.' },
  { date: 'Mar 21', tier: 'critical',   label: 'US-Israeli air raid targets Iran\'s Natanz nuclear enrichment facility — the first confirmed strike on Iran\'s nuclear infrastructure since Operation Midnight Hammer in June 2025. Iranian state media: "no leakage of radioactive materials." IAEA: attempting to verify. Drone strikes simultaneously ignite a massive fire near a US military complex in Baghdad\'s Green Zone — the complex has come under repeated attack since February 28. Day 22.' },
  { date: 'Mar 21', tier: 'critical',   label: 'Trump on Truth Social: "We are getting very close to meeting our objectives as we consider winding down our great Military efforts in the Middle East." On the same day: officials confirm thousands more US troops are heading to the region. Iran dismissed the post as "Trump\'s psychological operations to control the markets." Brent settles at $112.19 — the highest of the war. Goldman Sachs: higher prices could last through 2027. The administration has now exhausted every go-to policy lever for oil price relief. Day 22.' },
  { date: 'Mar 21', tier: 'critical',   label: 'Axios: The Trump administration is considering plans to occupy or blockade Kharg Island — 15 miles offshore, handling ~90% of Iran\'s crude exports. "We need about a month to weaken the Iranians more with strikes, take the island and then get them by the balls and use it for negotiations," a source with knowledge of White House thinking said. A ground operation would only be launched after further degradation of Iranian military capacity. Trump has already postponed his planned end-of-March China trip because the war has run longer than he planned. Day 22.' },
  { date: 'Mar 21', tier: 'critical',   label: 'CNN: The DIA\'s internal assessment, circulating inside the Pentagon for weeks, determined Iran could keep the Strait of Hormuz closed 1–6 months. "One of the core conundrums of this conflict is the Iranians have real leverage with this, and there\'s not an obvious fix for it," one intelligence official said. Officials acknowledge reopening is "not inevitable at this point." The Trump administration now privately estimates higher oil prices could linger for months. Over 3,000 vessels stranded in the Middle East per the IMO. Trump calls NATO "cowards" for not helping secure the Strait. Day 22.' },
  { date: 'Mar 21', tier: 'critical',   label: 'Trump temporarily lifts sanctions on 140 million barrels of stranded Iranian oil through April 19 — an attempt to bring supply to market. The National: fewer than 100 ships have transited the Strait since the war began, vs. up to 135 per day pre-conflict. Japan and France/Italy are in separate talks with Tehran for selective Strait access — another arrangement the US did not negotiate. Iran\'s permission-based transit regime now encompasses China, India, Pakistan, Turkey, and potentially Japan, France, and Italy. Every Western bypass route (Fujairah, Salalah, Duqm) has been struck. Day 22.' },
  { date: 'Mar 22', tier: 'critical', label: 'Trump issues 48-hour ultimatum via Truth Social: "If Iran doesn\'t FULLY OPEN, WITHOUT THREAT, the Strait of Hormuz, within 48 HOURS... the United States of America will hit and obliterate their various POWER PLANTS, STARTING WITH THE BIGGEST ONE FIRST!" Iran\'s Parliament Speaker Qalibaf responds immediately: if power plants are targeted, energy infrastructure across the region will be "irreversibly destroyed." Iran\'s National Defence Council announces it will mine "all communication lines in the Persian Gulf" if its coasts or islands are attacked. The ultimatum marks Trump\'s first explicit threat to civilian infrastructure — and Iran\'s most expansive counter-threat of the war. Day 23.' },
  { date: 'Mar 22', tier: 'critical', label: 'Iran fires ballistic missiles at the cities of Arad and Dimona in southern Israel — both lie close to Israel\'s Negev Nuclear Research Center, the country\'s primary nuclear facility. Approximately 100–180 people injured; the IAEA confirms it is monitoring but sees no indication of damage to the nuclear site. Netanyahu: "a very difficult evening in the battle for our future." The IRGC claims it targeted Israeli military installations and security centers. The proximity to the nuclear site was deliberate signaling. Day 23.' },
  { date: 'Mar 22', tier: 'critical', label: 'Iran fires two ballistic missiles at Diego Garcia — the joint US-UK military base in the Indian Ocean, approximately 3,800 km (2,360 miles) from Iran. The UK denounced the attack as "reckless." Diego Garcia hosts long-range US strategic bombers. The strike attempt — regardless of outcome — confirms that Iran\'s precision missile capability extends well beyond the Gulf theater. The deterrent architecture of this conflict just expanded by 3,800 miles. Asian markets react: Nikkei -3.5%, Kospi -4.9%, Hang Seng -2.7%. Both indices down ~12% since Feb 28. Day 23.' },
  { date: 'Mar 22', tier: 'critical', label: '22 nations sign a joint statement on ensuring safe Hormuz navigation — the UAE and Australia among the latest to join. No warships confirmed. No operational plan disclosed. The statement commits countries to "efforts to ensure safe navigation" without specifying what those efforts are. This is the coalition-building equivalent of the March 14 ask: named nations, no ships. Iraq extends its airspace closure 72 hours. Brent opens at $114.09 (+1.69%), WTI at $100.29 (+2%). Day 23.' },
  { date: 'Mar 22', tier: 'critical', label: 'Sen. Lisa Murkowski (R-Alaska) tells CNN she is considering pushing for a Congressional war authorization vote if Trump deploys US ground troops to Iran. "It raises it to a completely different level than what had been advertised to us as members of Congress, when we first went into Iran." The first senior Republican senator to publicly signal limits on war expansion. GOP fissure beginning to show — slowly, and from the edges. Day 23.' },
  { date: 'Mar 23', tier: 'critical', label: 'Trump delays all US strikes on Iranian power plants and energy infrastructure for five days, citing "very good and productive conversations" on a "complete and total resolution" of hostilities. WTI drops 8% to $90.10/bbl — largest single-day decline of the war. Brent falls 8% to $103.91. S&P 500 futures swing from -1% to +3%. Bond markets rally. Tehran has not confirmed any talks took place. Day 24.' },
  { date: 'Mar 23', tier: 'critical', label: 'Iran\'s official response to Trump\'s pause announcement: state broadcaster IRIB runs graphic — "Trump, fearing Iran\'s response, backed down from his 48-hour ultimatum." Semi-official Fars and Mehr: Iran\'s warnings "led Trump to back down." Iran\'s National Defence Council simultaneously announces that any attack on Iranian coasts or islands will result in the mining of "all communication lines in the Persian Gulf" — a new and expanded threat beyond the Hormuz closure already in effect. Tehran did not confirm any discussions with the United States. Day 24.' },
  { date: 'Mar 23', tier: 'critical', label: 'US-Israeli strikes on Tehran infrastructure continue on the same day Trump announces the 5-day pause. The Israeli military announces a "wide-scale wave of strikes" on infrastructure targets in Tehran. CENTCOM strikes a turbine engine production facility in Qom — used for drone and aircraft components. Admiral Cooper (CENTCOM) accuses Iran of launching from populated areas, providing no evidence, and signals those areas would be targeted. The 5-day pause is on power plants and energy infrastructure. It is not a ceasefire. Day 24.' },
  { date: 'Mar 23', tier: 'critical', label: 'China\'s envoy Zhai Jun enters publicly: "This is a war that should never have happened. While negotiations were still underway, the United States and Israel suddenly provoked conflict, causing diplomatic efforts to collapse." He calls for an immediate halt to all military action and Hormuz reopening, warning its continued closure "would bring unbearable consequences." China publicly names the US and Israel as the conflict\'s initiators for the first time at the envoy level. Goldman Sachs maintains its through-2027 elevated-price projection. Day 24.' },
  { date: 'Mar 24', tier: 'critical', label: 'Iran fires new missile barrage at Tel Aviv — a missile strikes a residential street in central Israel, search and rescue deployed across multiple areas, no reported fatalities but dozens wounded. IRGC dismisses Trump\'s diplomatic claims in real time: "contradictory behavior of the deceptive U.S. president does not distract us from the battlefield." Parliament Speaker Ghalibaf: Trump is spreading "fake news to influence financial and oil markets." Gulf states report repeated drone and missile interceptions. Strikes continue on all fronts. The 5-day pause is on power plant targeting. It is not a ceasefire. Day 25.' },
  { date: 'Mar 24', tier: 'critical', label: 'Pakistan emerges as key diplomatic go-between: two sources confirm an in-person US-Iran meeting could be held there in coming days. A senior Iranian FM official confirms to CBS that Iran "received points from the U.S. through mediators and they are being reviewed" — the first Iranian acknowledgment that any US communication has been received. Qatar says it is not involved. Iran\'s Foreign Ministry simultaneously denies direct talks and calls Trump\'s claims of progress false. Brent bounces back above $100/bbl and WTI back toward $95 — the market re-pricing the gap between "almost all points of agreement" and the ongoing kinetic reality. Day 25.' },
  { date: 'Mar 24', tier: 'critical', label: 'Israeli Defense Minister Katz: "We continue striking Iran with full force." An Israeli official to CNN: a deal "does not appear to be tangible right now" — Iran is "not in any concession mode." The Israeli military has "thousands of targets" remaining and plans for "several more weeks" of operations, running a completely parallel and open-ended military policy independent of US diplomatic signals. US strikes PMF headquarters in Iraq\'s Anbar province, targeting commander Saad Dawai. EU Commission President Von der Leyen: "it\'s time to go to the negotiation table." UK PM Starmer warns he must "plan on the basis there may not be" a swift resolution. South Korean PM cancels China trip to manage domestic energy fallout. Japan: 95% of oil flows through Hormuz. Nearly 2,000 vessels trapped in Persian Gulf per IMO. Day 25.' },
  { date: 'Mar 25', tier: 'critical', label: 'Iran formally rejects the US 15-point peace proposal — delivered via Pakistan — and issues five counter-conditions: end to aggression, concrete guarantees against recurrence of war, guaranteed war reparation payments, a comprehensive end to the war across all fronts including resistance groups, and recognition of Iranian sovereignty over the Strait of Hormuz. The sovereignty demand is a structural non-starter: it requires the US to concede permanent Iranian control over 20% of global oil flow. Iran FM Araghchi confirmed simultaneously that Iran "has not engaged in talks to end the war and does not plan to" — direct contradiction of Trump\'s claim Iran is "in negotiations right now" and "keen to reach a peace agreement." Oil fell briefly on Trump\'s claims, the third time this war the market has corrected a Trump diplomatic announcement. Day 26.' },
  { date: 'Mar 25', tier: 'critical', label: 'Pentagon confirms additional US paratroopers dispatched to the Middle East — adding to the 2,500 Marines already ordered on Day 21 who are trained for amphibious landings. Iran\'s Parliament Speaker warns that "Iran\'s enemies are preparing to occupy an Iranian island" — a public signal that Tehran has assessed the Kharg Island seizure scenario Axios reported was under active White House consideration. Day 26.' },
  { date: 'Mar 26', tier: 'critical', label: 'Israel kills IRGC navy commander Alireza Tangsiri — the officer Israeli Defense Minister Katz said was "directly responsible for the terrorist operation of mining and blocking the Strait of Hormuz to shipping." Israel also confirms the killing of Iran\'s naval intelligence chief Behnam Rezaei. Iran does not immediately acknowledge either death. The Hormuz blockade does not change: mines remain, IRGC naval presence remains, Iran makes no operational announcement. Israel\'s decapitation campaign has been running on standing authorization since Day 21 — no case-by-case approval required. Day 27.' },
  { date: 'Mar 26', tier: 'critical', label: 'Trump extends the power plant ultimatum for the third time — now to April 6 — citing "ongoing talks" and "Iranian Government request." Iran FM Araghchi simultaneously tells state television Iran "has not engaged in talks to end the war and does not plan to." At the same Cabinet meeting, Trump says he doesn\'t "know if we\'re willing" to make a deal with Iran — a statement that appears in the same news cycle as his claim talks are going "very well." Trump reveals that Iran\'s "present" was 8+ oil tankers it allowed through the Strait: "I said, \'Well, I guess we\'re dealing with the right people.\'" Day 27.' },
  { date: 'Mar 26', tier: 'critical', label: 'Iran\'s Parliament begins formalizing fees for Hormuz passage — a regime shipping sources dubbed the "Tehran tollbooth." Lloyd\'s List reports some vessels have been charged $2M+ to use Iran\'s alternate channel north of Larak Island. Iran FM Araghchi announces that ships from five nations — China, Russia, India, Iraq, and Pakistan — are formally allowed to transit. Malaysia confirmed. If the fee regime passes into law, the selective closure transitions from a wartime tactic to a permanent institutional structure. Bloomberg (Mar 27): Iran is "legislating to turn the Strait of Hormuz into a permanent toll booth — and it seems we are in for a longer conflict." Day 27.' },
  { date: 'Mar 26', tier: 'critical', label: 'Pentagon considering sending up to 10,000 additional ground troops to the Middle East (WSJ). Iranian ballistic missile debris kills 2 people near Abu Dhabi after intercept. Saudi Arabia shoots down at least 18 drones. Kuwait struck again. Iran issues broad warning that hotels and civilian facilities housing US military personnel are "legitimate defensive targets" — extending the threat to Syria, Lebanon, and Djibouti. Israeli strikes on Isfahan infrastructure continue. Brent ~$105.85, recovering from Day 26\'s diplomatic dip. Day 27.' },
  { date: 'Mar 27', tier: 'critical', label: 'Bloomberg: "The negotiations Trump announced to soothe markets amounted to an exchange of demands that neither side could expect the other to accept. Factor in what both are actually doing — the US deploying a small ground force to the Persian Gulf and Iran legislating to turn the Strait of Hormuz into a permanent toll booth — and it seems we are in for a longer conflict." WTI falls ~3.5% (~$94). Brent ~$107.81. UKMTO confirms no vessel attack incidents since March 19 — the longest attack-free period since the war began (8 days). All 9 structural floor conditions remain active. Day 28.' },
  { date: 'Mar 27', tier: 'critical', label: 'CPAC convenes with the right openly divided on the Iran war — the first sustained right-wing institutional fracture beyond isolated Senate dissent. Rubio heads to the G7: "The other countries get far more of their fuel from there than we do." No allies have committed ships. India\'s Navy executing Operation Urja Suraksha with five frontline warships in the Persian Gulf. Trump teased at Thursday\'s Cabinet meeting that "taking Iran\'s oil" is "an option." The April 6 deadline is the third version of a power plant ultimatum Trump has already extended twice. Day 28.' },
  { date: 'Mar 28', tier: 'critical', label: 'One month of war. Houthis enter the conflict: Yemen\'s Iran-backed Houthi rebels launch the first ballistic missile of the war toward Israel, triggering air raid sirens in Beersheba. The missile is intercepted. Their leader had given a speech warning they would join if attacks on Iran continued — now they have. The Red Sea, which has been relatively quiet since the Houthi ceasefire in January 2025, is back in play. A second front the US is not positioned to absorb simultaneously with Hormuz. Day 29.' },
  { date: 'Mar 28', tier: 'critical', label: 'Iran strikes Prince Sultan Air Base in Saudi Arabia — 10+ US service members wounded, including shrapnel injuries, and a refueler tanker aircraft damaged. First confirmed US military casualties inside Saudi Arabia. The base is shared with Saudi forces outside Riyadh. Iran also hits Kuwait\'s Shuwaikh Port with drones. Israeli attacks on Lebanon continue; Israel moves thousands of troops northward into Lebanon. AP: Iranian missile strikes a busy commercial street in Tel Aviv, killing one man. Day 29.' },
  { date: 'Mar 28', tier: 'critical', label: 'Israel strikes Shahid Khondab Heavy Water Complex in Arak and Ardakan yellowcake production plant in Yazd — both nuclear-adjacent facilities. Iran: no radioactive leak. Iran accuses US and Israel of "playing with fire" by targeting energy and nuclear infrastructure. US only confirmed destroying approximately one-third of Iran\'s missile arsenal (Reuters/Jerusalem Post intelligence sources) — another third may be damaged or buried in tunnels but status unknown. Rubio at the G7: war objectives complete "in the next couple weeks." NATO allies skeptical. Trump: "very disappointed" with NATO\'s response at the one-month mark. US wounded total: 300+ (CENTCOM). Day 29.' },
  { date: 'Mar 28', tier: 'critical', label: 'USS Gerald R. Ford anchors in Split, Croatia for repairs — fire in laundry area on Mar 12 was not combat-related but requires port visit. The Ford was the carrier repositioned from the Caribbean; the repair gap forced the USS Nimitz service life extension. Now the Ford is in Croatia for the duration of its repair window, leaving CENTCOM reliant on the Nimitz. Pakistan PM Sharif holds one-hour phone call with Iranian President Pezeshkian — Iran thanks Pakistan for mediation efforts, calls them "commendable." Egypt imposes 9pm business curfew — energy bills have more than doubled. Ethiopia: overnight queues for petrol. Kenya: 6,000–8,000 tonnes of tea stranded at Mombasa port. The war\'s economic blast radius is now confirmed in East Africa. Day 29.' },
  { date: 'Mar 29', tier: 'critical', label: 'USS Tripoli arrives in the Middle East — 3,500 sailors and Marines aboard, CENTCOM confirmed. This is the amphibious unit. The 31st MEU was described in March 14 reporting as "the unit you would want for a potential Kharg Island seizure." Its arrival converts the Kharg Island ground operation from a White House consideration to a confirmed operational deployment. Pentagon simultaneously weighing sending 10,000 additional ground troops. Iran\'s Parliament Speaker Ghalibaf: the US is "secretly planning a ground invasion" while floating negotiations, and Iranian forces are "waiting for them." Day 30.' },
  { date: 'Mar 29', tier: 'critical', label: 'Pakistan, Turkey, Egypt, and Saudi Arabia foreign ministers convene in Islamabad — the first substantive four-nation diplomatic structure since the war began. Pakistan FM Ishaq Dar announces Iran has agreed to allow 20 Pakistani-flagged ships to transit the Strait of Hormuz, two per day. "This is a welcome and constructive gesture by Iran and deserves appreciation," Dar wrote. Iran\'s concession extends the arrangement transit architecture to 20 named vessels — not a general reopening. The Strait remains closed to Western shipping. Saudi Arabia\'s participation in the Islamabad summit is the first constructive diplomatic signal from Riyadh since Saudi FM Faisal bin Farhan declared trust "completely shattered" on Day 20. Day 30.' },
  { date: 'Mar 29', tier: 'critical', label: 'IRGC threatens American- and Israeli-affiliated university campuses across the Gulf — Texas A&M and Northwestern in Qatar, NYU in UAE — now "legitimate targets until two universities are struck." The IRGC issued a March 30 deadline for the US to condemn strikes on Iranian universities or attacks will expand. New escalation domain: civilian educational infrastructure. Kuwait International Airport struck by drone — fuel tanks ignited, massive blaze, first major regional airport directly hit. Bahrain aluminum smelter targeted; UAE aluminum company sustains "significant damage." Day 30.' },
  { date: 'Mar 29', tier: 'critical', label: 'WTI closes Friday at $99.64 (+5.46%), briefly touching $100.04 intraday — highest since July 2022. Brent closes $112.57 (+4.22%). Dubai physical crude $126/bbl — 76% above pre-war vs. WTI futures +50%. JPMorgan: the physical-futures gap "is unlikely to persist" as Atlantic basin inventories are drawn down. VIX surges 13% to 31.05. S&P -1.7%, Dow -1.7%. Zelensky reveals Russia has conducted surveillance of 7 US and allied military sites across the Gulf — including Diego Garcia, Kuwait, Saudi Arabia, Turkey, and Qatar. Anti-war protests erupt in Tel Aviv; Israeli security forces break up demonstrations at Habima Square. Day 30.' },
{ date: 'Mar 30', tier: 'critical', label: 'Trump tells the Financial Times: "Maybe we take Kharg Island, maybe we don\'t. We have a lot of options." Then: "It would also mean we had to be there [on Kharg Island] for a while." Brent rises 3.5% to $116+ on the statement — market repricing a ground invasion premium. Iran has been reinforcing Kharg for weeks. Australian Strategic Policy Institute: "The Iranians can probably sit back and attack Americans on Kharg Island, and casualties will mount up." Trump is publicly weighing a ground invasion of Iran\'s primary oil export hub in the same interview where he claims a deal is imminent. Day 31.' },
  { date: 'Mar 30', tier: 'critical', label: 'US-Israeli overnight strikes hit Tehran\'s power infrastructure — blackout across the capital, since restored. First confirmed direct strike on Tehran\'s civilian power grid. Israel also strikes Mobarakeh Steel in Isfahan and Khuzestan Steel in Ahvaz — two of Iran\'s largest plants, partially IRGC-owned, used in military production. University of Science and Technology in Tehran struck. Iranian politicians formally push for exit from the Nuclear Non-Proliferation Treaty in response to strikes on nuclear sites. IRGC confirms Tangsiri death — four days after Israel announced it. Day 31.' },
  { date: 'Mar 30', tier: 'critical', label: 'Trump claims Iran agreed to "most of" the US 15-point demands. Pakistan confirms preparing to host "meaningful talks in coming days." Iran\'s Parliament Speaker Ghalibaf: the US is "secretly planning a ground invasion" while floating negotiations, and forces are "waiting for them." Trump says "We\'ll make a deal with them, I\'m pretty sure" — same day he told the FT he is weighing Kharg seizure. IRGC March 30 university deadline expires with no US condemnation. The gap between Trump\'s negotiating claims and Trump\'s escalation statements is now within the same interview. Day 31.' },
  { date: 'Mar 30', tier: 'critical', label: 'Second attack on Prince Sultan Air Base confirmed — combined 29 US service members wounded across two attacks (Friday and weekend), five seriously. E-3 Sentry airborne warning and control aircraft destroyed in the second strike (WSJ / CNN geolocated images). The E-3 Sentry performs airborne surveillance and missile/UAV detection at hundreds of kilometers range — a command-and-control asset. Its loss is operationally significant. IEA: Hormuz closure is now the largest oil supply shock in history. Between 1,900 and 2,500 vessels stranded in the Persian Gulf per IMO. Day 31.' },

  { date: 'Mar 31', tier: 'critical', label: 'National average retail gasoline crosses $4/gallon for the first time since 2022 (GasBuddy/AAA) — up more than $1 since the war began Feb 28. California average: $5.87/gallon. Diesel: $5.45/gallon, up 45% since Feb 28. Macquarie Group: 40% probability oil hits $200/barrel if war extends to summer — that scenario implies $7/gallon at the pump. "Prices go up like rockets, and they come down like a feather." The gas price is now the most visible domestic consequence of the war. Brent: ~$107.92 (+2.47%). Day 32.' },
  { date: 'Mar 31', tier: 'critical', label: 'Washington Post: The Pentagon is preparing for weeks of limited ground operations in Iran — specifically raids on Kharg Island and coastal sites near the Strait of Hormuz to destroy weapons targeting shipping. Plans involve special operations and conventional infantry troops. WH press secretary Leavitt: troops are deployed to give Trump "maximum optionality." Trump has not yet approved a ground operation but the planning is confirmed at the institutional level. USS Boxer Amphibious Ready Group (USS Boxer + 11th MEU, ~1,000 additional Marines) en route. 82nd Airborne Division Immediate Response Force (~2,000 paratroopers) also deploying. Total additional ground forces: ~7,000. Day 32.' },
  { date: 'Mar 31', tier: 'critical', label: 'Three US F-15 fighters crash in Kuwait — Iran claims it shot them down; CENTCOM attributes it to friendly fire by Kuwait. The war now involves nine countries directly. Iran launches its 87th wave of regional attacks — this wave launched by the Iranian navy, directly contradicting US and Israeli claims that Iran\'s navy has been largely destroyed. Iran\'s FM Araghchi calls it "high time" for US forces to leave Gulf state bases. Iran attacks the Al-Salmi, a fully loaded Kuwaiti oil tanker, at Dubai port — expanding the attack geography to a port previously considered outside the combat zone. NATO intercepts a missile fired at Turkey — the 4th since the war began. Day 32.' },
  { date: 'Mar 31', tier: 'critical', label: 'Pakistan FM Ishaq Dar flies to Beijing for talks with Chinese FM Wang Yi — the Pakistan-China diplomatic axis is formalizing around the Islamabad mediation framework. Saudi Arabia, Qatar, and Jordan summit in Jeddah jointly condemns Iran\'s attacks on civilian facilities — the GCC is hardening its public posture while simultaneously supporting diplomacy. Trump considers military operation to extract ~450kg of enriched uranium from inside Iran (reports). Russia\'s Rosatom continues evacuating staff from Bushehr nuclear plant — 300 Russian specialists remain. Pentagon holds first press briefing in nearly two weeks (Hegseth/Caine) for Tuesday morning. Day 32.' },

  { date: 'Apr 1', tier: 'critical', label: 'Trump delivers first primetime address to the nation on the Iran war — describes operation as "nearing completion," promises 2–3 more weeks of heavy strikes, threatens to bring Iran "back to the Stone Ages." Speech lasts under 20 minutes and offers no exit strategy, no deal framework, no Hormuz resolution path. Analysts: "It was really a repetition of everything he has said in the past" and "reveals that he really does not have a plan." Oil spikes 4–5% post-speech: Brent above $105, WTI above $103. Stock futures slide, reversing the day\'s earlier rally. Asian markets: Nikkei -2.1%, Kospi -3.9%, Hang Seng -1%. Day 33.' },
  { date: 'Apr 1', tier: 'critical', label: 'NATO allies Spain, France, and Italy formally restrict US military operations — closing airspace, denying base access, limiting logistical support. First formal alliance constraint on US warfighting since Operation Epic Fury began. Separately: B-52 bombers fly over Iranian territory for the first time in the war, striking an ammunition depot and air base in Isfahan — the US demonstrating air supremacy while publicly describing a wind-down. UK PM Starmer announces 35 countries have signed a statement committing to restore Hormuz maritime security; British FM Cooper to lead an international conference. Day 33.' },
  { date: 'Apr 1', tier: 'critical', label: 'Iranian President Pezeshkian releases open letter to the American people asking "which of the American people\'s interests are truly being served by this war?" and calling the US "a proxy for Israel." Trump responds by claiming Iran\'s "new" president wants a ceasefire — Pezeshkian has been president since 2024. IRGC threatens US tech companies: "starting from 20:00 on Wednesday, April 1 (Tehran time), should expect the destruction of their relevant units." Iran parliament head Azizi: the US "will not regain access to the Strait of Hormuz." Iran FM Araghchi: "zero trust" in Washington. Iran prepared for "at least six months" of war. Day 33.' },

  { date: 'Apr 2', tier: 'critical', label: 'The "oil cliff" narrative goes mainstream. Rystad Energy: global system has shifted from "buffered to fragile" — nearly 500 million barrels of total liquids lost since Feb 28, inventory buffers expended. BCA Research\'s Papic: world is losing 4.5–5M bpd now; that number doubles by mid-April when SPR releases and Russian/Iranian sanctions exemptions run out. Societe Generale: $150/bbl possible in April. Macquarie: 40% probability of $200 oil if war extends to summer. WTI: $103.69. Brent: $105.53. April 6 Hormuz deadline is four days away. Oil executives at CERAWeek warn mid-April is the hard window. Day 34.' },
  { date: 'Apr 2', tier: 'critical', label: 'Trump again threatens to leave NATO in a new interview — the second such threat since the war began. Pentagon reportedly considering deploying 10,000 additional ground troops to the region (WSJ). Iran\'s parliament head: the US "will not regain access to the Strait of Hormuz" — not a negotiating position but a statement of permanent Iranian policy. UK\'s Hormuz conference convenes; 35-nation statement is political, no warships named. Iran FM Araghchi dismisses ground invasion threat: "I do not think they would dare." Day 34.' },

  { date: 'Apr 3', tier: 'critical', label: 'US-Israeli forces strike the B1 bridge in Karaj during Sizdah Bedar (Iran\'s Nature Day, 13th day of Nowruz) — 8 killed, 95 wounded, civilians including holiday-goers who had gathered at the riverbank beneath the still-under-construction span. Trump posts video of the collapse to Truth Social: "The biggest bridge in Iran comes tumbling down, never to be used again — Much more to follow!" Hours later a second strike hits as emergency crews arrive. Over 100 legal experts issue a letter warning that threatened attacks on Iranian power plants could constitute war crimes under international law. Day 35.' },
  { date: 'Apr 3', tier: 'critical', label: 'Hegseth fires Army Chief of Staff Gen. Randy George "effective immediately" — the Army\'s top uniformed officer and Joint Chiefs member, with 40+ years of service, removed more than a year before his term was set to expire. Third senior officer fired the same day: Gen. David Horne (Army Transformation and Training Command) and Maj. Gen. William Green (Army chief of chaplains). Acting replacement: Gen. Christopher LaNeve (former 82nd Airborne commander). 14th+ general or admiral fired by Hegseth. Removal comes while a ground invasion of Iran is under active Pentagon planning. Day 35.' },
  { date: 'Apr 3', tier: 'critical', label: 'Iran fires waves of ballistic missiles and drones at Israel, Kuwait, UAE, and Saudi Arabia — two Gulf refineries set ablaze by strikes or falling debris. IRGC military spokesperson announces Iran maintains "hidden stockpiles of arms, munitions and production facilities." Oil markets closed for Good Friday, locking in Thursday\'s prints: WTI closed at $111/bbl (intraday high $113, +11% single day), Brent $108 (+6.6%). S&P 500 -1.74% on Thursday — biggest single-day equity drop of 2026. UN Security Council vote scheduled Friday on Bahrain resolution to authorize defensive naval action for Hormuz shipping; China, Russia, and France expected to veto or block. Day 35.' },

  { date: 'Apr 4', tier: 'critical', label: 'US-Israeli strikes hit Bushehr Nuclear Power Plant auxiliary building and the Mahshahr Special Petrochemical Zone — 5 killed, 170 wounded. Laser and Plasma Research Institute at Shahid Beheshti University bombed; Iran\'s Ministry of Science confirms 30+ universities targeted since Feb 28, along with 55+ libraries and 56+ museums and historical monuments. Iranian Minister of Science: \"Attacking universities and research centres means returning to the Stone Age.\" Day 36.' },
  { date: 'Apr 4', tier: 'critical', label: 'Iran launches waves of drones at Kuwait — two power and water desalination plants shut down, a government building \"significantly\" damaged, Kuwait Petroleum Corporation reports \"significant material losses.\" Bahrain\'s Gulf Petrochemical Industries also struck. Geographic expansion of Iranian retaliation reaches deep into GCC infrastructure beyond the Strait theater. Day 36.' },
  { date: 'Apr 5', tier: 'critical', label: 'Second F-15E crew member rescued in dramatic firefight inside Iran — US forces lose one A-10 Thunderbolt II (shot down) and two C-130 Hercules transports; several US servicemembers injured, 3 IRGC killed. Iran\'s CENTCOM publicly calls Trump\'s 48-hour Hormuz ultimatum \"a helpless, nervous, unbalanced and stupid action.\" Iranian state media publishes photos of F-15E wreckage. Day 37.' },
  { date: 'Apr 5', tier: 'critical', label: 'Iranian missile strikes residential building in Haifa — 34-year-old woman seriously injured by interceptor missiles in Petah Tikvah. More than 10 sites hit in Haifa. Iranian missile attacks set off alarms across southern Israel including Beersheba. Easter Sunday. Day 37.' },
  { date: 'Apr 6', tier: 'critical', label: 'Head of IRGC intelligence Maj. Gen. Majid Khademi killed in joint US-Israeli airstrike — \"nearly five decades\" of service in Iran\'s security apparatus. Israel strikes South Pars petrochemical complex: Jam and Damavand facilities — accounting for ~85% of Iran\'s petrochemical exports — rendered inoperative. Defense Minister Katz: \"a severe economic blow\" costing Iran \"tens of billions of dollars.\" Mojtaba Khamenei: forces \"cannot even crack their resolve.\" Day 38.' },
  { date: 'Apr 6', tier: 'critical', label: 'US-Israeli forces strike Sharif University of Technology in Tehran — mosque and laboratories severely damaged; Iran\'s VP accuses US of using a bunker-buster bomb. Total cultural and educational destruction: 30+ universities, 55+ libraries, 56+ museums and historical monuments hit since Feb 28. IRGC threatens to strike AI centers in UAE. Trump sets 8pm ET Tuesday deadline for Hormuz deal or power plant strikes. Day 38.' },
  { date: 'Apr 6', tier: 'critical', label: 'Iran formally rejects 45-day ceasefire proposed by Egyptian, Pakistani and Turkish mediators — demands a permanent end to the war instead. Trump claims Iran is \"an active, willing participant\" in negotiations; FM Araghchi: \"no talks have happened with the enemy until now, and we do not plan on any negotiations.\" US stocks close with modest gains after volatile session. Day 38.' },
  { date: 'Apr 7', tier: 'critical', label: 'US forces strike Kharg Island — 50+ military targets hit including IRGC naval base, missile storage bunkers, naval mine storage facilities, airport control tower and helicopter hangar. First direct kinetic engagement with Iran\'s oil export hub (handles ~90% of Iran\'s crude exports). Strikes deliberately avoid oil infrastructure. VP Vance: \"not a change in strategy.\" WTI surges to $115.8/bbl — highest since April 2008. Brent $111. Polymarket: 81% probability WTI hits $120 this month. Day 39.' },
  { date: 'Apr 7', tier: 'critical', label: 'IRGC formally removes restraint toward Gulf Arab states hosting US military: \"all such considerations [of good neighborliness] have been lifted.\" All US forward bases in Bahrain, Qatar, UAE and Kuwait now explicitly placed in Iranian declared threat envelope. Iran threatens to target UAE ports and cities. Iran submits 10-point permanent peace proposal through Pakistani mediators but simultaneously rejects temporary 45-day ceasefire. Trump\'s 8pm ET deadline is live. Day 39.' },

  { date: 'Apr 7', tier: 'critical', label: 'Trump agrees to 2-week ceasefire minutes before 8pm ET deadline — via Pakistan PM Sharif\'s personal appeal. Truth Social post: "subject to the Islamic Republic of Iran agreeing to the COMPLETE, IMMEDIATE, and SAFE OPENING of the Strait of Hormuz, I agree to suspend the bombing and attack of Iran for a period of two weeks." Iran\'s SNSC responds: "safe passage through the Strait of Hormuz will be possible via coordination with Iran\'s Armed Forces." Ceasefire comes into force when Hormuz opens. US-Iran talks scheduled Friday in Islamabad. Markets react instantly: WTI -6%, S&P 500 futures +1%. Day 39.' },
  { date: 'Apr 7', tier: 'critical', label: 'Ceasefire terms: Iran submitted 10-point permanent peace proposal — Trump says "almost all of the various points of past contention have been agreed to" and calls it "a workable basis on which to negotiate." Israel agrees to ceasefire per White House. Key conditions unresolved: full uranium removal, Hormuz sovereignty, Iran\'s enrichment program. Hormuz "safe passage via coordination with Iran\'s Armed Forces" — not pre-war free transit. Yuan-denominated managed access structure appears intact beneath ceasefire wrapper. Day 39.' },

  { date: 'Apr 8', tier: 'critical', label: 'Ceasefire Day 1 — markets celebrate, Hormuz barely moves. WTI closes -16.4% to $94.41 (biggest single-day drop since April 2020). Brent -13% to $94.75. Dow best day in a year (+1,325 pts). S&P +2.5%. Only 2 ships transit Hormuz in first 24 hours (Liberia-flagged Daytona Beach, Greek-owned NJ Earth). S&P Global: 4 tankers total on the day. Kpler: "similar pace to that seen in recent days." 187 tankers with 172M barrels stranded inside the Gulf. Spot Brent cargo $124.68 — $30 above the June futures that crashed 13%. Physical reality and paper market diverge sharply. Day 40.' },
  { date: 'Apr 8', tier: 'critical', label: 'Lebanon fractures Ceasefire Day 1. Israel kills 182 and wounds 890 in Lebanon strikes. Netanyahu confirms Lebanon is outside the deal — directly contradicting Pakistani PM Sharif who announced it covered all fronts. FM Araghchi: "The U.S. must choose — ceasefire or continued war via Israel. It cannot have both." Iran\'s IRGC announces it is suspending tanker traffic through Hormuz in response to Lebanese strikes. WH Press Secretary Leavitt: those reports are "completely unacceptable" and "false." UN Secretary General Guterres: Israeli Lebanon activity "poses a grave risk to the ceasefire." Lebanese Health Ministry: 182 killed, 890 wounded by Wednesday Israeli strikes alone. Day 40.' },
  { date: 'Apr 8', tier: 'critical', label: 'Two different deals. Iran\'s IRGC-affiliated Tasnim news agency publishes its version of the 10-point agreement: "the United States is committed to guaranteeing non-aggression, continuing Iranian control over the Strait of Hormuz, accepting uranium enrichment, lifting all primary and secondary sanctions, withdrawing American combat forces from the region." White House simultaneously calls enrichment a "red line" and confirms Hormuz must be OPEN & SAFE. WH Press Secretary Leavitt: a first 10-point plan was "thrown in the garbage" and a second condensed version accepted — Iran\'s published text and Trump\'s red lines are mutually exclusive. The US and Iran are heading to Islamabad to reconcile two different documents: Iran\'s 10-point plan and the White House\'s 15-point plan. Day 40.' },
  { date: 'Apr 8', tier: 'critical', label: 'GCC attacks continue through Ceasefire Day 1. Kuwait struck by 28 drone attacks. UAE struck by 35. Qatar intercepts 7 missiles. Saudi Arabia\'s East-West pipeline hit by drone. GCC states report ongoing attacks hours after ceasefire takes effect — underscoring Iran\'s position that the Lebanon front is integral to any halt. Iran is finalizing a maritime protocol with Oman to institutionalize coordinated tanker management through the Strait — embedding IRGC authority into a standing bilateral arrangement. Iran also reported to be demanding cryptocurrency toll for Hormuz transit per Financial Times. Day 40.' },
  { date: 'Apr 9', tier: 'critical', label: 'Markets reprice ceasefire fragility. WTI rebounds 3.1% to $97.33. Brent +2.8% to $97.42. Asian markets surrender ceasefire rally: Hang Seng -0.6%, Shanghai Composite -0.6%, Kospi -1.11%, Nikkei -0.6%. Fortune: "Within a day, the ceasefire began breaking down. Markets shrugged." Stocks fall only 0.3% on fracturing news — traders pricing in high probability the deal was always fragile. Hormuz physically still blocked: only 4 tanker transits recorded Day 40 (S&P Global), Kpler confirms no material increase in ship traffic above wartime pace. Day 41.' },
  { date: 'Apr 9', tier: 'critical', label: 'Islamabad talks Saturday under strain before they start. Iran\'s ambassador to Pakistan deletes premature social media post about delegation arriving Thursday night — embassy official calls it sent prematurely. Vance delegation (Witkoff + Kushner) confirmed for Saturday morning local time. Two-documents problem: Islamabad will try to reconcile Iran\'s 10-point plan with the White House\'s 15-point plan — structurally incompatible on enrichment and Hormuz sovereignty. Iran military spokesperson: Iran is "prepared for a long-term war" if talks fail. Trump NATO meeting with Rutte; threatens to leave NATO over failure to help reopen Hormuz. Two-week window expires April 22. Day 41.' },

  { date: 'Apr 10', tier: 'critical', label: 'Hormuz stranglehold structurally confirmed. UAE Minister of Industry Sultan Al Jaber states Hormuz is not open — access is "restricted, conditioned and controlled." Iran separately revealed to have lost track of mines it planted, physically unable to fully reopen even if willing. US begins naval mine-clearance operation in the Strait. Day 42.' },
  { date: 'Apr 10', tier: 'critical', label: 'WTI -2.4% to ~$95.50, down 12% on the week — largest weekly loss in months driven by ceasefire optimism. Saudi Arabia confirms attacks on oil facilities cut production capacity by ~600k bpd and slashed East-West pipeline throughput by ~700k bpd. Hormuz traffic at 4 ships/day vs pre-war 130–160. Day 42.' },
  { date: 'Apr 10', tier: 'critical', label: 'Vance, Witkoff, and Kushner depart Joint Base Andrews for Islamabad. Pakistan under military lockdown. Kuwait formally accuses Iran and proxies of drone attacks during ceasefire. Iran denies. Trump tells reporters nuclear is "99% of it" and warns Iran over transit fees in Hormuz. Day 42.' },
  { date: 'Apr 11', tier: 'critical', label: 'First direct US-Iran talks since 1979. Vance meets Araghchi and Ghalibaf in Islamabad under Pakistani mediation. Talks transition from proximate to fully direct with Pakistan Army Chief in the room. 21 hours of negotiations begin. Day 43.' },
  { date: 'Apr 11', tier: 'critical', label: 'USS Frank E. Peterson and USS Michael Murphy (guided-missile destroyers) transit Strait of Hormuz — first US warships through the Strait since the war began — conducting mine-clearance groundwork. Iran threatens to attack US ships, calls it a ceasefire violation. US CENTCOM calls it freedom of navigation. 16 ships transit Hormuz, busiest single day since ceasefire. Day 43.' },
  { date: 'Apr 11', tier: 'critical', label: 'Israel conducts 200+ Hezbollah strikes over the weekend; 350+ killed in Lebanon on Wednesday alone. Iran insists Lebanon is covered by ceasefire. US and Israel say it is not. Islamabad talks produce reports of a possible understanding to limit strikes to southern Lebanon, but no formal agreement. Day 43.' },
  { date: 'Apr 12', tier: 'critical', label: 'Islamabad talks collapse after 21 hours. No deal. Core sticking points: Iran\'s nuclear enrichment rights and Hormuz sovereignty. Vance departs 7:08 AM local. US leaves "final and best offer" on the table. Iran: "negotiations will continue." No next round scheduled. Ceasefire expires April 22 — 10 days remaining. Day 44.' },
  { date: 'Apr 12', tier: 'critical', label: 'Trump threatens full US naval blockade after talks fail. "The Blockade will begin shortly... Other Countries will be involved." NATO cited. Trump: "LOCKED AND LOADED" to "finish up the little that is left of Iran." Pakistan pledges continued mediation. Ceasefire technically still in place. Day 44.' },
  { date: 'Apr 13', tier: 'critical', label: 'US naval blockade of Iranian ports takes effect at 10am ET. CENTCOM: "will be enforced impartially against vessels of all nations entering or departing Iranian ports and coastal areas." Trump: "Right now we have a blockade. They\'re doing no business." Truth Social: "Warning: If any of these ships come anywhere close to our BLOCKADE, they will be immediately ELIMINATED." Iran: "illegal act... amounts to piracy." Legal analysis (San Remo Manual): blockade is a belligerent right under the laws of war, effectively ending the ceasefire. Brent near $100/bbl. 9 days remaining on ceasefire. Day 45.' },
  { date: 'Apr 13', tier: 'critical', label: 'France\'s Macron announces a "peaceful multinational mission aimed at restoring freedom of navigation" in Hormuz, with UK-France conference "in coming days" — no warships named. Vance on Fox News: "the ball really is in Iran\'s court" on further talks. Iran FM Araghchi: US showed "greed in negotiations." UN Secretary-General: "there is no military solution to the conflict." ~20,000 seafarers stranded per UN. Energy Secretary Wright: oil will stay high or rise until "meaningful ship traffic" through Hormuz, expects that "sometime in the next few weeks." Day 45.' },
  { date: 'Apr 14', tier: 'critical', label: 'First Israeli-Lebanese ambassador talks in Washington since 1983. Hezbollah rejects them outright. Pakistan/Egypt/Turkey mediators continuing engagement to bridge gaps before April 21 ceasefire expiry. Axios: "All parties still believe a deal is possible." Iran rebuilding air defenses with reported Chinese assistance. CFR: "Trump has big decisions to make. None of his options are appealing." 8 days remaining. Day 46.' },
  { date: 'Apr 15', tier: 'critical', label: 'Framework deal progress reported. Vance: "I think the people we\'re sitting across from wanted to make a deal." Pakistan\'s Asim Munir arrives in Tehran. US/Iran moving toward outline agreement before April 21 ceasefire expiry. Day 47.' },
  { date: 'Apr 15', tier: 'critical', label: 'WTI ~$91.72, Brent ~$96.83. Oil edges down on framework hopes. Hormuz still closed, blockade holding. Day 47.' },
  { date: 'Apr 16', tier: 'critical', label: 'Gen. Caine Pentagon briefing: 13 ships turned back, blockade declared "fully implemented." INDOPACOM interdicting ships that departed Iran before blockade began. Day 48.' },
  { date: 'Apr 16', tier: 'critical', label: 'Iran threatens to halt all shipping across Persian Gulf, Sea of Oman, and Red Sea if US blockade continues. "No port in the Persian Gulf and Arabian Sea will be safe." Day 48.' },
  { date: 'Apr 16', tier: 'critical', label: 'Trump announces 10-day Israel-Lebanon ceasefire brokered by Vance. Goes into effect overnight. Beirut fireworks. Lebanese army immediately accuses Israel of multiple violations. Day 48.' },
  { date: 'Apr 17', tier: 'critical', label: 'Iran FM Araghchi declares Strait of Hormuz "completely open" for commercial vessels for remaining ceasefire period, linked to Lebanon truce. WTI drops to ~$84 (-10%). Stocks surge. Day 49.' },
  { date: 'Apr 17', tier: 'critical', label: 'Trump: US blockade "will remain in full force" until peace deal complete. Second Islamabad round expected this weekend. Paris summit: Macron and Starmer host multinational Hormuz reopening talks. Day 49.' },
  { date: 'Apr 17', tier: 'critical', label: 'Shipping companies cautious: only handful of ships transit Hormuz despite declaration. Outstanding questions on enforcement. IAEA Grossi: nuclear verification must anchor any deal. Ceasefire expires April 21. Day 49.' },
  { date: 'Apr 18', tier: 'critical', label: 'Iran re-closes Strait of Hormuz. US refuses to lift naval blockade; Iran says it has "regained control" of the strait within hours of yesterday\'s opening. The 24-hour Hormuz window closes. Day 50.' },
  { date: 'Apr 18', tier: 'critical', label: 'Rubio urges European allies to reimpose sanctions on Iran urgently, warning Tehran is approaching nuclear weapons capability. Also signals Iran may retain civilian nuclear energy program in final deal. Day 50.' },
  { date: 'Apr 18', tier: 'critical', label: 'No date confirmed for second Islamabad round. Pakistan: talks still in channel, delegations unconfirmed. Ceasefire expires April 21 — 3 days. Oil rebounds sharply from yesterday\'s -10% drop on Hormuz re-closure. Day 50.' },
  { date: 'Apr 19', tier: 'critical', label: 'Iran Deputy FM Khatibzadeh: no date set for second Islamabad round, slams US "maximalist" demands. Ghalibaf in national address: "progress" but "big distance" remains, "many gaps and some fundamental points." Day 51.' },
  { date: 'Apr 19', tier: 'critical', label: 'Iran FM spokesperson: enriched uranium "as sacred to us as the soil of Iran" — transfer to US not on the table. Torpedoes Trump\'s claim of imminent uranium deal. Day 51.' },
  { date: 'Apr 19', tier: 'critical', label: 'IRGC gunboats fired on Indian-flagged tankers during April 17 Hormuz re-opening. India summons Iran\'s ambassador. ~200 vessels and 20,000 seafarers remain stranded in Gulf. Day 51.' },
  { date: 'Apr 19', tier: 'critical', label: 'Trump: might not extend ceasefire, "we\'ll have to start dropping bombs again." Also says deal could still happen. Ceasefire expires Monday April 21 — 2 days. No extension confirmed by either side. Day 51.' },
  { date: 'Apr 20', tier: 'critical', label: 'USS Spruance fires on and seizes Iranian cargo ship Touska in Gulf of Oman — first kinetic boarding of the war. Iran military calls it "maritime piracy," vows retaliation, says US has broken the ceasefire. Day 52.' },
  { date: 'Apr 20', tier: 'critical', label: 'Iran FM Baghaei: "As of now we have no plans for the next round of negotiations." US delegation (Vance, Witkoff, Kushner) confirmed heading to Islamabad. Iran has not confirmed attendance. Islamabad billboards up, hotel requisitioned. Day 52.' },
  { date: 'Apr 20', tier: 'critical', label: 'Zero tankers transited Strait of Hormuz on Sunday. ~200 vessels and 20,000 seafarers still stranded. Ceasefire expires 0000 GMT Wednesday (8pm ET Tuesday) — 1 day. Nuclear gap: US proposed 20-year enrichment pause; Iran countered 5 years; US rejected. Day 52.' },
  { date: 'Apr 20', tier: 'critical', label: 'WTI surges ~6% to ~$89 on ship seizure news. IMF warns global growth will take a hit even if ceasefire holds, citing Hormuz uncertainty as persistent drag. Gas national average $4.05/gal. Day 52.' },
  { date: 'Apr 21', tier: 'critical', label: 'Trump on CNBC: "I don\'t want to extend" the ceasefire, "I expect to be bombing." Vance never departs for Islamabad — trip on hold as Iran fails to confirm delegation. Brent spikes above $101 on Vance no-show. Day 53.' },
  { date: 'Apr 21', tier: 'critical', label: 'US boards second vessel: Pentagon seizes sanctioned oil tanker M/T Tifani in Indian Ocean. Iran FM Araghchi: US blockade is "an act of war and thus a violation of the ceasefire." IRGC threatens to strike oil facilities in neighboring countries if bombing resumes. Day 53.' },
  { date: 'Apr 21', tier: 'critical', label: 'Trump extends ceasefire with no end date — waiting for Iran\'s "unified proposal" from its "seriously fractured" government. Vance Islamabad trip canceled for day. Iran adviser Mohammadi: "Trump\'s ceasefire extension means nothing, the losing side cannot dictate terms." Day 53.' },
  { date: 'Apr 21', tier: 'critical', label: 'Iran notifies Pakistan it will not send delegation to Islamabad talks. Iran domestic flights resume after 50-day wartime suspension. Brent settles ~$99.67 after retreating from $101 spike. Day 53.' },
  { date: 'Apr 22', tier: 'today', label: 'Iran state media Tasnim: Tehran told US through Pakistani intermediary that "attending negotiations is a waste of time because the US prevents reaching any suitable agreement." Second Islamabad round effectively dead for now. Day 54.' },
  { date: 'Apr 22', tier: 'today', label: 'Ceasefire technically holds under open-ended Trump extension. No Iranian kinetic retaliation for Touska seizure yet. Brent ~$99.81, WTI ~$90.86. Hormuz still closed. Both sides accusing each other of ceasefire violations. Day 54.' },
];

const tierDot = { baseline: T.green, neutral: T.amber, critical: T.terra, peak: T.red, today: T.red };

/* ─── Structural floor conditions ───────────────────────────────────────────── */
/* Each condition holds until explicitly reversed by a named, observable event.
   Floors stack additively. Current floor = sum of all active contributions.
   Ceiling: $150+ sustained oil or nuclear weapons use = 96–100.
   Floor calibrated so all-active = ~59 (firmly in Very Fucked Up territory).
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
  { id: 'gcc_trust',    label: 'GCC host-nation trust explicitly broken (Saudi FM Mar 19)', contribution: 4,  active: true,  reversal: 'Formal US acknowledgment + confirmed repair of bilateral relationship with Saudi Arabia and Qatar' },
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
  { day: 20, date: 'Mar 19', x: 73, y: 3.0,
    xNote: 'Infrastructure war loop now active: South Pars → Ras Laffan LNG → Saudi refinery → Kuwait Mina Al-Ahmadi → UAE gas field, all struck in direct exchange. Brent above $110 (+50% since Feb 28). Axios: South Pars was US-approved — Trump\'s public disavowal was false. Qatar struck in retaliation for a US strike the US denied. Al Udeid in play. Saudi FM: trust \"completely shattered.\" Fed SEP (Mar 18): stagflationary posture confirmed — core PCE revised up, one cut now explicitly conditional on inflation progress that war trajectory makes unlikely. CME FedWatch: no cut in 2026.',
    yNote: 'TLM Assessment Day 20: 3.0/10. The conflict has crossed from military to full-spectrum energy infrastructure exchange. The US damaged its credibility with its own host nation (Qatar) through a strike it secretly approved and publicly denied. The Fed confirmed it cannot cushion the domestic political fallout — no rate cut bridge to the midterms. Larijani gone. No deal architect. Floor rose 4 points on GCC trust fracture. The lanes aren\'t just fewer — some are now structurally closed.' },
  { day: 21, date: 'Mar 20', x: 75, y: 3.0,
    label: 'Day 21 — Nowruz. Eid. War. Kuwait\'s largest refinery struck again. Qatar LNG offline 3–5 years. IRGC spokesman killed mid-broadcast. Pentagon requests $200B supplemental. Israel pledges no more South Pars strikes after triggering the largest gas supply disruption in decades.',
    xNote: '75/100: Floor is 59 (9 structural conditions, all active). Event push of +16 reflects three compounding factors: Qatar LNG damage is now confirmed at 17% capacity offline with a 3–5 year repair window — this is permanent energy architecture damage, not a disruption. The Pentagon\'s $200B supplemental signals a sustained campaign posture, not an endgame. And Israel\'s pledge to stop South Pars strikes came the day after its strike triggered the worst gas supply shock in decades — the reversal does not undo the damage. Score is 75, not higher, because no new structural floor conditions were crossed today. Score is 75, not lower, because the Qatar LNG timeline materially narrows the resolution path.',
    yNote: 'TLM Assessment Day 21: 3.0/10. The floor holds but the structural damage is compounding. Qatar\'s LNG capacity is not a six-month problem. A 3–5 year repair timeline means the energy architecture of the global gas market has been permanently altered — not disrupted. The Pentagon\'s $200B ask signals the administration is planning a sustained campaign, not an exit. The IRGC spokesman dying mid-sentence while saying Iran is still building missiles is the most honest summary of the information environment anyone has produced in three weeks.' },
  { day: 22, date: 'Mar 21', x: 78, y: 2.5,
    xNote: '78/100: Floor is 59 (9 conditions, all active). Event push of +19 driven by four compounding signals. First: Natanz nuclear enrichment facility struck — the first confirmed strike on Iran\'s nuclear infrastructure since June 2025. This is not the ceiling event (no radioactive release confirmed), but it narrows the gap between the current score and the 96–100 nuclear threshold. Second: Brent settles at $112.19, a new war high, as Goldman Sachs projects elevated prices through 2027 — structural energy damage is now priced in at the multi-year horizon. Third: DIA assessment (1–6 month Strait closure) is now public — the "not inevitable" language from inside the Pentagon is the most consequential acknowledgment of the conflict\'s architecture since it began. Fourth: Kharg Island ground operation is actively being considered. A US ground presence in Iran would be a new structural floor condition.',
    yNote: 'TLM Assessment Day 22: 2.5/10. The Natanz strike pulls the nuclear threshold closer without crossing it. The Kharg Island seizure scenario — if executed — would add a new structural floor condition and push X above 85. The "winding down" post and the troop deployment confirmation on the same day is the clearest illustration yet of the information environment: Trump\'s Truth Social is not the war. The DIA\'s "not inevitable" language on Strait reopening, combined with Goldman through 2027, confirms what the structural floor model has been pricing since Day 10: this is not a short war with a clean exit. The lane count keeps dropping.' },
  { day: 23, date: 'Mar 22', x: 82, y: 2.5,
    xNote: '82/100: First entry into "Completely unbelievably fucked up" territory (81+). Floor is 59 (9 conditions, all active). Event push of +23 driven by four compounding signals. First: Iran\'s ballistic missile strike attempt on Diego Garcia — 3,800 miles from Iran — is the most structurally significant escalation since Hormuz closed. The deterrent architecture of this conflict just expanded by 3,800 miles and now encompasses a US-UK strategic bomber base. Second: Trump\'s 48-hour power plant ultimatum introduced the first ceiling-adjacent threat of the war — executing it would push X above 85 and risk Iran permanently closing Hormuz and targeting all Gulf energy and communications infrastructure. Third: Iran targeted Dimona and Arad — cities adjacent to Israel\'s nuclear research facility at Negev. The IAEA confirmed it is monitoring. Fourth: Asian equity markets confirmed structural economic damage at the regional level: Nikkei -3.5%, Kospi -4.9% in one session; both down ~12% since Feb 28. Score is 82 and not higher because the power plant ultimatum was not executed on Day 23.',
    yNote: 'TLM Assessment Day 23: 2.5/10. The Diego Garcia strike attempt is the structural event of the war. The Iranian deterrent perimeter now extends 3,800 miles from Tehran. Every US base in the Indian Ocean is now a plausible target. Trump\'s 48-hour ultimatum was a genuine ceiling-adjacent moment — if executed, it would have triggered the largest oil supply disruption since the Strait closed and a direct attack on Iranian civilian infrastructure. Every unfollowed ultimatum narrows the credibility of the next one. The 22-nation coalition statement with no ships is the diplomatic equivalent of "we\'ll get back to you." Sen. Murkowski\'s public posture is the first GOP senatorial crack in the war\'s political architecture.' },
  { day: 24, date: 'Mar 23', x: 77, y: 3.0,
    xNote: '77/100: Score retreats 5 points from Day 23\'s ceiling pressure. Floor is 59 (all 9 structural conditions remain active — no reversal criteria met). Event push falls from +23 to +18: the 5-day pause on power plant strikes removes the immediate ceiling-adjacent threat that drove Day 23\'s score into 81+ territory. WTI dropped 8% and markets surged — the largest single-session market relief of the war. The 5 points of retreat reflect a genuine diplomatic channel opening, even if contested. Score does not fall further because: (1) Iran publicly denied any talks occurred and characterized the pause as "backing down"; (2) US-Israeli strikes on Tehran continued on Day 24 itself; (3) Iran introduced a new escalation threat — mining all Gulf communications lines if its coasts are attacked; (4) all 9 structural floor conditions remain active and no reversal criteria have been met; (5) the 5-day window is a postponement, not a resolution.',
    yNote: 'TLM Assessment Day 24: 3.0/10. The diplomatic channel is real even if Iran is publicly denying it. That\'s not unusual — both sides have incentives to manage domestic optics on any negotiation opening. But the structural reality has not changed: the Strait is closed, the mine-clearance ships are in Malaysia, the newer Iranian arsenal is undeployed, and GCC trust is fractured. The 5-day window is the most important thing to watch. If it produces a genuine Hormuz reopening framework, X falls. If Day 29 arrives with the Strait still closed and the power plant threat reinstated, X returns to 82+ immediately. The market is pricing a ceasefire. The structural model is pricing a pause.' },
  { day: 25, date: 'Mar 24', x: 78, y: 3.0,
    xNote: '78/100: Floor is 59 (all 9 structural conditions active — no reversal criteria met). Event push of +19. Score moves up 1 from Day 24, not down, for a straightforward reason: the market corrected its own overcorrection. Brent bounced back above $100 and WTI back toward $95 after yesterday\'s 10% drop — the market re-pricing the gap between "almost all points of agreement" and an ongoing kinetic reality in which Iran fired new missiles at Tel Aviv on Day 25 and the IRGC dismissed diplomacy in real time as a battlefield distraction. Israeli Defense Minister Katz confirmed "full force" strikes continue. An Israeli official told CNN a deal "does not appear to be tangible right now" and that Iran is "not in any concession mode." The Pakistan mediation lane is real — Iran confirmed to CBS it received US points through intermediaries — but it is a relayed message, not a framework, and it belongs on the Y axis, not the X axis. None of the 9 structural floor conditions moved. The Strait remains closed. The mine-clearance ships remain in Malaysia.',
    yNote: 'TLM Assessment Day 25: 3.0/10. The Pakistan go-between is the most concrete diplomatic contact since Larijani was killed — Iran\'s acknowledgment that it received US points through mediators is real. But "received points" is one step above silence. It is not a counterproposal. It is not a framework. And a ceasefire in this conflict requires two separate decisions from two actors running independent military policies: the US, which imposed a 5-day pause on power plant strikes, and Israel, which confirmed full-force operations with thousands of targets remaining and plans for several more weeks. Those are not the same decision. If Pakistan hosts an in-person meeting and Iran tables a counterproposal, Y moves to 3.5. Until then, the lane exists but nothing is moving through it.' },
  { day: 26, date: 'Mar 25', x: 76, y: 3.0,
    xNote: '76/100: Floor is 59 (all 9 structural conditions active). Event push of +17. Score retreats 2 points from Day 25 (78→76). The diplomatic channel is more concrete — the US delivered a formal 15-point action list via Pakistan; Iran responded with 5 counter-conditions — but Iran\'s conditions clarify that the gap between positions is structural, not tactical. Iran\'s demand for sovereignty over the Strait of Hormuz is not a negotiating position. It is a demand that the US accept permanent Iranian control over 20% of global oil flow. Iran FM explicitly confirmed Iran has not engaged in talks and does not plan to. WTI fell on Trump\'s claims of negotiations — the third time the market has corrected a Trump diplomatic claim this war.',
    yNote: 'TLM Assessment Day 26: 3.0/10. The proposals exchanged via Pakistan confirm the diplomatic channel is real. But the channel leads somewhere the US cannot go. Iran\'s counter-conditions include war reparations and Hormuz sovereignty — two structural non-starters. The "tollbooth" legislation moving through Iran\'s Parliament is the structural tell: Iran is treating this not as a conflict to be ended but as a governance transition to be institutionalized. Path holds at 3.0 but the lane destinations are clarifying in ways that make resolution harder to picture.' },
  { day: 27, date: 'Mar 26', x: 79, y: 2.5,
    xNote: '79/100: Floor is 59 (all 9 structural conditions active). Event push of +20. Three compounding factors. First: Iran\'s Parliament is actively formalizing a Hormuz toll regime — the "Tehran tollbooth." Ships reported charged $2M+ to use Iran\'s alternate channel. If this becomes law, the selective closure transitions from a wartime measure to a permanent geopolitical institution. Second: Trump extended the power plant ultimatum for the third time — now to April 6 — after the original 48-hour deadline issued Day 23. Each extension narrows the credibility of the next one. Third: Iran FM confirmed on the same day as Trump\'s extension that Iran "has not engaged in talks to end the war and does not plan to." Pentagon considering 10,000 more ground troops (WSJ). Two killed near Abu Dhabi by ballistic missile debris. Saudi Arabia shoots down 18 drones.',
    yNote: 'TLM Assessment Day 27: 2.5/10. Y drops from 3.0. Tangsiri is dead — the officer directly responsible for the Hormuz blockade — but the IRGC has absorbed the deaths of its intelligence minister, Larijani, and multiple senior commanders without changing operational posture. The blockade doesn\'t move. The tollbooth legislation is the structural tell: Iran is treating this conflict as a governance transition, not a fight to resolve. Third ultimatum extension further degrades the credibility of the April 6 deadline. Lane count dropping.' },
  { day: 28, date: 'Mar 27', x: 75, y: 3.0,
    xNote: '75/100: Floor is 59 (all 9 structural conditions active — no reversal criteria met). Event push of +16. Score retreats 4 points from Day 27 (79→75) on two genuine signals. First: UKMTO confirmed no vessel incidents since March 19 — the longest attack-free period since the war began (8 days). Second: WTI fell ~3.5% on diplomacy expectations — market pricing an April 6 resolution. Score does not fall further because: (1) the structural floor is fully intact — no bilateral cessation confirmed, Strait remains closed to Western shipping; (2) Iran\'s selective transit formally extended to 5 nations (China, Russia, India, Iraq, Pakistan), cementing the arrangement architecture; (3) Bloomberg: negotiations are "an exchange of demands that neither side could expect the other to accept," with Iran legislating a permanent Hormuz toll regime in parallel.',
    yNote: 'TLM Assessment Day 28: 3.0/10. Y recovers from 2.5. The tollbooth legislation is real but Iran\'s Parliament has been making maximalist declarations all war — the IRGC and SNSC run the actual conflict. If the SNSC decides to deal, the Parliament bill is footnote material. The 8-day vessel attack pause is the most concrete behavioral signal since the war began — not a Trump claim, a UKMTO confirmation. Behavioral change without structural change is a lagging indicator, not a resolution. But it earns the point back. Hold at 3.0 pending April 6.' },
  { day: 29, date: 'Mar 28', x: 81, y: 2.5,
    xNote: '81/100: First confirmed return to "Completely unbelievably fucked up" territory since Day 23. Floor is 59 (all 9 structural conditions active — no reversal criteria met). Event push of +22. Four compounding drivers. First: Houthis enter the war — first ballistic missile toward Israel from Yemen, triggering sirens in Beersheba. The missile was intercepted but the threshold has been crossed. The Red Sea is back in play. This is a potential new structural floor condition: if Houthi operations against shipping resume, the global shipping disruption extends to a second chokepoint simultaneously. Second: Prince Sultan Air Base struck — 10+ US troops wounded inside Saudi Arabia, first confirmed US casualties there. A refueler aircraft damaged. Third: Shahid Khondab and Ardakan nuclear-adjacent facilities struck; Iran warns of "playing with fire." Fourth: US intelligence confirms only ~1/3 of Iran\'s missile arsenal verifiably destroyed — the operational picture is materially worse than the administration\'s public framing.',
    yNote: 'TLM Assessment Day 29: 2.5/10. The Houthi entry is the structural event of Day 29. Even if it stays at one missile, the deterrent logic has changed: the US is now managing potential kinetic pressure on two simultaneous chokepoints — Hormuz and the Red Sea — with a carrier in Croatian drydock and mine-clearance ships in Malaysia. The US intelligence confirmation that only 1/3 of Iran\'s missile arsenal is verifiably destroyed is the second major tell. The administration\'s "ahead of schedule" framing is not supported by its own intelligence community\'s numbers. April 6 is nine days away. If the Strait is still closed and the Houthis are operationally active, that deadline will either be extended again or executed against a target set the US has been unwilling to hit for four weeks.' },
 
  { day: 30, date: 'Mar 29', x: 82, y: 2.5,
    xNote: '82/100: Floor is 59 (all 9 structural conditions active). Event push of +23. Score holds at the Day 23 ceiling level driven by four compounding signals. First: USS Tripoli — 3,500 Marines — arrives in theater. The 31st MEU is the unit specifically suited for ship-to-shore amphibious operations, confirming the Kharg Island ground operation has moved from White House deliberation to operational deployment. Second: WTI briefly crosses $100 and closes +5.46%, with Dubai physical crude at $126 — the physical-futures gap JPMorgan says "is unlikely to persist." Third: IRGC threatens Gulf university campuses — Texas A&M, Northwestern (Qatar), NYU (UAE) — with a March 30 deadline, opening a new civilian escalation domain. Fourth: Kuwait International Airport struck by drone, first major regional airport directly hit. Score is 82 and not higher because the Islamabad four-nation summit (Pakistan, Turkey, Egypt, Saudi) is the most substantive multilateral diplomatic structure of the war, including Saudi Arabia\'s first constructive signal since trust was declared "shattered" on Day 20.',
    yNote: 'TLM Assessment Day 30: 2.5/10. Two forces pulling in opposite directions. The Islamabad summit and Saudi Arabia\'s re-entry into the diplomatic lane are genuinely new — Saudi participation is structurally meaningful, not parliamentary noise. Iran\'s 20-ship Pakistani concession is a behavioral signal that a negotiating counterpart exists on the Iranian side. But simultaneously: USS Tripoli arrives, Ghalibaf warns Iran is "waiting" for a ground invasion, IRGC opens a university threat with a 24-hour deadline, and Kuwait airport burns. Both sides escalating and signaling simultaneously. Y holds at 2.5 pending whether the Islamabad format produces a framework or another exchange of incompatible demands. April 6 is eight days away.' },
  { day: 31, date: 'Mar 30', x: 84, y: 2.5,
    xNote: '84/100: Floor is 59 (9 conditions active). Event push of +25 — highest since Day 23. Four drivers. First: Trump publicly discusses Kharg Island seizure in the FT — Brent rises 3.5% to $116+. A ground operation on Kharg is a new structural floor condition; if executed, X goes above 90. This is presidential public statement, not White House deliberation. Second: US-Israeli strikes hit Tehran\'s power grid — first confirmed blackout of the capital, a new civilian infrastructure threshold. Third: Iranian politicians formally push NPT withdrawal — if executed, ceiling event probability rises sharply. Fourth: IEA confirms Hormuz closure is the largest oil supply shock in history. Score held below 85 because Pakistan talks remain active and the Kharg seizure has not been ordered.',
    yNote: 'TLM Assessment Day 31: 2.5/10. Holds. Pakistan channel is real — four-nation summit, confirmed mediation, talks imminent. That is the floor on Y. But Trump simultaneously claims most demands agreed and openly weighs seizing Kharg Island in the same FT interview. A counterpart watching cannot determine whether they are negotiating a ceasefire or preparing to occupy Iran\'s main oil export hub. That ambiguity is a structural problem for the Y axis. Iran\'s NPT withdrawal push is the ceiling watch item: formal withdrawal drops Y to 2.0 and pushes X toward 90. April 6 is seven days away.' },

  { day: 32, date: 'Mar 31', x: 85, y: 2.5,
    xNote: '85/100: Floor is 59 (9 conditions active). Event push of +26 — new war high. Five compounding drivers. First: national gas average crosses $4 — the war\'s domestic political cost is now visible at every gas station in America. Second: Pentagon confirms ground operation planning at institutional level (WashPost) — Kharg Island and Hormuz coastal raids no longer speculative. Third: Three F-15s down in Kuwait; nine countries now directly involved. Fourth: Iran\'s 87th attack wave launched by its navy — the navy Trump has repeatedly claimed is destroyed. Fifth: Trump issues new "completely obliterate all energy sources" threat, his fourth escalatory ultimatum since Day 23. Score is 85 and not higher because no ground operation has been ordered and the Pakistan-China diplomatic axis is the most substantive international framework yet assembled.',
    yNote: 'TLM Assessment Day 32: 2.5/10. Holds, but the lanes are clarifying badly. The Pakistan-China axis is real structural diplomacy — Beijing entering the mediation frame changes the weight of the effort. That is the floor on Y. But the ground operation is now confirmed at institutional level. If Trump approves Kharg raids, a new structural floor condition activates and X goes above 90. Iran\'s 87th attack wave from its "destroyed" navy is the operational tell: the war is not nearly as far along as the administration\'s public framing. Gas at $4 is the domestic political clock that April 6 is running against. April 6 is six days away.' },

  { day: 33, date: 'Apr 1', x: 86, y: 2.0,
    xNote: '86/100: Floor is 59 (9 conditions active). Event push of +27. Four drivers. First: Trump\'s primetime address reveals no exit strategy — oil spikes 4–5% post-speech, markets pricing 2–3 more weeks of disruption, not resolution. Analysts call it "a repetition of everything he has said" that "reveals he really does not have a plan." Second: NATO allies Spain, France, and Italy formally restrict US military operations — first formal alliance constraint on US warfighting this conflict, closing airspace and denying base access. Third: B-52 bombers fly over Iranian territory for the first time — market reads this as deeper operational commitment, not the wind-down Trump\'s speech described. Fourth: Asian markets open sharply lower (Nikkei -2.1%, Kospi -3.9%). Score is 86 and not higher because the UK-led 35-nation Hormuz conference is the most formal multilateral framework for Strait restoration yet assembled.',
    yNote: 'TLM Assessment Day 33: 2.0/10. Y drops 0.5. The driver is structural: three NATO allies formally restricting US military operations is not diplomatic grumbling, it is institutional action. When Spain, France, and Italy close airspace and deny base access, the alliance fracture moves from the political lane to the operational one — a genuinely new thing in this conflict. Combined with a primetime address that provided no diplomatic path, Iran FM at "zero trust," IRGC threatening US tech companies, and April 6 five days away with no framework in place, the path back is materially narrower than Day 32. The UK-led conference is the only genuine resolution lane still open. Watch item: if April 6 is extended again, Y holds at 2.0. If executed, X crosses 90.' },

  { day: 34, date: 'Apr 2', x: 87, y: 2.0,
    xNote: '87/100: Floor is 59 (9 conditions active). Event push of +28 — new war high. The primary driver is the "oil cliff": Rystad Energy says the global system has shifted from "buffered to fragile," with nearly 500 million barrels of total liquids lost and inventory buffers approaching exhaustion. BCA Research\'s Papic estimates the supply loss at 4.5–5M bpd now, doubling by mid-April when SPR releases and sanctions exemptions run out — "the largest loss of crude supply" in history. Societe Generale: $150/bbl possible in April. Macquarie: 40% probability of $200 oil if the war extends to summer. WTI: $103.69. Brent: $105.53. April 6 is four days away. Score is 87 and not 88+ because no new kinetic escalation confirmed today and the UK 35-nation conference has convened.',
    yNote: 'TLM Assessment Day 34: 2.0/10. Holds. Nothing moves the path today — the UK conference is procedural, not binding; Iran\'s parliament head says the US will not regain Hormuz access; the April 6 deadline is four days out with no framework visible. The "oil cliff" is an X-axis event, not a Y-axis one — it narrows the economic time window without opening or closing diplomatic lanes. Watch items: (1) April 6 — another extension holds Y at 2.0, execution pushes X to 92+; (2) NATO losing formal basing access in a fourth country drops Y to 1.5; (3) Iranian FM-level acceptance of ceasefire talks is the only reversal event on Y.' },

  { day: 35, date: 'Apr 3', x: 89, y: 1.8,
    xNote: '89/100: Floor is 59 (9 conditions active). Event push of +30 — new war high. Three compounding drivers. First: US-Israeli forces strike the B1 bridge in Karaj during Sizdah Bedar — 8 killed, 95 wounded among civilians celebrating a national holiday. Trump immediately posts video of the collapse, then threatens power plants on Truth Social. 100+ legal experts issue war crimes warning. Civilian infrastructure targeting at a holiday event is a structurally distinct escalation from previous military strikes. Second: Hegseth fires Army Chief of Staff Gen. Randy George effective immediately, plus two additional general officers — 14th+ senior flag officer removed since Hegseth took office. Command coherence at the Army level is now in question while ground invasion planning is ongoing and a potential Kharg Island operation is on the table. Third: Iran strikes two Gulf refineries; IRGC announces hidden weapons stockpiles remain intact. Oil markets suspended (Good Friday) with Thursday\'s prints — WTI $111, S&P 500 -1.74% — as the last market signal available.',
    yNote: 'TLM Assessment Day 35: 1.8/10. Moving Y down from 2.0 on a specific mechanism: the B1 bridge strike during Sizdah Bedar produces a civilian-casualty image that is qualitatively different from previous strikes on military or industrial targets. Opposition figure Reza Pahlavi, who has called on the US and Israel to spare civilian infrastructure, and regime spokespeople are now reading from the same civilian-harm frame. When Iranian political opinion converges across factional lines — however briefly — the diplomatic space contracts. Negotiating against the backdrop of bridge rubble on a national holiday is harder than negotiating against the backdrop of bombed air bases. Y is not at 1.5 because Guterres\' direct intervention, the scheduled UN Security Council vote, and the UK Hormuz conference indicate international actors are still constructing an off-ramp. But the structural hardening is real and the window is narrowing.' },

  { day: 36, date: 'Apr 4', x: 90, y: 1.7,
    xNote: '90/100: Floor is 59 (9 conditions, all active). Event push of +31. Mahshahr petrochemical struck (5 killed, 170 wounded), Bushehr nuclear plant auxiliary hit, 30+ universities and 55+ libraries destroyed or damaged. Iranian drones reach deep into Kuwait — power plants, water desalination, a government building, petroleum infrastructure. Geographic expansion of IRGC retaliation beyond the Strait theater accounts for the increment above Day 35.',
    yNote: 'TLM Assessment Day 36: 1.7/10. Kuwait drone attacks are a qualitative escalation — IRGC is now willing to strike deep GCC infrastructure. Every increment of geographic expansion reduces the scope for a bilateral settlement and increases the number of parties who need to be bought off in any resolution architecture. The path has been narrowing since Day 22.' },
  { day: 37, date: 'Apr 5', x: 90, y: 1.7,
    xNote: '90/100: Floor is 59. Event push of +31. Rescue operation extracts the second F-15E crew member at cost of one A-10 Thunderbolt II shot down and two C-130 Hercules destroyed — significant US airframe losses inside Iran. Easter Sunday; markets closed. No new structural floor shift. Score holds at Day 36 level: the kinetic attrition is real but not a new ceiling event.',
    yNote: 'TLM Assessment Day 37: 1.7/10. Hold. Iran\'s CENTCOM spokesperson calling the US Commander-in-Chief\'s ultimatum "helpless, nervous, unbalanced and stupid" is not parliamentary noise — that is the IRGC operational layer speaking in the language of contempt. The rescue narrative played well domestically for Trump; it has zero diplomatic valence in Tehran.' },
  { day: 38, date: 'Apr 6', x: 91, y: 1.5,
    xNote: '91/100: Floor is 59. Event push of +32. Khademi killed — IRGC intelligence chief, nearly five decades of institutional knowledge. Jam and Damavand petrochemicals (85% of export capacity) rendered inoperative. Sharif University struck. Score ticks up primarily on the ceasefire rejection: Iran refused a 45-day pause offered by Egypt, Pakistan and Turkey — the most credible three-party mediation architecture in the war — and demanded a permanent deal or nothing.',
    yNote: 'TLM Assessment Day 38: 1.5/10. Down from 1.7. A 45-day ceasefire offered by three credible mediators is exactly the kind of face-saving architecture that de-escalation ladders are built from. Iran said no. That\'s not a maximalist opening bid — it\'s a structural constraint on the mediation space. Araghchi\'s flat denial of any negotiations while Trump claims talks are "going well" means one of them is lying about the current state of the channel. Either way: the resolution architecture is not intact.' },

  { day: 39, date: 'Apr 7', x: 77, y: 2.5,
    xNote: '77/100: Floor is 53 (8 active conditions; "Iran publicly refusing negotiations" reversed — FM-level engagement through Pakistani mediators produced a signed SNSC response). Event push of +24. Kharg Island struck today — first kinetic engagement with Iran\'s primary oil export hub, 50+ military targets. IRGC formally lifts restraint toward all GCC host nations. WTI hit $115.8/bbl intraday before ceasefire announcement drove a 6% drop. Score drops from 91 on the ceasefire announcement — real structural movement, not a tweet — but Hormuz remains closed, 72-hour cessation not yet confirmed, and the managed "safe passage via IRGC coordination" is not the reversal of the yuan-denominated transit arrangement.',
    yNote: 'TLM Assessment Day 39: 2.5/10. Up from 1.5. The ceasefire is the most significant de-escalatory signal since Day 1 — it is SNSC-level engagement, not Parliament theater. Iran submitted a 10-point counter-proposal. Pakistan brokered something both sides signed within hours. Talks are scheduled for Friday in Islamabad. That back-channel is now real and active, which moves Y. But the structural negatives are intact: Larijani is still dead, the tollbooth legislation is still institutionalized, and Mojtaba told his own supporters these talks are "just a delay until the Islamic Shiite state is established." That is not a man negotiating in good faith — that is a man managing domestic optics while buying time. The path to resolution is less impassable than it was yesterday. It is not open.' },

  { day: 40, date: 'Apr 8', x: 67, y: 3.0,
    label: 'Day 40 — Ceasefire. WTI -16.4%. Dow +1,325 pts. Hormuz still closed. Three violations claimed within hours.',
    xNote: '67/100: Floor is 53 (8 active structural conditions — no new reversals; Hormuz passage promised under IRGC coordination but physically still closed as of Apr 8 evening). Event push of +14. Score drops 10 points from Day 39 on the ceasefire announcement — real structural de-escalation, not a Trump tweet. But the push falls, not to near-zero, because the structural damage is intact: WTI closed at $94.41 (-16.4%), the biggest single-day oil drop since April 2020. Spot Brent cargo came in at $124.68 — a $30 gap above the June futures price that crashed 13%. That gap is the physical reality: 187 tankers with 172 million barrels remain stranded inside the Gulf. Iran conditioned Hormuz access on IRGC coordination — not free transit. GCC attacks continued throughout the ceasefire day: Kuwait took 28 drone attacks, UAE 35, Qatar intercepted 7 missiles, Saudi East-West pipeline hit by drone. Score is 67, not lower, because the ceasefire is real SNSC-level engagement and both Dow and VIX are confirming genuine de-escalation. Score is 67, not lower still, because the Strait is physically closed and the structural conditions are all intact.',
    yNote: 'TLM Assessment Day 40: 3.0/10. Up from 2.5. The ceasefire is the highest-quality diplomatic signal this conflict has produced — SNSC signed, Pakistan brokered, Vance leading the Islamabad delegation is a serious commitment of US negotiating bandwidth. Markets believed it enough to produce the best Dow day in a year. But the framework started fraying within hours: Iran\'s Parliament Speaker Qalibaf publicly identified 3 violations (Lebanon strikes continuing, Iran airspace, Lebanon carve-out), and said bilateral negotiations are "unreasonable" given the violations. Lebanon is the structural sticking point: Pakistan announced it was included; Netanyahu confirmed it was not; Leavitt confirmed Lebanon is excluded. Iran cannot negotiate a bilateral settlement while Israel operates in Lebanon without cover — that is not a negotiating position, it is a logical constraint. Y is not at 3.5 because the path back requires Lebanon resolution, Hormuz actually opening, and a framework that survives the gap between the SNSC\'s version of the deal and the White House\'s version. Right now both sides are announcing a different agreement.' },

  { day: 41, date: 'Apr 9', x: 69, y: 3.0,
    label: 'Day 41 — Violations contested. Hormuz still closed. WTI bounces 3.1%. Islamabad talks Saturday.',
    xNote: '69/100: Floor is 53 (8 active structural conditions; Hormuz remains physically closed as of Thursday morning per Bloomberg). Event push of +16. Score rises slightly from Day 40 (67→69) on two signals: oil bounced 3.1% to $97.33 (WTI) and 2.8% to $97.42 (Brent) as markets repriced the ceasefire\'s fragility. Hormuz has not reopened in any meaningful sense — Kpler confirms ship traffic has not materially increased above the wartime pace. Iran\'s Parliament Speaker Qalibaf identified 3 violations of the 10-point proposal and said bilateral negotiations are "unreasonable." The violations claim is from Parliament — the SNSC is the operational authority — but it signals the political environment in Tehran is not supportive of the deal architecture. Score is 69, not higher, because Vance is committed to Islamabad Saturday and the ceasefire nominally holds. Score is 69, not lower, because the SNSC has not withdrawn and oil is still 40% above pre-war levels — the resolution incentive is real.',
    yNote: 'TLM Assessment Day 41: 3.0/10. Holds. The structure is: ceasefire nominally in place, SNSC still signatory, Vance leading the US delegation to Islamabad Saturday. Parliament Speaker Qalibaf threatening to call negotiations unreasonable is a pressure move, not a withdrawal — the IRGC and SNSC have consistently run the actual war independently of Parliament\'s declarations. Lebanon remains the structural sticking point: Iran cannot formalize de-escalation while Israel operates in Lebanon with explicit White House confirmation that Lebanon is outside the agreement. Watch items: (1) whether Hormuz daily transit count moves materially by end of Saturday — Kpler data is the tell, not Trump Truth Social; (2) whether Islamabad produces a framework or another "productive conversations" cycle; (3) whether a fourth country formally restricts US military basing, which drops Y to 2.5. The two-week window expires April 22.' },


  { day: 42, date: 'Apr 10', x: 71, y: 3.0,
    label: 'Day 42 — Hormuz physically unrestorable without mine-clearance. Talks preparations. WTI -12% on week.',
    xNote: '71/100: Floor is 53 (8 active structural conditions; "No US mine-clearance capability in theater" still active on Day 42 — destroyers had not yet transited). Event push of +18. Score rises slightly from Day 41 (69→71): UAE minister publicly confirms Hormuz remains "restricted, conditioned and controlled" despite ceasefire; Iran revealed to have lost track of mines it planted — a structural problem the US ceasefire demand language did not account for. Saudi Arabia confirms 600k bpd capacity loss and pipeline damage. Lebanon strikes continue. Ceasefire fragility is now a market consensus view.',
    yNote: 'TLM Assessment Day 42: 3.0/10. The revelation that Iran physically cannot reopen Hormuz — because it lost track of its own mines — reframes the diplomatic problem. The US demand for "immediate Hormuz reopening" was always political; it\'s now also logistical. That is actually Y-positive if the talks can reframe the strait as a joint mine-clearance problem rather than a political capitulation demand. Watch whether Islamabad addresses the operational mechanics of reopening, not just the political conditions.' },
  { day: 43, date: 'Apr 11', x: 68, y: 3.2,
    label: 'Day 43 — First direct US-Iran talks since 1979. US destroyers transit Hormuz. Mine clearance begins.',
    xNote: '68/100: Floor drops to 46 (7 active structural conditions — "No US mine-clearance capability in theater" reversed: USS Frank E. Peterson and USS Michael Murphy confirmed conducting mine-clearance groundwork in the Strait, satisfying the reversal criterion). Event push of +22. Score declines 3 points from Day 42: direct US-Iran talks open in Islamabad for the first time since 1979; 16 ships transit Hormuz, the busiest single day since the war began. Score does not fall further because Iran threatens to attack US warships conducting mine clearance, Lebanon strikes continue, and no agreements have been reached.',
    yNote: 'TLM Assessment Day 43: 3.2/10. The transition from proximate to direct talks — with Pakistan\'s Army Chief in the room — is a structural shift. Direct engagement doesn\'t guarantee a deal but it changes the shape of what a deal would require. The mine-clearance operation is also structurally positive: it moves Hormuz from politically blocked to physically remediable, which means any agreement can be implemented rather than just announced. The risk flag: US is reportedly demanding Iran surrender all enrichment including civilian/medical. That\'s a maximalist ask. If it\'s the actual US position, Iran cannot accept it publicly regardless of SNSC posture. Watch whether Vance softens the framing or holds the line.' },
  { day: 44, date: 'Apr 12', x: 76, y: 2.0,
    label: 'Day 44 — Islamabad talks collapse. Trump threatens naval blockade. Ceasefire expires in 10 days.',
    xNote: '76/100: Floor is 46 (7 active structural conditions). Event push of +30. Score rises 8 points from Day 43: talks collapse after 21 hours, Vance declares Iran "chose not to accept our terms" and leaves a take-it-or-leave-it ultimatum. Trump follows with explicit blockade threat — "The Blockade will begin shortly" with NATO involvement — and "LOCKED AND LOADED" language. Ceasefire expires April 22; no next round has been scheduled. Floor stays at 46 because the mine-clearance operation is ongoing and the diplomatic channel is not yet formally severed — both are real structural reversals that survive a single failed round.',
    yNote: 'TLM Assessment Day 44: 2.0/10. Revised down from initial 2.8. The binding constraint is not Iran — it is the United States. Iran\'s position is legible: keep jerking the strait, extract maximum concessions, avoid unconditional surrender. That is a coherent strategy for a weaker party. The US has no coherent strategy at all. Washington went into this conflict with three stated goals — military degradation, regime change, denuclearization — achieved partial progress on the first, none on the second, and is now maximally demanding on the third with no leverage theory attached. The Islamabad delegation had no authority to say yes to anything Iran could accept and no authority to say yes to anything the White House would ratify. That is not a negotiating failure. That is an institutional one. The US has two actual options: negotiate a deal everyone can live with, or convert military advantage into unconditional surrender. It has the capability for either. It is executing neither — running a third option that is not an option, which is to keep making threats until someone else solves the problem. Pakistan cannot solve this. Iran cannot solve this. The ceasefire window closing April 22 is not a forcing function if the party with the most leverage has no idea what it wants to force. Y is 2.0 not lower because the mine-clearance operation is real and Pakistan is still functional. Y is not higher because there is no evidence the US has resolved its internal incoherence, and until it does, the channel to Iran is irrelevant.' },

  { day: 45, date: 'Apr 13', x: 78, y: 1.8,
    label: 'Day 45 — US naval blockade of Iranian ports takes effect. 9 days left on ceasefire.',
    xNote: '78/100: Floor remains 46 (7 active structural conditions). Event push +32. Score rises 2pts from Day 44: blockade taking legal effect is a concrete military escalation — legal experts confirm it constitutes a belligerent right that de facto ends the ceasefire. Iran calls it piracy. But no new strikes occurred, ceasefire technically still in place, mediators active, Macron/UK signaling multilateral Hormuz mission.',
    yNote: 'TLM Assessment Day 45: 1.8/10. The blockade creates legal ambiguity that could force Iran\'s hand or give both sides a face-saving off-ramp — depending on how the US handles the next 9 days. The Macron/UK Hormuz mission is significant if it develops into operational reality: a multilateral escort framework is the one path that doesn\'t require either side to publicly capitulate. But France has announced a conference with no warships confirmed. Core US pathology persists: blockade is pressure without a theory. Blockading Iranian ports doesn\'t explain how that forces Iran to surrender Hormuz sovereignty — that is the reverse of the leverage Iran holds.' },

  { day: 46, date: 'Apr 14', x: 77, y: 1.7,
    label: 'Day 46 — Israeli-Lebanon talks in Washington. Mediators active. 8 days left.',
    xNote: '77/100: Floor 46, event push +31. Minor decrease from Day 45: no new major military actions, Israel-Lebanon Washington talks a marginal stabilizing signal. Blockade in effect but no incident. Score holds near Day 44-46 range because no structural conditions changed.',
    yNote: 'TLM Assessment Day 46: 1.7/10. Israel-Lebanon talks are the day\'s most interesting development — not because they will succeed, but because Hezbollah rejected them immediately, which means they add a complication to the Iran deal rather than clearing one. Iran has consistently insisted Lebanon is covered by the ceasefire. Washington legitimizing it as a separate track implicitly concedes Netanyahu\'s framing. That makes Iran\'s willingness to sustain the Hormuz pause harder to maintain politically. The countdown is the dominant variable now. 8 days is not enough time for parties who produced two different documents in Islamabad.' },
  { day: 47, date: 'Apr 15', x: 73, y: 2.5,
    xNote: '73/100: Floor is 59 (9 conditions, all active). Event push of +14. Framework talks produce genuine signal — Munir in Tehran, Vance publicly optimistic, US/Iran exchanging draft proposals. Push decays from prior high as no kinetic incidents reported and diplomatic track is active.',
    yNote: 'TLM Assessment Day 47: 2.5/10. The corridor is narrow but it is real. Back-channel momentum — Munir traveling to Tehran, Vance characterizing Iran as genuinely willing — represents the most credible de-escalation signal since the ceasefire began. Y rises from 1.7 for the first time since Islamabad collapsed. Watch: whether the framework survives contact with the actual terms. The nuclear gap remains the civilizational-scale problem that no amount of optimistic VP statements resolves.' },
  { day: 48, date: 'Apr 16', x: 73, y: 3.0,
    xNote: '73/100: Floor is 59 (9 conditions, all active). Event push of +14. Lebanon ceasefire announced — reduces regional pressure vector Iran had been exploiting to block progress. But Iran\'s threat to halt all Gulf/Red Sea/Oman trade is a new structural warning. Net neutral on X; the positive and negative signals cancel.',
    yNote: 'TLM Assessment Day 48: 3.0/10. Lebanon ceasefire matters because Iran had made it a precondition. Vance brokered it. That is a meaningful structural move — it removes one of Iran\'s blocking arguments. Y rises to 3.0. Caveat: Israel violated the Lebanon ceasefire within hours. If the Lebanon truce collapses, Iran\'s precondition logic returns immediately and Y snaps back down. The window is open but it\'s a swinging door.' },
  { day: 49, date: 'Apr 17', x: 70, y: 3.5,
    xNote: '70/100: Floor is 59 (9 conditions, all active). Event push of +11. Hormuz declared open for ceasefire remainder — temporary, conditional, not yet confirmed by sustained commercial transit. Oil -10%. But blockade remains in force, ceasefire expires in 4 days, nuclear gap unchanged. Hormuz structural condition not reversed until Western-flagged commercial transit is confirmed without escort or yuan settlement. Event push decays on the opening declaration but floor holds.',
    yNote: 'TLM Assessment Day 49: 3.5/10. The Lebanon ceasefire plus the Hormuz declaration plus a second Islamabad round creates the most constructive 72-hour window since Day 1. But the geometry is brutal: ceasefire expires April 21 — four days — and the structural gaps (nuclear enrichment, Hormuz sovereignty, sanctions architecture) have not moved. Iran\'s FM opened the strait; Iran\'s state media is calling it a victory. Trump\'s claims about Iranian concessions are already being disputed by Iranian officials in real time. The Paris summit is theater. The question is whether Monday\'s Islamabad round produces a framework extension or a third collapse. Without an extension, this entire de-escalation signal evaporates by Tuesday.' },
  { day: 50, date: 'Apr 18', x: 76, y: 2.0,
    xNote: '76/100: Floor is 59 (9 conditions, all active). Event push of +17. Hormuz structural condition not reversed — yesterday\'s declaration lasted less than 24 hours. Iran re-closed on US refusal to lift blockade. Rubio sanctions push signals diplomatic track is adding complexity, not reducing it. X rises from 70 as the de-escalation signal of Day 49 is fully unwound.',
    yNote: 'TLM Assessment Day 50: 2.0/10. The 24-hour Hormuz window was the tell. Iran opened it conditional on blockade relief; the US declined; Iran closed it. That is not a concession — it is a demonstration of leverage. What looked like a Y=3.5 environment yesterday is now a Y=2.0 environment: ceasefire expires in 3 days, no Islamabad date confirmed, Rubio is pushing Europe to sanction while simultaneously signaling nuclear flexibility, and Iran\'s re-closure resets the structural scoreboard to pre-Apr 17. The second Islamabad round, if it happens, is the last offramp before the ceasefire clock hits zero Tuesday.' },
  { day: 51, date: 'Apr 19', x: 78, y: 1.5,
    xNote: '78/100: Floor is 59 (9 conditions, all active). Event push of +19. Hormuz closed and under IRGC kinetic control — gunboats fired on tankers during the brief Apr 17 re-opening. Ceasefire expires in 2 days with no extension confirmed. Trump threatening to resume bombing. X rises as the last-ditch-deal window is now measured in hours, not days.',
    yNote: 'TLM Assessment Day 51: 1.5/10. The geometry is about as bad as it gets without active kinetics. Ceasefire expires Monday. No Islamabad date. Uranium transfer explicitly off the table. Iran\'s own chief negotiator on national television calling the gaps "fundamental." The one thread keeping Y above 1.0 is that both sides are still talking through Pakistan — Ghalibaf said "progress" and "more realistic understanding," and Trump simultaneously threatened bombs and said a deal is possible. That is the architecture of a last-minute extension, not a collapse. But extensions require someone to blink first on the blockade-vs-Hormuz loop, and neither side has shown any sign of doing so. Watch for any ceasefire extension announcement before midnight Monday.' },
  { day: 52, date: 'Apr 20', x: 84, y: 1.3,
    xNote: '84/100: Floor is 59 (9 conditions, all active). Event push of +25. Ship seizure is new kinetic category — first armed US boarding of the war. Iran vowing retaliation. Zero Hormuz transits Sunday. Ceasefire expires in under 36 hours with no extension confirmed. Nuclear gap hardened: 20-year vs 5-year enrichment pause, both sides publicly locked. X spikes to its highest since Day 23.',
    yNote: 'TLM Assessment Day 52: 1.3/10. The Touska seizure is the tell. The US boarded an Iranian merchant vessel while both sides were supposedly in a ceasefire and approaching talks. Iran called it piracy and vowed retaliation — that is IRGC operational language, not Parliament grandstanding. The Y thread holding above 1.0: Islamabad is physically prepared, US delegation is confirmed en route, and Iranian sources privately told CNN their team would also go. But the official Iranian position is "no plans." If Tehran sends a delegation despite that public stance, Y stays above 1.0. If Iran retaliates for the Touska before the ceasefire expires, Y goes to 0.5 and X goes to 90+. The 36-hour window is the entire ballgame.' },
  { day: 53, date: 'Apr 21', x: 80, y: 2.2,
    xNote: '80/100: Floor is 59 (9 conditions, all active). Event push of +21. Ceasefire extended at the last minute — imminent kinetic risk deferred. But second tanker seized, IRGC threatening regional oil infrastructure, Brent briefly above $101. X declines slightly from Day 52 peak as the extension removes the immediate war-resumption clock, but structural conditions unchanged.',
    yNote: 'TLM Assessment Day 53: 2.2/10. The extension is analytically interesting for one reason: Trump\'s framing. He called Iran\'s government "seriously fractured" — that is an accurate read of the SNSC/IRGC vs. negotiating-team divide that has paralyzed Iranian decision-making throughout. The open-ended extension removes deadline pressure on Iran, which advisers warned Trump about privately. That cuts both ways: it defers war but also lets Iran drag. Y rises modestly from 1.3 because the extension reveals Trump\'s revealed preference is still a deal, not bombs — his "I expect to be bombing" statement dissolved within hours into a ceasefire extension. Structural problem: no end date means no forcing function.' },
  { day: 54, date: 'Apr 22', x: 78, y: 2.2,
    xNote: '78/100: Floor is 59 (9 conditions, all active). Event push of +19. Ceasefire holds under open-ended extension. No Iranian kinetic retaliation for Touska yet despite IRGC threat language. Hormuz closed. X declines marginally on quiet day — no new escalation events. Structural floor unchanged.',
    yNote: 'TLM Assessment Day 54: 2.2/10. Iran officially refusing to attend Islamabad II is not a surprise — it is consistent with their stated "no plans" position since Day 50. What matters is whether the refusal is a hard no or a negotiating posture. Iran\'s language ("waste of time because US prevents reaching any suitable agreement") points at the blockade as the unlocking condition — the same loop since Day 46. The open-ended extension with no forcing function now defines the situation: both sides in a holding pattern, each waiting for the other to blink on blockade vs. Hormuz. Trafigura\'s estimate: even if this resolves tomorrow, 1 billion barrels of supply already lost. The meter keeps running.' },
];

const BILL = [
  { label: 'US KIA',          value: '15+',      sub: '6 killed Kuwait (Mar 1), 1 non-combat (Mar 9), 6 killed KC-135 crash Iraq (Mar 13), 1 enemy attack Prince Sultan AB Saudi Arabia (Mar 1), 1 non-combat Kuwait (Apr 1). The Intercept (Apr 1): Pentagon sending outdated figures — a defense official called it a "casualty cover-up."', src: 'Wikipedia / The Intercept, Apr 1' },
  { label: 'US WIA',          value: '303+',     sub: 'CENTCOM confirmed 303 as of Mar 28 — already an undercount per The Intercept, which excluded at least 15 wounded in a Mar 28 Prince Sultan attack. Majority: traumatic brain injuries from Iranian ballistic missile/drone barrages. Pentagon has refused to provide updated figures.', src: 'CENTCOM Mar 28 / The Intercept Apr 1' },
  { label: 'Iranian dead',    value: '3,636+',   sub: 'HRANA (Apr 7): 3,636 documented — 1,701 civilians, 1,221 military, 714 unclassified. Iran Health Ministry (Apr 2): 2,076+ (acknowledged undercount). Iran International: 4,700+ security forces killed (Mar 31). Trump administration claims 32,000. HRANA notes military casualties believed significantly higher.', src: 'HRANA Apr 7 / Iran Health Ministry Apr 2' },
  { label: 'Iranian injured', value: '26,500+',  sub: 'Iran Health Ministry as of early April. Includes at least 4,000 women and 1,621 children.', src: 'Iran Health Ministry, Apr 2' },
  { label: 'Lebanon dead',    value: '2,387+',   sub: 'Killed by Israeli strikes since Mar 2 (as of Apr 20). Includes Apr 8 mass strike: 254 killed in single day. Over 1 million displaced (1/6 of population). 10-day Israel-Lebanon ceasefire began Apr 17; Israel accused of multiple violations same day. IDF claims 1,400+ Hezbollah fighters killed.', src: 'Casualties Wikipedia / Lebanon Health Ministry, Apr 20' },
  { label: 'Lebanon injured',  value: '7,602+',   sub: 'Since Israel renewed widespread attacks Mar 2. As of Apr 20. 10-day ceasefire began Apr 17 but violations reported immediately.', src: 'Casualties Wikipedia / Lebanon Health Ministry, Apr 20' },
  { label: 'Israel dead',      value: '40+',      sub: 'As of Apr 7: 40 Israeli citizens killed including 27 civilians; 7,453 injured (418 military). Killed by Iranian missile/drone strikes Feb 28 onward. 15 IDF soldiers killed in southern Lebanon ground operations since Mar 2.', src: 'Casualties Wikipedia, Apr 7' },
  { label: 'Minab school',    value: '175+',     sub: 'Girls school, Minab, Feb 28. Amnesty International (Mar 17) confirms US responsibility. Iranian state media: more than 175 killed, mostly schoolgirls; 95 wounded. US has not acknowledged civilian casualties.', src: 'Amnesty International, Mar 17; Wikipedia' },
  { label: 'Ships struck',    value: '26+',      sub: 'IRGC attacks on merchant vessels since Feb 28 (excludes 2 US seizures/boardings). Apr 18 cluster: Sanmar Herald (VLCC fired on by 2 gunboats), CMA CGM Everglade (struck by projectile), Jag Arnav (near-miss). US blockade has turned back 28 ships. 870 vessels stranded inside Gulf; ~200 ships and 20,000 seafarers unable to transit.', src: 'Al Jazeera Apr 14 (22 confirmed) / Windward Maritime AI Apr 19-20 / UKMTO' },
  { label: 'Gulf civilians',  value: 'Dozens',   sub: 'UAE, Kuwait, Saudi Arabia, Bahrain — Iranian retaliatory strikes on energy and government infrastructure. Kuwait: power plants, desalination, KPC facilities (Apr 4). Iraqi dead: 109+ (Health Ministry).', src: 'Reuters / official statements / Al Jazeera' },
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
        Average US driver: ~1,000 miles/month, ~28 MPG. National average crossed $4.00/gal on Mar 31 (GasBuddy/AAA) — up $1.00+ since Feb 28. California: $5.87/gal. Diesel: $5.45/gal, up 45% since war began.
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
     - WTI up ~52% from inauguration ($76 → $115+)
     - Average US household grocery spend: ~$550/month (BLS CES 2024)
     - National avg retail gas crossed $4/gal Mar 31 (GasBuddy/AAA); CA $5.87, diesel $5.45
     - JPMorgan/Goldman: airfare CPI up to 20% modeled at $95 crude — now higher
     - Fertilizer (natural gas derivative): already embedded in food supply chain
  */
  const IMPACTS = [
    {
      label: 'Groceries',
      est: '+$30–55/mo',
      estColor: '#C0392B',
      note: 'Oil up ~52% from inaug → food CPI +~1.56% per Fed Board model ($550/mo spend = +$8.58 mechanically). Add fertilizer lag (natural gas up sharply; 1–2 season pass-through), supply chain repricing, and diesel transport costs already at $5.45/gal — full household exposure runs $30–55/mo above Jan 2025 baseline.',
      src: 'Fed Board FEDS Notes, Dec 2023; GasBuddy/AAA Apr 2026; BLS CES 2024',
    },
    {
      label: 'Airfares',
      est: '+20–35%',
      estColor: '#C0392B',
      note: 'Jet fuel ~80% above pre-war levels. Fuel is 25–30% of airline operating cost; airlines pass through 60–70% of sustained increases. JPMorgan projected 15–20% at $95 crude — at $115+ the model pushes 20–35%. Route consolidation and reduced capacity amplify ticket prices further.',
      src: 'JPMorgan Private Bank via CNBC, Mar 11, 2026; EIA jet fuel data',
    },
    {
      label: 'Consumables',
      est: '+$12–22/mo',
      estColor: '#B85C38',
      note: 'Petroleum inputs in plastics, packaging, cleaning products, and synthetics. Core CPI +~0.52% at current oil levels (52% increase × Fed model). Applied to ~$400/mo nondurables spend plus supply chain repricing now flowing through to retail shelves.',
      src: 'Fed Board FEDS Notes, Dec 2023; EIA oil-to-consumer analysis',
    },
    {
      label: 'Durables',
      est: '2–4% costlier',
      estColor: '#B8860B',
      note: 'Appliances, vehicles, electronics: PPI (producer prices) leads CPI by 3–6 months. At $115+ WTI the PPI pass-through to durables is now building into the pipeline. Effect will be felt through Q3 2026 regardless of when the war ends.',
      src: 'ScienceDirect: Oil price shocks and inflation, 2025; BLS PPI data',
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
    // Fetch oil and commodities independently so one failure doesn't block the other
    const [oilResult, comResult] = await Promise.allSettled([
      fetch('/api/oil').then(r => r.json()),
      fetch('/api/commodities').then(r => r.json()),
    ]);
    if (oilResult.status === 'fulfilled') {
      setData(oilResult.value);
      setError(null);
    } else {
      setError('Live oil data unavailable — markets may be closed.');
    }
    if (comResult.status === 'fulfilled' && comResult.value?.commodities?.length) {
      setCommodities(comResult.value.commodities);
    } else {
      setCommodities(null); // triggers retry UI
    }
    setLastUpdated(new Date());
    setLoading(false);
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
        <meta name="description" content="A little excursion. Live WTI crude index vs. Inauguration Day 2025." />
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
              A little excursion.
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

          {/* ── Inline CTA — BLUF position ──────────────────────────────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', background: T.slatePale, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.slate}`, borderRadius: '2px', padding: '0.875rem 1.25rem', marginBottom: '2rem' }}>
            <p style={{ ...serif, fontSize: '13px', color: T.slateDk, margin: 0, lineHeight: 1.6 }}>
              The analysis continues in your inbox — institutional-grade threat appraisal, free.
            </p>
            <a href="https://thelongmemo.com/subscribe" target="_blank" rel="noopener noreferrer"
              style={{ ...serif, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase', color: T.bgCard, background: T.slate, padding: '0.45rem 1rem', borderRadius: '2px', textDecoration: 'none', whiteSpace: 'nowrap', fontWeight: 600 }}>
              Subscribe Free →
            </a>
          </div>

          {error && (
            <div style={{ background: '#FEF3EE', border: `1px solid ${T.terraPale}`, borderRadius: '2px', padding: '10px 14px', marginBottom: '1.25rem', ...serif, fontSize: '13px', color: T.terra }}>
              {error}
            </div>
          )}

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
                <div style={{ display: 'flex', justifyContent: 'space-between', margin: '6px 0 8px', padding: '0 2px' }}>
                  {[['0–20','Fine'],['21–40','Elevated'],['41–60','Significant'],['61–80','Very'],['81–100','Nuclear/etc']].map(([range, label]) => (
                    <div key={range} style={{ textAlign: 'center' }}>
                      <p style={{ ...serif, margin: 0, fontSize: '9px', color: T.inkMuted }}>{range}</p>
                      <p style={{ ...serif, margin: 0, fontSize: '8px', color: T.inkMuted, fontStyle: 'italic' }}>{label}</p>
                    </div>
                  ))}
                </div>
                <p style={{ ...serif, fontSize: '11px', color: T.inkMuted, margin: '0 0 6px', lineHeight: 1.6 }}>
                  Score = structural floor ({CURRENT_FLOOR} pts, 9 active conditions) + daily event push (+{DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1].x - CURRENT_FLOOR} pts today).
                  Does not reset on a tweet. Ceiling = nuclear use or $150+ sustained oil.
                </p>
                <p style={{ ...serif, fontSize: '11px', color: T.inkMuted, margin: '0 0 8px', lineHeight: 1.6 }}>
                  Floor contributions: Hormuz closed (18), active kinetic ops (8), no mine-clearance ships in theater (7), Iran refusing talks (6), no allied coalition (5), yuan transit (5), newer arsenal undeployed (4), GCC trust broken (4), internal dissent confirmed (2). Reversal criteria for each listed in the Floor Conditions table below.
                </p>
                {DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1].xNote && (
                  <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '8px', marginTop: '4px' }}>
                    <p style={{ ...serif, margin: '0 0 3px', fontSize: '9px', letterSpacing: '0.14em', textTransform: 'uppercase', color: T.slateMid }}>Why {DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1].x}/100 today</p>
                    <p style={{ ...serif, margin: 0, fontSize: '11px', color: T.inkMid, lineHeight: 1.6 }}>{DAILY_ASSESSMENTS[DAILY_ASSESSMENTS.length - 1].xNote}</p>
                  </div>
                )}
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

            {/* Drill quote */}
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
            {commodities && commodities.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1px', background: T.border, borderRadius: '2px', overflow: 'hidden' }}>
                {commodities.map((c, i) => <CommodityCard key={i} c={c}/>)}
              </div>
            ) : (
              <div style={{ height: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', ...serif, fontSize: '13px', color: T.inkMuted }}>
                <span>Commodity data unavailable.</span>
                <button onClick={fetchAll} style={{ ...serif, fontSize: '12px', background: 'none', border: `1px solid ${T.border}`, color: T.terra, borderRadius: '2px', padding: '4px 10px', cursor: 'pointer' }}>
                  Retry
                </button>
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
          <div style={{ marginBottom: '1.25rem' }}>

            {/* Free tier — TLM */}
            <div style={{ background: T.slateDk, borderRadius: '2px 2px 0 0', padding: '2rem 2rem 1.75rem', textAlign: 'center', borderTop: `3px solid ${T.terra}` }}>
              <p style={{ ...serif, fontSize: '10px', letterSpacing: '0.22em', color: T.terra, textTransform: 'uppercase', margin: '0 0 0.6rem' }}>
                Free — The Long Memo
              </p>
              <p style={{ ...display, fontSize: '1.6rem', fontStyle: 'italic', color: '#F5F1EB', margin: '0 0 0.6rem', lineHeight: 1.15 }}>
                You&apos;ve been reading Day {dayCount}.
              </p>
              <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.6)', margin: '0 0 1.5rem', lineHeight: 1.7, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                The analysis continues in your inbox. The Long Memo is institutional-grade threat appraisal for people who need to know what&apos;s actually happening — free, no paywall.
              </p>
              <a href="https://thelongmemo.com/subscribe" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '11px 32px', background: T.terra, color: '#F5F1EB', border: 'none', borderRadius: '2px', fontSize: '12px', textDecoration: 'none', ...serif, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>
                Subscribe Free →
              </a>
            </div>

            {/* Paid tier — BL */}
            <div style={{ background: T.slateMid, borderRadius: '0 0 2px 2px', padding: '1.5rem 2rem', textAlign: 'center', borderTop: `1px solid rgba(255,255,255,0.08)` }}>
              <p style={{ ...serif, fontSize: '10px', letterSpacing: '0.22em', color: 'rgba(245,241,235,0.5)', textTransform: 'uppercase', margin: '0 0 0.5rem' }}>
                Paid — Borderless Living
              </p>
              <p style={{ ...serif, fontSize: '13px', color: 'rgba(245,241,235,0.75)', margin: '0 0 1rem', lineHeight: 1.7, maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
                The Fuckupometer tracks the problem. Borderless Living is the answer — sovereign strategy, jurisdictional optionality, and the Borderless Sovereignty Index for internationally mobile Americans.
              </p>
              <a href="https://borderlessliving.com/subscribe" target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', padding: '9px 28px', background: 'transparent', color: 'rgba(245,241,235,0.85)', border: `1px solid rgba(245,241,235,0.3)`, borderRadius: '2px', fontSize: '12px', textDecoration: 'none', ...serif, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Go Deeper →
              </a>
            </div>

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

