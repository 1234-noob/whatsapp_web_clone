const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    waId: { type: String, index: true, required: true },
    direction: { type: String, enum: ["inbound", "outbound"], required: true },
    type: { type: String, default: "text" },
    text: { type: String, default: "" },
    mediaUrl: { type: String },
    timestamp: { type: Date, index: true, required: true },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
    msgId: { type: String, sparse: true },
    metaMsgId: { type: String, sparse: true },
    payloadRaw: { type: mongoose.Schema.Types.Mixed },
  },
  { timestamps: true }
);

MessageSchema.index({ waId: 1, timestamp: -1 });

module.exports = mongoose.model("processed_messages", MessageSchema);
