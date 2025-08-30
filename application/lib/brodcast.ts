// lib/ws-broadcast.ts
export const broadcastFlagUpdate = (flag: { workspaceId:string; }) => {
  if (!global.io) {
    console.warn("⚠️ Socket.io not initialized");
    return;
  }

  const workspaceId = flag.workspaceId;
  if (!workspaceId) {
    console.warn("⚠️ No workspaceId on flag");
    return;
  }

  global.io.to(`workspace:${workspaceId}`).emit("flag-updated", flag);
  console.log(`📤 Broadcasted flag update to workspace:${workspaceId}`);
};
