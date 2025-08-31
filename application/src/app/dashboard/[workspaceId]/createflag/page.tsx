"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWorkspaceFlags } from "../../../../../hook/useWorkspaceflags";

type Comparator = "EQ" | "IN";

interface Rule {
  order: number;
  attribute: string;
  comparator: Comparator;
  value: string | string[];
  rolloutPercent: number;
}

interface Flag {
  key: string;
  defaultValue: boolean;
  workspaceId: string;
  rules: Rule[];
}

export default function CreateFlagPage() {
  const { workspaceId } = useParams();
  const router = useRouter();

  const [flag, setFlag] = useState<Flag>({
    key: "",
    defaultValue: false,
    workspaceId: workspaceId as string || "",
    rules: [],
  });
 useWorkspaceFlags(workspaceId as string, (flag) => {

  // update UI state here
});
  const [rule, setRule] = useState<Rule>({
    order: 1,
    attribute: "",
    comparator: "EQ",
    value: "",
    rolloutPercent: 100,
  });
const handleAddRule = () => {
  const newRule = {
    ...rule,
    value: rule.comparator === "IN" 
      ? (rule.value as string).split(",").map(v => v.trim())  // convert string -> array
      : rule.value,
  };

  setFlag({
    ...flag,
    rules: [...flag.rules, newRule],
  });

  setRule({ order: rule.order + 1, attribute: "", comparator: "EQ", value: "", rolloutPercent: 100 });
};
  const handleSubmit = async () => {
    try {
      const res = await fetch("/api/v1/flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(flag),
      });
      const data = await res.json();
      console.log("Flag created:", data);
      router.push(`/dashboard/flags`); 
    } catch (err) {
      console.error(err);
      alert(err.error);
    }
  };

  return (
    <div style={{ maxWidth: 700, margin: "2rem auto", padding: 20, border: "1px solid #ddd", borderRadius: 12, boxShadow: "0px 4px 8px rgba(0,0,0,0.1)" }}>
      <h2 style={{ textAlign: "center", fontSize: "1.5rem", marginBottom: 20 }}>Create New Feature Flag</h2>

      {/* Flag Key */}
      <div style={{ marginBottom: 15 }}>
        <label>Key:</label>
        <input
          type="text"
          value={flag.key}
          onChange={(e) => setFlag({ ...flag, key: e.target.value })}
          placeholder="key Name Must be unique"
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
      </div>

      {/* Default Value */}
      <div style={{ marginBottom: 15 }}>
        <label>Default Value:</label>
        <select
          value={flag.defaultValue ? "true" : "false"}
          onChange={(e) => setFlag({ ...flag, defaultValue: e.target.value === "true" })}
          style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="true">True</option>
          <option value="false">False</option>
        </select>
      </div>

      {/* Rule Builder */}
      <div style={{ border: "1px solid #eee", padding: 15, borderRadius: 8, marginBottom: 15 }}>
        <h4>Add Rule</h4>
        <input
          placeholder="Attribute"
          value={rule.attribute}
          onChange={(e) => setRule({ ...rule, attribute: e.target.value })}
          style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <select
          value={rule.comparator}
          onChange={(e) => setRule({ ...rule, comparator: e.target.value as Comparator })}
          style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 8, border: "1px solid #ccc" }}
        >
          <option value="EQ">EQ</option>
          <option value="IN">IN</option>
        </select>
        <input
          placeholder="Value (comma separated for IN)"
          value={rule.value as string}
          onChange={(e) => setRule({ ...rule, value: e.target.value })}
          style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <input
          type="number"
          placeholder="Rollout %"
          value={rule.rolloutPercent}
          onChange={(e) => setRule({ ...rule, rolloutPercent: Number(e.target.value) })}
          style={{ width: "100%", padding: 8, marginBottom: 8, borderRadius: 8, border: "1px solid #ccc" }}
        />
        <button
          onClick={handleAddRule}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "0.6rem 1.2rem",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: "bold",
          }}
        >
          ➕ Add Rule
        </button>
      </div>

      {/* Rules Preview */}
      <h4>Rules Preview:</h4>
      <pre style={{ background: "#f9f9f9", padding: 10, borderRadius: 8, fontSize: 14, overflowX: "auto" }}>
        {JSON.stringify(flag.rules, null, 2)}
      </pre>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        style={{
          backgroundColor: "#007BFF",
          color: "white",
          padding: "0.8rem 1.5rem",
          border: "none",
          borderRadius: 10,
          cursor: "pointer",
          fontSize: "1.1rem",
          marginTop: 15,
          width: "100%",
          fontWeight: "bold",
          boxShadow: "0px 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        🚀 Create Flag
      </button>
    </div>
  );
}
