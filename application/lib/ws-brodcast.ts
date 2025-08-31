import { $Enums } from "@/generated/prisma";
import { JsonValue } from "@/generated/prisma/runtime/library";

// lib/ws-broadcast.ts
export const broadcastFlagUpdate = (flag: { rules: { id: string; flagId: string; order: number; attribute: string; comparator: $Enums.Comparator; value: JsonValue; rolloutPercent: number | null; }[]; } & { key: string; id: string; defaultValue: boolean; isEnabled: boolean; workspaceId: string; createdAt: Date; updatedAt: Date; }) => {
  if (!global.io) {
    console.warn("⚠️ Socket.io not initialized");
    return;
  }

  const workspaceId = flag.workspaceId || "default";
  global.io.to(`workspace:${workspaceId}`).emit("flag-updated", flag);
  console.log(`📤 Broadcasted flag update to workspace:${workspaceId}`);
};


export const broadcastType = (id: string, type: string) => {
  if (!global.io) {
    console.warn("⚠️ Socket.io not initialized");
    return;
  }

  // Example: broadcast event to all connected clients
  global.io.emit("type-event", { id, type });
  console.log(`📤 Broadcasted type event with id: ${id} and type: ${type}`);
};