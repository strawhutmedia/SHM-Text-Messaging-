# Working notes for Claude (read this in future sessions)

## About Ryan (the owner)

- **Ryan is NOT tech savvy. Spell everything out.** Click-by-click
  instructions, exact button names, one small chunk at a time, say what
  the screen should look like after each step. Define any jargon the
  first time it's used ("the bridge" = the Node middleware, etc.).
  No assumed Terminal knowledge.
- Prefers direct answers, gets frustrated by vague steps. Keep it simple.

## MILESTONE 2026-09-26: END-TO-END WORKING 🎉

- Inbound tested: iMessage → Mac → bridge → GHL conversation (✓ synced, contact auto-created)
- Outbound tested: GHL reply → bridge → Mac → delivered to iPhone as iMessage
- Mac Messages now signed into BUSINESS Apple ID: ryan@strawhutmedia.com
  (email-only identity, no phone number; personal gmail account removed from Mac)
- BlueBubbles webhook now points at http://localhost:3000 (tunnel-proof)
- Firebase configured via Manual Setup (project bluebubbles-3d094, Google
  account ryan@strawhutmedia.com) so BB clients auto-discover server URL
- BlueBubbles web client (bluebubbles.app/web) for Ryan + Caroline (group
  chats live here, not in GHL). Initial 4.6k-chat sync is slow/sticky.
- Known cosmetic bug: BB Home shows stale "iMessage Email" (old gmail) — harmless
- Remaining: permanence pass (stable tunnel for GHL delivery URL, pm2/launchd
  auto-start for bridge+tunnel, Mac mini + optional SIM for phone-number identity)
- GHL delivery URL must be re-pointed whenever bridge tunnel restarts
  (marketplace app → Modules → Conversation Providers → iMessage → Delivery URL)

## Project state (as of 2026-09-23)

- MacBook Pro is the TEST relay. Plan: buy used M1 Mac mini later as
  permanent relay.
- BlueBubbles server: installed, wizard complete, Full Disk Access
  granted, Private API OFF (SIP not disabled — fine, using AppleScript
  fallback). Auto-start = Launch Agent, Keep macOS Awake = on.
- Bridge: cloned at `~/shm-imessage-bridge` on branch
  `claude/ghl-imessage-integration-j3uQJ`, deps installed, runs with
  `npm start`, health showed bluebubbles connected.
- Tunnel: cloudflared quick tunnel in a Terminal tab:
  `https://algorithm-looksmart-bargain-inn.trycloudflare.com`
  (changes every restart — re-check before reusing).
- Terminal tab layout: Tab 1 = bridge (npm start), Tab 2 = spare shell,
  Tab 3 = cloudflared tunnel.
- Credentials: see docs/CREDENTIALS.md (BlueBubbles password + webhook
  secret recorded there; GHL keys pending).
- Remaining: BlueBubbles webhook → bridge, GHL marketplace app
  (OAuth keys, scopes, conversation provider), .env completion,
  app install via chooselocation URL, end-to-end test.
- Apple ID on the Mac is Ryan's personal one (ryan.t.tillotson@gmail.com)
  — fine for testing; suggest dedicated business Apple ID for the
  permanent Mac mini.
