import { Server } from "ws";

let wss: Server;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initWebSocketServer(server: any) {
  if (wss) return wss; // already initialized

  wss = new Server({ server });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wss.on("connection", (ws: any) => {
    console.log("Client connected to WebSocket");
  });

  return wss;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function broadcast(data: any) {
  if (!wss) return;
  const message = JSON.stringify(data);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  wss.clients.forEach((client: { readyState: any; OPEN: any; send: (arg0: string) => void; }) => {
    if (client.readyState === client.OPEN) client.send(message);
  });
}
