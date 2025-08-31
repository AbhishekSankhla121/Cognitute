'use client';

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

interface Rule {
  id: string;
  flagId: string;
  order: number;
  attribute: string;
  comparator: "EQ" | "IN";
  value: string | string[] | boolean;
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

export default function EditFlagPage() {
  const { workspaceId } = useParams();
  const router = useRouter();

  const [flag, setFlag] = useState<Flag | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch flag data
    async function fetchFlag() {
      try {
        const res = await fetch(`/api/v1/flags/${workspaceId}`);
        const data = await res.json();
        setFlag(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchFlag();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleRuleChange = (index: number, key: keyof Rule, value: any) => {
    if (!flag) return;
    const updatedRules = [...flag.rules];
    updatedRules[index] = { ...updatedRules[index], [key]: value };
    setFlag({ ...flag, rules: updatedRules });
  };

  const handleSubmit = async () => {
    if (!flag) return;
    try {
      const res = await fetch(`/api/v1/flags/${flag.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flag),
      });
      if (!res.ok) throw new Error("Failed to update flag");
      router.push(`/dashboard/flags`);
    } catch (err) {
      alert("Failed to update flag");
    }
  };

  if (loading) return <p style={{ padding: "2rem" }}>Loading...</p>;
  if (!flag) return <p style={{ padding: "2rem", color: "red" }}>Flag not found</p>;

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: 30, border: "1px solid #e5e7eb", borderRadius: 16, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", backgroundColor: "#fff" }}>
      <h2 style={{ fontSize: "1.8rem", fontWeight: 700, textAlign: "center", marginBottom: 20 }}>Edit Feature Flag</h2>

      {/* Flag Details */}
      <div style={{ display: "flex", gap: 20, marginBottom: 20 }}>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 500 }}>Key</label>
          <input
            type="text"
            value={flag.key}
            onChange={(e) => setFlag({ ...flag, key: e.target.value })}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 5 }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 500 }}>Default Value</label>
          <select
            value={flag.defaultValue ? "true" : "false"}
            onChange={(e) => setFlag({ ...flag, defaultValue: e.target.value === "true" })}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 5 }}
          >
            <option value="true">True</option>
            <option value="false">False</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label style={{ fontWeight: 500 }}>Is Enabled</label>
          <select
            value={flag.isEnabled ? "true" : "false"}
            onChange={(e) => setFlag({ ...flag, isEnabled: e.target.value === "true" })}
            style={{ width: "100%", padding: 10, borderRadius: 10, border: "1px solid #ccc", marginTop: 5 }}
          >
            <option value="true">Enabled</option>
            <option value="false">Disabled</option>
          </select>
        </div>
      </div>

      {/* Rules */}
      <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: 10 }}>Rules</h3>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {flag.rules.map((rule, idx) => (
          <div key={rule.id} style={{ display: "flex", gap: 10, alignItems: "center", padding: 12, border: "1px solid #e5e7eb", borderRadius: 12, backgroundColor: "#f9fafb" }}>
            <input
              type="text"
              value={rule.attribute}
              onChange={(e) => handleRuleChange(idx, "attribute", e.target.value)}
              placeholder="Attribute"
              style={{ flex: 2, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
            />
            <select
              value={rule.comparator}
              onChange={(e) => handleRuleChange(idx, "comparator", e.target.value)}
              style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
            >
              <option value="EQ">EQ</option>
              <option value="IN">IN</option>
            </select>
            <input
              type="text"
              value={Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value)}
              onChange={(e) => handleRuleChange(idx, "value", rule.comparator === "IN" ? e.target.value.split(",").map(v => v.trim()) : e.target.value)}
              placeholder="Value"
              style={{ flex: 2, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
            />
            <input
              type="number"
              value={rule.rolloutPercent || 100}
              onChange={(e) => handleRuleChange(idx, "rolloutPercent", Number(e.target.value))}
              placeholder="% Rollout"
              style={{ flex: 1, padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
            />
          </div>
        ))}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        style={{
          marginTop: 25,
          width: "100%",
          padding: 14,
          borderRadius: 12,
          backgroundColor: "#2563eb",
          color: "#fff",
          fontWeight: 600,
          fontSize: 16,
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          cursor: "pointer",
          transition: "all 0.3s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#1d4ed8")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#2563eb")}
      >
        💾 Save Changes
      </button>

      <div style={{ marginTop: 20, fontSize: 12, color: "#6b7280" }}>
        Created: {new Date(flag.createdAt).toLocaleString()} | Updated: {new Date(flag.updatedAt).toLocaleString()}
      </div>
    </div>
  );
}
