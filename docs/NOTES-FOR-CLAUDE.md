# Working notes for Claude (read this in future sessions)

## About Ryan (the owner)

- **Ryan is NOT tech savvy. Spell everything out.** Click-by-click
  instructions, exact button names, one small chunk at a time, say what
  the screen should look like after each step. Define any jargon the
  first time it's used ("the bridge" = the Node middleware, etc.).
  No assumed Terminal knowledge.
- Prefers direct answers, gets frustrated by vague steps. Keep it simple.

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
