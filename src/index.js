import express from "express";
import { config } from "./config.js";
import * as bb from "./bluebubbles.js";
import * as ghl from "./ghl.js";
import { getAnyLocationId, getTokens } from "./store.js";

const app = express();
app.use(express.json({ limit: "1mb" }));

// Recently-sent BlueBubbles GUIDs, so the echo of our own outbound message
// coming back through the BlueBubbles webhook isn't re-posted into GHL.
const recentlySent = new Set();
function rememberSent(guid) {
  recentlySent.add(guid);
  setTimeout(() => recentlySent.delete(guid), 5 * 60_000).unref();
}

/** Reject webhook calls that don't carry our shared secret. */
function requireSecret(req, res, next) {
  if (req.query.secret !== config.webhookSecret) {
    return res.status(401).json({ error: "bad secret" });
  }
  next();
}

// ── Health ───────────────────────────────────────────────────────
app.get("/health", async (_req, res) => {
  const bbOk = await bb.ping();
  const locationId = getAnyLocationId();
  res.json({
    ok: true,
    bluebubbles: bbOk ? "connected" : "unreachable",
    ghl: locationId ? `installed (location ${locationId})` : "not installed yet",
  });
});

// ── GHL OAuth ────────────────────────────────────────────────────
// Set this as the redirect URL in your marketplace app:
//   {PUBLIC_URL}/oauth/callback
app.get("/oauth/callback", async (req, res) => {
  try {
    const tokens = await ghl.exchangeCode(req.query.code);
    console.log(`GHL app installed for location ${tokens.locationId}`);
    res.send("<h2>✅ Connected!</h2><p>GoHighLevel is now linked to your iMessage bridge. You can close this tab.</p>");
  } catch (err) {
    const detail = err.response?.data || err.message;
    console.error("OAuth exchange failed:", JSON.stringify(detail, null, 2));
    console.error("Using client_id:", `${config.ghl.clientId.slice(0, 12)}...`);
    res
      .status(500)
      .send(
        `<h2>OAuth exchange failed</h2><pre>${JSON.stringify(detail, null, 2)}</pre><p>Send a screenshot of this page to Claude.</p>`
      );
  }
});

// ── Outbound: GHL → iMessage ─────────────────────────────────────
// Set this as the Conversation Provider delivery URL:
//   {PUBLIC_URL}/webhooks/ghl?secret=WEBHOOK_SECRET
app.post("/webhooks/ghl", requireSecret, async (req, res) => {
  const { locationId, messageId, message, phone, contactId } = req.body || {};
  console.log(`→ outbound from GHL: msg ${messageId} to ${phone}`);

  // Ack immediately; GHL retries on slow responses.
  res.json({ success: true });

  if (!phone || !message) return;
  try {
    const guid = await bb.sendText(phone, message);
    rememberSent(guid);
    if (locationId && messageId) {
      await ghl.updateMessageStatus(locationId, messageId, "delivered");
    }
    console.log(`  ✓ sent via iMessage (${guid})`);
  } catch (err) {
    const detail = err.response?.data?.error?.message || err.message;
    console.error(`  ✗ send failed for ${phone}:`, detail);
    if (locationId && messageId) {
      try {
        await ghl.updateMessageStatus(locationId, messageId, "failed", `iMessage send failed: ${detail}`);
      } catch (statusErr) {
        console.error("  could not report failure to GHL:", statusErr.response?.data || statusErr.message);
      }
    }
    void contactId; // present in payload; not needed for the failure path
  }
});

// ── Inbound: iMessage → GHL ──────────────────────────────────────
// Set this as the BlueBubbles webhook URL (event: "New Messages"):
//   {PUBLIC_URL}/webhooks/bluebubbles?secret=WEBHOOK_SECRET
app.post("/webhooks/bluebubbles", requireSecret, async (req, res) => {
  res.json({ ok: true }); // ack fast

  const { type, data } = req.body || {};
  if (type !== "new-message" || !data) return;
  if (data.isFromMe) return; // our own sends (from GHL or the Messages app)
  if (recentlySent.has(data.guid)) return;

  const from = data.handle?.address;
  const text = data.text?.trim();
  if (!from || !text) return;

  // Group chats have a different chat identifier; keep v1 to 1:1 chats.
  const chatGuid = data.chats?.[0]?.guid || "";
  if (chatGuid.includes(";+;")) {
    console.log(`← skipping group chat message from ${from}`);
    return;
  }

  console.log(`← inbound iMessage from ${from}: "${text.slice(0, 60)}"`);

  const locationId = getAnyLocationId();
  if (!locationId || !getTokens(locationId)) {
    console.error("  ✗ GHL app not installed yet — message not synced");
    return;
  }

  try {
    const contact = await ghl.upsertContact(locationId, bb.normalizePhone(from));
    await ghl.postInboundMessage(locationId, contact.id, text);
    console.log(`  ✓ synced to GHL contact ${contact.id}`);
  } catch (err) {
    console.error("  ✗ failed to sync into GHL:", err.response?.data || err.message);
  }
});

app.listen(config.port, () => {
  console.log(`SHM iMessage bridge listening on port ${config.port}`);
  console.log(`Health check:        http://localhost:${config.port}/health`);
  if (config.publicUrl) {
    console.log(`GHL delivery URL:    ${config.publicUrl}/webhooks/ghl?secret=***`);
    console.log(`BlueBubbles webhook: ${config.publicUrl}/webhooks/bluebubbles?secret=***`);
    console.log(`OAuth redirect:      ${config.publicUrl}/oauth/callback`);
  }
});
