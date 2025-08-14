const Message = require("../models/Message.js");
const Contact = require("../models/Contact.js");
const { getIO } = require("../sockets/socket.js");

const toDate = (ts) => {
  if (!ts) return new Date();

  const n = Number(ts);
  return new Date(n * (String(n).length > 10 ? 1 : 1000));
};

async function handleWebhook(req, res) {
  try {
    const meta = req.body?.metaData;
    const entries = meta?.entry || [];

    for (const entry of entries) {
      for (const change of entry.changes || []) {
        const v = change.value || {};

        for (const c of v.contacts || []) {
          const waId = c.wa_id;
          if (!waId) continue;
          await Contact.updateOne(
            { waId },
            { $setOnInsert: { waId }, $set: { name: c.profile?.name } },
            { upsert: true }
          );
        }

        for (const m of v.messages || []) {
          const from = m.from;

          const businessNumber = v?.metadata?.display_phone_number;
          const direction = from === businessNumber ? "outbound" : "inbound";
          const waId =
            direction === "outbound"
              ? v.contacts?.[0]?.wa_id || m.to || m.recipient_id
              : from;

          const text = m.text?.body || "";
          const msgDoc = await Message.create({
            waId,
            direction,
            type: m.type || "text",
            text,
            timestamp: toDate(m.timestamp),
            status: "sent",
            msgId: m.id,
            metaMsgId: m.meta_msg_id || m.context?.id,
            payloadRaw: m,
          });

          await Contact.updateOne(
            { waId },
            {
              $setOnInsert: { waId },
              $set: {
                lastMessageAt: msgDoc.timestamp,
                lastMessagePreview: text.slice(0, 80),
              },
            },
            { upsert: true }
          );

          getIO()?.emit("message:new", { waId, message: msgDoc });
          getIO()?.emit("conversation:update", { waId });
        }

        for (const s of v.statuses || []) {
          const metaId = s.meta_msg_id || s.id || s.message_id;
          const status = s.status;
          if (!metaId || !status) continue;

          const updated = await Message.findOneAndUpdate(
            { $or: [{ metaMsgId: metaId }, { msgId: metaId }] },
            { $set: { status } },
            { new: true }
          );

          if (updated) {
            getIO()?.emit("message:updateStatus", {
              waId: updated.waId,
              messageId: String(updated._id),
              status,
            });
            getIO()?.emit("conversation:update", { waId: updated.waId });
          }
        }
      }
    }

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message || "bad webhook" });
  }
}

module.exports = {
  handleWebhook,
};
