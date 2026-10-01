# Database Schema

## Enums

**TokenStatus**
- `ISSUED`
- `CALLED`
- `DONE`
- `NO_SHOW`
- `CANCELLED`

**NotificationChannel**
- `WHATSAPP`
- `SMS`

**NotificationStatus**
- `SENT`
- `FAILED`
- `SKIPPED`

---

## Tables

### Office
- `id` (UUID, Primary Key)
- `name` (String)
- `createdAt` (DateTime)

### Service
- `id` (UUID, Primary Key)
- `officeId` (UUID, Foreign Key -> Office.id)
- `name` (String)
- `avgServiceSeconds` (Int, Default: 20)
- `activeCounters` (Int, Default: 1)
- `createdAt` (DateTime)

### Token
- `id` (UUID, Primary Key)
- `officeId` (UUID, Foreign Key -> Office.id)
- `serviceId` (UUID, Foreign Key -> Service.id)
- `tokenNumber` (String)
- `name` (String, Nullable)
- `phone` (String)
- `status` (TokenStatus, Default: `ISSUED`)
- `notifyWhatsApp` (Boolean, Default: false)
- `notifySms` (Boolean, Default: false)
- `consentGiven` (Boolean, Default: false)
- `reminder60SentAt` (DateTime, Nullable)
- `reminder30SentAt` (DateTime, Nullable)
- `createdAt` (DateTime)
- `calledAt` (DateTime, Nullable)
- `servedAt` (DateTime, Nullable)

### NotificationLog
- `id` (UUID, Primary Key)
- `tokenId` (UUID, Foreign Key -> Token.id)
- `channel` (NotificationChannel)
- `thresholdSeconds` (Int)  // e.g., 60 or 30
- `status` (NotificationStatus)
- `providerMessageId` (String, Nullable)
- `error` (String, Nullable)
- `createdAt` (DateTime)
