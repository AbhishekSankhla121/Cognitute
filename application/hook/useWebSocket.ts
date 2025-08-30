/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

export const useWebSocket = (workspaceId?: string) => {
  const [isConnected, setIsConnected] = useState(false);
  const [flagUpdates, setFlagUpdates] = useState<any[]>([]);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (workspaceId) {
      console.log('🔄 Initializing WebSocket for workspace:', workspaceId);
      
      socketRef.current = io({
        path: '/api/socketio/',
        transports: ['websocket', 'polling'],
      });

      // Add debug event listeners
      socketRef.current.on('connect', () => {
        setIsConnected(true);
        console.log('✅ WebSocket connected, ID:', socketRef.current?.id);
        
        // Join the workspace room
        socketRef.current?.emit('join-workspace', workspaceId);
        console.log(`📨 Joined workspace: ${workspaceId}`);
      });

      socketRef.current.on('disconnect', () => {
        setIsConnected(false);
        console.log('❌ WebSocket disconnected');
      });

      socketRef.current.on('connect_error', (error) => {
        console.error('WebSocket connection error:', error);
      });

  socketRef.current.on("flag-updated", (flag: any) => {
  console.log("📩 Received flag update:", flag);
  setFlagUpdates(prev => {
    // Check if this flag already exists
    const exists = prev.some(f => f.id === flag.id);

    if (exists) {
      // Replace the existing one
      return prev.map(f => (f.id === flag.id ? flag : f));
    } else {
      // Otherwise append as new
      return [...prev, flag];
    }
  });
});
      // Debug: Listen to all events
      socketRef.current.onAny((event, ...args) => {
        console.log('📨 Received event:', event, args);
      });

      return () => {
        console.log('🔄 Cleaning up WebSocket connection');
        if (socketRef.current) {
          socketRef.current.disconnect();
        }
      };
    }
  }, [workspaceId]);

  return { socket: socketRef.current, isConnected, flagUpdates };
};