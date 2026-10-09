Absolutely—these features are now part of the **TurnWise master scope**. But we should distinguish between:

1. **The practice prototype you already built**
2. **Pre-hackathon planning**
3. **Code legitimately implemented during October 7–10, 2026**

Today is **Thursday, October 1, 2026**. Under the rule that the project must be developed during the hackathon, October 1–6 is preparation time—not eligible implementation time unless the organizers explicitly say prebuilt code is allowed.

## Important compliance boundary

Your current prototype should be treated as a **practice/proof-of-concept**, not silently submitted as code created during the hackathon.

The safest approach is:

- Preserve the current prototype in its existing repository.
- Label/tag it as a pre-event practice prototype.
- Prepare requirements, architecture, test cases, wireframes and task plans before October 7.
- On October 7, create the official hackathon repository and rebuild the eligible solution there.
- Do not copy the current source code into the official repository unless the organizers explicitly permit starter code.
- Preserve the official repository’s commit history as evidence of the build process.

A new Git branch would still contain the old history. A **new repository created on October 7** is cleaner.

You have plenty of preparation time—but not plenty of eligible pre-event development time.

---

# Unified TurnWise feature strategy

TurnWise should have four layers:

## 1. Citizen experience

- Web token issuance
- WhatsApp `JOIN <service-code>`
- SMS joining as a stretch feature
- QR-based joining/check-in
- Document requirements before joining
- OTP phone verification
- Duplicate-request and active-token limits
- Live position and ETA
- Confirm/cancel actions
- Notification timing preferences
- Missed-turn recovery
- Multilingual interface
- Feedback
- Clear service outcome or inability-to-process reason

## 2. Office operations

- Dedicated admin console
- Counter activation and staffing
- Call next
- Serve, no-show and cancel
- Transfer between counter/service
- Reminder execution
- No-show recycle
- Queue pause/resume
- SLA indicators
- Counter staffing simulator
- Daily operational analytics

## 3. Trust and transparency

- Notification Log
- Append-only Audit Log
- Public display with token numbers only
- Standard reason codes
- Transparent fairness rules
- Consent and opt-out records
- No personal information on public displays

## 4. Government-grade foundation

- Accessibility controls
- Skip link and keyboard navigation
- Multilingual support
- Policy pages
- Structured header/footer
- Last-updated information
- Printable token receipt
- Clear prototype disclaimer
- No government impersonation

---

# Hackathon priority levels

A three-member beginner team should not attempt every item equally. The winning approach is a stable core plus three powerful differentiators.

## P0 — Demo spine: must work

These features make the product usable:

1. Web token issuance
2. Service-specific document requirements
3. Token number, position and ETA
4. Dedicated admin console
5. Counters and call-next
6. Serve/no-show/cancel
7. Notification Log
8. Audit Log
9. Configurable notification thresholds
10. One active token per phone/service
11. Public queue display
12. Accessibility and government-portal structure

## P1 — Unfair Advantage Pack

These are the three differentiators that should receive the most attention:

### A. WhatsApp joining

Citizen sends:

```text
JOIN INC
```

The same queue engine used by the website should create the token and respond with:

- Token number
- Service name
- Estimated wait
- Status link
- STOP instruction

Do not create a separate WhatsApp-only queue implementation. Every entry channel should call the same central token issuance service.

### B. Missed-turn recycle

Suggested transition:

```text
ISSUED → CALLED → NO_SHOW → RECYCLED → ISSUED
```

For a simple implementation, you do not necessarily need a permanent `RECYCLED` database status. You can:

- Record the no-show
- Increment `recycleCount`
- Add an audit event
- Return the token to `ISSUED`
- Give it a new queue position
- Send a recycle notification

Example message:

> You missed your call. Your token remains active and has been returned to the queue. Please arrive at the office now.

Add a maximum recycle limit, such as one recovery per token.

### C. Audit Log + Public Display

Every significant action should be visible in the audit trail:

- Token issued
- OTP verified
- Reminder sent or failed
- Token confirmed
- Token called
- No-show recorded
- Token recycled
- Counter changed
- Service completed
- Token cancelled
- Service outcome recorded

The public display should show only:

- Token number
- Counter
- Called/serving state
- Upcoming token numbers
- Queue statistics

Never display names or phone numbers.

## P2 — High-value supporting features

Implement these after the demo spine and Unfair Advantage Pack are stable:

- English/Hindi or English/local-language switch
- User feedback
- Unable-to-process/service-outcome reason
- QR joining/check-in
- Confirm/cancel
- Counter staffing simulator
- Simple wait-time analytics
- SLA warning badges

## P3 — Roadmap or stretch features

- Permanent citizen accounts
- SMS join webhook
- Advanced role-based administration
- Forgot-password/account recovery
- Priority-category workflows
- Advanced predictions or ML
- Multi-office deployment
- Detailed analytics and reporting

---

# Important corrections to your friend’s features

## 1. Document requirements

This is high-impact and inexpensive.

Store requirements against each service:

```text
Income Certificate
- Valid photo ID
- Address proof
- Income declaration
- Supporting income records
```

Show the list:

- When the service is selected
- Before token submission
- On token confirmation
- On token status
- On the printable receipt
- In the reminder message, if space permits

This directly prevents wasted visits.

---

## 2. OTP verification

OTP verifies control of a phone number. It does **not** prove the legal identity of the person.

Recommended rule:

- Verify the phone once before token creation.
- Allow one active token per phone per service.
- Optionally allow no more than two active tokens total.
- Add a cooldown after repeated cancellations.
- Log blocked duplicate attempts without exposing the phone publicly.

A real OTP must be implemented server-side with:

- Short expiry
- Attempt limits
- Resend cooldown
- Rate limiting
- Secure OTP comparison

A client-side OTP inside static JavaScript is only a simulation and must be labelled accordingly.

---

## 3. Notification timing

Separate office policy from citizen preference.

### Office policy

- Demo: 60 seconds and 30 seconds
- Production proposal: 10 minutes and 5 minutes

### Citizen preference

- All reminders
- Final reminder only
- Called notification only
- No notifications

Every reminder decision should enter the Notification Log, including `SKIPPED` decisions.

---

## 4. Permanent login

Permanent login is not necessary for the hackathon MVP. It introduces:

- Password handling
- Recovery workflows
- Account security
- Persistent personal data
- Additional privacy responsibilities

A better hackathon design is:

- Phone verification
- Token lookup
- Temporary token-specific session
- Optional OTP verification when reopening a token

Permanent accounts can remain on the roadmap.

---

## 5. Separate admin panel

This should be separate both visually and logically:

```text
Citizen portal: /
Admin console: /admin/*
Public display: /display/*
Messaging webhook: /api/webhooks/*
```

The admin console should have:

- Its own navigation
- Session protection
- Role-aware actions
- Audit logging
- No citizen marketing content

A separate URL alone is not security. In the real implementation, admin authorization must be enforced by the backend.

---

## 6. Multilingual support

For the hackathon, translate the most important citizen journey:

- Navigation
- Service selection
- Document requirements
- Form labels
- Consent explanation
- Token confirmation
- Position and ETA
- Reminder messages
- Error messages
- Feedback form

Do not attempt to translate the entire admin console first.

Choose languages based on the target pilot office. For a local Gujarat deployment, **English + Gujarati** may be more relevant than English + Hindi. Hindi can be the third language or roadmap item.

Persist the language selection and ensure changing languages does not reset an in-progress form.

---

## 7. User feedback

Keep it simple:

- Rating from 1–5
- Category:
  - Ease of use
  - Notification experience
  - ETA accuracy
  - Office experience
  - Accessibility
  - Other
- Optional comment
- Optional token association
- Do not require the citizen to provide their phone number again

Admin analytics can show:

- Average rating
- Rating distribution
- Most common category
- Recent comments

---

## 8. Rejection reason

Be careful with terminology. TurnWise manages the **queue and office visit**, not necessarily the legal application decision.

Keep queue state and service outcome separate.

### Queue status

```text
ISSUED
CALLED
DONE
NO_SHOW
CANCELLED
```

### Service/visit outcome

```text
COMPLETED
UNABLE_TO_PROCESS
REFERRED
FOLLOW_UP_REQUIRED
```

Possible reasons:

```text
MISSING_DOCUMENTS
INVALID_DETAILS
WRONG_SERVICE_SELECTED
DUPLICATE_REQUEST
SERVICE_TEMPORARILY_UNAVAILABLE
OFFICE_APPROVAL_REQUIRED
OTHER
```

For example, the token can be `DONE` because the counter interaction ended, while the outcome is `UNABLE_TO_PROCESS` because required documents were missing.

Citizen-facing copy:

> Your visit was completed, but the service could not be processed because address proof was not provided. Please bring the required document and take a new token.

This is much more accurate than marking every unsuccessful application as `CANCELLED`.

---

# Counter staffing simulator

This is still one of your best visual WOW features.

Admin changes active counters:

```text
1 counter → predicted wait: 42 minutes
2 counters → predicted wait: 21 minutes
3 counters → predicted wait: 14 minutes
```

Keep the calculation transparent. Call it:

> Formula-based staffing simulation

Do not call it AI or machine learning unless an actual predictive model is implemented.

A simple calculation is enough:

```text
Predicted wait =
tokens ahead × average service duration ÷ active counters
```

Later, it can use rolling service-time averages.

---

# Recommended three-minute demo

A strong final demo can be:

1. Citizen opens the portal in a selected language.
2. Selects a service and sees the required documents.
3. Joins through WhatsApp or web.
4. OTP/duplicate protection is demonstrated.
5. The token appears immediately in the admin console.
6. Admin calls the token and assigns a counter.
7. Reminder appears in the Notification Log.
8. Admin records a no-show.
9. Token is recycled and the citizen is notified.
10. Public display updates without revealing personal details.
11. Audit Log proves every transition.
12. Counter simulator demonstrates how adding a counter lowers predicted waiting time.

That tells one complete story instead of demonstrating disconnected features.

---

# Suggested 36-hour build order

## Hours 0–4

- Create official repository
- Scaffold application
- Database schema
- Seed office/services
- Shared legal/accessibility shell

## Hours 4–10

- Token issuance
- Document requirements
- Duplicate/active-token limits
- Position and ETA
- Token status

## Hours 10–16

- Admin authentication
- Queue dashboard
- Counter assignment
- Serve/no-show/cancel
- Audit Log

## Hours 16–22

- Notification engine
- Notification Log
- Threshold configuration
- WhatsApp joining and provider fallback

## Hours 22–27

- No-show recycle
- Confirm/cancel
- Public display
- QR entry/check-in

## Hours 27–31

- Multilingual citizen flow
- Feedback
- Service outcome reasons

## Hours 31–34

- Staffing simulator
- Analytics/SLA indicators, only if everything else is stable

## Hours 34–36

- Testing
- Accessibility review
- Reset/seed reliability
- Demo rehearsal
- Documentation and submission packaging

---

# What to do before October 7

Do **planning only**, unless organizers explicitly permit prebuilt implementation:

- Finalize the feature backlog
- Finalize data entities
- Prepare screen flow diagrams
- Write acceptance tests
- Write the three-minute demo script
- Decide service codes
- Research document requirements
- Decide language scope
- Document webhook/message formats
- Prepare environment-variable checklist
- Decide task ownership for three members
- Practice rebuilding features in a separate training environment

Do not add these new production features to the official submission before the event window.

---

# Planning-only Antigravity prompt

Give Claude Sonnet 4.6 this now. It should create documentation without modifying your working prototype:

```text
TASK: Create the TurnWise Master Feature and Hackathon Build Plan.

IMPORTANT:
This is a planning-only task. Do not modify any application source code.
Do not edit engine.js, app.js, ui.js, styles.css, or index.html.
Do not implement any feature.

Create these documentation files:

1. docs/TURNWISE_MASTER_SCOPE.md
2. docs/HACKATHON_BUILD_PLAN.md
3. docs/FEATURE_ACCEPTANCE_TESTS.md
4. docs/DEMO_FLOW_V2.md

The master scope must include:

CORE:
- Virtual token issuance
- Queue position and ETA
- Counter operations
- Notification Log
- Audit Log
- Accessibility and government-portal patterns

CITIZEN UX:
- Service-specific document requirements
- OTP phone verification
- One active token per phone per service
- Configurable notification preferences
- Temporary token session
- Multilingual citizen flow
- Feedback
- Service outcome/reason display

UNFAIR ADVANTAGE PACK:
- Web + WhatsApp JOIN <service-code>
- SMS as stretch
- QR join/check-in
- Confirm/cancel
- No-show recycle + notification
- Public queue display
- Counter staffing simulator

OPERATIONS:
- Separate admin console
- Active/idle counters
- Call next, serve, no-show, cancel
- Queue pause/resume
- Transfers/routing
- SLA indicators
- Daily analytics

TRUST:
- Append-only audit trail
- Notification delivery log
- Consent and STOP handling
- Fairness/rate-limit policy
- No personal data on public display

Clearly separate features into:
- P0 Demo Spine
- P1 Unfair Advantage Pack
- P2 Supporting Features
- P3 Roadmap

Important design decisions:
- OTP proves control of a phone number, not identity.
- Permanent login is a roadmap feature.
- Queue status and service outcome must be separate.
- Demo reminders use 60s/30s; production proposal uses 10min/5min.
- The staffing simulator must be described as formula-based, not AI.
- Public display must show token numbers only.
- Multilingual implementation should prioritize the citizen flow.

Hackathon compliance:
- Treat the existing application as a pre-event practice prototype.
- The official eligible implementation must begin during the hackathon window.
- Include a 36-hour implementation sequence.
- Do not claim pre-event code was developed during the event.

Acceptance tests must be written in Given/When/Then format.
The demo flow must fit within three minutes.

After creating the documentation, report:
- Files created
- Major prioritization decisions
- Any conflicts or unresolved product decisions

Do not change application code.
```

This gives us one permanent source of truth, so the original features, your friend’s suggestions and the Unfair Advantage Pack do not get lost or implemented randomly.