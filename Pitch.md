# FlightPlan: 3-Minute Demo Pitch

## Opening

Imagine standing beside a child's hospital bed.

The family is worried. The care team is busy. The information already exists, but it is spread across the EHR, notes, orders, results, handoffs and separate team conversations.

The problem is not a lack of data. The problem is getting the right information to the right person at the right moment.

**FlightPlan turns one hospital stay into a clear journey from admission to home.**

It is a shared awareness and communication tool. It does not replace the EHR and it does not make clinical decisions.

## The Problem From the Clinicians' Notes

During bedside rounds, clinicians need to understand the patient quickly:

- Where is the child now?
- What changed since yesterday or the last handoff?
- What is the plan for today?
- Is the stay on track or behind the expected pathway?
- What actions, questions and follow-ups are still open?

The current information is often split across systems and specialty tabs. This creates repeated explanations, missed context and handoff risk. Families have a different problem: they often do not know what is happening now, what comes next or when going home might be possible.

## What The Demo Shows

### 1. Care-team view

The care-team view is designed for the first 15 seconds of rounds.

At the top, the team sees:

- Current location and level of care
- Day of stay and post-operative day
- On track or behind pathway
- Expected discharge estimate
- Active flags
- Open loops and family notes

The timeline then shows the actual course against the expected pathway. Important events are labelled directly, so the clinician does not need to click every dot to understand the story.

A clinician can select an event for semantic zoom. The selected event expands to show its type, date, time, source, clinical wording and family-safe wording.

### 2. Family view

The family view uses the same journey data in simpler language.

It shows:

- Day of the stay
- Where the child is on the path home
- What is happening today
- What needs to happen before going home
- The current discharge estimate and why it changed
- Recent reviewed updates

Sensitive details stay in the care-team view. The family display is designed to be calm, plain and hallway-safe.

### 3. Handoff and conference direction

The same journey model can support handoff and conference workflows. A handoff can focus on changes, safety items, open loops and what the family has been told. A conference view can compare actual pathways against expected pathways across patients.

These are the next workflow surfaces, not claims that the current demo has completed every production requirement.

## Does The Prototype Solve The Problem?

**It solves the communication and visibility problem at the prototype level.**

The demo proves that one stay can be organized into:

- A fast clinician summary
- A compressed full-stay timeline
- Actual versus expected pathway
- Recent changes
- Family-safe and clinician-specific views
- Discharge estimate and criteria
- Visible event labels with optional detail
- Notes and open loops shared between family and care team

**It does not yet prove the full operational solution.** The following still need clinician testing or implementation:

- Real EHR connectivity and authentication
- Complete action capture with owner, due time and linked event
- Clinician validation of pathway and discharge-estimate rules
- Family display-only mode as the final deployed experience
- Privacy, consent, audit and role-permission workflows
- Validation with real clinicians and families

That distinction is important. The prototype demonstrates the product direction and interaction model. The next phase validates the workflow and connects it safely to hospital systems.

## How The Data Can Be Fetched From The EHR

FlightPlan should read from the EHR. It should not ask clinicians to search through the chart and re-enter the same information.

### Recommended integration path

1. **Authenticate through the hospital identity system**
   - Use hospital single sign-on for clinicians.
   - Use SMART on FHIR launch for an EHR-launched clinician view.
   - Apply role-based access and patient-context checks.

2. **Fetch the current patient and encounter**
   - FHIR `Patient`: demographic context needed by the clinician view.
   - FHIR `Encounter`: admission, unit and stay context.
   - FHIR `Location`: current unit, room and bed.
   - FHIR `Practitioner` and `CareTeam`: current care-team roles and names.

3. **Build the journey timeline**
   - FHIR `Procedure`: operations and procedures.
   - FHIR `Observation`: milestones and selected structured measurements.
   - FHIR `Condition`: clinician-facing diagnoses and active concerns.
   - FHIR `MedicationRequest`, `MedicationAdministration` and `MedicationStatement`: important medication changes or milestones.
   - FHIR `ServiceRequest`, `Task` and `Appointment`: planned work and follow-ups.
   - FHIR `DiagnosticReport` and `ImagingStudy`: findings and results, subject to release and review rules.
   - FHIR `DocumentReference` and `Communication`: reviewed notes, family updates and communication history.
   - FHIR `CarePlan` and `Goal`: pathway goals, discharge criteria and today's priorities where available.

4. **Support hospitals that are not fully FHIR-based**
   - Consume HL7 v2 ADT messages for admission, transfer and discharge events.
   - Consume HL7 v2 ORM/ORU messages for orders and results where needed.
   - Use a hospital interface engine or integration platform to normalize messages.
   - Never expose raw messages directly to the UI.

5. **Normalize into the FlightPlan journey model**

```text
EHR and interface systems
        |
        | FHIR, SMART on FHIR, HL7 v2
        v
Read-only integration adapter
        |
        | validates, maps, deduplicates and timestamps
        v
Canonical Journey Model
        |
        | pathway rules, permissions, review status
        v
Care-team view       Family-safe view       Handoff view
```

6. **Apply safety and review rules before display**
   - Keep source clinical data separate from translated family wording.
   - Label every item with its source and last-updated time.
   - Auto-publish only approved low-risk items such as reviewed location changes and glossary-based milestones.
   - Require clinician review for results, setbacks, medication changes, new diagnoses, procedure risks and discharge-reason changes.
   - Do not send identifiers, private notes, sensitive results, organisms or clinician-only flags to the room display.
   - Log what was shown, to whom and when.

### Example mapping

| FlightPlan information | Likely EHR source | Display use |
|---|---|---|
| Day of stay | `Encounter.period` | Clinician and family day counter |
| Current unit and bed | `Encounter`, `Location` | Current position |
| Care team | `CareTeam`, `Practitioner` | Clinician names and roles |
| Procedures | `Procedure` | Timeline milestones |
| Care-state transitions | `Encounter`, `Location`, ADT messages | ICU, step-down and transfer events |
| Today's priorities | `CarePlan`, `Goal`, `Task` | Clinician priorities and family-safe goals |
| Discharge criteria | `CarePlan`, `Goal`, `Task` | Before-going-home checklist |
| Discharge estimate | Pathway rules plus current EHR state | Estimate, never a promise |
| Recent updates | reviewed `Communication`, `Observation`, `Procedure` and `Task` | What changed |
| Family questions | FlightPlan-owned `Communication` or `Task` record | Open loop for rounds |
| Round actions | FlightPlan-owned `Task` linked to an event | Owner and follow-up |

### Important feasibility boundary

EHR data is not always structured consistently. The integration must handle missing fields, duplicate messages, delayed updates and conflicting sources.

For the hackathon, synthetic data is the correct choice. For a real pilot, the first integration should use one hospital, one EHR, one cardiac pathway and a small set of read-only FHIR resources. Clinicians should confirm the mapped data before it reaches the family view.

## Judging Criteria

### Problem and impact

**Strong direction, with measurable impact to validate.**

FlightPlan directly addresses the clinician notes: fragmented information, repeated explanations, handoff risk and family uncertainty.

Proposed measures:

- Time for a clinician to state current status, what changed and today's plan
- Number of repeated-history requests during a stay
- Number of open actions without an owner
- Handoff items acknowledged by the receiving provider
- Family ability to state where the child is, what comes next and who to ask
- Clinician edits required on translated family updates

### Novelty

The novelty is not simply another timeline or chatbot. FlightPlan combines:

- One chronological journey across fragmented clinical systems
- Actual course versus expected pathway
- A fast clinician view and a separate family-safe view
- Visible discharge changes with reasons
- Semantic zoom for detail without a crowded first screen
- AI translation constrained by a vetted glossary and clinician review
- Family notes and round actions treated as part of the same journey

### Technical feasibility and depth

The prototype uses synthetic data and a deterministic browser demo, which makes the workflow easy to evaluate safely. The production path is feasible through SMART on FHIR, FHIR resources and HL7 v2 normalization.

The technical depth is in the boundaries:

- Read-only EHR integration
- Canonical journey model
- Audience-specific filtering
- Review status and provenance
- Explainable discharge estimate
- Role-based access
- Audit logging
- Offline-tolerant last-known state
- No clinical recommendations from AI

### Prototype quality

The prototype demonstrates four connected views, responsive layouts, synthetic patient scenarios, care-team summary, pathway timeline, event detail, family-safe language and Skye conversation.

Be transparent during the demo: action capture, EHR integration, production authentication and final privacy controls are planned implementation work, not complete production features.

### Pitch clarity

The pitch has one clear sentence:

> **FlightPlan turns a fragmented hospital stay into one clear journey from admission to home.**

Everything in the demo should return to that sentence.

### Execution and judgment

Good judgment is visible in what FlightPlan does not do:

- It does not replace the EHR.
- It does not make diagnoses or treatment recommendations.
- It does not expose sensitive details on a family display.
- It does not use 3D as decoration in the clinical workflow.
- It does not claim that a prototype is a production integration.
- It uses synthetic data until safety and privacy questions are answered.

### Q&A readiness

**Is this an EHR?**

No. FlightPlan reads existing information and presents the journey for shared awareness and communication.

**How does it connect to the EHR?**

Through SMART on FHIR and read-only FHIR resources where available, with HL7 v2 normalization for legacy interfaces.

**Can AI make a clinical decision?**

No. AI may translate approved information into plain language. It does not diagnose, recommend treatment or predict outcomes.

**How do you prevent a family from seeing sensitive information?**

Audience-specific data contracts, role permissions, review status and an explicit family-safe filter prevent clinician-only content from being sent to the room display.

**How is the discharge date calculated?**

From the expected pathway, current position and discharge criteria using a transparent rule. It is an estimate, not a promise, and clinicians can review or override it.

**Why not build a 3D world?**

The core user needs speed and clarity. A 2.5D journey gives orientation without adding cognitive load. A richer 3D child story mode could be explored later, but it should not be required for rounds or family communication.

**What is missing today?**

The next build needs complete action capture, real integration testing, privacy and consent implementation, and clinician and family usability testing.

## Closing

FlightPlan is a simple idea applied to a difficult problem:

**Show the whole journey, make today obvious, explain what changed, and keep the next action visible.**

The prototype shows that this can be done without adding another complicated chart or asking clinicians to rebuild the story by hand.

The next step is a focused pilot: one hospital, one EHR, one pathway, synthetic data first, read-only integration, clinician verification, and measurable outcomes.

If FlightPlan succeeds, families will know what is happening, clinicians will spend less time reconstructing the story, and fewer important actions will disappear during handoff.
