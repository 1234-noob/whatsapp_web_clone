const fs = require("fs");
const path = require("path");
const axios = require("axios");
require("dotenv").config();

const PAYLOAD_DIR = process.argv[2] || path.join(__dirname, "../../payloads");
const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "https://whatsapp-web-clone-ochre-xi.vercel.app/";

function validatePayload(payload, fileName) {
  const errors = [];

  const meta = payload?.metaData;
  const entry = meta?.entry?.[0];
  const change = entry?.changes?.[0];
  const value = change?.value;

  if (!value) {
    errors.push("Missing 'value' inside entry.changes");
  }
  if (value?.contacts) {
    value.contacts = value.contacts.filter((c) => c.wa_id);
  }

  if (!value?.messages && !value?.statuses) {
    errors.push("Missing both 'messages' and 'statuses'");
  }

  if (value?.messages && !Array.isArray(value.messages)) {
    errors.push("'messages' must be an array");
  }

  if (value?.statuses && !Array.isArray(value.statuses)) {
    errors.push("'statuses' must be an array");
  }

  if (value?.contacts && !Array.isArray(value.contacts)) {
    errors.push("'contacts' must be an array");
  }

  if (errors.length > 0) {
    console.error(`❌ Validation failed for ${fileName}:`);
    errors.forEach((err) => console.error(`   - ${err}`));
    return false;
  }

  return true;
}

fs.readdir(PAYLOAD_DIR, async (err, files) => {
  if (err) {
    console.error("Error reading payload directory:", err);
    return;
  }

  for (const file of files) {
    if (!file.endsWith(".json")) continue;

    const filePath = path.join(PAYLOAD_DIR, file);
    let payload;

    try {
      payload = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
      console.error(`❌ Invalid JSON in ${file}:`, err.message);
      continue;
    }

    if (!validatePayload(payload, file)) continue;

    try {
      const res = await axios.post(WEBHOOK_URL, payload, {
        headers: { "Content-Type": "application/json" },
      });
      console.log(`✅ Sent ${file}: ${res.status}`);
    } catch (error) {
      if (error.response) {
        console.error(
          `❌ Failed ${file}: ${error.response.status} ${error.response.statusText}`
        );
        console.error("Response body:", error.response.data);
      } else {
        console.error(`❌ Failed ${file}:`, error.message);
      }
    }
  }
});
