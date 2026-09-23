# SHM iMessage Bridge — Credentials Record

Recorded at Ryan's request so this project has a saved copy.
(Note: this repo is private, but anyone with repo access can read these.)

| Credential | Value | Used where |
|---|---|---|
| BlueBubbles server password | `$4ForLife` | BlueBubbles app on the MacBook; `.env` → `BLUEBUBBLES_PASSWORD` |
| Webhook shared secret | `8a66c63bc2b1365d973b82b3295cb098965fc5009c36627a` | `.env` → `WEBHOOK_SECRET`; appended to both webhook URLs (`?secret=...`) |

GHL marketplace app ("SHM iMessage", private, sub-account):

| Credential | Value | Used where |
|---|---|---|
| GHL Client ID | `6ab424ce53f60610d3d76c91-muehszpf` | `.env` → `GHL_CLIENT_ID` |
| GHL Client Secret | `772f59b2-b2e1-437c-8ba6-75525eb62e05` | `.env` → `GHL_CLIENT_SECRET` |
| GHL Conversation Provider ID | _(pending)_ | `.env` → `GHL_CONVERSATION_PROVIDER_ID` |
| GHL Location ID (Straw Hut Media sub-account) | `TrsMh89uPvyZdZ6Zrlyy` | app install target; token store key |

Marketplace developer login: ryan@strawhutmedia.com (password not recorded here).
