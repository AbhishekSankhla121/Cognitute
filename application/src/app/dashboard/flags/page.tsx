// app/debug/websocket/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWorkspaceFlags } from '../../../../hook/useWorkspaceflags';
import { useRouter } from "next/navigation";
export const newSocket = io('http://localhost:3000', {
      path: '/api/socketio/'
    });
    
interface Rule {
  id: string;
  flagId: string;
  order: number;
  attribute: string;
  comparator: string;
  value: string[] | boolean;
  rolloutPercent?: number;
}

interface Flag {
  id: string;
  key: string;
  defaultValue: boolean;
  isEnabled: boolean;
  workspaceId: string;
  createdAt: string;
  updatedAt: string;
  rules: Rule[];
}

interface FlagsResponse {
  flags: Flag[];
  access: string;
  workspaceId: string;
}

export default function WebSocketDebugPage() {
      const router = useRouter();
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  const [flags, setFlags] = useState<Flag[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [access, setAccess] = useState<string>("");
  const [workspaceId, setWorkspaceId] = useState<string>("");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function changeDefaultValue(e: any, defaultValue: boolean,flagID:string){
  try {
    await fetch(`/api/v1/flags/${flagID}`, {
  method: "PATCH",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    defaultValue: !defaultValue
  }),
});
  } catch (error) {
    console.log(error)
  }
}

  useWorkspaceFlags(workspaceId, (flag) => {

  // update UI state here
});
  
  useEffect(() => {
    async function fetchFlags() {
      try {
        const res = await fetch("/api/v1/flags");
        const { flags, access, workspaceId } = await res.json();

        setFlags(flags);
        setAccess(access);
        setWorkspaceId(workspaceId);
      } catch (err) {
        console.error("❌ Error fetching flags", err);
      } finally {
        setLoading(false);
      }
    }

    fetchFlags();
  }, []);

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
    setFlags((prevFlags) => {
  const exists = prevFlags.some((flag) => flag.id === data.id);

  if (exists) {
    // Update existing
    return prevFlags.map((flag) =>
      flag.id === data.id ? { ...flag, ...data } : flag
    );
  } else {
    // Add new
    return [...prevFlags, data];
  }
});

console.log("flag:",flags)
console.log("data:",data)
     
    });

    newSocket.onAny((event, ...args) => {
      setMessages(prev => [...prev, `📨 Event: ${event} - ${JSON.stringify(args)}`]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [workspaceId]);


 if (loading) return <p className="p-4">Loading flags...</p>;
  if (!flags) return <p className="p-4 text-red-500">No flags found.</p>;
return (
  <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
    {/* Header */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#f3f4f6",
        padding: "16px",
        borderRadius: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
      }}
    >
    
      <div>
        <h1 style={{ fontSize: "22px", fontWeight: "700", margin: 0 }}>Workspace</h1>
        <p style={{ color: "#6b7280", fontSize: "14px", marginTop: "4px" }}>ID: {workspaceId}</p>
      </div>
      <div>
 <span
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: 500,
          background: access === "Admin" ? "#dcfce7" : "#dbeafe",
          color: access === "Admin" ? "#15803d" : "#1d4ed8",
        }}
      >
        {access}
      </span>
       <span
        style={{
          padding: "6px 12px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: 500,
          background: isConnected ? "#dcfce7" : "#dbeafe",
          color: isConnected  ? "#15803d" : "#1d4ed8",
        }}
      >
        {isConnected?"connected":"not - connected"}
      </span>
      </div>
     
     
             
    </div>
{access ==="Admin"&& <button
style={{
backgroundColor: "#007BFF",
color: "white",
padding: "0.8rem 1.5rem",
border: "none",
borderRadius: "10px",
cursor: "pointer",
fontSize: "1.1rem",
marginTop: "1.5rem",
width: "100%",
fontWeight: "bold",
boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
transition: "background 0.3s ease",
}}


onClick={()=>{
  router.push(`/dashboard/${workspaceId}/createflag`)
}}
>
🚀 Create Flag
</button>
}
    {/* Flags */}
    <div
      style={{
        display: "grid",
        gap: "16px",
        gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
      }}
    >
      {flags.map((flag) => (
        <div
          key={flag.id}
          style={{
            background: "white",
            borderRadius: "16px",
            padding: "16px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.12)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.boxShadow = "0 2px 6px rgba(0,0,0,0.06)")
          }
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ fontWeight: 600, fontSize: "18px", margin: 0 }}>{flag.key}</h2>
      
            <span
              style={{
                padding: "4px 8px",
                borderRadius: "12px",
                fontSize: "12px",
                fontWeight: 500,
                background: flag.defaultValue ? "#dcfce7" : "#fee2e2",
                color: flag.defaultValue ? "#15803d" : "#b91c1c",
              }}
            >
              {flag.defaultValue ? "Enabled" : "Disabled"}
            </span>
          </div>

          
          {/* Rules */}
          <div style={{ marginTop: "12px" }}>
            <h3 style={{ fontSize: "13px", fontWeight: 500, color: "#374151", marginBottom: "8px" }}>
              Rules:
            </h3>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
              {flag.rules.map((rule) => (
                <li
                  key={rule.id}
                  style={{
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    padding: "8px",
                    fontSize: "14px",
                  }}
                >
                  <p style={{ margin: 0 }}>
                    <span style={{ fontWeight: 600 }}>{rule.attribute}</span>{" "}
                    {rule.comparator}{" "}
                    <span style={{ color: "#4f46e5", fontWeight: 500 }}>
                      {Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value)}
                    </span>
                  </p>
                  {rule.rolloutPercent !== undefined && (
                    <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
                      Rollout: {rule.rolloutPercent}%
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Metadata */}
          <div style={{ marginTop: "12px", fontSize: "12px", color: "#9ca3af" }}>
            <p style={{ margin: 0 }}>Created: {new Date(flag.createdAt).toLocaleString()}</p>
            <p style={{ margin: 0 }}>Updated: {new Date(flag.updatedAt).toLocaleString()}</p>
          </div>
          
              {access==="Admin" && <>
              <input type="button" value={`${flag.defaultValue}`} onClick={(e)=> {changeDefaultValue(e,flag.defaultValue,flag.id)}} />
              </>}
          
         

        </div>
      ))}
    </div>

    
  </div>
  
);
  
}