# REMAINS_FOR_HACKATHON.md
**TurnWise (PS2) — Work Reserved for Hackathon Window (Oct 7–10, 2026)**  
**Purpose:** Keep clear, visible scope that will be implemented *during* the hackathon so (1) we remain compliant with event expectations and (2) we don’t forget any differentiator.

---

## 0) Non‑Negotiables (must stay true in every build)
- **No government impersonation**
  - Do not use national emblem, ministry seals, “gov.in” branding, or claim “official/approved”.
  - Keep header disclaimer everywhere: **“Hackathon Prototype — Not an official Government website.”**
- **Demo disclosure must remain wherever reminders appear**
  - **“Demo mode: reminder triggers use 60 s / 30 s for judging; production would use 10 min / 5 min.”**
- **Consent + opt‑out must remain wherever phone/channel is collected**
  - Include the STOP line and consent paragraph exactly as approved.
- **Accessibility must not regress**
  - Toolbar persists to localStorage keys: `tw_textSize`, `tw_contrast`, `tw_reduceMotion`
  - High contrast: bg black, text white, links yellow, focus ring yellow 3px.
- **Truth layer is mandatory**
  - Notification Log + Audit Log must reflect actual actions (no fake “success” claims).

---

## 1) Current Baseline (Pre‑Hack Status Snapshot)
As of **Oct 1–6**, we already have a working prototype with:
- Citizen: Take Token + Token Status
- Admin: Login + Queue Dashboard + Notification Log
- Engine: tokens, counters, call-next, serve/no-show/cancel, reminder check, seeded demo/reset
- Government portal “chrome”: skip link, utility strip, DBIM-style footer, print stylesheet
- Accessibility toolbar and basic component system

**Hackathon goal:** Extend this into a “best-of-the-best” system that is *more than a token app*.

---

## 2) Hackathon Definition of Done (DoD)
By final submission, we must be able to demo, end-to-end, without breaking:
1. Citizen joins queue (web and at least one additional channel)
2. Citizen sees documents required for selected service
3. Admin operations: call-next → counter assignment → served/no-show
4. Reminders run (manual trigger + optional scheduler) and appear in Notification Log
5. Missed-turn handling works (recycle / recovery) + logged
6. Audit Log shows every important transition
7. Public Display page shows token numbers only (no personal data)
8. Portal remains accessible (keyboard, focus, contrast) + printable receipt

---

## 3) P0 (Must Ship During Hackathon) — “Meaningful Work Left”
These items are reserved for hackathon time and will be implemented during Oct 7–10.

### P0.1 Service Document Requirements (Citizen + Print)
**Why:** Most realistic govt workflow improvement; reduces failed visits.  
**Deliverables:**
- Requirements list per service (data-backed)
- Requirements panel shown:
  - before token submission
  - on token confirmation/status
  - in print receipt
- Admin can view requirements per service (read-only is OK for demo)

**Acceptance:**
- Selecting “Income Certificate” visibly changes the document checklist.
- Checklist prints cleanly on A4.

---

### P0.2 Fairness + Anti-Spam Controls (No “token spam”)
**Deliverables:**
- Enforce rule: **max 1 active token per phone per service** (configurable).
- Optional: max 2 active tokens total per phone across services.
- Clear user-facing error message when blocked.
- Audit log entry created for blocked attempt (actor=SYSTEM).

**Acceptance:**
- Same phone cannot create repeated active tokens for same service.

---

### P0.3 Reason / Outcome Logging (Reject / Unable-to-process)
**Goal:** Not every failure is “cancelled”; we must explain outcomes like missing documents.  
**Deliverables:**
- Admin action: **Mark outcome / rejection reason** (e.g., MISSING_DOCUMENTS, WRONG_SERVICE, DUPLICATE_REQUEST, OTHER)
- Citizen sees the reason clearly on Token Status.
- Audit log captures reason in notes.

**Acceptance:**
- Admin selects a reason → citizen page updates instantly → audit log records it.

---

### P0.4 Public Display (Kiosk Mode, token numbers only)
**Deliverables:**
- Route like `#/display` (or similar)
- Shows:
  - Now serving (token numbers large)
  - Counter assignments
  - Recently called
  - Queue stats
  - “Queue status: Active/Paused”
- No names/phones anywhere.

**Acceptance:**
- Calling next updates display instantly.

---

### P0.5 Admin Console Separation (Layout + Guard)
**Deliverables:**
- Admin pages use a separate “Operations Console” layout + nav.
- Hard gate: if not logged in → redirect to Admin Login.
- Citizen pages never expose admin-only controls.

**Acceptance:**
- Directly opening admin URLs without auth forces login.

---

### P0.6 Category/Subcategory Workflow (Target: Oct 10th)
**Deliverables:**
- Update `engine.js` services data to include a `category` property (e.g., "Transport & License").
- Update Citizen "Take Token" form to use a two-step dropdown:
  1. Select Category
  2. Select Specific Service (unlocks based on category)
- Preserves the illusion of massive enterprise scale for the final demo pitch.

**Acceptance:**
- Choosing a category filters the second dropdown appropriately.

---

## 4) P1 “Unfair Advantage Pack” (WOW differentiators)
These are the features that will separate us from CRUD token apps.

### P1.0 Full V2 Transplant (Target: Oct 10th)
**Deliverables:**
- Use `queless3.html` as the new base frontend (`index.html`).
- **De-Simulation (Lobotomy):** Remove the `setInterval` loop and random token generation from the V2 file to ensure manual admin control.
- **Engine Wiring:** Connect the V2 UI state directly to the deterministic `engine.js` backend.
- **Accessibility Completion:** Re-introduce the High Contrast and Reduced Motion toggles to the V2 utility strip to satisfy WCAG 2.1 AA.
- **File Splitting:** Extract the massive inline `<script>` block from V2 into a clean `app_v2.js` file for maintainability.

**Acceptance:**
- The teammate's V2 design is fully adopted as the main portal while maintaining strict GovTech compliance and deterministic queue math.

---

### P1.1 Omnichannel Join — WhatsApp `JOIN <service_code>`
**Deliverables:**
- WhatsApp join flow (Twilio webhook or simulated provider mode if network fails)
- Command format:
  - `JOIN INC` (Income Certificate)
  - `JOIN BIRTH`
  - `JOIN GEN`
- Reply includes:
  - Token number (TW-####)
  - Service name
  - ETA
  - Status link
  - STOP instruction
- Log outbound messages in Notification Log (and optionally Template Log)

**Acceptance:**
- WhatsApp join creates token visible in Admin Queue immediately.
- Notification Log records “WELCOME” or “TOKEN_ISSUED” message event.

**Fallback plan (non-negotiable):**
- If WhatsApp provider fails, use **Simulated Provider Mode** that still writes NotificationLog entries so demo never breaks.

---

### P1.2 Missed-turn prevention + Recovery (Recycle)
**Deliverables:**
- Admin marks token as **NO_SHOW**
- System can **Recycle / Return to Queue** with:
  - recycleCount increment
  - audit entry
  - citizen notification (WhatsApp/SMS or simulated)
- Limit recycle to 1–2 times per token (to prevent abuse)

**Acceptance:**
- NO_SHOW → Recycle → token reappears in waiting list with updated position and a log entry.

---

### P1.3 Confirm / Cancel from Reminder (Simple, reliable)
**Deliverables:**
- Reminder message contains:
  - “Confirm” link or code (web-confirm is fine)
  - “Cancel” option
- Citizen confirmation reflected on admin row (badge “CONFIRMED” derived UI label)

**Acceptance:**
- Citizen clicks confirm → Admin sees confirmed state instantly.

---

### P1.4 Audit Log (Append-only truth of operations)
**Deliverables:**
- Dedicated Audit Log screen (admin)
- Records every action:
  - token created/cancelled
  - called/served/no-show/recycled
  - reminder sent/failed/skipped
  - rejection reason assigned
  - counter change
- Columns: timestamp, token, actor, action, from→to, notes

**Acceptance:**
- Every button press in admin creates a new audit entry.

---

## 5) P2 Supporting Features (If P0 + P1 are stable)
### P2.1 OTP Verification (Spam reduction + phone control)
**Deliverables (hackathon-safe):**
- OTP step before token issuance (or before enabling notifications)
- Rate limits:
  - resend cooldown
  - attempt limit
  - OTP expiry
- Demo-safe fallback:
  - show OTP on screen with label “Demo OTP shown here”
  - OR deliver via WhatsApp/SMS when available

**Acceptance:**
- Token cannot be issued unless OTP verified (or explicitly bypassed in demo mode with clear disclosure).

---

### P2.2 Multilingual Citizen Flow (EN + HI/GU)
**Deliverables:**
- Language toggle in header: `English | हिन्दी` (or Gujarati if chosen)
- Translate only citizen-critical strings:
  - nav + headings
  - form labels + errors
  - token status labels
  - document requirements headings
- Persist language selection

**Acceptance:**
- Switching language updates UI without losing in-progress form data.

---

### P2.3 Feedback (Continuous improvement signal)
**Deliverables:**
- Citizen feedback form:
  - rating 1–5
  - category
  - comment
  - optionally token number
- Admin feedback view: list + average rating

**Acceptance:**
- Submit feedback → visible in admin list immediately.

---

### P2.4 Notification Timing Controls (Policy + Preferences)
**Deliverables:**
- Admin can set threshold profile:
  - Demo (60/30)
  - Production (10m/5m)
  - Custom (optional)
- Citizen preference:
  - WhatsApp / SMS / Web-only
- All decisions logged as SENT/FAILED/SKIPPED with reasons.

**Acceptance:**
- Changing thresholds changes which tokens get reminders on next check.

---

### P2.5 Counter Staffing Simulator (Ops realism + pitch booster)
**Deliverables:**
- Slider/stepper: active counters 1..4
- Shows predicted wait impact immediately
- Clearly labelled “Formula-based simulation (not AI)”

**Acceptance:**
- Changing counters changes predicted ETA numbers consistently.

---

## 6) P3 Roadmap (Explicitly NOT required for hackathon)
We will mention these as “next steps” but not promise implementation:
- Permanent citizen accounts (username/password, recovery)
- Fully production-grade SMS compliance (DLT etc.)
- Role-based admin accounts (multiple roles)
- Advanced ML wait-time prediction (if not truly implemented)
- Multi-office deployment + analytics dashboards at scale

---

## 7) Demo Script (Final 2–3 minutes)
1. **Citizen** selects service → sees **required documents**
2. Citizen joins via **Web** (and optionally WhatsApp JOIN demo)
3. Token appears instantly in **Admin Queue**
4. Admin **Call Next** → token is assigned to a counter → Public Display updates
5. Admin runs **Reminder Check** → Notification Log shows SENT/FAILED/SKIPPED truthfully
6. Admin marks **NO_SHOW** → system **Recycle + notify** → audit log proves it
7. Admin records **Reason/Outcome** (e.g., missing documents) → citizen status updates
8. Show **Audit Log** to prove fairness + accountability
9. Optional: **Staffing simulator** changes predicted wait

---

## 8) Team Execution Plan (3 members)
- **Member A (Core Ops + Counters + Audit):**
  - counter assignment, call-next, serve/no-show/recycle, audit log screen
- **Member B (Messaging + Reminders + WhatsApp Join):**
  - webhook/simulated provider, reminder engine, template log, STOP/opt-out handling
- **Member C (Citizen UX + Portal grade + i18n + Feedback):**
  - documents checklist, token status UX, multilingual strings, feedback, public display layout

---

## 9) Risk Register + Mitigations
- **WhatsApp/Twilio fails / no internet**
  - Mitigation: Simulated Provider Mode + logs as source of truth
- **Too many features → demo breaks**
  - Mitigation: P0 must remain stable; P1 only if stable; P2 only if time
- **Privacy concerns**
  - Mitigation: public display shows token numbers only; mask phones in admin lists if shown; keep clear disclaimers

---

## 10) Tracking Checklist (Tick during hackathon)
### P0
- [x] Document requirements data + UI + print
- [x] Fairness anti-spam: active token limits
- [x] Outcome/rejection reason + audit
- [x] Public display (token numbers only)
- [x] Admin console separation + auth gate
- [x] Category/Subcategory workflow (Oct 10th)

### P1
- [x] V2 Transplant: Use `queless3.html` as base
- [x] V2 Transplant: De-simulate (remove setInterval)
- [x] V2 Transplant: Wire UI to `engine.js`
- [x] V2 Transplant: Complete Accessibility (High Contrast)
- [x] V2 Transplant: Extract JS to `app_v2.js`
- [ ] WhatsApp JOIN <service_code> (or simulated)
- [ ] Recycle flow + notify + audit
- [ ] Confirm/Cancel from reminders
- [ ] Full audit log screen

### P2
- [ ] OTP verification + rate limits
- [ ] Multilingual citizen UI (EN + HI/GU)
- [ ] Feedback form + admin list
- [ ] Notification timing controls
- [ ] Staffing simulator

---

**End of file**