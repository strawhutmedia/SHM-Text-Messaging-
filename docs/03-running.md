# Step 3 — Run the bridge

Time: ~10 minutes. Run this on the MacBook itself (simplest), or on any
always-on machine that can reach the MacBook's BlueBubbles port.

## 1. Install and configure

```bash
# On the Mac (install Node.js first if needed: https://nodejs.org or `brew install node`)
git clone <this repo>
cd SHM-Text-Messaging-
npm install
cp .env.example .env
open -e .env   # fill in every value — see comments in the file
```

## 2. Start it

```bash
npm start
```

You should see:

```
SHM iMessage bridge listening on port 3000
Health check:        http://localhost:3000/health
```

Check health: `curl http://localhost:3000/health` — it should report
`"bluebubbles": "connected"`. (`"ghl": "not installed yet"` is expected until
you finish the OAuth install in the Step 2 guide.)

## 3. End-to-end test

1. Make sure the tunnel (`cloudflared`) is running and the URLs in your GHL
   app + BlueBubbles webhook match the current `PUBLIC_URL`.
2. **Inbound:** text your business Apple ID's number/email from a friend's
   iPhone → within a few seconds it should appear in GHL → Conversations
   (a new contact is created if the number is unknown).
3. **Outbound:** reply from the GHL Conversations tab → it should arrive on
   the friend's iPhone as a **blue** message.
4. Watch the bridge terminal — every message logs a `→`/`←` line with
   success (`✓`) or failure (`✗`) detail.

## 4. Keep it running (permanent setup)

On the dedicated Mac (mini), run the bridge as a launchd service so it starts
on boot. Quick version with `pm2`:

```bash
npm install -g pm2
pm2 start src/index.js --name imessage-bridge
pm2 startup   # follow the printed instruction
pm2 save
```

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| `/health` says bluebubbles unreachable | BlueBubbles app not running, wrong port/password in `.env` |
| Outbound stays "pending" in GHL, no log line | GHL delivery URL wrong/stale tunnel URL, or provider not set as default |
| Bridge logs `✗ send failed` | Recipient may not be iMessage-capable (Android), or Private API needs re-setup after a macOS update |
| Inbound not appearing in GHL | BlueBubbles webhook URL wrong/missing secret, or app not installed (no tokens) |
| Everything broke after a macOS update | Re-grant Full Disk Access and re-run BlueBubbles Private API helper |
