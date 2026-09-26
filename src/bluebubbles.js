import axios from "axios";
import crypto from "node:crypto";
import { config } from "./config.js";

// Client for the BlueBubbles server REST API running on the Mac.
// Docs: https://docs.bluebubbles.app/server

const bb = axios.create({
  baseURL: config.bluebubbles.url,
  params: { password: config.bluebubbles.password },
  timeout: 60_000,
});

/**
 * Normalize a phone number to the format iMessage expects (+1XXXXXXXXXX).
 * Assumes US numbers when no country code is present.
 */
export function normalizePhone(phone) {
  if (!phone) return null;
  let digits = String(phone).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  digits = digits.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/**
 * Check whether an address can receive iMessage (blue) at all.
 * Returns true/false, or null when the server can't tell us
 * (older BlueBubbles versions don't have this endpoint).
 */
export async function checkIMessageAvailability(phone) {
  try {
    const res = await bb.get("/api/v1/handle/availability/imessage", {
      params: { address: normalizePhone(phone), password: config.bluebubbles.password },
    });
    return res.data?.data?.available ?? null;
  } catch {
    return null;
  }
}

/**
 * Send a text via iMessage. Tries the existing chat first; if no chat
 * with this address exists yet, creates one with the message attached.
 * Returns the BlueBubbles message GUID.
 */
export async function sendText(phone, message) {
  const address = normalizePhone(phone);
  const chatGuid = `iMessage;-;${address}`;
  const tempGuid = `shm-${crypto.randomUUID()}`;

  try {
    const res = await bb.post("/api/v1/message/text", {
      chatGuid,
      tempGuid,
      message,
      method: "private-api",
    });
    return res.data?.data?.guid || tempGuid;
  } catch (err) {
    // No existing chat with this address — create one, which also sends.
    const status = err.response?.status;
    if (status === 400 || status === 404 || status === 500) {
      const res = await bb.post("/api/v1/chat/new", {
        addresses: [address],
        message,
        service: "iMessage",
        tempGuid,
      });
      return res.data?.data?.messages?.[0]?.guid || tempGuid;
    }
    throw err;
  }
}

/** Quick connectivity check used by /health. */
export async function ping() {
  try {
    const res = await bb.get("/api/v1/ping");
    return res.status === 200;
  } catch {
    return false;
  }
}
