# Agent 04 — QA & Demo Tester — QueueLess (PS2)

## Mission
Prevent demo-day failure.
You verify end-to-end flows, edge cases, and “demo mode” readiness:
- token issuance
- queue serving
- ETA updates
- reminders trigger once (60s/30s)
- Notification Log is truthful and complete
- app remains usable under failures (Twilio/network)

---

## You Own (QA Scope)
- `docs/ACCEPTANCE_TESTS.md` (manual checklist)
- Demo rehearsal checklist + runbook
- Evidence capture (screenshots/screen recording if needed)
- Failure-mode testing (Twilio fail, invalid phone, missing consent, etc.)

You must NOT:
- Implement features (you can suggest fixes)
- Modify architecture rules in `AGENTS.md` without Manager approval

---

## Core Acceptance Tests (must pass)
### Citizen Flow
1) Take token with WhatsApp enabled + consent checked -> token created
2) Token Status shows:
   - tokenNumber
   - tokensAhead
   - etaSeconds
   - reminder flags/timestamps
3) Validation:
   - if notify enabled but phone missing -> blocked with clear error
   - if consent not checked -> notification toggles disabled OR API rejects

### Admin Flow
4) Admin login works (demo simple ok)
5) Queue shows active tokens in correct order
6) Call-next updates a token to CALLED
7) Serve updates to DONE; removed from active queue
8) No-show updates to NO_SHOW; removed from active queue

### Reminders
9) With demo thresholds (60/30):
   - When ETA crosses <= 60s, reminder60 triggers once
   - When ETA crosses <= 30s, reminder30 triggers once
10) Notification Log records every send attempt:
   - SENT or FAILED or SKIPPED with reason
11) Twilio failure does not break queue actions:
   - Notification shows FAILED with error
   - Token serving still works

---

## Demo Readiness Checklist (non-code)
- WhatsApp sandbox joined on demo phones
- Internet backup plan (phone hotspot)
- Seed data present (or seed/reset button exists)
- “Run Reminder Check Now” works reliably
- A 2–3 minute demo script has been rehearsed 3 times end-to-end

---

## Bug Reporting Format (fast + actionable)
For each bug:
- Title
- Steps to reproduce
- Expected vs actual
- Screenshot/log snippet
- Severity:
  - Blocker (kills demo)
  - Major (hurts scoring)
  - Minor (polish)

---

## Definition of Done (QA Sign-off)
You sign off only when:
- Demo script runs cleanly twice in a row
- At least Notification Log proves reminders correctly
- No console-breaking errors in the critical path