# Care Journey Plan: Product & Design Guidelines

> **Status:** Draft v0.2. Items marked **[DECISION]** need a call from the team.

## 1. Vision

A **flight plan for a child's care**. A pilot, a crew and a passenger can all see where the flight is, what comes next, and what could change it. This product gives families the same view of a child's health journey.

- **Parents and guardians come first.** They carry the journey day to day.
- **The child is the long-term owner.** The same record grows with them. At the right age, the adult patient inherits it.
- **Providers come and go.** Each handoff is a point where information is usually lost. We design to prevent that loss.

### The flight-plan metaphor

| Aviation concept | Care journey equivalent |
|---|---|
| Origin / destination | Where care started and the goal (e.g., "home and thriving", "stable on new treatment") |
| Route and waypoints | Planned milestones: appointments, procedures, tests, therapy phases |
| Current position | Where the child is now in the plan |
| ETA | Expected timing for the next milestone and for the goal |
| Weather / turbulence | Known risks, symptoms to watch, things that could change the plan |
| Alternates / diversions | What happens if the plan changes (e.g., readmission, med change) |
| Crew | The care team and family, with roles |
| ATC handoff | Provider-to-provider transfer of responsibility |
| Pre-flight briefing | Pre-visit prep for family and clinician |
| Post-flight debrief | Visit summary in plain language |

Use the metaphor as an organizing idea for the product. In the UI it should stay light. Do not use pilot jargon with families.

---

## 2. Design Principles

1. **Child first, parent first.** Design for a worried parent at 2 a.m. before anything else.
2. **Calm clarity.** Show what matters now. Everything else is one tap away.
3. **Honest, never alarming.** State uncertainty plainly. Don't hide bad news and don't dramatize it.
4. **Same truth, different view.** Each stakeholder sees the same underlying plan in a form built for them.
5. **Nothing falls through the cracks.** Critical information must survive every handoff. The system enforces this (see §7).
6. **Tell us once.** Families should never have to repeat their story to a new provider.
7. **Grows with the child.** The language, visuals and permissions change as the child ages.
8. **Clinician-verified.** AI helps translate. It does not become a source of clinical truth.

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

---

## 4. Things We Don't Want in the UI

**Language and content**
- Medical jargon, abbreviations, or ICD/CPT codes shown to families without a plain-language explanation
- Raw lab values or imaging reports with no context or "what this means"
- Blame or guilt phrasing ("you failed to…", "non-compliant")
- False reassurance ("everything's fine!") or catastrophizing
- AI-generated text that is unmarked, unreviewed or unattributed

**Visual and interaction**
- Alarm-red walls of warnings. Reserve urgent styling for truly urgent items
- Dense tables or spreadsheets in family views
- Infantilizing visuals in teen or adult views
- Dark patterns, upsells or ads of any kind
- Unexplained empty states, spinners or dead ends
- Anything that makes a parent hunt for the next step
- Information hidden in tooltips or hover states (touch-first)

**Data and safety**
- Surprise results: a family seeing a serious result with no support or context, unless release rules allow it (§9)
- Showing a teen's confidential information to a parent, or the reverse, against policy
- Auto-publishing AI-generated clinical content without review
- Unrecoverable edits. Every change is versioned and auditable.

---

## 5. Data Model: EHR → AI-Generated Translation

### 5.1 Layers

```
[ EHR / source systems ]        FHIR, HL7, notes, orders, results   (source of truth, read-only)
          ↓
[ Canonical Journey Model ]     structured, normalized, versioned
          ↓
[ Translation Layer ]           AI-generated plain-language + reading-level variants
          ↓                     (with provenance, review status, confidence)
[ Audience Views ]              family / child / teen / clinician / handoff
          ↓
[ UI Generation ]               see §6
```

### 5.2 Core entities (draft)

- **Person:** child, guardians, clinicians, other roles; with relationships and permissions
- **Journey:** the overall plan for a condition or episode of care
- **Waypoint:** a planned milestone (appointment, procedure, test, phase)
- **Event:** something that happened (visit, result, med change, symptom report)
- **Instruction:** what the family should do, with trigger, timing and escalation path
- **Risk / Watch item:** the "weather": what to watch for and when to call
- **Handoff:** transfer of responsibility between providers, with required items and acknowledgments
- **Translation:** an AI-generated rendering of a source item for a given audience, language and reading level
- **Preference / Context:** what the family has told us (comfort items, fears, language, communication needs, cultural or religious considerations)

### 5.3 Rules for AI translation

- **Source is never overwritten.** Translations are derived artifacts.
- Every translation stores: source reference(s), model and version, audience, language, reading level, generated time, **review status**, reviewer.
- **Review tiers:**
  - *Clinician review required before family sees it:* new diagnoses, prognosis, medication changes, procedure risks, results with significant implications.
  - *Auto-publish with disclosure:* appointment logistics, general explanations from a vetted glossary, restatements of already-reviewed content.
- Flag low-confidence or conflicting source data to a human. Never smooth it over.
- Keep a **vetted glossary** of approved plain-language terms. Prefer glossary terms over free generation.
- Translations expire or re-generate when the source changes.

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
- Generated UI can change layout and emphasis. It cannot invent clinical content (see §5.3).
- Every generated view shows its source and review status.
- Accessibility, reading-level and tone checks run before display.
- Log what was shown to whom and when.

---

## 7. Handoff: Rules for Provider-to-Provider Transfer

Handoffs are where information is lost, and providers must "remember key things." We treat this as a **system rule**, not a suggestion.

### 7.1 Principles

- A handoff is a **first-class object** with its own UI, state and audit trail.
- The receiving provider sees a **briefing first**, before the full chart.
- Critical items must be **explicitly acknowledged.** The handoff can't be marked complete without that.

### 7.2 Required handoff content (the "never-forget" set)

Use a structured format (e.g., I-PASS or SBAR as a base):

1. **Who this child is:** age, weight (for dosing), language, guardians and decision-makers, communication needs
2. **Safety-critical:** allergies, code status, isolation, high-risk meds, devices, safeguarding flags
3. **Current state and trajectory:** what's going on and where the plan is headed
4. **Open loops:** pending results, unfinished orders, promised callbacks, unanswered family questions
5. **What the family has been told:** and what they understood or asked
6. **What the family has told us:** preferences, fears, comfort items, routines, previously stated wishes
7. **Contingencies:** if X happens, do Y, and who to call
8. **What's changed:** deltas since the last handoff

### 7.3 System rules (draft)

- **R1:** A handoff can't be closed until the receiving provider acknowledges all items in the *safety-critical* group.
- **R2:** Open loops older than a set threshold are surfaced at the top and can't be silently dropped. They must be completed, transferred (with an owner) or closed with a reason.
- **R3:** "What the family has been told" is mandatory. If empty, the sender must confirm "nothing communicated."
- **R4:** The receiving provider sees a **diff** against their last view of this child.
- **R5:** Family-stated preferences travel with the child and appear in every handoff briefing.
- **R6:** Handoff content is auto-drafted from the record and **confirmed by the sending clinician.** Unconfirmed drafts are labeled as such.
- **R7:** Handoffs cannot hide unresolved safety concerns. The system flags any blank required field.
- **R8:** The family can see (in plain language) that a handoff happened, who the new contact is, and what was passed on. They can correct anything wrong.

---

## 8. Surfaces

### 8.1 Tablet (bedside / clinic / waiting room)
- Touch-first, large targets, glanceable; usable one-handed and by a child
- Shared-device safe: quick lock, no PHI lingering on screen, role-aware
- Offline-tolerant for poor hospital connectivity
- Modes: parent mode, child mode (story/activity), clinician mode

### 8.2 Large-screen parent dashboard (room display / family lounge / ambient)
- Built for reading from across a room: big type, high contrast, few elements
- Shows: today's plan, who's coming, what's next, who to ask, comfort and routine reminders
- **Privacy rules:** show only what the family has approved for a shared screen. Hide results, diagnoses and sensitive notes by default.
- Calm ambient design that doesn't demand attention. Updates must feel gentle.

### 8.3 Handoff UI
- Briefing-first layout, with the safety-critical block pinned (see §7)
- Side-by-side: what the sender says vs. what the record says
- Clear acknowledgment controls and visible progress toward "handoff complete"
- Fast on workstation and tablet; usable at a bedside

### 8.4 Automated Conference Interaction
For care conferences and multidisciplinary meetings:

- **Before:** auto-generated agenda and pre-read from the journey; family gets a plain-language prep sheet and can add questions or concerns
- **During:** optional capture of notes, decisions and action items, with explicit consent to any recording or transcription, and a visible indicator when active
- **After:** draft summary in family language, with decisions, next steps, owners and dates
  - Clinician review is required before the summary is published to the family.
  - Action items flow back into the journey as waypoints or instructions.
- Family can mark "I didn't understand this" on any item and trigger a follow-up
- Interpreter support built in, not bolted on

---

## 9. Language Filtering & Family Data Rules

### 9.1 Language rules
- **Reading level:** target roughly 6th grade for family content, and lower for child-facing content. Test with real readers.
- **Languages:** support family-preferred languages. Machine translation of clinical content needs a quality check or review tier. Interpreter access stays one tap away.
- **Plain-language first:** lead with what it means and what to do. Put technical detail behind "more detail."
- **Glossary:** approved terms with child-friendly and adult variants.
- **Tone check:** run a tone and jargon filter on all family-facing text (see §10).

### 9.2 What the family needs (and when)

Define rules per **data class**, not per screen:

| Data class | Parent | Child | Teen | Notes |
|---|---|---|---|---|
| Schedule and logistics | Yes | Age-appropriate | Yes | |
| Medications and instructions | Yes | Simplified | Yes | |
| Routine results | Yes, with context | No / simplified | Per policy | |
| Serious or sensitive results | Release rules: clinician-controlled timing and support | No | Per policy | Avoid surprise delivery |
| Mental health, reproductive and substance-use info | Per law and policy | | Teen-controlled in many jurisdictions | **Confidentiality rules vary by jurisdiction. Needs legal review.** |
| Safeguarding or social concerns | Clinician/policy gated | | | Never auto-display |
| Clinician-to-clinician notes | Not by default | | | Consider open-notes requirements |

Each rule must record: **who** may see it, **when**, **in what form** (raw / translated / summarized) and **who can override.**

**Cross-cutting requirements**
- Follow open-notes and information-blocking rules. Delays must have a documented, permitted reason.
- Guardian and proxy access with clear roles (custody, shared care, foster).
- Rules re-evaluate when the child's age, consent status or custody changes.

---

## 10. Voice & Tone

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
- Avoid: *"Patient is NPO after midnight pending sedated MRI."*
- Prefer: *"Please don't give Mia any food or drink after midnight. Her MRI scan is tomorrow, and she'll have medicine to help her sleep so she stays still."*

---

## 11. Child → Adult Transition

- The journey carries forward as one record, with ownership shifting gradually.
- Staged autonomy: age-based checkpoints for increased privacy, consent and responsibility.
- Teen-appropriate onboarding that explains what parents can and can't see.
- Transition checklist: adult provider introduction, records handoff (which uses the same handoff rules in §7), medication self-management, insurance changes.
- At adulthood, the former child chooses what history stays shared with family.

---

## 12. Privacy, Safety & Compliance

- HIPAA and applicable state, regional and international law. Minors' consent laws vary and need legal review.
- Role-based access with full audit logging, including AI-generated views
- Data minimization on shared and ambient displays
- Clear disclosure wherever AI helped produce content
- Clinical safety review process for the translation layer, rules engine and generated UI
- Accessibility: WCAG AA at minimum, plus read-aloud, dyslexia-friendly options and high contrast

---

## 13. Success Measures

- Parents can correctly state what happens next and who to call (comprehension checks)
- Fewer repeated-history requests from families
- Handoff completeness: zero unacknowledged safety-critical items, and fewer open loops dropped
- Time-to-briefing for receiving providers
- Reading-level and tone compliance for family content
- Family-reported confidence and stress
- Clinician trust: low rate of edits needed on AI translations over time

---

## 14. Open Questions

1. Disposable UI scope: is the hybrid approach in §6 acceptable? **[DECISION]**
2. Which handoff framework is the base (I-PASS, SBAR, other)?
3. Which results are held for clinician-led delivery, and who owns that policy?
4. How are custody and proxy changes verified?
5. Which jurisdictions launch first (drives confidentiality rules)?
6. What is the child-facing character and brand, and who tests it with kids?
7. Final tone-of-voice statement (§10) **[DECISION]**
