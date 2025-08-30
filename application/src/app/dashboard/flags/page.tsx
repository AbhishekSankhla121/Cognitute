// app/debug/websocket/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWorkspaceFlags } from '../../../../hook/useWorkspaceflags';
export const newSocket = io('http://localhost:3000', {
      path: '/api/socketio/'
    });
export default function WebSocketDebugPage() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  useWorkspaceFlags("7776db19-8c97-45e3-90a1-0051943d7e1e", (flag) => {

  // update UI state here
});


  useEffect(() => {
   

    newSocket.on('connect', () => {
      setIsConnected(true);
      setMessages(prev => [...prev, '✅ Connected to server']);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      setMessages(prev => [...prev, '❌ Disconnected from server']);
    });

    newSocket.on('connect_error', (error) => {
      setMessages(prev => [...prev, `❌ Connection error: ${error.message}`]);
    });

    newSocket.on('flag-updated', (data) => {
    setMessages(prev =>
  prev.map(flag => flag.id === data.id ? data : flag)
);

    });

    newSocket.onAny((event, ...args) => {
      setMessages(prev => [...prev, `📨 Event: ${event} - ${JSON.stringify(args)}`]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const joinWorkspace = () => {
    if (socket) {
      socket.emit('join-workspace', 'test-workspace');
      setMessages(prev => [...prev, '📨 Emitted join-workspace event']);
    }
  };

  const simulateFlagUpdate = () => {
    if (socket) {
      const testFlag = {
        id: 'test-flag',
        key: 'test-feature',
        isEnabled: true,
        defaultValue: 'false',
        workspaceId: 'test-workspace'
      };
      socket.emit('flag-updated', testFlag);
      setMessages(prev => [...prev, '📤 Simulated flag update']);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace' }}>
      <h1>WebSocket Debug (No Auth)</h1>
      
      <div>
        <strong>Status:</strong> {isConnected ? '✅ Connected' : '❌ Disconnected'}
      </div>
      
      <div style={{ margin: '10px 0' }}>
        <button 
          onClick={joinWorkspace} 
          disabled={!isConnected}
          style={{ marginRight: '10px', padding: '10px' }}
        >
          Join Workspace
        </button>
        
        <button 
          onClick={simulateFlagUpdate} 
          disabled={!isConnected}
          style={{ padding: '10px' }}
        >
          Simulate Flag Update
        </button>
      </div>
      
      <h2>Messages:</h2>
<div style={{ border: '1px solid #ccc', padding: '10px', height: '300px', overflow: 'auto' }}>
  {...messages}
</div>
    </div>
  );
}