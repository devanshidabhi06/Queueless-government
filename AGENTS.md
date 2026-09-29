# AGENTS.md — QueueLess (PS2) Shared Architecture + Rules

Project: QueueLess Government Office
Goal: Virtual token + live ETA + WhatsApp/SMS reminders to reduce physical waiting and missed turns.

This file is the shared architecture + operating rules.
- Do NOT store agent personas here.
- Do NOT overwrite this file.
- Agent personas live in `directives/`.

---

## 1) Product Scope (MVP)

### Core user stories
Citizen:
1) Select office + service, request a virtual token.
2) See token number, tokens ahead, ETA seconds, status.
3) Receive reminders when ETA is near (demo thresholds).

Admin/Counter:
1) View live queue by office + service.
2) Call next token, mark served, mark no-show.
3) View Notification Log.
4) Run reminder check deterministically for demo.

### Explicit out-of-scope
- Real government system integration (this is a prototype).
- Identity verification (Aadhaar/KYC).
- “AI prediction” claims. ETA is explainable queue math.
- Production-grade India SMS DLT compliance implementation (we will not claim production readiness).

---

## 2) Demo Mode Rules (Hackathon)
To make the reminder feature show instantly during judging:
- DEMO reminder thresholds:
  - Reminder A triggers at <= 60 seconds
  - Reminder B triggers at <= 30 seconds
- Demo mode must be DISCLOSED in demo notes.
- In a real deployment thresholds would be 10 min / 5 min.

The reminder check MUST be triggerable deterministically:
- When queue changes (token issued / served / no-show / counters changed)
- AND via an admin button/endpoint: "Run Reminder Check Now"

---

## 3) Tech Stack (recommended)
Frontend: React / Next.js + Tailwind
Backend: Node (Express OR Next API routes)
DB: SQLite + Prisma (preferred for reliable local demo)
Notifications: Twilio (WhatsApp sandbox + SMS where possible)

All secrets in `.env`. Never commit `.env`.

---

## 4) Repository Layout (suggested)
- /client      (frontend app)  [if using separate FE]
- /server      (backend app)   [if using separate BE]
- /docs        (PRD, API contract, schema, demo script, acceptance tests)
- /directives  (agent persona files; SOPs)
- /.tmp        (temporary files; never commit)

If using a single Next.js fullstack app, adjust to:
- /app or /src/app (UI + API routes)
but keep docs/directives/tmp.

---

## 5) Data Model (minimum fields)

### Office
- id (uuid)
- name
- createdAt

### Service
- id (uuid)
- officeId (fk)
- name
- avgServiceSeconds (int, default demo-friendly, e.g. 20)
- activeCounters (int, default 1)
- createdAt

### Token
- id (uuid)
- officeId (fk)
- serviceId (fk)
- tokenNumber (string, e.g. A-023)
- name (nullable)
- phone (string)
- status (enum): ISSUED | CALLED | DONE | NO_SHOW | CANCELLED
- notifyWhatsApp (bool)
- notifySms (bool)
- consentGiven (bool)
- reminder60SentAt (nullable datetime)
- reminder30SentAt (nullable datetime)
- createdAt
- calledAt (nullable)
- servedAt (nullable)

### NotificationLog
- id (uuid)
- tokenId (fk)
- channel (enum): WHATSAPP | SMS
- thresholdSeconds (int): 60 or 30
- status (enum): SENT | FAILED | SKIPPED
- providerMessageId (nullable string)
- error (nullable string)
- createdAt

(Optional) EventLog for audits:
- tokenId, type, actor, createdAt

---

## 6) ETA Logic (explainable)
For a given service queue:
- tokensAhead = count of active tokens in front of this token
- etaSeconds = ceil((tokensAhead / activeCounters) * avgServiceSeconds)

Show ETA as a range if desired, but the stored value is etaSeconds.

---

## 7) Reminder Logic (DEMO thresholds)
For each active token:
Send reminder at 60s if:
- consentGiven = true
- notifyWhatsApp or notifySms is enabled
- etaSeconds <= 60
- reminder60SentAt is null

Send reminder at 30s if:
- etaSeconds <= 30
- reminder30SentAt is null

Never send twice; set timestamps.
Always write a NotificationLog record for each attempted send:
- SENT if provider succeeded
- FAILED with error text if provider failed
- SKIPPED if user opted out / no consent / channel disabled

Provider failures must not break core queue functionality.

---

## 8) API Contract (canonical list)
Public (Citizen):
- GET  /api/meta/offices
- GET  /api/meta/services?officeId=...
- POST /api/citizen/tokens
- GET  /api/citizen/tokens/:tokenId
- POST /api/citizen/tokens/:tokenId/cancel (optional)

Admin:
- POST /api/admin/login
- GET  /api/admin/queue?officeId=...&serviceId=...
- POST /api/admin/queue/call-next
- POST /api/admin/tokens/:tokenId/serve
- POST /api/admin/tokens/:tokenId/no-show
- POST /api/admin/reminders/run?officeId=...&serviceId=...
- GET  /api/admin/notifications?officeId=...&serviceId=...

Exact request/response JSON lives in `docs/API_CONTRACT.md`.

---

## 9) Twilio / Messaging Guardrails
- All Twilio credentials are read from `.env`.
- WhatsApp sandbox: recipients must join sandbox before receiving messages.
- If WhatsApp/SMS delivery fails, the Notification Log must still show attempt + error truthfully.
- Include consent/opt-out copy in UI.

---

## 10) Definition of Done (MVP)
A build is acceptable only if:
- Citizen can create token and view status + ETA
- Admin can call/serve/no-show tokens
- Reminder check triggers logs; at least WhatsApp works during demo (ideal)
- Notification Log screen displays attempts with status
- README + demo steps exist
- Main branch is demoable

End of AGENTS.md.