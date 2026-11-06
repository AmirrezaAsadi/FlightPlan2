# Care Journey Plan: Product & Design Guidelines

> **Status:** Draft v0.4
> **Data scope:** one hospital stay, **from admission to discharge**. We do not go through years of patient history.
> **Element reference:** states of care, locations, milestones and the expected-course pathway follow the FlightPlan Hackathon Brief (Cincinnati Children's).
> Items marked **[DECISION]** need a call from the team.

## 1. Vision

A **flight plan for a child's hospital stay**. A pilot, a crew and a passenger can all see where the flight is, what comes next, and what could change it. This product gives families the same view of their child's stay, from admission to going home.

- **Parents and guardians come first.** They carry the stay alongside the care team.
- **Built child-first, used by adults later.** We design for children and their parents first. The same structure will later serve adult patients.
- **Providers come and go.** Shifts change, units change and teams change during a single stay. Each handoff is a point where information is usually lost. We design to prevent that loss.

### The flight-plan metaphor

| Aviation concept | Care journey equivalent (one stay) |
|---|---|
| Origin | Admission |
| Destination | Discharge home |
| Altitude | Level of care: how much support the child needs right now (see §2) |
| Route and waypoints | Planned steps: OR or cath lab, intensive care, step-down unit, home |
| Planned route | **Pathway:** the expected course for this kind of stay |
| Current position | Where the child is now, and the day after surgery (POD) |
| Milestones | E.g., breathing tube out, heart-support medicine stopped, chest tubes out |
| Turbulence | Setbacks: the level of care climbs back up |
| Pre-flight check | **CrossCheck:** flags vulnerable patients before major procedures |
| Course correction | **Course Correction:** patient-specific thresholds for escalating care quickly |
| Crew | The care team and family, with roles |
| ATC handoff | Provider-to-provider transfer of responsibility |
| Direct Flight | A stay that goes exactly as expected |
| Post-flight debrief | Visit or conference summary in plain language |

Use the metaphor as an organizing idea for the product. In the UI it should stay light. Do not use pilot jargon with families.

---

## 2. States of Care (Admission → Discharge)

These are the core elements every view is built from. They come from the FlightPlan timeline. Each view shows the same states in its own style (§3).

### 2.1 Levels of care (highest to lowest)

| State | Clinical meaning | Family label (draft) | Visual guidance |
|---|---|---|---|
| **Procedure** | In the OR or cath lab, or on ECMO (machine doing the work of the heart and lungs) | "Having surgery / a procedure" or "On a heart-lung machine" | Top level; distinct icon per procedure type |
| **Intubated** | On a breathing machine through a tube, intensive care | "On a breathing machine" | High level |
| **Extubated** | Breathing tube out, still in intensive care | "Breathing on their own, still in intensive care" | Middle level |
| **ACCU (step-down)** | One level below intensive care | "Moved to the step-down unit" | Low level |
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

---

## 3. Stakeholders & Visual Styles

Each stakeholder gets a **distinct visualization style** built from one shared data model.

| Stakeholder | Needs | Visual style | Primary device |
|---|---|---|---|
| **Parent / guardian** | What's happening, what to do next, who to call, how worried to be | Warm, illustrated journey map; large type; progress and "what's next" cards; friendly icons; generous whitespace | Phone, tablet, large display |
| **Young child (approx. 4–10)** | Know what will happen, feel safe, have some control | Story-style path with a character or companion, stickers or rewards, minimal text, read-aloud | Tablet |
| **Teen / future adult** | Privacy, autonomy, real information, no talking down | Cleaner, more adult layout; timeline view; own-your-data controls; transition checklist | Phone |
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

---

## 5. Data Model: EHR → AI-Generated Translation

### 5.1 Scope
- **Time window:** admission → today → expected discharge, for one stay.
- **No multi-year history.** Earlier admissions and outpatient history are not loaded or shown. **[DECISION]** whether a one-line "relevant history" field (e.g., prior surgery) is allowed.

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

**Data and safety**
- Surprise results: a family seeing a serious result with no support or context, unless release rules allow it (§10)
- Showing a teen's confidential information to a parent, or the reverse, against policy
- Auto-publishing AI-generated clinical content without review
- Unrecoverable edits. Every change is versioned and auditable.

---

## 8. Handoff: Rules for Provider-to-Provider Transfer

Handoffs are where information is lost, and providers must "remember key things." We treat this as a **system rule**, not a suggestion. Within one stay, handoffs include shift changes, unit transfers (e.g., CICU → step-down) and discharge to the outpatient team.

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

### 9.3 Handoff UI
- Briefing-first layout, with the safety-critical block pinned (see §8)
- Side-by-side: what the sender says vs. what the record says
- Clear acknowledgment controls and visible progress toward "handoff complete"
- Fast on workstation and tablet; usable at a bedside

### 9.4 Automated Conference Interaction
For care conferences and multidisciplinary meetings (including the weekly FlightPlan conference):

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

---

## 13. Privacy, Safety & Compliance

- HIPAA and applicable state, regional and international law. Minors' consent laws vary and need legal review.
- Role-based access with full audit logging, including AI-generated views
- Data minimization on shared and ambient displays
- Clear disclosure wherever AI helped produce content
- Clinical safety review process for the translation layer, rules engine and generated UI
- Not a clinical decision support tool: no suggested diagnoses or treatments
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
