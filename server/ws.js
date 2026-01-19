const WebSocket = require("ws");

let wss;

module.exports = {
  init: (server) => {
    wss = new WebSocket.Server({ server, path: "/ws" });

    wss.on("connection", (ws, req) => {
      console.log("WebSocket connected");

      ws.on("message", (msg) => {
        console.log("Received:", msg.toString());
      });

      ws.on("close", () => {
        console.log("WebSocket disconnected");
      });
    });

    return wss;
  },

  getWSS: () => {
    if (!wss) {
      throw new Error("WebSocket server not initialized");
    }
    return wss;
  },
};
