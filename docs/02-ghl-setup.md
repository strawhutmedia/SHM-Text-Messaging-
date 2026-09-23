# Step 2 — Create the GoHighLevel marketplace app

Time: ~20 minutes. This is free and stays private to your account.

GHL routes custom messaging channels through a **Conversation Provider**,
which lives inside a marketplace developer app. You'll make a private app,
add a conversation provider to it, and install it on your location.

## 1. Create a developer account & app

1. Go to <https://marketplace.gohighlevel.com> and sign in with your GHL
   login → become a developer (free).
2. **Create App**:
   - Distribution type: **Private** (only you can install it)
   - App type: choose the one for sub-accounts (locations)
   - Name: e.g. `SHM iMessage`

## 2. Configure OAuth

In the app's settings:

- **Redirect URL:** `https://YOUR-PUBLIC-URL/oauth/callback`
- **Scopes** — add:
  - `contacts.readonly`
  - `contacts.write`
  - `conversations.readonly`
  - `conversations.write`
  - `conversations/message.readonly`
  - `conversations/message.write`
- Generate a **Client ID** and **Client Secret** → put them in `.env` as
  `GHL_CLIENT_ID` / `GHL_CLIENT_SECRET`.

## 3. Add the Conversation Provider

In the app's left menu → **Conversation Provider** → create one:

- Type: **SMS** (GHL treats our iMessage channel as an SMS-type provider so
  it appears natively in Conversations and workflows)
- Delivery URL: `https://YOUR-PUBLIC-URL/webhooks/ghl?secret=YOUR_WEBHOOK_SECRET`
- Mark it as the provider that should handle conversations.

Copy the **Conversation Provider ID** it generates → `.env` as
`GHL_CONVERSATION_PROVIDER_ID`.

## 4. Install the app on your location

With the bridge already running (Step 3 guide), open this URL in a browser,
substituting your values:

```
https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=https://YOUR-PUBLIC-URL/oauth/callback&client_id=YOUR_CLIENT_ID&scope=contacts.readonly contacts.write conversations.readonly conversations.write conversations/message.readonly conversations/message.write
```

Pick your location → approve → you should land on the bridge's
"✅ Connected!" page. The bridge now has API tokens stored in `data/tokens.json`.

## 5. Make it the default SMS provider (per contact or location)

In your GHL location: **Settings → Phone Numbers / Labs → Conversation
Providers** (naming varies as GHL updates their UI) — select your new
provider as the outbound SMS provider. Any message you type in the
Conversations tab (or send from a workflow SMS action) now routes through
the bridge → iMessage.

> Tip: GHL's UI around custom conversation providers moves around between
> releases. If a menu isn't where this doc says, search "conversation
> provider" in GHL's help docs — the concept is stable even when the menus
> aren't.

Next → [Step 3: Run the bridge](03-running.md)
