# Demo Script (QueueLess)

**Target Duration**: 2-3 minutes
**Goal**: Demonstrate end-to-end token creation, ETA updates, deterministic reminder dispatch, and log transparency.

## 1. Demo Preparation Checklist
- [ ] **Twilio Sandbox**: Ensure the demo device (judge's phone or secondary device) has joined the Twilio WhatsApp sandbox by sending the join code.
- [ ] **Hotspot Backup**: Have a reliable 5G mobile hotspot active.
- [ ] **Seed Data**: Run the database seeder to ensure at least 1 Office and 1 Service exist. Create 3 dummy tokens ahead of time so the queue isn't completely empty.
- [ ] **Environment**: Ensure `.env` is loaded with correct Twilio keys and the backend is running locally.

## 2. Script & Walkthrough

**Step 1: Introduction (30 seconds)**
- Open the Citizen App.
- *Speaker Track*: "QueueLess eliminates physical waiting via virtual tokens. We calculate ETA using simple queue math—no AI black boxes. Let's join the line for License Renewal."

**Step 2: Token Creation (45 seconds)**
- Select Office and Service.
- Enter Phone Number, toggle WhatsApp, check Consent, and Submit.
- *Speaker Track*: "I've received token A-004. The screen shows exactly how many people are ahead and my ETA in seconds."

**Step 3: Admin & ETA Math (45 seconds)**
- Switch to Admin Dashboard. Call the first dummy token.
- *Speaker Track*: "As an admin calls the next person, the queue moves. If we switch back to the citizen view, the ETA mathematically updates."

**Step 4: Deterministic Reminders (60 seconds)**
- *Speaker Track*: "To respect your time today, our demo thresholds trigger reminders at 60 seconds and 30 seconds (instead of real-world 10 minutes/5 minutes). Watch this."
- In Admin dashboard, click **Run Reminder Check Now**.
- Show the demo phone receiving the WhatsApp message instantly.
- Navigate to the **Notification Log** screen.
- *Speaker Track*: "We don't claim messages are sent unless they are. Our log shows real-time Twilio statuses—SENT, FAILED, or SKIPPED if consent wasn't given."

**Step 5: Conclusion (15 seconds)**
- Serve the token to finalize the flow.
- End demo.
