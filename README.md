# FlightPlan Journey

A guiding journey for one hospital stay, admission to home. This is **not an EHR or a patient portal**: it shares a small amount of information, in plain words, at the right moment.

- **Design docs:** [`InteractionPlan.md`](InteractionPlan.md), [`Widget-UI-Element.md`](Widget-UI-Element.md)
- **Demo app:** [`demo/`](demo/)
- **Synthetic dataset:** [`data/flightplan_cardiac_dataset/`](data/flightplan_cardiac_dataset/) (everything is made up)

## The demo

One app, four views of the same data, in a calm, light "sci-fi" style:

| View | Who | What it shows |
|---|---|---|
| **Family room screen** | Family, in the room | **The journey map is the main view**: a glowing path from surgery to home with "you are here", plus the day of the stay. Around it are widgets for going home (estimate, why it moved, checklist), today's plan, your care team (nurse and doctor by name) and recent updates. On the right is **Skye**, a smiling hologram guide you can talk to. |
| **Care team** | Rounding team, on a tablet | Bedside snapshot, what changed, the stay timeline vs. pathway, the discharge estimate with its inputs, a review queue for family updates, items captured on rounds, and questions the family saved. A **Family present** switch hides sensitive details. |
| **Handoff** | Sending and receiving clinician (shift change) | The **Handoff Flight Plan** (Widget 4). FlightPlan *suggests* a highlight reel (setbacks, procedures, medicine changes, new results, what changed, open loops, questions the family saved with Skye). The sender removes or adds items from the timeline. Safety-critical items are always pinned, and missing ones (allergies, code status) are flagged to confirm out loud. The sender must say what the family was told. The receiver **replays** the reel and **acknowledges** each item. **Hard stop:** the handoff can't close until every item is checked. |
| **Conference** | Weekly FlightPlan conference (Performance Rounds), big screen | All 7 stays. An agenda with **Direct Flights grouped**, and the **Pathway Variance Plot** (actual vs. dashed pathway, ECMO shading, compressed quiet stretches, numbered markers that open callouts on tap so nothing overlaps). The **Outcome & Ratings Heatmap** (scores 1–4 and outcome dots, review only, never in family views). **Decisions & actions** are captured with an owner and a linked event. **After the meeting**, a family summary is drafted that needs clinician approval. |

Three patients from the dataset: **Room 4 · Leo** (smooth stay), **Room 7 · Sam** (behind pathway, the date moved), **Room 12 · Ava** (teen, no date stated yet). First names are made up for the demo.

### Talking to Skye

- **Tap her face or "Tap to talk"** and ask out loud. Voice input works in Chrome and Edge and needs internet; elsewhere, tap ⌨ and type.
- **Or tap a question** ("When can we go home?", "Who can I ask?", "I'm feeling worried", …). These work offline.
- She **answers out loud** with captions. With AI on she uses a calm OpenAI voice; otherwise the browser's voice. 🔈 mutes her.
- Free-form questions need AI. She answers only from what's on the family screen. Anything she doesn't know, she says so and offers **"Save this question for the team"**; saved questions appear in the care-team view.

### Option 1: run from disk (no hosting, no install)

Double-click `demo/index.html`. It works offline with template wording and scripted answers.

To turn on AI, open ⚙ settings and paste your OpenAI key. The key stays in that browser's local storage and the browser calls OpenAI directly. Fine on your own laptop; **don't do this on a shared or public copy.**

### Option 2: Vercel (key stays on the server)

1. Import this repo in Vercel (no framework, no build command needed).
2. Set environment variables:
   - `OPENAI_API_KEY`: your key (server only, never sent to the browser)
   - `DEMO_PASSCODE`: optional but recommended, so strangers can't use your credits. Enter it once in the app's ⚙ settings.
   - `OPENAI_MODEL`: optional, defaults to `gpt-4o-mini`
   - `OPENAI_TTS_MODEL` / `OPENAI_TTS_VOICE`: optional, Skye's voice (defaults `gpt-4o-mini-tts` / `shimmer`)
3. Open the site. `/` redirects to `/demo/`. Leave the key field in settings empty; the app uses `/api/ai` and `/api/tts`.

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
