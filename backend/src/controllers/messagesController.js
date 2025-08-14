const Message = require("../models/Message.js");
const Contact = require("../models/Contact.js");
const { getIO } = require("../sockets/socket.js");

async function createMessage(req, res) {
  const { wa_id, text } = req.body || {};
  const waId = wa_id;
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

  getIO()?.emit("conversation:update", {
    waId,
    last_message: text,
    last_timestamp: msg.timestamp,
  });
  res.json({ ok: true, message: msg });
}

const markMessagesRead = async (req, res) => {
  const { waId } = req.params;
  const { message_ids } = req.body;

  if (!waId || !Array.isArray(message_ids)) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const result = await Message.updateMany(
      {
        _id: { $in: message_ids },
        waId,
        direction: "inbound", // only mark incoming messages as read
        status: { $ne: "read" },
      },
      { $set: { status: "read" } }
    );

    return res.status(200).json({
      message: "Messages marked as read",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  createMessage,
  markMessagesRead,
};
