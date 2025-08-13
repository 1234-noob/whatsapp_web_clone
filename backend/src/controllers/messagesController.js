const Message = require("../models/Message.js");
const Contact = require("../models/Contact.js");
const { getIO } = require("../sockets/socket.js");

async function createMessage(req, res) {
  const { waId, text } = req.body || {};
  if (!waId || !text)
    return res.status(400).json({ ok: false, error: "waId and text required" });

  const msg = await Message.create({
    waId,
    direction: "outbound",
    type: "text",
    text,
    timestamp: new Date(),
    status: "sent",
    payloadRaw: { demo: true },
  });

  await Contact.updateOne(
    { waId },
    {
      $setOnInsert: { waId },
      $set: {
        lastMessageAt: msg.timestamp,
        lastMessagePreview: text.slice(0, 80),
      },
    },
    { upsert: true }
  );

  getIO()?.emit("message:new", { waId, message: msg });
  getIO()?.emit("conversation:update", { waId });

  res.json({ ok: true, message: msg });
}

module.exports = {
  createMessage,
};
