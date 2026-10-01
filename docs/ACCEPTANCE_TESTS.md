# Acceptance Tests (MVP)

## 1. Citizen Flow
- **TC-01:** Citizen can successfully load the "Take Token" screen and view available Offices/Services.
- **TC-02:** Submitting a token request with valid phone and consent successfully creates a token with status `ISSUED`.
- **TC-03:** Citizen can view their real-time "Token Status" screen and see `tokensAhead` and `etaSeconds` matching the backend queue logic.
- **TC-04:** If a citizen cancels their token, the status immediately updates to `CANCELLED` and they are removed from the active queue.

## 2. Admin & Queue Management
- **TC-05:** Admin can successfully login and view the "Queue Dashboard".
- **TC-06:** Calling the next token updates the top `ISSUED` token to `CALLED`, triggering an update for all subsequent tokens' `tokensAhead` and `etaSeconds`.
- **TC-07:** Admin marking a token as `DONE` removes it from the active line entirely.
- **TC-08:** Admin marking a token as `NO_SHOW` removes it from the active line entirely.

## 3. Reminder Dispatch & Truthfulness
- **TC-09:** Clicking "Run Reminder Check Now" accurately triggers the 60s reminder for a token if `etaSeconds <= 60` and `reminder60SentAt` is null.
- **TC-10:** Clicking "Run Reminder Check Now" accurately triggers the 30s reminder for a token if `etaSeconds <= 30` and `reminder30SentAt` is null.
- **TC-11:** If a user opted out of WhatsApp/SMS or withheld consent, a `SKIPPED` log is written to the `NotificationLog`, and no API call is made to Twilio.
- **TC-12:** If the Twilio API request fails (e.g., bad number), a `FAILED` log is securely written to the `NotificationLog` with the error reason.
- **TC-13:** A successful dispatch writes a `SENT` log to the `NotificationLog` containing the Provider Message ID.
- **TC-14:** Reminders are strictly idempotent; a 60s or 30s reminder is never sent twice for the same token.

## 4. ETA Math Verification
- **TC-15:** Given `avgServiceSeconds = 20` and `activeCounters = 1`, a token with 3 `tokensAhead` must have an exact `etaSeconds` of 60.
