const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema(
  {
    waId: { type: String, unique: true, index: true },
    name: { type: String },
    lastMessageAt: { type: Date, index: true },
    lastMessagePreview: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("contacts", ContactSchema);
