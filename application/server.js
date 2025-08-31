// server.js
import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server } from "socket.io";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  
  const io = new Server(server, {
    cors: {
      origin: dev
        ? ["http://localhost:3000", "http://127.0.0.1:3000"]
        : process.env.NEXT_PUBLIC_APP_URL,
      methods: ["GET", "POST", "PATCH"],
      credentials: true,
    },
    path: "/api/socketio/",
  });

  console.log("Socket.io server initialized");

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("join-workspace", (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`📨 Client ${socket.id} joined workspace ${workspaceId}`);
    });

    socket.on("disconnect", (reason) => {
      console.log("Client disconnected:", socket.id, "Reason:", reason);
    });

    socket.on("error", (error) => {
      console.error("Socket error:", error);
    });
  });

  // Store io globally so API routes can broadcast
  global.io = io;

  const port = process.env.PORT || 3000;
  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`Server ready on http://localhost:${port}`);
  });
});
