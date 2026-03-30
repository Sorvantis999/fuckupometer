---
name: fuckupometer
description: Daily update workflow for the Trump Fuckupometer at fuckupometer.thelongmemo.com. Use this skill whenever Bryan says "update the fuckupometer", "day [N] update", "fuckupometer update", or any variant. Covers the full workflow: researching current news, scoring the dual-axis XY model, writing EVENTS_2026 entries, TRUMP_SAID entries, and DAILY_ASSESSMENTS, editing pages/index.js, committing to GitHub, and deploying to Vercel. Always read this skill before starting a fuckupometer update — it contains all credentials, data structures, scoring methodology, and deploy pattern.
---

# Fuckupometer Daily Update Skill

Live tracker at **fuckupometer.thelongmemo.com**. Repo: `Sorvantis999/fuckupometer`. Next.js app, single file: `pages/index.js`.

---

## Credentials

- **GitHub token**: stored in Bryan's Claude memory (Sorvantis999 account, repo scope)
- **Vercel token**: stored in Bryan's Claude memory (full access, never expires)
- **Vercel team ID**: `team_pqZJ4C6tmTe5iWOjZoIPBSly`
- **Vercel project name**: `fuckupometer`

---

## War timeline reference

- **War start**: Feb 28, 2026 = Day 1
- **Day count formula**: `Math.floor((now - Feb28) / 86400000) + 1`
- Today's day = today's date minus Feb 27 (inclusive count)

---

## Step 1 — Pull current index.js from GitHub

```python
import urllib.request, json, base64

req = urllib.request.Request(
    "https://api.github.com/repos/Sorvantis999/fuckupometer/contents/pages/index.js",
    headers={"Authorization": "token <GITHUB_TOKEN_FROM_MEMORY>", "User-Agent": "python"}
)
with urllib.request.urlopen(req) as r:
    data = json.load(r)
    content = base64.b64decode(data['content']).decode('utf-8')
    sha = data['sha']  # SAVE THIS — needed for commit
```

Write to `/home/claude/index.js`.

---

## Step 2 — Research

Search for the days since the last DAILY_ASSESSMENTS entry. Check the last `{ day: N, date: ... }` entry to find the gap.

**Required searches:**
1. `US Iran war Hormuz strait [dates]` — military, diplomatic, Hormuz developments
2. `WTI oil price [dates]` or `Brent crude [dates]` — price data for each missing day
3. Any specific events Bryan flags

**Key sources to check:** Reuters, AP, CBS News, CNN, NPR, Bloomberg, PBS, WSJ, UKMTO for ship incidents.

---

## Step 3 — Data structures to update

### 3a. EVENTS_2026 (incident log)

Append entries before the closing `];` of the `EVENTS_2026` array.

```js
{ date: 'Mar NN', tier: 'critical', label: 'Full narrative. Day N.' },
```

**Tier values:**
- `baseline` — pre-war background
- `neutral` — neutral/ambiguous development
- `critical` — significant escalation or structural event
- `peak` — war high (e.g., $119.48 WTI on Mar 9)
- `today` — current day's entries only (yesterday's `today` entries become `critical` on next update)

**On each update:** change all previous `tier: 'today'` entries to `tier: 'critical'` before adding new ones.

Write multiple entries per day when needed — one entry per distinct storyline (military, diplomatic, economic, casualty).

### 3b. TRUMP_SAID

Append entries before the closing `];` of the `TRUMP_SAID` array.

```js
{
  date: 'Mar NN, 2026',
  said: '"Direct quote or close paraphrase."',
  reality: 'What actually happened, with named contradicting sources and timeline. Day N.',
},
```

Only add entries where the gap between claim and reality is documentably specific. Not every statement — only the ones where the contradiction is tight and sourced.

### 3c. DAILY_ASSESSMENTS

Append entries before the closing `];` of the `DAILY_ASSESSMENTS` array.

```js
{ day: N, date: 'Mar NN', x: XX, y: Y.Y,
  xNote: 'XX/100: Floor is [F] ([count] conditions, all active). Event push of +[N]. [Narrative explaining why X moved from prior day, naming the specific events that drove the score.]',
  yNote: 'TLM Assessment Day N: Y.Y/10. [Narrative explaining the Y score — what the path to resolution looks like, what lanes are open or closing, what the key watch items are.]' },
```

---

## Step 4 — Scoring methodology

### X axis — Fuckedness (0–100)

**Scale:**
- 0–20: Not fucked up
- 21–40: More than a little fucked up
- 41–60: Significantly fucked up
- 61–80: Very fucked up
- 81–95: Completely unbelievably fucked up
- 96–100: Reserved for $150+ sustained oil or nuclear weapons use

**Formula:** `X = structural floor + event push`

**Current structural floor:** 59 points (9 active conditions, all active as of last update — verify none have been reversed)

| Condition | Points | Reversal criteria |
|---|---|---|
| Hormuz closed to Western/US-aligned shipping | 18 | Confirmed Western-flagged commercial transit without Iranian escort or yuan settlement |
| Active kinetic operations ongoing (both sides) | 8 | 72-hour cessation confirmed by both CENTCOM and IRGC |
| No US mine-clearance capability in theater | 7 | USS Tulsa or USS Santa Barbara confirmed operating in Persian Gulf |
| Iran publicly refusing negotiations | 6 | FM-level statement accepting ceasefire talks — not Trump claiming they want a deal |
| No allied coalition for Hormuz reopening | 5 | Two or more named nations confirm warships en route for escort operations |
| Yuan-denominated transit arrangement in place | 5 | Arrangement formally dissolved or Western vessels granted equivalent access |
| Iran's newer-generation arsenal undeployed | 4 | IRGC confirms or deploys |
| GCC host-nation trust explicitly broken | 4 | Formal US acknowledgment + confirmed repair of bilateral relationship with Saudi Arabia and Qatar |
| US internal dissent confirmed public | 2 | Confirmed replacement, no further senior public resignations |

**Floor = 59 when all active.** If a condition is reversed, subtract its points from the floor.

**Event push:** Add points above the floor based on the day's events. Typical range is +5 to +25 depending on severity. Decays ~0.5pt/quiet day back toward floor. Score does not reset on a tweet.

**Ceiling events that push toward 96–100:** confirmed nuclear weapons use, $150+ sustained WTI.

### Y axis — Ease of Unfuckability (1.0–10.0)

**Scale:** 10 = adults in the room fix it tomorrow. 1 = chiseled in rock.

This is a TLM editorial judgment, not a formula. Updated daily with evidence.

**Key factors that move Y:**
- Credible back-channel contacts (up)
- Key interlocutors eliminated (down — e.g., Larijani's death)
- Iran making structural institutional changes (down — e.g., tollbooth legislation)
- Behavioral de-escalation signals (up — e.g., 8-day vessel attack pause)
- US credibility erosion with allies (down)
- Coalition formation (up)

**Important distinction:** Parliament grandstands, SNSC governs. Iranian legislative maximalism is less structurally meaningful than IRGC/SNSC operational posture. Don't mechanically drop Y on Parliament statements.

**When Bryan challenges a Y score:** stress-test the argument. Identify the specific mechanism driving the score. If the argument for moving Y relies on a signal that's historically been noise (e.g., Parliament votes), hold or revert. If it relies on a new structural condition not yet priced in, accept the move.

---

## Step 5 — Edit the file

Use Python string replacement to insert new entries. **Never use sed on JS content with quotes** — it mangles escaping. Use Python's `str.replace()` with the exact marker string found at the insertion point.

**Pattern:**
```python
with open('/home/claude/index.js', 'r') as f:
    content = f.read()

new_entries = """  { date: 'Mar NN', tier: 'today', label: '...' },"""

# Find the last entry's closing and append before ];
marker = "[exact unique string from last entry ending]' },\n];"
content = content.replace(marker, "[same string]' },\n" + new_entries + "\n];", 1)

with open('/home/claude/index.js', 'w') as f:
    f.write(content)
```

**Always verify** with `grep -n` that previous `tier: 'today'` entries were changed to `critical` and that new entries are present.

---

## Step 6 — Commit to GitHub

```python
import urllib.request, json, base64

with open('/home/claude/index.js', 'r') as f:
    content = f.read()

encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')

payload = json.dumps({
    "message": "Day N update: [one-line summary of key events]",
    "content": encoded,
    "sha": SHA_FROM_STEP_1,  # critical — will reject if stale
    "committer": {"name": "Sorvantis", "email": "bryan@sorvantis.com"}
}).encode('utf-8')

req = urllib.request.Request(
    "https://api.github.com/repos/Sorvantis999/fuckupometer/contents/pages/index.js",
    data=payload, method="PUT",
    headers={
        "Authorization": "token <GITHUB_TOKEN_FROM_MEMORY>",
        "Content-Type": "application/json", "User-Agent": "python"
    }
)
with urllib.request.urlopen(req) as r:
    result = json.load(r)
    commit_sha = result['commit']['sha']
```

---

## Step 7 — Deploy to Vercel

```python
import urllib.request, json, time

# Get latest commit SHA from GitHub (use commit_sha from step 6)
payload = json.dumps({
    "name": "fuckupometer",
    "target": "production",
    "gitSource": {
        "type": "github",
        "org": "Sorvantis999",
        "repo": "fuckupometer",
        "ref": "main",
        "sha": commit_sha
    }
}).encode('utf-8')

req = urllib.request.Request(
    "https://api.vercel.com/v13/deployments?teamId=team_pqZJ4C6tmTe5iWOjZoIPBSly",
    data=payload, method="POST",
    headers={
        "Authorization": "Bearer <VERCEL_TOKEN_FROM_MEMORY>",
        "Content-Type": "application/json", "User-Agent": "python"
    }
)
with urllib.request.urlopen(req) as r:
    deploy = json.load(r)
    deploy_id = deploy['id']

# Poll until READY
for _ in range(18):  # 3 min max
    time.sleep(10)
    req = urllib.request.Request(
        f"https://api.vercel.com/v13/deployments/{deploy_id}?teamId=team_pqZJ4C6tmTe5iWOjZoIPBSly",
        headers={"Authorization": "Bearer <VERCEL_TOKEN_FROM_MEMORY>", "User-Agent": "python"}
    )
    with urllib.request.urlopen(req) as r:
        result = json.load(r)
        status = result['status']
        if status == 'READY':
            print("Live:", result['url'])
            break
        elif status in ('ERROR', 'CANCELED'):
            print("Deploy failed:", result.get('errorMessage'))
            break
```

---

## Score history (for continuity)

| Day | Date | X | Y | Key event |
|-----|------|---|---|-----------|
| 1 | Feb 28 | 28 | 7.0 | War commences |
| 10 | Mar 9 | 56 | 4.5 | WTI $119.48, Mojtaba appointed |
| 18 | Mar 17 | 66 | 3.5 | Larijani killed, Hormuz "cannot return" |
| 20 | Mar 19 | 73 | 3.0 | Infrastructure war loop, South Pars, GCC trust shattered |
| 22 | Mar 21 | 78 | 2.5 | Natanz struck, Kharg seizure under consideration, DIA 1–6 month assessment |
| 23 | Mar 22 | 82 | 2.5 | Diego Garcia strike attempt, 48hr ultimatum, Dimona targeted |
| 24 | Mar 23 | 77 | 3.0 | 5-day pause, market rally, Iran denies talks |
| 25 | Mar 24 | 78 | 3.0 | Market re-corrects, Pakistan go-between confirmed, Israel: "full force" |
| 26 | Mar 25 | 76 | 3.0 | Iran rejects US proposal, 5 counter-conditions incl. Hormuz sovereignty |
| 27 | Mar 26 | 79 | 2.5 | Tollbooth legislation, 3rd ultimatum extension, Tangsiri killed |
| 28 | Mar 27 | 75 | 3.0 | 8-day attack pause (UKMTO confirmed), WTI -3.5%, CPAC division |

---

## Correct insertion markers

**CRITICAL — use these exact markers for each array. Never use a phrase from inside an entry's text as a marker, even if it seems unique. Always use the array boundary itself.**

### EVENTS_2026
```python
# Correct marker — the array's own closing
marker = "];\n\nconst tierDot"
# Insert BEFORE it:
content = content.replace(marker, "\n" + new_events + "\n" + marker, 1)
```

### DAILY_ASSESSMENTS
```python
# Correct marker — the array closes before const BILL
marker = "];\n\nconst BILL"
# Insert BEFORE it:
content = content.replace(marker, "\n" + new_assessment + "\n" + marker, 1)
```

### TRUMP_SAID
```python
# Correct marker — the array closes before const HORMUZ
marker = "];\n\n/* ─── Hormuz"
# Insert BEFORE it:
content = content.replace(marker, "\n" + new_trump + "\n" + marker, 1)
```

**Why this matters:** Text inside entry yNote/xNote fields (e.g. "April 6 is X days away") can accidentally match the intended insertion target. The array boundary markers (`const tierDot`, `const BILL`, `/* ─── Hormuz`) are unique and unambiguous. Always use those.

---

## Common failure modes

- **Events injected into DAILY_ASSESSMENTS**: Happens when the EVENTS insertion marker matches text inside a DAILY_ASSESSMENTS yNote instead of the EVENTS_2026 array closing. Use `];\n\nconst tierDot` as the EVENTS marker — it's unambiguous. Symptom: XY plot breaks, Chart.js gets `undefined` for x/y.
- **Day N+1 inserted before Day N**: Happens when new assessment entries are appended using a text marker that resolves to a position before an existing entry rather than after it. Always verify final order with `re.findall(r'\{ day: (\d+),', da_block)` before committing.
- **Entries merged onto one line**: Happens when a Day N entry's closing `},` has no newline before the next entry. Check with `grep -n "{ day:"` and look for two entries on the same line. Fix with explicit `\n  ` before each entry.
- **Stale SHA on commit**: Always pull fresh SHA in Step 1. If another commit happened between pull and push, the commit will 400. Pull again.
- **Mangled JS escaping**: Use Python string replacement, not sed. Single quotes inside JS strings that are already single-quoted need `\\'` escaping. Verify by checking the lines around each edit with `repr()`.
- **Wrong tier on current day's entries**: New entries get `tier: 'today'`. Previous day's `today` entries must be changed to `critical` first. Verify with `grep -n "tier: 'today'"` before committing.
- **Y score dispute**: Bryan will push back if Y moves mechanically. See scoring methodology — distinguish Parliament noise from SNSC/operational signals.
- **Deploy 400**: Usually wrong payload shape. Ensure `gitSource.org` and `gitSource.repo` are separate fields, not `repoId`.
