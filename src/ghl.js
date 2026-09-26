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
  const params = {
    client_id: config.ghl.clientId,
    client_secret: config.ghl.clientSecret,
    grant_type: "authorization_code",
    code,
    user_type: "Location",
  };
  if (config.publicUrl) {
    params.redirect_uri = `${config.publicUrl}/oauth/callback`;
  }
  const res = await axios.post(
    `${config.ghl.apiBase}/oauth/token`,
    new URLSearchParams(params),
    { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
  );
  const tokens = res.data;

  // Location-level install: tokens are already scoped to the sub-account.
  if (tokens.locationId) {
    setTokens(tokens.locationId, tokens);
    return tokens;
  }

  // Agency-level install: we got a company token. Store it, then figure
  // out which sub-account(s) the app is attached to and link one.
  if (tokens.companyId) {
    setTokens(`company:${tokens.companyId}`, tokens);
    return finishAgencyInstall(tokens.companyId);
  }

  throw new Error(
    `OAuth token response had neither locationId nor companyId (got keys: ${Object.keys(tokens).join(", ")})`
  );
}

/**
 * Ask GHL which sub-accounts this app is actually installed on,
 * pick the right one, and mint a location-scoped token for it.
 * Safe to call repeatedly (also used by the /oauth/finish repair page).
 */
export async function finishAgencyInstall(companyId) {
  const company = getTokens(`company:${companyId}`);
  if (!company?.access_token) {
    throw new Error(`No agency token stored for company ${companyId} — run the install first.`);
  }
  const appId = config.ghl.clientId.split("-")[0];
  let locations = [];
  try {
    const res = await axios.get(`${config.ghl.apiBase}/oauth/installedLocations`, {
      params: { companyId, appId, isInstalled: true, limit: 100 },
      headers: {
        Authorization: `Bearer ${company.access_token}`,
        Version: "2021-07-28",
      },
    });
    locations = res.data?.locations || res.data || [];
  } catch (err) {
    console.error("installedLocations lookup failed:", err.response?.data || err.message);
  }

  const ids = locations.map((l) => l._id || l.id || l.locationId).filter(Boolean);
  console.log(`App is installed on ${ids.length} sub-account(s):`, ids.join(", ") || "(none)");

  // Prefer the configured location if it's genuinely installed; else take
  // whatever location GHL says has the app.
  let target = null;
  if (config.ghl.locationId && ids.includes(config.ghl.locationId)) {
    target = config.ghl.locationId;
  } else if (ids.length > 0) {
    target = ids[0];
  } else if (config.ghl.locationId) {
    target = config.ghl.locationId; // last resort: try the configured one anyway
  }

  if (!target) {
    throw new Error(
      "The app is installed at the agency level but attached to ZERO sub-accounts. " +
        "In GoHighLevel, open the app page and click 'Install to more sub-accounts', " +
        "select Straw Hut Media, then open the /oauth/finish link again."
    );
  }

  const minted = await mintLocationToken(companyId, target);
  const name = locations.find((l) => (l._id || l.id || l.locationId) === target)?.name || "";
  console.log(`Linked to location ${target} ${name ? `(${name})` : ""}`);
  return { locationId: target, name, ...minted };
}

/**
 * Exchange an agency (company) token for a token scoped to one location.
 * Used when the app was installed agency-wide.
 */
async function mintLocationToken(companyId, locationId) {
  const company = getTokens(`company:${companyId}`);
  if (!company?.access_token) {
    throw new Error(`No company tokens stored for ${companyId}`);
  }
  const res = await axios.post(
    `${config.ghl.apiBase}/oauth/locationToken`,
    new URLSearchParams({ companyId, locationId }),
    {
      headers: {
        Authorization: `Bearer ${company.access_token}`,
        Version: "2021-07-28",
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );
  const locTokens = { ...res.data, companyId, locationId };
  setTokens(locationId, locTokens);
  return locTokens;
}

async function refreshTokens(locationId) {
  const current = getTokens(locationId);

  // Location tokens minted from a company token have no refresh_token of
  // their own — refresh the company token, then mint a fresh location token.
  if (!current?.refresh_token && current?.companyId) {
    const companyKey = `company:${current.companyId}`;
    const company = getTokens(companyKey);
    if (company?.refresh_token) {
      const res = await axios.post(
        `${config.ghl.apiBase}/oauth/token`,
        new URLSearchParams({
          client_id: config.ghl.clientId,
          client_secret: config.ghl.clientSecret,
          grant_type: "refresh_token",
          refresh_token: company.refresh_token,
          user_type: "Company",
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
      );
      setTokens(companyKey, { ...company, ...res.data });
    }
    return mintLocationToken(current.companyId, locationId);
  }

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

  try {
    const created = await ghlRequest(locationId, {
      method: "POST",
      url: "/conversations/",
      data: { locationId, contactId },
    });
    return created.data?.conversation?.id || created.data?.id;
  } catch (err) {
    // GHL helpfully returns the existing conversation's id on this error.
    const existingId = err.response?.data?.conversationId;
    if (existingId) return existingId;
    throw err;
  }
}

/**
 * Push an inbound iMessage into the GHL conversation so it shows up
 * in the Conversations tab (and can trigger workflows).
 */
export async function postInboundMessage(locationId, contactId, text) {
  const conversationId = await getOrCreateConversation(locationId, contactId);
  const base = {
    conversationId,
    conversationProviderId: config.ghl.conversationProviderId,
    message: text,
  };
  const post = (type) =>
    ghlRequest(locationId, {
      method: "POST",
      url: "/conversations/messages/inbound",
      data: { type, ...base },
    });

  // Custom conversation providers are picky about the message type label;
  // which one GHL expects has shifted between releases. Try both.
  try {
    return (await post("SMS")).data;
  } catch (err) {
    const code = err.response?.data?.canonicalCode || "";
    if (err.response?.status === 400 || code.includes("PROVIDER_MISMATCH")) {
      return (await post("Custom")).data;
    }
    throw err;
  }
}

/**
 * Send a plain SMS through the location's native phone system (the LC/323
 * number). Used as the fallback when a recipient has no iMessage.
 */
export async function sendNativeSMS(locationId, contactId, text) {
  const res = await ghlRequest(locationId, {
    method: "POST",
    url: "/conversations/messages",
    data: { type: "SMS", contactId, message: text },
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
