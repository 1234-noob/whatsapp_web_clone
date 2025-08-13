const Message = require("../models/Message.js");
const Contact = require("../models/Contact.js");

async function listConversations(req, res) {
  const contacts = await Contact.find().sort({ lastMessageAt: -1 }).limit(500);
  const unread = await Message.aggregate([
    { $match: { direction: "inbound", status: { $ne: "read" } } },
    { $group: { _id: "$waId", unread: { $sum: 1 } } },
  ]);
  const map = new Map(unread.map((u) => [u._id, u.unread]));
  res.json(
    contacts.map((c) => ({
      waId: c.waId,
      name: c.name || c.waId,
      lastMessageAt: c.lastMessageAt,
      lastMessagePreview: c.lastMessagePreview,
      unread: map.get(c.waId) || 0,
    }))
  );
}

async function getMessages(req, res) {
  const { waId } = req.params;
  const { limit = 50, before } = req.query;
  const filter = { waId };
  if (before) filter.timestamp = { $lt: new Date(before) };
  const msgs = await Message.find(filter)
    .sort({ timestamp: -1 })
    .limit(Number(limit));
  res.json(msgs.reverse());
}

module.exports = {
  listConversations,
  getMessages,
};
