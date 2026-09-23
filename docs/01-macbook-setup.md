# Step 1 — Set up your MacBook as the iMessage relay

Time: ~20 minutes.

## 1. Check iMessage works

Open **Messages** on the MacBook, sign in with the Apple ID you want to use
for business texting, and send a test iMessage to a friend. If it sends blue
from the Mac, you're good.

> ⚠️ Whatever Apple ID is signed in here is the identity your leads will text
> with. If you use your personal Apple ID, business and personal messages
> share an account. That's fine for testing; consider a dedicated business
> Apple ID for the permanent Mac mini later.

## 2. Install the BlueBubbles server

1. Download the latest server from <https://bluebubbles.app/downloads/server>
   (it's free and open source).
2. Open the app. macOS will ask for several permissions — grant them all,
   especially **Full Disk Access** (System Settings → Privacy & Security →
   Full Disk Access → enable BlueBubbles). It needs this to read the
   Messages database.
3. In the BlueBubbles app, set a **server password** — save it, this goes in
   the bridge's `.env` as `BLUEBUBBLES_PASSWORD`.
4. Note the local port (default `1234`).

Optional but recommended: in BlueBubbles settings, enable the **Private API**
(follow its built-in helper). This gives more reliable sending. Without it,
BlueBubbles falls back to AppleScript automation, which still works.

## 3. Keep the Mac awake

The relay only works while the Mac is awake and online.

- System Settings → **Displays → Advanced** → "Prevent automatic sleeping when
  the display is off" → ON (on laptops: Battery → Options → same setting while
  on power adapter).
- Keep the MacBook **plugged in**.
- If you want to close the lid, that normally sleeps a MacBook — either leave
  it open, or run it in clamshell mode connected to power. The free app
  **Amphetamine** (Mac App Store) can also force it to stay awake.
- System Settings → General → Login Items: add BlueBubbles so it starts on
  boot, and enable automatic login so a power outage recovers by itself.

## 4. Expose the bridge to the internet (free)

GoHighLevel's webhooks must be able to reach the bridge over HTTPS. Easiest
free option is a **Cloudflare Tunnel**:

```bash
brew install cloudflared
cloudflared tunnel --url http://localhost:3000
```

That prints a public `https://….trycloudflare.com` URL — that's your
`PUBLIC_URL` for the bridge `.env`. (Quick tunnels get a new URL each run;
for the permanent setup, create a named tunnel with a stable hostname, or use
ngrok with a reserved domain.)

## 5. Point BlueBubbles' webhook at the bridge

In the BlueBubbles server app → **API & Webhooks → Webhooks → Add**:

- URL: `https://YOUR-PUBLIC-URL/webhooks/bluebubbles?secret=YOUR_WEBHOOK_SECRET`
- Event: **New Messages**

(Do this after you've started the bridge in Step 3 of the docs so the URL
actually resolves.)

Next → [Step 2: GoHighLevel setup](02-ghl-setup.md)
