const { Server } = require("socket.io");

let io;

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:
        "https://whatsapp-web-clone-gojsxctts-1234-noobs-projects.vercel.app",
    },
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
