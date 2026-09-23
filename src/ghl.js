import axios from "axios";
import { config } from "./config.js";
import { getTokens, setTokens } from "./store.js";

// Client for the GoHighLevel (LeadConnector) v2 API.
// Docs: https://highlevel.stoplight.io / https://marketplace.gohighlevel.com/docs
//
// Auth model: this runs as a GHL Marketplace app. The business owner installs
// the app on their location (sub-account), which hits our /oauth/callback with
// a code we exchange for access + refresh tokens, stored per-location.

const API_VERSION = "2021-04-15"; // conversations endpoints
const CONTACTS_VERSION = "2021-07-28"; // contacts endpoints

export async function exchangeCode(code) {
  const res = await axios.post(
    `${config.ghl.apiBase}/oauth/token`,
    new URLSearchParams({
      client_id: config.ghl.clientId,
      client_secret: config.ghl.clientSecret,
      grant_type: "authorization_code",
      code,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const tokens = res.data;
  if (!tokens.locationId) {
    throw new Error("OAuth token response did not include a locationId");
  }
  setTokens(tokens.locationId, tokens);
  return tokens;
}

async function refreshTokens(locationId) {
  const current = getTokens(locationId);
  if (!current?.refresh_token) {
    throw new Error(`No refresh token stored for location ${locationId} — reinstall the app`);
  }
  const res = await axios.post(
    `${config.ghl.apiBase}/oauth/token`,
    new URLSearchParams({
      client_id: config.ghl.clientId,
      client_secret: config.ghl.clientSecret,
      grant_type: "refresh_token",
      refresh_token: current.refresh_token,
    }),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const tokens = { ...current, ...res.data };
  setTokens(locationId, tokens);
  return tokens;
}

/** Authenticated request with one automatic retry after a token refresh. */
async function ghlRequest(locationId, options, retried = false) {
  const tokens = getTokens(locationId);
  if (!tokens?.access_token) {
    throw new Error(`No tokens for location ${locationId} — install the app first (see docs/02-ghl-setup.md)`);
  }
  try {
    return await axios({
      baseURL: config.ghl.apiBase,
      ...options,
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
        Version: API_VERSION,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch (err) {
    if (err.response?.status === 401 && !retried) {
      await refreshTokens(locationId);
      return ghlRequest(locationId, options, true);
    }
    throw err;
  }
}

/**
 * Find or create the GHL contact for a phone number.
 * Upsert dedupes on phone, so incoming texts from unknown numbers
 * become new contacts automatically.
 */
export async function upsertContact(locationId, phone) {
  const res = await ghlRequest(locationId, {
    method: "POST",
    url: "/contacts/upsert",
    headers: { Version: CONTACTS_VERSION },
    data: { locationId, phone },
  });
  return res.data?.contact;
}

/** Find the contact's conversation, creating one if none exists. */
export async function getOrCreateConversation(locationId, contactId) {
  const search = await ghlRequest(locationId, {
    method: "GET",
    url: "/conversations/search",
    params: { locationId, contactId },
  });
  const existing = search.data?.conversations?.[0];
  if (existing) return existing.id;

  const created = await ghlRequest(locationId, {
    method: "POST",
    url: "/conversations/",
    data: { locationId, contactId },
  });
  return created.data?.conversation?.id || created.data?.id;
}

/**
 * Push an inbound iMessage into the GHL conversation so it shows up
 * in the Conversations tab (and can trigger workflows).
 */
export async function postInboundMessage(locationId, contactId, text) {
  const conversationId = await getOrCreateConversation(locationId, contactId);
  const res = await ghlRequest(locationId, {
    method: "POST",
    url: "/conversations/messages/inbound",
    data: {
      type: "SMS",
      conversationId,
      conversationProviderId: config.ghl.conversationProviderId,
      message: text,
    },
  });
  return res.data;
}

/**
 * Report delivery status back to GHL for an outbound message we handled.
 * status: "delivered" | "failed"
 */
export async function updateMessageStatus(locationId, messageId, status, errorMessage) {
  const data = { status };
  if (errorMessage) {
    data.error = { code: "1", type: "message_failed", message: errorMessage };
  }
  const res = await ghlRequest(locationId, {
    method: "PUT",
    url: `/conversations/messages/${messageId}/status`,
    data,
  });
  return res.data;
}
