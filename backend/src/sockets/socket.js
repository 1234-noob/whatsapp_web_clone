const { Server } = require("socket.io");

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: "*" },
  });
  io.on("connection", () => {});
  return io;
}
function getIO() {
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
