import { useEffect } from "react";

    import { newSocket } from "@/app/dashboard/flags/page";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useWorkspaceFlags(workspaceId: string, onUpdate: (flag: any) => void) {
   
  useEffect(() => {
    if (!newSocket.connected) {
      newSocket.connect();
    }

    newSocket.emit("join-workspace", workspaceId);

    newSocket.on("flag-updated", onUpdate);

    return () => {
      newSocket.off("flag-updated", onUpdate);
    };
  }, [workspaceId, onUpdate]);
}
