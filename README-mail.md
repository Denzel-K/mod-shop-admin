# Mail API and Setup

This admin app now exposes endpoints to support the Mod-Shop contact form, centralizing email processing.

## Endpoints

- POST `/api/mail/submit`
  - Public CORS-enabled endpoint to receive contact form submissions from the Mod-Shop website.
  - Body: `{ name, email, company?, subject?, message }`
  - Side effects:
    - Stores the message in MongoDB (`models/Message.ts`).
    - Sends a notification email to the official inbox (`SMTP_FROM`).

- GET `/api/mail/messages`
  - Admin-authenticated (JWT cookie) list endpoint with optional filters `q`, `status`, `page`, `pageSize`.

- POST `/api/mail/messages/[id]/reply`
  - Admin-authenticated endpoint to send a reply back to the original sender. Adds the reply to the message document and sets status to `replied`.

## Environment Variables

Add to `.env.local` for admin app:

- `ALLOWED_CONTACT_ORIGINS` — Optional. Comma-separated origins allowed to call `/api/mail/submit`. Defaults to `*` for development.
- Existing SMTP variables are used: `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`.

In the Mod-Shop app, configure:

- `NEXT_PUBLIC_ADMIN_API_BASE` — Base URL of the admin app (e.g., `http://localhost:3001` or your deployed admin domain).

## UI

- New page at `/mail` lists messages and allows replying.
- Dashboard header now includes a `Mail` link (`components/dashboard/TopBar.tsx`).

## Notes

- Ensure `MONGODB_URI` and `JWT_SECRET` are configured for admin.
- The admin endpoints use the `auth-token` cookie (see `app/api/auth/login/route.ts`).
- For CORS in production, set `ALLOWED_CONTACT_ORIGINS` to your Mod-Shop domain.
