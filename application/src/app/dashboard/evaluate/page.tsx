"use client";
import React, { useState } from "react";

export default function TestEvaluate() {
  const [flagKey, setFlagKey] = useState("");
  const [unitId, setUnitId] = useState("");
  const [attributes, setAttributes] = useState("{}");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [result, setResult] = useState<any>(null);



  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Test Flag Evaluation</h1>

      <div className="mb-2">
        <input
          className="border p-2 w-full"
          placeholder="Flag Key"
          value={flagKey}
          onChange={e => setFlagKey(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <input
          className="border p-2 w-full"
          placeholder="Unit ID"
          value={unitId}
          onChange={e => setUnitId(e.target.value)}
        />
      </div>
      <div className="mb-2">
        <textarea
          className="border p-2 w-full"
          placeholder='Attributes as JSON, e.g. {"country":"IN"}'
          value={attributes}
          onChange={e => setAttributes(e.target.value)}
          rows={4}
        />
      </div>

      {/* <button
        className="bg-blue-500 text-white px-4 py-2 rounded"
        onClick={}
      >
        Evaluate
      </button> */}

      {result && (
        <div className="mt-4 p-2 border rounded bg-gray-50">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
