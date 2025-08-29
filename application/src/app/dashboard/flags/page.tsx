"use client";

import useSWR from "swr";
import React from "react";

interface Rule {
  id: string;
  order: number;
  attribute: string;
  comparator: string;
  value: string | string[] | boolean;
  rolloutPercent?: number;
}

interface Flag {
  id: string;
  key: string;
  defaultValue: boolean;
  isEnabled: boolean;
  rules: Rule[];
}

const fetcher = (url: string) => fetch(url).then(res => res.json());

export default function FlagsList() {
  const { data, error, isLoading } = useSWR<Flag[]>("/api/v1/flags", fetcher);

  if (error) return <div className="text-red-600">Error loading flags</div>;
  if (isLoading) return <div>Loading...</div>;


  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "1rem" }}>Feature Flags</h1>
      <button
        style={{ marginBottom: "1rem", padding: "0.5rem 1rem", cursor: "pointer" }}
        onClick={() => window.location.href = "/dashboard/flags/create"}
      >
        + Create New Flag
      </button>

      {data.map((flag: Flag) => (
        <div
          key={flag.id}
          style={{
            border: "1px solid #ccc",
            borderRadius: "8px",
            padding: "1rem",
            marginBottom: "1rem",
            backgroundColor: flag.isEnabled ? "#e6ffed" : "#ffe6e6",
          }}
        >
          <h2 style={{ margin: "0 0 0.5rem 0" }}>
            {flag.key}{" "}
            <span style={{ fontSize: "0.8rem", color: "#555" }}>
              ({flag.isEnabled ? "Enabled" : "Disabled"})
            </span>
          </h2>
          <p style={{ margin: "0.5rem 0" }}>Default Value: {flag.defaultValue ? "True" : "False"}</p>

          <h3 style={{ margin: "0.5rem 0" }}>Rules:</h3>
          {flag.rules.length === 0 ? (
            <p>No rules defined.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.25rem" }}>Order</th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.25rem" }}>Attribute</th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.25rem" }}>Comparator</th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.25rem" }}>Value</th>
                  <th style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.25rem" }}>Rollout %</th>
                </tr>
              </thead>
              <tbody>
                {flag.rules.map((rule: Rule) => (
                  <tr key={rule.id}>
                    <td style={{ padding: "0.25rem" }}>{rule.order}</td>
                    <td style={{ padding: "0.25rem" }}>{rule.attribute}</td>
                    <td style={{ padding: "0.25rem" }}>{rule.comparator}</td>
                    <td style={{ padding: "0.25rem" }}>
                      {Array.isArray(rule.value) ? rule.value.join(", ") : String(rule.value)}
                    </td>
                    <td style={{ padding: "0.25rem" }}>{rule.rolloutPercent ?? 100}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <div style={{ marginTop: "0.5rem" }}>
            <button
              style={{ marginRight: "0.5rem", padding: "0.25rem 0.5rem", cursor: "pointer" }}
              onClick={() => window.location.href = `/dashboard/flags/${flag.id}/edit`}
            >
              Edit
            </button>
            <button
              style={{ padding: "0.25rem 0.5rem", cursor: "pointer" }}
              onClick={() => window.location.href = `/dashboard/flags/${flag.id}/test`}
            >
              Test Evaluation
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}