# FlightPlan: Data Visualization & Widget System

## 1. Core Data Visualization Principles

The existing conference tool fails at the bedside because of cognitive overload: the legend covers "today," text boxes collide, and color carries too much meaning. Our widget system decouples this data into purpose-built, high-impact visualizations.

* **Decouple Risk from Location:** We will no longer use a single colored line to mean both "how sick the child is" and "where they are."

* **Semantic Zoom for Annotations:** To fix the overlapping text boxes (collisions), we use semantic zoom. The top-level view shows only markers; tapping a marker expands the clinical shorthand or plain-language translation.

* **Accessibility Over Color:** Location (OR, Cath Lab, CICU, ACCU) is represented by distinct iconography, typography, and shape, never by color alone.

* **"Now" Centric:** Visualizations anchor on the current 48 hours, automatically compressing long historical stretches.

## 2. The Widget Matrix

This table maps the purpose-built widgets to their stakeholders and details the specific data visualization strategies used to fix the legacy system's flaws.

| Widget / Component | Target Stakeholder | Data Visualization Strategy | Replaces / Fixes (From the Brief) | 
| ----- | ----- | ----- | ----- | 
| **The "Flight Path" (Discharge Tracker)** | Family & Patient (Large Screen) | A visual, stepped area chart moving downward toward a "Home" target. Replaces the clinical Y-axis with plain-language milestones. | Removes the confusing dual-meaning line (location + sickness) and keeps clinical shorthand away from families. | 
| **The "First 30 Seconds" Sparkline** | Bedside Rounding Team | A compact, 48-hour sparkline showing immediate risk trajectory, paired with bold iconography for location (OR, CICU, Step-down). | Fixes the issue where the right-hand legend covers "today" and removes the reliance on color alone. | 
| **Delta Waterfall (What Changed)** | Bedside Rounding Team | A visual delta list or mini waterfall chart isolating overnight events, setback climbs, and new lab results. | Eliminates the need for clinicians to hunt for changes by reading the massive timeline to its right-hand end. | 
| **Action Capture Matrix** | Bedside Rounding Team | A quick-entry, Kanban-style grid linking decisions, owners, and follow-ups directly to specific timeline events. | Replaces the generic "Add a Note" button with structured, trackable task assignment. | 
| **Handoff Flight Plan** | Handoff / Shift Change Providers | An AI-suggested, touchscreen-modifiable "highlight reel" timeline. The system drafts key events to replay; providers can tap to add/remove items before the receiver explicitly checks them off. | Fixes information loss at shift change and replaces unstructured memory-based handoffs. | 
| **Pathway Variance Plot** | Conference / Clinician Review | An interactive milestone variance chart mapping the "Actual" course against the dashed "Pathway" and dotted "Course Correction" thresholds. | Solves overlapping fixed text boxes (collisions) by using semantic zoom for deep clinical callouts. | 
| **Outcome & Ratings Heatmap** | Conference / Clinician Review | A dedicated grid aggregating team performance scores (1–4) and phase outcomes (green/yellow/red dots) away from the timeline. | Removes quality review judgments from the primary bedside view where families might misinterpret them. | 

## 3. Large Screen Ambient Display (Family View)

These widgets compose the large room display, replacing the handwritten whiteboard.

### Widget 1: Patient Days & Flight Path

* **Visualization:** A horizontal, stepped progression path (like stepping stones). It visually compresses past days and keeps "Today" (e.g., "Day 3 after surgery", "POD 3") dead center.

* **Data Displayed:** Current location (e.g., "Step-Down Unit") using a clear icon and text label.

* **Rule:** Never displays the Y-axis "risk level" chart to families, preventing unnecessary anxiety over minor fluctuations.

### Widget 2: Expected Dates to Leave (Projected Discharge)

* **Visualization:** A prominent, calming target card with a visual checklist.

* **Data Displayed:** Estimated target date for going home, alongside the "Discharge Criteria" (e.g., "Chest tubes out", "Breathing on own").

* **Rule:** If the clinical team updates the date, the widget automatically displays a plain-language reason for the shift (e.g., "Waiting for one more test result") to maintain trust.

### Widget 3: Recent Updates (What Changed)

* **Visualization:** A soft, card-based feed with AI-generated iconography mapping to the update type (e.g., a resting icon for sleep, a heart icon for meds).

* **Data Displayed:** AI-translated plain language derived from overnight clinical events (e.g., "Overnight, Mia stopped needing the extra heart medicine.")

* **Rule:** Strict filtering blocks all clinical shorthand, raw lab values, and alarm styling from this widget.

## 4. Handoff Briefing & Transition (Provider View)

Handoffs are the highest-risk moments for information loss. This interactive widget acts as a safety net during shift changes, turning the transition into an active, verified playlist.

### Widget 4: The Handoff Flight Plan

* **Interaction Model (The "Suggest, Modify, & Replay" Loop):**

  1. **AI Suggestion:** Nearing the end of a shift, the AI automatically drafts a recommended handoff plan. It pulls high-risk events, setbacks, medication changes, and new results from the timeline into a preliminary queue.
  
  2. **Touchscreen Modification:** The sending provider uses the touchscreen to review the AI's draft. With simple taps, they can remove suggested items that aren't critical, or tap other timeline events to add them to the handoff queue. The clinician has final authority over the playlist.

  3. **The Replay:** At shift change, the widget compiles these finalized items into a chronological "Highlight Reel" alongside mandatory safety-critical elements (allergies, code status).

  4. **Acknowledgment:** The receiving provider interacts with this timeline like a story sequence, checking off each node to formally acknowledge the event or open loop before the handoff is complete.

* **Data Displayed:** AI-suggested/clinician-modified events, uncompleted action items from the Action Capture Matrix, and the delta (what changed since the receiver's last shift).

* **Rule:** The system enforces a hard stop; the handoff cannot be closed until the receiving provider acknowledges all critical safety items and replay events.
