# SHM iMessage Bridge — Credentials Record

Recorded at Ryan's request so this project has a saved copy.
(Note: this repo is private, but anyone with repo access can read these.)

| Credential | Value | Used where |
|---|---|---|
| BlueBubbles server password | `$4ForLife` | BlueBubbles app on the MacBook; `.env` → `BLUEBUBBLES_PASSWORD` |
| Webhook shared secret | `8a66c63bc2b1365d973b82b3295cb098965fc5009c36627a` | `.env` → `WEBHOOK_SECRET`; appended to both webhook URLs (`?secret=...`) |

Still to be added during GHL setup:

| Credential | Value | Used where |
|---|---|---|
| GHL Client ID | _(pending)_ | `.env` → `GHL_CLIENT_ID` |
| GHL Client Secret | _(pending)_ | `.env` → `GHL_CLIENT_SECRET` |
| GHL Conversation Provider ID | _(pending)_ | `.env` → `GHL_CONVERSATION_PROVIDER_ID` |
