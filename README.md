# SHM iMessage Bridge

Send and receive **iMessages (blue bubbles)** from your **GoHighLevel** account,
using your own Mac as the relay — no SendBlue subscription.

```
 GoHighLevel  ──webhook──▶  ┌──────────────────┐  ──REST──▶  BlueBubbles server
 (Conversations tab,        │  This middleware  │             (your Mac, signed
  workflows, contacts)      │  (Node/Express)   │              into iMessage)
 GoHighLevel  ◀──API─────   └──────────────────┘  ◀─webhook─  incoming iMessages
```

- **Outbound:** you type a message in GHL → GHL calls this bridge → the bridge
  tells BlueBubbles to send it → your Mac sends a real iMessage.
- **Inbound:** a lead replies → BlueBubbles sees it on your Mac → calls this
  bridge → the bridge posts it into the GHL conversation (creating the contact
  if needed).

## Setup (three parts, ~1 hour total)

| Step | Guide | Where |
|---|---|---|
| 1. Mac + BlueBubbles | [docs/01-macbook-setup.md](docs/01-macbook-setup.md) | Your MacBook |
| 2. GHL marketplace app | [docs/02-ghl-setup.md](docs/02-ghl-setup.md) | marketplace.gohighlevel.com |
| 3. Run the bridge | [docs/03-running.md](docs/03-running.md) | Your MacBook (for now) |

## Requirements

- A Mac (macOS 11+) that stays **on, awake, and online** — this is the relay;
  when it sleeps, messaging is down. Test on your MacBook, then move to a
  cheap used M1 Mac mini as the permanent relay.
- An Apple ID signed into iMessage on that Mac.
- A GoHighLevel account with a developer/marketplace app (free).
- Node.js 18+ on whatever machine runs this bridge (the Mac itself is fine).

## Important honest caveats

- **Apple's terms don't allow automated business messaging over iMessage.**
  Low-volume conversational use from a normal, aged Apple ID is low risk;
  bulk blasts will get the Apple ID banned. Use this for conversations,
  not campaigns.
- **Blue bubbles only reach iPhones.** Android contacts can't receive
  iMessage — keep GHL's native SMS as a fallback for them.
- macOS updates occasionally require re-doing the BlueBubbles Private API
  setup. Budget 15 minutes after major updates.

## Status

v0.1 — initial scaffold. Supports 1:1 text conversations both directions,
auto-creates GHL contacts for new inbound numbers, reports delivered/failed
status back to GHL. Not yet supported: attachments/MMS, group chats,
read receipts, typing indicators.
