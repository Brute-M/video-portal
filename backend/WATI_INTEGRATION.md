# WATI (WhatsApp API) Integration

This document describes the WATI webhook and contact sync integration with the existing registration flow.

## Behaviour

- **Registration**: When a **website** user registers (i.e. `isFromLandingPage` is `false`) via `POST /api/auth/register` (or `/auth/register`), the backend creates/updates a contact in WATI with:
  - **Name** (from `fname` + `lname`)
  - **Phone** (from `mobile`; normalized to digits only, country code with no `+`)
  - **Custom attributes**: `Email`, `PaymentStatus` (paid/unpaid)
- **Payment**: When payment is verified (`POST /api/payment/verify-landing`), the user’s WATI contact is updated to `PaymentStatus: paid` **only for website registrations** (i.e. when `isFromLandingPage` is `false`). Landing-page users are not synced on payment.
- **Webhook**: WATI can send events to our backend; we log them and respond `200 OK`.

## Environment Variables

Add to your `.env` (backend):

```env
# Required for contact sync
WATI_BASE_URL=https://live-server-XXXXX.wati.io
WATI_API_KEY=your_api_key

# Optional: send template message after registration by payment status
WATI_TEMPLATE_PAID=your_paid_template_name
WATI_TEMPLATE_UNPAID=your_unpaid_template_name
WATI_CHANNEL_NUMBER=your_whatsapp_channel_number
```

- **WATI_BASE_URL**: From WATI Dashboard → Settings → API (e.g. `https://live-server-XXXXX.wati.io`).
- **WATI_API_KEY**: API token from the same place.
- **WATI_CHANNEL_NUMBER**: Your WhatsApp business number (with country code, no `+`). Required only if you use template messages.
- **WATI_TEMPLATE_PAID** / **WATI_TEMPLATE_UNPAID**: Approved template names in WATI. If set, the corresponding template is sent after contact sync.

If `WATI_BASE_URL` or `WATI_API_KEY` is missing, contact sync and template send are skipped (no errors thrown).

## Webhook URL

Configure in WATI Dashboard:

- **URL**: `https://<your-domain>/api/wati/webhook`
- **Method**: POST
- **Events**: Enable as needed (e.g. Contact Created, Message Received, Message Sent, Template Message Status).

The backend always responds with **HTTP 200 OK** and logs the payload. Use HTTPS in production.

## WATI Dashboard – Custom Contact Attributes

Create these custom attributes in WATI (exact names):

- **Email**
- **PaymentStatus**

They are set automatically when we create/update contacts from registration and payment verification.

## API Endpoints (Backend)

| Endpoint | Purpose |
|----------|--------|
| `POST /api/auth/register` | Existing registration; after save, syncs contact to WATI (and optional template). |
| `POST /api/wati/webhook` | Inbound WATI webhook; log and return 200. |

## Security

- WATI API key is read from environment only (never committed).
- Webhook is public; validate with WATI signature if they provide one (optional enhancement).
- Use HTTPS only in production.

## Files Touched

- `backend/utils/watiService.js` – WATI API client (contact + optional template).
- `backend/controller/watiWebhookController.js` – Webhook handler.
- `backend/routes/watiRoute.js` – Route for `/api/wati/webhook`.
- `backend/server.js` – Mounts `app.use("/api/wati", watiRoute)`.
- `backend/controller/authController.js` – Calls `syncRegistrationToWati(newUser)` after registration.
- `backend/controller/paymentController.js` – Calls `syncRegistrationToWati(user)` after landing payment verification.
