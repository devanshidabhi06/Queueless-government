# QueueLess - Product Requirements Document (MVP)

## 1. Product Overview
QueueLess is a virtual token system designed for government offices to reduce physical waiting times and missed turns. The system predicts waiting times using explainable queue mathematics, issues virtual tokens, and sends proactive notifications (via WhatsApp and SMS) when a citizen's turn approaches.

**Note on ETA Prediction**: We do not claim this is "AI prediction." The ETA calculation relies purely on explainable queue math based on current wait lines and average service times.

## 2. Core Screens (MVP Scope)

### 2.1 Citizen Interface
- **Take Token Screen**: Allows selection of Office and Service, captures citizen's phone number, communication preferences (WhatsApp/SMS), and consent.
- **Token Status Screen**: Displays real-time status including the issued token number, tokens currently ahead, exact ETA in seconds, and current token state.

### 2.2 Admin Interface
- **Login Screen**: Simple authentication to secure admin endpoints.
- **Queue Dashboard**: Live view of the current queue filtered by Office and Service. Allows admins to manage the queue.
- **Notification Log**: A detailed, truthful audit log showing all attempted outgoing messages, their destination, and actual delivery status (`SENT`, `FAILED`, `SKIPPED`).

## 3. Reminder Behavior
To ensure a reliable and fast-paced presentation for the 36-hour hackathon, we employ aggressive demonstration thresholds:
- **Reminder A (60s)**: Triggered exactly once when `etaSeconds <= 60`, provided consent and valid channel are selected, and `reminder60SentAt` is null.
- **Reminder B (30s)**: Triggered exactly once when `etaSeconds <= 30` and `reminder30SentAt` is null.
*(Note: These 60s/30s thresholds are strictly for the demo. Real-world implementations would use 10m/5m thresholds. This must be disclosed during the demo.)*

- **Truthfulness**: We never claim a message is delivered unless confirmed by the provider. The `NotificationLog` is the ultimate source of truth.

## 4. Deterministic Demo Control
To guarantee the reminder feature can be showcased instantly during judging without waiting for natural queue decay, the system includes a deterministic "Run Reminder Check Now" admin action. This is available via an endpoint and a button on the Admin Dashboard.

## 5. ETA Logic
ETA is continuously recalculated for any active token using the following explainable formula:
`etaSeconds = ceil((tokensAhead / activeCounters) * avgServiceSeconds)`
*(Where `tokensAhead` is the count of active tokens in front of the current token.)*

## 6. Out-of-Scope (To Prevent Feature Creep)
- **Government Integration**: No real system connectivity (prototype only).
- **Identity Verification**: No Aadhaar or external KYC integrations.
- **Machine Learning**: No AI models for predictive wait times.
- **Production DLT Compliance**: No India DLT SMS compliance pipelines (using sandbox/basic Twilio where feasible).
- **Complex Authentication**: No citizen login or RBAC for admins; basic auth suffices for demo.
