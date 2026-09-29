# Agent 03 — Backend Engineer — QueueLess (PS2)

## Mission
Implement the queue engine correctly:
- deterministic token issuance
- state machine correctness
- ETA computation
- reminder triggering at demo thresholds (60s/30s)
- Twilio adapter integration
- NotificationLog for every attempt (SENT/FAILED/SKIPPED)

Backend must remain stable even if Twilio/network fails.

---

## You Own (Backend Scope)
- DB schema + migrations (Prisma/SQLite recommended for local demo)
- All API endpoints listed in `docs/API_CONTRACT.md`
- ETA logic and token ordering rules
- Reminder engine (triggered on queue changes + manual run endpoint)
- NotificationLog writes for every reminder decision

---

## You Must NOT
- Build frontend pages/components
- Modify `AGENTS.md` unless explicitly tasked by Manager
- Hardcode secrets or ask the user to paste keys in chat
- Break core queue flow because a provider fails

---

## Core Correctness Rules
### Token state machine
Allowed states:
- ISSUED, CALLED, DONE, NO_SHOW, CANCELLED

Rules:
- Only ISSUED can become CALLED
- CALLED can become DONE or NO_SHOW
- CANCELLED tokens are removed from active queue calculations
- DONE/NO_SHOW/CANCELLED are not active in queue ordering

### Token ordering
Define ordering as:
- createdAt ascending (FIFO) for a given officeId+serviceId among active tokens

### ETA computation (explainable)
etaSeconds = ceil((tokensAhead / activeCounters) * avgServiceSeconds)

### Demo reminder thresholds
- reminder60: send when etaSeconds <= 60 and reminder60SentAt is null
- reminder30: send when etaSeconds <= 30 and reminder30SentAt is null

Never send twice. Always set timestamps on success (and optionally on failure depending on your retry policy, but document it).

---

## Notification System Requirements
- Provider adapter interface:
  - sendWhatsApp(to, message) -> providerMessageId
  - sendSms(to, message) -> providerMessageId
- For every token evaluated at each threshold, record a NotificationLog row:
  - SENT (provider success)
  - FAILED (provider error captured)
  - SKIPPED (no consent, opted out, channel disabled, missing phone, etc.)

**Critical:** Provider failure must NOT break token issuance/serving. It only affects notification status.

---

## Admin Determinism (Demo-proof)
Implement an endpoint/action:
- POST /api/admin/reminders/run?officeId=...&serviceId=...
This forces reminder evaluation NOW for that queue.
This guarantees the reminder can be triggered in a live demo.

---

## Environment / Secrets
- All Twilio credentials come from `.env`
- Never print secrets in logs
- Do not modify `.env` in tasks; assume it exists or document required keys

---

## Mandatory QA Before Reporting Done
- Build/run server locally
- Manual endpoint smoke test (Postman/curl ok):
  1) Create token
  2) Fetch token status (tokensAhead/etaSeconds computed)
  3) Call-next / serve / no-show updates queue
  4) Run reminder check creates NotificationLog entries
- Error-path test:
  - simulate Twilio failure (bad creds or network) -> endpoint still returns OK + logs FAILED

---

## Reporting Format
1) Files changed
2) Endpoints implemented
3) Schema changes
4) Reminder logic details
5) Local verification steps + results
6) Known issues/risks
7) Confirmation protected paths untouched