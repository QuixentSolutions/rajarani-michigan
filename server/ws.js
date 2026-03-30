const WebSocket = require("ws");

let wss;

module.exports = {
  init: (server) => {
    wss = new WebSocket.Server({ server, path: "/ws" });

    wss.on("connection", (ws, req) => {
      console.log("WebSocket connected");

      ws.on("message", (msg) => {
        try {
          const data = JSON.parse(msg.toString());
          if (data.type === "ping") {
            ws.send(JSON.stringify({ type: "pong" }));
          }
        } catch (_) {}
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
