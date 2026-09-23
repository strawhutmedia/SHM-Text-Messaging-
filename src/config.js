import "dotenv/config";

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error("Copy .env.example to .env and fill it in.");
    process.exit(1);
  }
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  publicUrl: (process.env.PUBLIC_URL || "").replace(/\/$/, ""),
  webhookSecret: required("WEBHOOK_SECRET"),

  bluebubbles: {
    url: required("BLUEBUBBLES_URL").replace(/\/$/, ""),
    password: required("BLUEBUBBLES_PASSWORD"),
  },

  ghl: {
    clientId: required("GHL_CLIENT_ID"),
    clientSecret: required("GHL_CLIENT_SECRET"),
    conversationProviderId: required("GHL_CONVERSATION_PROVIDER_ID"),
    apiBase: "https://services.leadconnectorhq.com",
  },

  tokenStorePath: process.env.TOKEN_STORE_PATH || "./data/tokens.json",
};
