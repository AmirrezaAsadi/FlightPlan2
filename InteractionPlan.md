# Care Journey Plan: Product & Design Guidelines

> **Status:** Draft v0.6 (adds widget build spec §19; v0.5 was validated against the Hackathon Brief, the One-Pager and the clinician kickoff meeting; see §16)
> **Data scope:** one hospital stay, **from admission to discharge**. We do not go through years of patient history. Prior FlightPlans may be linked for staged or repeat patients (§5.1).
> **Element reference:** states of care, locations, milestones and the expected-course pathway follow the FlightPlan Hackathon Brief (Cincinnati Children's).
> **Sources:** FlightPlan Hackathon Brief (5 pp.), FlightPlan Hackathon One-Pager (2026), clinician kickoff meeting (AI-generated notes + auto-transcript).
> Items marked **[DECISION]** need a call from the team.

## 0. Purpose, Scope & What We Deliver

### 0.1 The one question
From the brief: **"What should a clinician see, touch, hide, capture, or hand off during bedside rounds?"**
We are rethinking one moment of care.

### 0.2 Phasing (so the whole team works toward the same target)

| Phase | Audience and setting | What it is | Status |
|---|---|---|---|
| **1. Hackathon (the deliverable)** | Rounding team at the bedside, family often present. Tablet or small screen, 1–2 minutes per patient. | A **bedside rounds view** of FlightPlan, with a **family-present mode** and a way to **capture actions** | **In scope now** |
| **2. Family-facing bedside** | Patient and family. Phone, tablet, in-room monitor (replacing handwritten whiteboards). | Plain-language journey, today's goals, what must happen before discharge, projected discharge with visible changes | Vision; design for it, do not build it first |
| **3. Beyond cardiac** | Neonatology, neurosurgery, adult care; minutes-to-days time scales | One configurable platform; each specialty defines its own targets and milestones | Vision |

Sections of this document marked **[Phase 1]** are the hackathon core. Everything else is the longer-term direction, kept so Phase 1 does not paint us into a corner.

### 0.3 Hard constraints (from the brief)
- The **data behind FlightPlan and how it is collected do not change.** The bedside view is a new way of showing the same information, most likely a subset, plus a way to capture what happens on rounds.
- Spend effort on **what to show and how**, not on the data underneath.

### 0.4 Deliverables checklist (from the brief)
- [ ] Interview findings (with the clinicians provided)
- [ ] Bedside information hierarchy: first screen / secondary / kept out
- [ ] Wireframe showing at least the five parts in §9.0
- [ ] Short design rationale tied to what clinicians said
- [ ] Recommendation for what to prototype first

### 0.5 Questions to ask clinicians (from the brief and One-Pager)
1. What do you need to know in the **first 30 seconds** at the bedside?
2. Which parts of the conference version are **essential, optional or distracting** during rounds?
3. What is **safe to show when a family is present**?
4. What should be **captured** during rounds: decisions, questions, tasks, contingencies, consult needs, family updates, follow-up?
5. What would make you **trust** this view during live care?

## 1. Vision

A **flight plan for a child's hospital stay**. A pilot, a crew and a passenger can all see where the flight is, what comes next, and what could change it. This product gives families the same view of their child's stay, from admission to going home.

- **Parents and guardians come first.** They carry the stay alongside the care team.
- **Built child-first, used by adults later.** We design for children and their parents first. The same structure will later serve adult patients.
- **Providers come and go.** Shifts change, units change and teams change during a single stay. Each handoff is a point where information is usually lost. We design to prevent that loss.
- **Useful data, not more data.** The data already exists in the record. The problem is getting useful data to the right place at the right time, in a form people can talk about. We add no search-and-assemble work for clinicians.
- **See the whole course, not just the task list.** FlightPlan is a 30,000-foot view of cause and effect over time. It does not replace task tools such as the medication schedule.
- **Sequencing note [DECISION]:** the brief's bedside view is built first for the rounding team, with the family in the room. The family-first vision above is the direction of travel (Phase 2, §0.2). Confirm this order with the team.

### The flight-plan metaphor

| Aviation concept | Care journey equivalent (one stay) |
|---|---|
| Origin | Admission |
| Destination | Discharge home |
| Altitude | Level of care / level of risk: the timeline row the child is on right now (see §2) |
| Estimated arrival | **Projected discharge date**, clinician-set, shown with when and why it changed (§2.3) |
| Route and waypoints | Planned steps: OR or cath lab, intensive care, step-down unit, home |
| Planned route | **Pathway:** the expected course for this kind of stay |
| Current position | Where the child is now, and the day after surgery (POD) |
| Milestones | E.g., breathing tube out, heart-support medicine stopped, chest tubes out |
| Turbulence | Setbacks: the level of care climbs back up |
| Pre-flight check | **CrossCheck:** flags vulnerable patients before major procedures |
| Course correction | **Course Correction:** patient-specific thresholds for escalating care quickly |
| Crew | The care team and family, with roles |
| ATC handoff | Provider-to-provider transfer of responsibility |
| Direct Flight | A stay that goes exactly as expected: no unplanned events, all-green ratings. Grouped together at the weekly conference. |
| Post-flight debrief | Visit or conference summary in plain language |

**Why the flight tracker works for families (from the kickoff):** a passenger sees takeoff, landing, key conditions and re-routes without anyone typing them in, and without seeing everything the pilot sees. We aim for the same: automated, clear milestones and visible changes, with the detailed cockpit view kept for clinicians. Too little information causes anxiety. Too much does too. The right amount is **unknown**, so test it with families (§15).

Use the metaphor as an organizing idea for the product. In the UI it should stay light. Do not use pilot jargon with families.

---

## 2. States of Care (Admission → Discharge)

These are the core elements every view is built from. They come from the FlightPlan timeline. Each view shows the same states in its own style (§3).

### 2.1 Levels of care (highest to lowest)

The brief calls these rows **levels of risk**: the line's height shows how sick the patient is. Family wording is in the draft column below.

| State | Clinical meaning | Family label (draft) | Visual guidance |
|---|---|---|---|
| **Procedure** | In the OR or cath lab, or on ECMO (machine doing the work of the heart and lungs) | "Having surgery / a procedure" or "On a heart-lung machine" | Top level; distinct icon per procedure type |
| **Intubated** | On a breathing machine through a tube, intensive care | "On a breathing machine" | High level |
| **Extubated** | Breathing tube out, still in intensive care | "Breathing on their own, still in intensive care" | Middle level |
| **ACCU (step-down)** | Acute care cardiology unit, one level below intensive care | "Moved to the step-down unit" | Low level |
| **Discharged** | Home | "Going home" | The destination |

The ideal stay is a **stepwise drop** from admission to discharge. A climb back up is a setback. In family views, show this as a path down toward home rather than a chart of how sick the child is. **[DECISION]** final family wording, tested with parents.

### 2.2 Locations

| Location | FlightPlan color | Required non-color cue |
|---|---|---|
| Operating room (OR) | Purple | Label + icon |
| Catheterization lab | Pink | Label + icon |
| Cardiac intensive care (CICU) | Orange | Label + icon |
| Step-down unit (ACCU) | Blue | Label + icon |
| ECMO period | Shading | Pattern + label |

Location must never be shown by color alone.

### 2.3 Other elements
- **Milestones:** inotropes (heart-support medicine) off, chest tubes out, extubation, first feed, etc.
- **Pathway:** expected course shown alongside the actual course, so "ahead / on track / behind" is visible
- **Day counters:** calendar day plus POD (post-operative day)
- **Compressed stretches:** long uneventful periods are collapsed so "today" stays in view
- **Callouts:** findings (echo, cath) attached to a point in time. Clinical shorthand is shown to clinicians only. Families see a reviewed plain-language version (§5.3).
- **CrossCheck and Course Correction flags:** clinician views only
- **Projected discharge:** the team's current estimate of the discharge date, plus the discharge criteria ("what needs to happen before going home"). **Every change is logged with when and why.** The estimate is allowed to be wrong and to move, as long as the change and reason are visible. It is **set by the clinical team, never generated by AI** (§5.4).
- **Ratings and conference markers:** team performance scores (1–4) and outcome dots are quality-review tools, entered by each team for its own phase. Clinician/conference only; whether they belong at the bedside is an open question (§15).
- **Decisions:** formal decisions made at structured conferences (e.g., close the chest, return to the OR) sit on the timeline next to the everyday events. Today these decisions are not captured together anywhere else in the record.
- **Time scale:** the default is days, but the same structure can run in hours or minutes for time-critical protocols (see §12).

---

## 3. Stakeholders & Visual Styles

Each stakeholder gets a **distinct visualization style** built from one shared data model.

| Stakeholder | Needs | Visual style | Primary device |
|---|---|---|---|
| **Parent / guardian** | What's happening, what to do next, who to call, how worried to be | Warm, illustrated journey map; large type; progress and "what's next" cards; friendly icons; generous whitespace | Phone, tablet, large display |
| **Young child (approx. 4–10)** | Know what will happen, feel safe, have some control | Story-style path with a character or companion, stickers or rewards, minimal text, read-aloud | Tablet |
| **Teen / future adult** | Privacy, autonomy, real information, no talking down | Cleaner, more adult layout; timeline view; own-your-data controls; transition checklist | Phone |
| **Bedside rounding team** (attending, fellow, resident, nurse, APP, consultant) **[Phase 1]** | The first-30-seconds view, what changed, today's priorities, and a fast way to capture decisions and tasks. Different roles need different depth. | Bedside snapshot, compressed stay, "what changed", action capture, family-present mode (§9.0) | Tablet, small screen |
| **Treating clinician** | Fast, dense, accurate, actionable | Compact timeline plus structured summary; clinical terms; flags and deltas | Workstation, tablet |
| **Receiving provider (handoff)** | What do I need to know *now* to take over safely? | Briefing-first layout: critical items at the top, then the story, then the detail | Workstation, tablet |
| **Care coordinator / nurse navigator** | Gaps, open loops, scheduling, family contact | Operational board: tasks, owners, due dates, blockers | Workstation |
| **Extended family / school (limited, parent-granted)** | Minimal, relevant instructions only | Single-purpose "care card" (e.g., allergy plan, medication schedule) | Phone, print |

**Rules for visual differentiation**
- Style changes presentation, not facts. The same event must never be contradictory across views.
- Each view must have a documented reading level, density and tone.
- Color carries meaning consistently across views. Never rely on color alone (accessibility).
- Every view uses the same states of care (§2), shown in its own style.

---

## 4. Design Principles

1. **Child first, parent first.** Design for a worried parent at 2 a.m. before anything else.
2. **Calm clarity.** Show what matters now. Everything else is one tap away.
3. **"Now" before the whole stay.** Lead with where the child is today and what's next. The full stay timeline is secondary.
4. **Honest, never alarming.** State uncertainty plainly. Don't hide bad news and don't dramatize it.
5. **Same truth, different view.** Each stakeholder sees the same underlying plan in a form built for them.
6. **Nothing falls through the cracks.** Critical information must survive every handoff. The system enforces this (see §8).
7. **Tell us once.** Families should never have to repeat their story to a new provider during the stay.
8. **Age-fit.** Language and visuals fit the child's age, and the structure carries over to adult patients later.
9. **Clinician-verified.** AI helps translate. It does not become a source of clinical truth, and the system never suggests diagnoses or treatments.
10. **No extra work for clinicians.** Clinicians are already stretched by the EHR. Anything that needs manual digging or re-entry will not be adopted. Pull from the record automatically, and keep capture to a tap or two.
11. **One system, many views.** Different audiences and access levels on one underlying system, like a bank's website and app. Do not build separate products.
12. **Configurable, not customized.** Each specialty sets its own variables, targets and milestones through configuration. Heavy custom builds make upgrades painful (the hospital's heavily customized Epic is the cautionary example).
13. **Show the team's thinking.** Families currently have no visibility into what the clinical team is thinking or planning. Visible goals, priorities and projected discharge are core value, not extras.

---

## 5. Data Model: EHR → AI-Generated Translation

### 5.1 Scope
- **Time window:** admission → today → expected discharge, for one stay.
- **No multi-year history.** Earlier admissions and outpatient history are not loaded or shown.
- **Meeting input on history:** the unit of analysis is admission to discharge. But for staged procedures or repeat admissions, clinicians review the **prior FlightPlans** to see how the child responded and what complications occurred. Events that predisposed the child to this admission are included.
  - **[DECISION]** Proposed: allow a **link to the prior FlightPlan(s)** (clinician views only) and a one-line "relevant history" field, instead of loading old data into this stay.
- **Hackathon note:** the brief says the underlying data and its collection do not change. The layers and entities below describe the longer-term direction. Phase 1 only needs a new way to show existing data plus a capture layer (§5.3: Decision, Action item).

### 5.2 Layers

```
[ EHR / source systems ]        FHIR, HL7, notes, orders, results   (source of truth, read-only)
          ↓                     filtered to this admission
[ Canonical Journey Model ]     structured, normalized, versioned
          ↓
[ Translation Layer ]           AI-generated plain-language + reading-level variants
          ↓                     (with provenance, review status, confidence)
[ Audience Views ]              family / child / teen / clinician / handoff
          ↓
[ UI Generation ]               see §6
```

### 5.3 Core entities (draft)

- **Person:** child, guardians, clinicians, other roles; with relationships and permissions
- **Journey:** this admission, from admission to discharge
- **Care State Segment:** level of care (§2.1) + location (§2.2), with start and end time
- **Pathway:** the expected course, for comparison with the actual course
- **Waypoint:** a planned step (procedure, transfer, discharge)
- **Milestone:** a recovery marker reached or due (inotropes off, chest tubes out…)
- **Event:** something that happened (procedure, result, med change, setback, transfer)
- **Callout:** a finding attached to a point in time, in clinical shorthand
- **Instruction:** what the family should do, with trigger, timing and escalation path
- **Risk / Watch item:** the "weather", including CrossCheck and Course Correction flags
- **Handoff:** transfer of responsibility between providers, with required items and acknowledgments
- **Translation:** an AI-generated rendering of a source item for a given audience, language and reading level
- **Preference / Context:** what the family has told us (comfort items, fears, language, communication needs, cultural or religious considerations)
- **Projection:** the team's projected discharge date and discharge criteria, with a change log (when, why, who). Clinician-authored.
- **Decision:** something decided on rounds or at a conference (e.g., close the chest, return to the OR), with date, who decided and rationale. *New in Phase 1 (capture).*
- **Action item:** a task, follow-up or contingency from rounds, with an **owner** and due time, linked to the timeline event it refers to. *New in Phase 1 (capture).*
- **Conference:** a structured review (weekly FlightPlan conference, care conference), with attendees and the decisions it produced

### 5.4 Rules for AI translation

- **Source is never overwritten.** Translations are derived artifacts.
- Every translation stores: source reference(s), model and version, audience, language, reading level, generated time, **review status**, reviewer.
- **Review tiers:**
  - *Clinician review required before family sees it:* new diagnoses, callouts and results with significant implications, setbacks, medication changes, procedure risks.
  - *Auto-publish with disclosure:* care-state labels from the vetted glossary, schedule and logistics, restatements of already-reviewed content.
- Flag low-confidence or conflicting source data to a human. Never smooth it over.
- Keep a **vetted glossary** of approved plain-language terms, covering every state, location and milestone in §2. Prefer glossary terms over free generation.
- Translations expire or re-generate when the source changes.
- Translate and summarize only. **Never interpret, predict or recommend.**
- The **projected discharge date** is entered and changed by the clinical team. AI may format and explain it, but never produces or adjusts the estimate.

---

## 6. UI Generation & the "Disposable UI" Question

**Question:** Should the UI be generated from data on demand, and treated as disposable?

**Recommended position [DECISION]: a hybrid.**

| Layer | Approach |
|---|---|
| App shell, navigation, safety-critical screens (meds, allergies, emergency instructions, handoff acknowledgment) | **Stable, designed, tested, deterministic.** Never generated on the fly. |
| Journey map, summaries, visit prep, daily views | **Template-driven and data-bound** from a fixed component library |
| Personalized or one-off views (e.g., "explain this result to a 7-year-old", "prep me for tomorrow's conference") | **Disposable and generated** from a constrained schema, composed only of approved components |

**Guardrails for generated UI**
- The model picks and arranges **approved components**. It does not write arbitrary UI code.
- Generated UI can change layout and emphasis. It cannot invent clinical content (see §5.4).
- Every generated view shows its source and review status.
- Accessibility, reading-level and tone checks run before display.
- Log what was shown to whom and when.

---

## 7. Things We Don't Want in the UI

**Language and content**
- Medical jargon, abbreviations, or ICD/CPT codes shown to families without a plain-language explanation
- Clinical shorthand callouts (e.g., "sm LV → RA shunt (PG=39)") in family views
- Raw lab values or imaging reports with no context or "what this means"
- Blame or guilt phrasing ("you failed to…", "non-compliant")
- False reassurance ("everything's fine!") or catastrophizing
- AI-generated text that is unmarked, unreviewed or unattributed
- Any suggested diagnosis, treatment or prediction
- Specific organism names (e.g., a gut bacterium behind a chest-wound infection). Say "an infection of the breastbone" and let the clinician explain more. A search engine will otherwise do it badly and families look for someone to blame.
- Procedure durations that invite comparison between families (e.g., days on ECMO). Parents talk to each other and walk past other rooms.
- Persistent reminders of traumatic events (e.g., an ECMO run) on a screen the family stares at all day

**Visual and interaction**
- Identifiers (record number, date of birth, caregiver phone) as the first thing on screen
- Location or status shown **by color alone**
- One line carrying two meanings (location and level of care) without labels
- Callout boxes that overlap each other or hide the data
- Legends or panels that cover "today" at the right-hand end of the timeline
- Large legends and stacks of display toggles. Label things directly instead.
- Team performance ratings or outcome dots in family views
- Alarm-red walls of warnings. Reserve urgent styling for truly urgent items
- Dense tables or spreadsheets in family views
- Infantilizing visuals in teen or adult views
- Dark patterns, upsells or ads of any kind
- Unexplained empty states, spinners or dead ends
- Anything that makes a parent hunt for the next step
- Information hidden in tooltips or hover states (touch-first)
- A projected discharge date that moves with no visible reason, or that is shown as a promise
- Anything on a room display that visitors or people walking past the door can read (hallway visibility)
- Extra data entry for clinicians, or forcing them to search the EHR to build the view

**Data and safety**
- Surprise results: a family seeing a serious result with no support or context, unless release rules allow it (§10)
- Showing a teen's confidential information to a parent, or the reverse, against policy
- Auto-publishing AI-generated clinical content without review
- Unrecoverable edits. Every change is versioned and auditable.

---

## 8. Handoff: Rules for Provider-to-Provider Transfer

Handoffs are where information is lost, and providers must "remember key things." We treat this as a **system rule**, not a suggestion. Within one stay, handoffs include shift changes, unit transfers (e.g., CICU → step-down) and discharge to the outpatient team. The kickoff added one more: the **weekly attending-to-attending handoff** at the end of a service week. The value there is the course of the whole admission, not just "right now."

> **Validation note:** the brief and One-Pager confirm that physicians and nurses already use FlightPlan at shift change. The rules R1–R8 below are **our proposals**, not requirements from the brief. Treat them as Phase 2 unless clinicians say a handoff step belongs in the bedside view.

### 8.1 Principles

- A handoff is a **first-class object** with its own UI, state and audit trail.
- The receiving provider sees a **briefing first**, before the full chart.
- Critical items must be **explicitly acknowledged.** The handoff can't be marked complete without that.

### 8.2 Required handoff content (the "never-forget" set)

Use a structured format (e.g., I-PASS or SBAR as a base):

1. **Who this child is:** age, weight (for dosing), language, guardians and decision-makers, communication needs
2. **Safety-critical:** allergies, code status, isolation, high-risk meds, devices, CrossCheck flag, Course Correction thresholds, safeguarding flags
3. **Current state and trajectory:** current level of care and location, POD, on track / ahead / behind the Pathway
4. **Open loops:** pending results, unfinished orders, promised callbacks, unanswered family questions
5. **What the family has been told:** and what they understood or asked
6. **What the family has told us:** preferences, fears, comfort items, routines, previously stated wishes
7. **Contingencies:** if X happens, do Y, and who to call
8. **What's changed:** deltas since the last handoff, including any setback

### 8.3 System rules (draft)

- **R1:** A handoff can't be closed until the receiving provider acknowledges all items in the *safety-critical* group.
- **R2:** Open loops older than a set threshold are surfaced at the top and can't be silently dropped. They must be completed, transferred (with an owner) or closed with a reason.
- **R3:** "What the family has been told" is mandatory. If empty, the sender must confirm "nothing communicated."
- **R4:** The receiving provider sees a **diff** against their last view of this child.
- **R5:** Family-stated preferences travel with the child and appear in every handoff briefing.
- **R6:** Handoff content is auto-drafted from the record and **confirmed by the sending clinician.** Unconfirmed drafts are labeled as such.
- **R7:** Handoffs cannot hide unresolved safety concerns. The system flags any blank required field.
- **R8:** The family can see (in plain language) that a handoff happened, who the new contact is, and what was passed on. They can correct anything wrong.

---

## 9. Surfaces

### 9.0 Bedside rounds view **[Phase 1: hackathon core]**

The rounding team has a minute or two per patient, probably on a tablet, with the family listening. A strong wireframe shows at least these five things (from the brief):

| # | Part | What it contains | Replaces / fixes in the conference version |
|---|---|---|---|
| 1 | **Bedside snapshot** | Current location, status (level of care), key diagnoses, active concerns, today's priorities. **Identifiers are not the first thing on screen.** | Identifiers lead the page; there is no "now" |
| 2 | **Compressed stay** | A short version of the timeline that tells the story without taking over the conversation. "Today" stays in view and nothing covers the right-hand end. | Long desktop page; legend covers the latest days |
| 3 | **What changed** | Overnight events, new results, procedures, therapies, changes in location or status, open questions | Nothing today pulls this out |
| 4 | **Capture actions** | Decisions, tasks, follow-ups and contingency plans, each with an **owner**, linked to the timeline event it concerns | Generic "Add a Note" / "+ Add"; no decision, owner or follow-up |
| 5 | **Family-present mode** | One clear switch that changes what is shown when the patient or family is in the room (§10.2 data classes) | One view for everyone |

**Information hierarchy to test (draft):**
- *First screen (first 30 seconds):* snapshot, what changed, today's priorities, open actions
- *Secondary (one tap):* the compressed stay, pathway vs. actual, milestones, care team, recent notes
- *Kept out of rounds by default:* team ratings and outcome dots, conference markers, full note lists, the nine-symbol legend and display toggles, callouts in clinical shorthand (clinician detail on request only)

**Design rules for this view:**
- Show location with label + icon, not color alone
- Separate "where the child is" from "how sick the child is" or label both clearly
- Callouts never overlap; link each to its event
- Role-aware depth: attendings, fellows, residents, nurses, APPs and consultants see different detail on the same data
- No clinical recommendations; workflow and communication only
- Trust: every item shows its source and when it was last updated

### 9.1 Tablet (bedside / clinic / waiting room)
- Touch-first, large targets, glanceable; usable one-handed and by a child
- Shared-device safe: quick lock, no PHI lingering on screen, role-aware
- Offline-tolerant for poor hospital connectivity
- Modes: parent mode, child mode (story/activity), clinician mode

### 9.2 Large-screen parent dashboard (room display / family lounge / ambient)
- Built for reading from across a room: big type, high contrast, few elements
- Shows: where the child is on the path home, today's plan, milestones done and to go, who's coming, who to ask, comfort and routine reminders
- **Privacy rules:** show only what the family has approved for a shared screen. Hide identifiers, results, diagnoses and sensitive notes by default.
- Calm ambient design that doesn't demand attention. Updates must feel gentle.
- **Where it fits today:** rooms already have large monitors, but teams still use **handwritten whiteboards** (care team names, goals, "get up, eat, walk"). This display could replace or sit beside them and add the bigger picture: where the child is in the stay, what must happen before discharge, and the projected discharge with any changes and reasons.
- Continuous education: show teaching goals along the stay so families are not taught everything in the last two days before discharge.
- Hallway test: nothing on the display may identify the child or reveal clinical detail to someone passing the door.
- **Build spec for the first widget:** see §19.

### 9.3 Handoff UI
- Briefing-first layout, with the safety-critical block pinned (see §8)
- Side-by-side: what the sender says vs. what the record says
- Clear acknowledgment controls and visible progress toward "handoff complete"
- Fast on workstation and tablet; usable at a bedside

### 9.4 Automated Conference Interaction
For care conferences and multidisciplinary meetings (including the weekly FlightPlan conference):

> **Context from the brief and kickoff:** the weekly FlightPlan conference (also called Performance Rounds) reviews recent patients with cardiology and intensive care physicians, surgeons, anesthesia and OR staff, nurse practitioners, fellows and nursing leaders. Its stated aim is "blameless but accountable" learning. The kickoff described a roughly two-hour session. The decisions made there are not captured together anywhere else, which is why §2.3 treats Decisions as a first-class item. The conference is not a daily bedside tool and families do not see it today.

- **Before:** auto-generated agenda and pre-read from the stay; family gets a plain-language prep sheet and can add questions or concerns
- **During:** optional capture of notes, decisions and action items, with explicit consent to any recording or transcription, and a visible indicator when active
- **After:** draft summary in family language, with decisions, next steps, owners and dates
  - Clinician review is required before the summary is published to the family.
  - Action items flow back into the journey as waypoints or instructions.
- Family can mark "I didn't understand this" on any item and trigger a follow-up
- Interpreter support built in, not bolted on

---

## 10. Language Filtering & Family Data Rules

### 10.1 Language rules
- **Reading level:** target roughly 6th grade for family content, and lower for child-facing content. Test with real readers.
- **Languages:** support family-preferred languages. Machine translation of clinical content needs a quality check or review tier. Interpreter access stays one tap away.
- **Plain-language first:** lead with what it means and what to do. Put technical detail behind "more detail."
- **Glossary:** approved terms with child-friendly and adult variants, including every state of care in §2.
- **Tone check:** run a tone and jargon filter on all family-facing text (see §11).

### 10.2 What the family needs (and when)

Define rules per **data class**, not per screen:

| Data class | Parent | Child | Teen | Notes |
|---|---|---|---|---|
| Current state of care and location | Yes | Age-appropriate | Yes | Plain labels from glossary |
| Milestones and progress toward home | Yes | Age-appropriate | Yes | |
| Schedule and logistics | Yes | Age-appropriate | Yes | |
| Medications and instructions | Yes | Simplified | Yes | |
| Projected discharge and discharge criteria | Yes, with changes and reasons shown | Age-appropriate | Yes | Clinician-set. Framed as an estimate, not a promise. |
| Organism names, detailed procedure durations (e.g., ECMO days) | Clinician-led conversation only; not on shared displays | No | Per policy | See §7: causes fear, blame and comparison between families |
| Routine results | Yes, with context | No / simplified | Per policy | |
| Callouts (echo, cath findings) | Reviewed plain-language only | No | Reviewed plain-language | |
| Serious or sensitive results, setbacks | Release rules: clinician-controlled timing and support | No | Per policy | Avoid surprise delivery |
| CrossCheck / Course Correction flags | No | No | No | Clinician only |
| Team ratings / conference markers | No | No | No | Conference only |
| Mental health, reproductive and substance-use info | Per law and policy | | Teen-controlled in many jurisdictions | **Confidentiality rules vary by jurisdiction. Needs legal review.** |
| Safeguarding or social concerns | Clinician/policy gated | | | Never auto-display |
| Clinician-to-clinician notes | Not by default | | | Consider open-notes requirements |

Each rule must record: **who** may see it, **when**, **in what form** (raw / translated / summarized) and **who can override.**

**Cross-cutting requirements**
- Follow open-notes and information-blocking rules. Delays must have a documented, permitted reason.
- Guardian and proxy access with clear roles (custody, shared care, foster).
- Rules re-evaluate if consent status or custody changes during the stay.

---

## 11. Voice & Tone

> *The original note was cut off at "Write language in a tone that…". Below is a proposed completion. Please confirm or edit.* **[DECISION]**

Write in a tone that is **warm, calm, honest and plain**, like a trusted nurse who has time to explain.

- **Warm:** speak to a person, not a patient record. "Here's what happens next" beats "The patient will undergo…"
- **Calm:** short sentences. No exclamation marks on medical content. No panic words unless truly urgent.
- **Honest:** say what we know, what we don't, and when we'll know more.
- **Plain:** everyday words. Define any medical term the first time it appears.
- **Respectful:** never blame, never talk down. Treat parents as partners and teens as emerging adults.
- **Actionable:** every message ends with what to do, or says clearly that nothing is needed.
- **Age-fit:** a different voice for a 6-year-old than for a 16-year-old, but the same truth.

**Example**
- Avoid: *"POD 3, extubated, inotropes weaned off overnight, CT out today."*
- Prefer: *"It's day 3 after Mia's surgery. Her breathing tube is out, and overnight she stopped needing the extra heart medicine. Today the team plans to take out her chest tube."*

---

## 12. Later Use by Adult Patients

- The states of care, journey model and handoff rules are age-neutral, so they carry over to adult patients.
- What changes for adults: the visual style (closer to the teen view), the patient as primary reader, and no guardian layer by default.
- Scope stays the same: one stay, admission to discharge.
- **Adoption warning from the kickoff:** adult services may say "we don't need that" because they have not asked what patients and families think. Plan to show the value (the flight-tracker effect: once offered, people expect it), not argue it.

### 12.1 Other specialties and time scales
- Today's implementation is **cardiac**. The aim is neonatology, neurosurgery and adult care.
- Every use case has **beginnings, ends and steps**. Cardiology, neonatology and neurosurgery differ in what they track, but each fits the same shape. Each service defines its own variables, targets and milestones, and a patient with several consulting services can have each lens on one timeline.
- Build the **general platform first**, then configure it per specialty. Avoid specialty-specific code (§4, principle 12).
- Time scale is configurable: **days to weeks** for complex admissions, **hours or minutes** for time-critical protocols. Example from the kickoff: a **sepsis** timeline plotting antibiotic and fluid-resuscitation times against targets, with patient data layered on top to see where targets were met or missed. This is review of a protocol, not a recommendation engine.
- Even short or simple stays benefit from a visible expectation. A stay shorter than expected is as worth explaining as a longer one.

---

## 13. Privacy, Safety & Compliance

- HIPAA and applicable state, regional and international law. Minors' consent laws vary and need legal review.
- Role-based access with full audit logging, including AI-generated views
- Data minimization on shared and ambient displays
- Clear disclosure wherever AI helped produce content
- Clinical safety review process for the translation layer, rules engine and generated UI
- Not a clinical decision support tool: no suggested diagnoses or treatments
  - **Wording conflict [DECISION]:** the brief says FlightPlan is not clinical decision support. In the kickoff, speakers called it a "decision support tool" in the sense of helping teams see cause and effect and record decisions. Use "shared awareness and communication tool" in all materials unless regulatory counsel says otherwise.
- Accessibility: WCAG AA at minimum, plus read-aloud, dyslexia-friendly options and high contrast
- Use only made-up or de-identified data in demos and design work

---

## 14. Success Measures

- Parents can correctly state where their child is, what happens next and who to call (comprehension checks)
- Fewer repeated-history requests from families during the stay
- Handoff completeness: zero unacknowledged safety-critical items, and fewer open loops dropped
- Time-to-briefing for receiving providers
- Reading-level and tone compliance for family content
- Family-reported confidence and stress
- Clinician trust: low rate of edits needed on AI translations over time

**Phase 1 (bedside rounds) measures**
- Clinicians can state the patient's status, what changed and today's priorities within 30 seconds of opening the view
- Every decision and task captured on rounds has an owner and a linked timeline event
- Added clinician time per patient: target zero or negative (no new searching or re-entry)
- Families can name the projected discharge, why it moved, and what must happen before going home
- No identifiers, organism names or other family-sensitive content on the first screen or in family-present mode

---

## 15. Open Questions

1. Disposable UI scope: is the hybrid approach in §6 acceptable? **[DECISION]**
2. Which handoff framework is the base (I-PASS, SBAR, other)?
3. Final family wording for each state of care (§2.1), tested with parents
4. Is a one-line "relevant history" allowed, given the admission-only scope? (§5.1)
5. Which results and setbacks are held for clinician-led delivery, and who owns that policy?
6. How are custody and proxy changes verified?
7. Which jurisdictions launch first (drives confidentiality rules)?
8. What is the child-facing character and brand, and who tests it with kids?
9. Final tone-of-voice statement (§11) **[DECISION]**

**Added from the kickoff meeting (none were answered there):**
10. What exactly should patients and families see, and what stays clinician-facing? (Too little causes anxiety; too much causes anxiety or confusion.)
11. How do we communicate a projected discharge and its changes without it feeling like a promise?
12. How do we stay useful across specialties without heavy customization that makes upgrades hard?
13. What level of detail fits different conditions, needs and lengths of stay?
14. Do team ratings and conference markers belong at the bedside at all, especially with family present? (open in the brief too)
15. Which of the five bedside parts (§9.0) do clinicians rate essential, and what do they say is missing?
16. Phase order: bedside rounds team first, family-facing second (§0.2). Confirm.
17. Decision-support wording (§13). Confirm "shared awareness and communication tool."

## 16. Source Validation (v0.5)

Cross-check of the v0.4 draft against the Hackathon Brief, the One-Pager and the kickoff meeting.

### 16.1 Confirmed correct
- Five levels/rows (Procedure, Intubated, Extubated, ACCU, Discharged), ECMO under Procedure, and the stepwise-drop ideal
- Location colors: OR purple, cath lab pink, CICU orange, step-down blue, ECMO shading
- Pathway (dashed), Course Correction (dotted), milestones (inotropes off, chest tubes out), POD counter, compressed stretches, callouts in clinical shorthand
- CrossCheck (flags vulnerable patients before major procedures) and Course Correction (patient-specific escalation thresholds)
- Problems with the conference version: identifiers first, no "now", color-only meaning, collisions, shorthand, ratings aimed at review
- Not a decision-support tool, made-up data only, handoffs and Direct Flights exist today

### 16.2 Gaps found and where they are fixed
| Gap in v0.4 | Source | Fixed in |
|---|---|---|
| No statement of the actual hackathon question or deliverables | Brief §4, One-Pager | §0 |
| No bedside rounds view (snapshot, compressed stay, what changed, capture, family-present mode) | Brief §4 | §9.0 |
| No concept of decisions, tasks and owners on rounds | Brief §3–4, kickoff | §2.3, §5.3 |
| Rounding-team roles (attending, fellow, resident, nurse, APP, consultant) missing | One-Pager | §3 |
| Projected discharge with visible changes and reasons missing | Kickoff | §1, §2.3, §5.3, §10.2 |
| Hackathon says data does not change; draft proposes new layers | Brief §4 | §5.1 note, §0.3 |
| "Direct Flight" defined loosely | Brief §2 | §1 |
| Ratings and conference markers not described | Brief §2 | §2.3 |
| ACCU not expanded; "level of care" vs. brief's "level of risk" | Brief §2 | §2.1 |
| Draft assumed no prior-admission info at all | Kickoff | §5.1 |
| Specialty configuration, time scales, anti-customization lesson | Kickoff | §4, §12.1 |
| Organism names, ECMO comparisons, hallway visibility, whiteboards | Kickoff | §7, §9.2, §10.2 |
| Continuous education vs. discharge-day teaching | Kickoff | §9.2 |
| Weekly attending-to-attending handoff | Kickoff | §8 |
| "Decision support" wording conflict | Brief vs. kickoff | §13 |

### 16.3 Discrepancies to be aware of
- **Conference attendance:** the kickoff described "four cardiologists and four surgeons"; the brief lists a wider group (cardiology and intensive care physicians, surgeons, anesthesia, OR staff, nurse practitioners, fellows, nursing leaders). Use the brief. The kickoff figure is a speaker's description.
- **"30% chance of error"** was a speaker's estimate in the kickoff, not a validated statistic. **Do not cite it** in any deliverable without a source.
- **"Decision support"** was used loosely in the kickoff and conflicts with the brief (§13).
- **Automation vs. verification:** speakers described the flight tracker as fully automated with nobody typing. The brief says key events are compiled from the EHR and **checked with clinicians**, and ratings are entered by each team. Treat "no extra clinician work" as the goal, and keep clinician verification for anything families see.
- **The transcript is auto-generated** and garbled in places, including speaker names. Do not attribute quotes to named people. The AI-generated notes matched the transcript on the points we used; they omitted the clinician-distraction question and the "decision support" framing.
- A clinician's family medical story was shared as motivation. We use only its lesson (a visible expectation of stay length would have helped) and keep personal details out of this repository.

### 16.4 Data sufficiency check (v0.6)

Is what we have enough to start the work?

| Work item | Enough to start? | What was missing → added |
|---|---|---|
| Wireframe the bedside rounds view | **Yes** | Brief's five parts and questions are in §0 and §9.0. Still needs clinician interviews to set the hierarchy. |
| Information hierarchy (first screen / secondary / out) | **Partly** | Draft hierarchy in §9.0 is our hypothesis. Needs clinician validation. |
| Large-screen widget | **No, until now** | The team note only listed three items. Added layout, data contract, example data, AI rules, states, build plan and open items (§19). |
| Family wording for states and events | **Partly** | Draft labels (§2.1) and starter templates (§19.4). Need parent and clinician review. |
| Example data for building | **No** | Added a made-up JSON example (§19.3). No real data exists or is allowed. |
| Tech stack, screen size, who enters the projected date | **No** | Not in any source. Listed as decisions (§19.7). |

## 17. Kickoff Insights → Requirements

| Insight from the kickoff | Requirement |
|---|---|
| "Having data isn't the problem; it's useful data at the right place and time." | Curate and compress. Bedside view is a subset (§9.0). |
| EHR splits care by system (heart, lungs, gut, brain) in tabs | One chronological story (§2, §9.0 part 2) |
| Handoffs run on memory | Briefing-first handoff view (§8); stay story in §9.0 |
| Weekly conference decisions are captured nowhere else | Decision capture, linked to the timeline (§2.3, §9.0 part 4) |
| Cause-and-effect and near-miss learning across patients | Keep patterns reviewable, clinician/conference side only (§2.3, §9.4) |
| Families don't know when they'll go home | Projected discharge with change log (§2.3, §10.2) |
| Education is crammed into the last days | Continuous education along the stay (§9.2) |
| Too little information causes anxiety; too much does too | Test the right amount with families; start conservative (§15 Q10) |
| Families compare rooms and Google terms | Hide organisms and comparable durations (§7) |
| One system, filtered views (like MyChart or a bank app) | Role- and audience-based views on a single data model (§3, §4) |
| Avoid Epic-style over-customization | Configurable general platform (§4 p.12, §12.1) |
| Clinicians cannot take on extra EHR work | Principle 10; Phase 1 measures (§14) |
| Whiteboards are handwritten; room monitors exist | Room display (§9.2) |
| Works for hours/minutes too (sepsis) | Configurable time scale (§12.1) |

## 18. Next Steps (proposed; the kickoff set no owners or deadlines)

Owners are **TBD**. Assign them in the next team sync.

1. Confirm the phase order and decision-support wording (§0.2, §13)
2. Interview the clinicians provided, using the questions in §0.5. Record findings against §9.0.
3. Draft the bedside information hierarchy (first screen / secondary / kept out)
4. Wireframe the five parts of §9.0, including family-present mode
5. Write the short design rationale tied to what clinicians said
6. Recommend what to prototype first
7. Build the large-screen widget from §19 using made-up data, after the open items in §19.7 are answered
8. Park for Phase 2: handoff rules R1–R8, translation layer, generated UI, family and child views

## 19. Large-Screen Widget: System Description and Build Spec

**Source:** `Widget-UI-Element.md` (team note): *"Describe the widget overall system, then we start building it. We need a large screen widget: patient days here, expected date to leave, recent updates in words and icons (AI can generate)."*
This section is the description that note asks for. It is a **draft for the team to confirm** before building.

### 19.1 What it is
A calm, read-from-across-the-room display for a patient room or family lounge (§9.2). It answers three family questions at a glance: **How long have we been here? When might we go home? What's new?** It shows the same facts as every other view, in a family style (§3).

### 19.2 Screen layout (landscape, large display)

| Zone | Content | Notes |
|---|---|---|
| **A. Days here** | "Day 6" (days since admission, counted from the admission date). Optional second line for days after surgery, e.g. "Day 3 after surgery". | Very large type. Always visible. |
| **B. Expected to go home** | Projected discharge date, plus the last change: "Moved from Thursday to Saturday. Reason: needs a little more time on breathing support." | Framed as an estimate, never a promise (§2.3, §7). Hidden until a clinician sets it. |
| **C. Where we are on the path home** | Simple path (current step marked, steps done and to go) using the glossary labels from §2.1 | Not a "how sick" chart. Label + icon, never color alone (§2.2). |
| **D. Recent updates** | 3–5 newest items, each = icon + one plain sentence + time ("This morning") | AI-assisted wording under the review rules in §19.4 |
| **E. Today** | Today's goals and who's coming (optional, Phase 1.5) | Replaces the handwritten whiteboard (§9.2) |
| **Footer** | Last updated time, "Questions? Ask your nurse", language | Quiet; no identifiers |

### 19.3 Data the widget needs (contract)

All fields come from existing FlightPlan data or from clinician entry. The widget reads; it does not change underlying data (§0.3).

| Field | Type | Source | Required | Notes |
|---|---|---|---|---|
| `admissionDate` | date | existing record | yes | Days here = today − admissionDate + 1. **[DECISION]** count admission day as Day 1? |
| `postOpDay` | integer or null | existing record | no | Only shown after a procedure |
| `currentState` | enum (§2.1) | existing record | yes | Mapped to the glossary label |
| `currentLocation` | enum (§2.2) | existing record | yes | Shown with label + icon |
| `projectedDischarge` | date or null | **clinician entry** | no | Not AI-generated (§5.4) |
| `projectionHistory[]` | `{from, to, changedAt, reasonCode, reasonText}` | clinician entry | with projection | Reason from an approved list plus optional free text |
| `milestones[]` | `{type, status: done/due/upcoming, date}` | existing record | no | From the §2.3 list |
| `updates[]` | `{id, type, occurredAt, sourceRef, familyText, icon, reviewStatus, reviewedBy}` | derived (§19.4) | yes | Only `published` items are shown |
| `goalsToday[]` | `{text, owner}` | clinician entry | no | Phase 1.5 |
| `displayConsent` | `{approvedFields[], approvedBy, approvedAt}` | family + clinician | yes | Nothing outside `approvedFields` is displayed (§9.2) |
| `language` | code | existing record | no | Default English |

**Never sent to the widget:** name, MRN, date of birth, caregiver phone, diagnoses, lab or imaging results, organism names, ECMO durations, ratings, CrossCheck/Course Correction flags, clinician-only notes (§7, §10.2).

**Example (made-up data):**
```json
{
  "admissionDate": "2026-03-02",
  "postOpDay": 3,
  "currentState": "ACCU",
  "currentLocation": "Step-down unit",
  "projectedDischarge": "2026-03-09",
  "projectionHistory": [
    {"from": "2026-03-07", "to": "2026-03-09", "changedAt": "2026-03-06T08:10",
     "reasonCode": "RECOVERY_PACE", "reasonText": "A little more time to build strength"}
  ],
  "updates": [
    {"id": "u1", "type": "LOCATION_CHANGE", "occurredAt": "2026-03-05T14:00",
     "familyText": "Moved to the step-down unit.", "icon": "bed-arrow-down",
     "reviewStatus": "published"}
  ]
}
```

### 19.4 "Recent updates in words and icons (AI can generate)"

AI may draft the sentence and pick an icon. It must stay inside the rules of §5.4:

1. **Event type → icon is a fixed map** from an approved icon set. The model selects from it and never creates new icons.
2. **Auto-publish tier (no clinician review):** location changes, state changes from the vetted glossary, schedule and logistics, milestone reached (from the §2.3 list).
3. **Clinician review required before display:** anything about a result, setback, medication change, procedure risk, a new diagnosis, or a change to the projected discharge reason.
4. Wording uses glossary terms first, 6th-grade reading level, tone from §11. No jargon, no blame, no prediction.
5. Each update stores source reference, model and version, generated time, review status and reviewer. If the source changes, the update regenerates or expires.
6. If the model has low confidence or the sources conflict, **nothing is shown** and a clinician is asked.
7. If AI is unavailable, fall back to template sentences from the glossary (below). The widget must work without AI.

**Starter map (draft, needs clinician and parent review):**

| Event type | Icon (suggested) | Family sentence (template) | Tier |
|---|---|---|---|
| `LOCATION_CHANGE` | bed / arrow | "Moved to the {unit}." | Auto |
| `STATE_STEP_DOWN` | arrow down | "{Name} is breathing on their own now." (from glossary) | Auto |
| `MILESTONE_DONE` | check / star | "{Milestone in plain words} is done." | Auto |
| `PROCEDURE_PLANNED` | calendar | "{Procedure in plain words} is planned for {day}." | Review |
| `PROCEDURE_DONE` | heart / hands | "{Procedure} finished. The team will update you." | Review |
| `PROJECTION_CHANGED` | calendar arrow | "Expected to go home {date}. Changed from {old}. {Reason}." | Review |
| `FAMILY_MEETING` | people | "Care team meeting today at {time}." | Auto |
| `EDUCATION_GOAL` | book | "Today we practice {skill} together." | Auto |
| Any setback, result or medication change | none | **Not shown on the widget.** Clinician talks to family first (§10.2). | Never auto |

### 19.5 States and behavior
- **Empty states:** no projection yet → "Your team will share an expected date soon." No updates → "Nothing new since {time}." Never a blank or a spinner.
- **Stale data:** if the last update is older than a set limit, show "Last updated {time}" and dim the display. Never show stale data as current.
- **Gentle updates:** new items fade in, with no sound, flashing or red alarms.
- **Privacy:** idle screen shows only the room's greeting. A clinician or family unlock wakes the full view. Hallway test (§9.2) must pass.
- **Accessibility:** WCAG AA, readable at 3 m, location by label + icon, optional read-aloud, text scales, non-English support.
- **Offline-tolerant:** keeps the last good state with the "last updated" label.

### 19.6 Build plan (proposed)
1. Confirm this spec and the §19.7 items
2. Build with **made-up JSON only** (example above), fixed templates first, AI wording second
3. Pieces: data adapter (reads the contract), glossary + icon map, render zones A–D, review-status gate, privacy/idle mode
4. Test: hallway test, reading-level check, stale and empty states, a reviewer rejects an AI sentence and it never appears
5. Show to clinicians and parents, then adjust

### 19.7 Open items before building
1. **"Patient days here"**: confirmed as *days since admission*? Or also days in the current unit? **[DECISION]**
2. Is the display shown to the family only, or also to the rounding team at the bedside? (Changes how much detail is allowed.)
3. Which technology and screen size do we build for? Nothing is chosen in the notes. **[DECISION]**
4. Who enters the projected discharge date and reason, and in what screen? (The brief says the data and its collection do not change, so this may need a mock capture screen in Phase 1.)
5. Who approves the icon set and the wording templates (clinicians and parents)?
6. Language support needed on day one?
7. Who sets and approves `displayConsent` for a room?
