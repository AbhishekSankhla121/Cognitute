'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

interface AuditLog {
  id: string;
  action: string;
  flagId?: string;
  userId?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta?: any;
  createdAt: string;
}

export default function AuditLogPage() {
 const { workspaceId } = useParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLogs() {
      try {
        const res = await fetch(`/api/v1/audit`);
        const data = await res.json();
        setLogs(data.logs || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchLogs();
  }, [workspaceId ]);

  if (loading) return <p style={{ padding: '1rem' }}>Loading audit logs...</p>;
  if (logs.length === 0) return <p style={{ padding: '1rem', color: 'red' }}>No audit logs found.</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '2rem', color: '#111' }}>Audit Logs</h1>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
        {logs.map(log => (
          <div
            key={log.id}
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '1rem',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 10px rgba(0,0,0,0.08)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 8px 20px rgba(0,0,0,0.12)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
              (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 10px rgba(0,0,0,0.08)';
            }}
          >
            <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#1f2937' }}>
              {log.action}
            </h2>

            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
              <strong>Flag ID:</strong> {log.flagId || '-'}
            </p>
            <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#6b7280' }}>
              <strong>User ID:</strong> {log.userId || '-'}
            </p>
            {log.meta && (
              <div style={{ marginTop: '0.5rem', background: '#f9fafb', padding: '0.5rem', borderRadius: '8px', fontSize: '0.85rem', overflowX: 'auto' }}>
                <strong>Meta:</strong>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{JSON.stringify(log.meta, null, 2)}</pre>
              </div>
            )}
            <p style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#9ca3af' }}>
              Created: {new Date(log.createdAt).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
