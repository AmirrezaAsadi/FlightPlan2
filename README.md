# FlightPlan Journey

A guiding journey for one hospital stay, admission to home. This is **not an EHR or a patient portal**: it shares a small amount of information, in plain words, at the right moment.

- **Design docs:** [`InteractionPlan.md`](InteractionPlan.md), [`Widget-UI-Element.md`](Widget-UI-Element.md)
- **Demo app:** [`demo/`](demo/)
- **Synthetic dataset:** [`data/flightplan_cardiac_dataset/`](data/flightplan_cardiac_dataset/) (everything is made up)

## The demo

One app, two views of the same stay:

| View | Who | What it shows |
|---|---|---|
| **Family room screen** | Family, in the room | Day of the stay, expected day to go home (and why it moved), the path home, 3–4 recent updates in plain words, today's plan. **Skye**, a calm "flight attendant" guide, answers questions from what's on the screen only. |
| **Care team** | Rounding team, on a tablet | Bedside snapshot, what changed, the stay timeline vs. pathway, the discharge estimate with its inputs, a review queue for family updates, items captured on rounds, and questions the family saved. A **Family present** switch hides sensitive details. |

Three patients from the dataset: **Room 4 · Leo** (smooth stay), **Room 7 · Sam** (behind pathway, the date moved), **Room 12 · Ava** (teen, no date stated yet). First names are made up for the demo.

### Option 1: run from disk (no hosting, no install)

Double-click `demo/index.html`. It works offline with template wording and scripted answers.

To turn on AI, open ⚙ settings and paste your OpenAI key. The key stays in that browser's local storage and the browser calls OpenAI directly. Fine on your own laptop; **don't do this on a shared or public copy.**

### Option 2: Vercel (key stays on the server)

1. Import this repo in Vercel (no framework, no build command needed).
2. Set environment variables:
   - `OPENAI_API_KEY`: your key (server only, never sent to the browser)
   - `DEMO_PASSCODE`: optional but recommended, so strangers can't use your credits. Enter it once in the app's ⚙ settings.
   - `OPENAI_MODEL`: optional, defaults to `gpt-4o-mini`
3. Open the site. `/` redirects to `/demo/`. Leave the key field in settings empty; the app uses `/api/ai`.

### What the AI is (and isn't) allowed to do

- **Family updates:** turns one clinical item into one plain sentence and an icon from a fixed set. A clinician approves before the family sees it. A safety check blocks numbers, jargon and long text, for AI drafts and manual edits alike.
- **Never sent to AI or the room screen:** results to be explained in person, private/teen-confidential items, identifiers.
- **Skye:** answers only from the family-safe facts on the screen. No advice, no interpreting results, no predictions. Otherwise says "I don't know" and offers to save the question for the team. Emergency words get a fixed "press the call button" reply without calling AI.
- **Going-home date:** the system *suggests* a date from the expected pathway. The family only sees a date the team stated or a clinician confirmed; otherwise "Your team will share an expected date soon."

### Editing the demo data

The app reads `demo/data.js`, generated from the CSVs plus a small hand-written layer (`data/demo_overlay.json`: names, family wording, discharge reasons, template drafts):

```bash
python3 tools/build_demo_data.py
```

Dataset fixes applied by the build (listed in the overlay): Ava's (C06) intensive-care → step-down move was dated after rounds time; moved to the day before.
