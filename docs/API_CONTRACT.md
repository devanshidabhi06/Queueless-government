# API Contract

All JSON endpoints strictly return standard `application/json` responses.

## 1. Public (Citizen) Endpoints

### `GET /api/meta/offices`
Retrieves a list of all available government offices.
**Response**:
```json
{
  "offices": [
    { "id": "uuid-1", "name": "RTO Bangalore" }
  ]
}
```

### `GET /api/meta/services?officeId={id}`
Retrieves a list of services available at a specific office.
**Response**:
```json
{
  "services": [
    { "id": "uuid-2", "name": "License Renewal", "avgServiceSeconds": 20, "activeCounters": 1 }
  ]
}
```

### `POST /api/citizen/tokens`
Generates a new token for a citizen.
**Request**:
```json
{
  "officeId": "uuid-1",
  "serviceId": "uuid-2",
  "name": "Jane Doe",
  "phone": "+919876543210",
  "notifyWhatsApp": true,
  "notifySms": false,
  "consentGiven": true
}
```
**Response**:
```json
{
  "token": {
    "id": "uuid-3",
    "tokenNumber": "A-024",
    "status": "ISSUED",
    "tokensAhead": 3,
    "etaSeconds": 60
  }
}
```

### `GET /api/citizen/tokens/:tokenId`
Retrieves the real-time status of a token.
**Response**:
```json
{
  "token": {
    "id": "uuid-3",
    "tokenNumber": "A-024",
    "status": "ISSUED",
    "tokensAhead": 1,
    "etaSeconds": 20,
    "calledAt": null
  }
}
```

### `POST /api/citizen/tokens/:tokenId/cancel`
Allows a citizen to cancel their own token before it is called.
**Response**:
```json
{
  "success": true,
  "status": "CANCELLED"
}
```

---

## 2. Admin Endpoints

### `POST /api/admin/login`
**Request**: `{ "password": "demo" }`
**Response**: `{ "token": "jwt-or-session-token" }`

### `GET /api/admin/queue?officeId={id}&serviceId={id}`
Retrieves the live queue of active tokens.
**Response**:
```json
{
  "queue": [
    { "id": "uuid-3", "tokenNumber": "A-024", "status": "ISSUED" }
  ]
}
```

### `POST /api/admin/queue/call-next`
Calls the next token in line.
**Request**: `{ "officeId": "uuid-1", "serviceId": "uuid-2" }`
**Response**:
```json
{
  "calledToken": { "id": "uuid-x", "tokenNumber": "A-023", "status": "CALLED" }
}
```

### `POST /api/admin/tokens/:tokenId/serve`
Marks a currently called token as completed.
**Response**: `{ "success": true, "status": "DONE" }`

### `POST /api/admin/tokens/:tokenId/no-show`
Marks a currently called token as a no-show.
**Response**: `{ "success": true, "status": "NO_SHOW" }`

### `POST /api/admin/reminders/run?officeId={id}&serviceId={id}`
Deterministically forces a reminder check for all active tokens in the queue.
**Response**:
```json
{
  "success": true,
  "processedCount": 5,
  "messagesAttempted": 2
}
```

### `GET /api/admin/notifications?officeId={id}&serviceId={id}`
Retrieves the notification log for auditing messaging attempts.
**Response**:
```json
{
  "logs": [
    {
      "id": "uuid-4",
      "tokenId": "uuid-3",
      "channel": "WHATSAPP",
      "status": "SENT",
      "createdAt": "2026-09-29T21:00:00Z"
    }
  ]
}
```
