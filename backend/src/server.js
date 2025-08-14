require("dotenv").config();
const http = require("http");

const app = require("./app.js");
const { connectDB } = require("./config/db.js");
const { initSocket } = require("./sockets/socket.js");

const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

(async () => {
  await connectDB(MONGO_URI);
  const server = http.createServer(app);
  initSocket(server);
  server.listen(PORT, () => console.log(`[server] listening on :${PORT}`));
})();
