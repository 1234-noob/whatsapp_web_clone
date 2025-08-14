const express = require("express");
const cors = require("cors");

const morgan = require("morgan");
const webhookRouter = require("./routes/webhook.js");
const conversationsRouter = require("./routes/conversations.js");
const messagesRouter = require("./routes/messages.js");

const app = express();
app.use(
  cors({
    origin:
      "https://whatsapp-web-clone-gojsxctts-1234-noobs-projects.vercel.app",
    credentials: true,
  })
);

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.get("/", (req, res) => {
  res.send("Backend server running");
});
app.use("/webhook", webhookRouter);
app.use("/contacts", conversationsRouter);
app.use("/messages", messagesRouter);

module.exports = app;
