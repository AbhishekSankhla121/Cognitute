/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getUserSession } from "../../../../../lib/auth";
import redis from "../../../../../lib/redis";
import { z } from "zod";
import { x86 } from "murmurhash3js";

// --- Input validation ---
const EvalSchema = z.object({
  flagKey: z.string(),
  unitId: z.string(),
   attributes: z.record(z.string(), z.any()).default({}),
});

// --- Deterministic bucket ---
function bucketPercent(workspaceId: string, flagKey: string, unitId: string) {
  const input = `${workspaceId}:${flagKey}:${unitId}`;
  const hash32 = x86.hash32(input);
  const percent = (hash32 >>> 0) / 4294967295;
  return percent * 100;
}

// --- Compile a flag ---
function compileFlag(flag: any) {
  return {
    key: flag.key,
    defaultValue: flag.defaultValue,
    isEnabled: flag.isEnabled,
    workspaceId: flag.workspaceId,
    rules: (flag.rules ?? []).sort((a: any, b: any) => a.order - b.order).map((r: any) => ({
      attribute: r.attribute,
      comparator: r.comparator,
      value: r.value,
      rolloutPercent: r.rolloutPercent,
    })),
  };
}

// --- Evaluate a compiled flag ---
function evaluateFlag(compiledFlag: any, unitId: string, attributes: Record<string, any>) {
  if (!compiledFlag.isEnabled) return { value: compiledFlag.defaultValue, reason: "disabled" };

  for (let i = 0; i < compiledFlag.rules.length; i++) {
    const rule = compiledFlag.rules[i];
    const left = attributes[rule.attribute];

    let matched = false;
    if (rule.comparator === "EQ") matched = left === rule.value;
    if (rule.comparator === "IN" && Array.isArray(rule.value)) {
      if (Array.isArray(left)) matched = left.some(v => rule.value.includes(v));
      else matched = rule.value.includes(left);
    }

    if (!matched) continue;

    // rollout percent
    if (rule.rolloutPercent != null) {
      const p = bucketPercent(compiledFlag.workspaceId, compiledFlag.key, unitId);
      if (p > rule.rolloutPercent) continue;
    }

    return { value: true, reason: `rule_${i}` };
  }

  return { value: compiledFlag.defaultValue, reason: "default" };
}

// --- POST API ---
export async function POST(req: NextRequest) {
  const body = EvalSchema.parse(await req.json());

  // --- Get user ---
  const user = await getUserSession();
  if (!user ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
    const userKey = `Currentuser:${user.id}`; 

  let currentUser = null;
  const usercached = await redis.get(userKey);
  if (usercached) {
    try {
      currentUser = JSON.parse(usercached);
    } catch {
      await redis.del(userKey); 
    }
  }

  if (!currentUser) {
    const userdata = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, workspaceId: true, role: true }, // only needed fields
    });

    if (!userdata) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (!userdata.workspaceId) {
      return NextResponse.json({ error: "No workspace" }, { status: 400 });
    }

    currentUser = userdata;

    await redis.set(userKey, JSON.stringify(currentUser), "EX", 60);
  }


  const workspaceId = currentUser.workspaceId;

  // --- Try workspace flags cache ---
  const workspaceCacheKey = `flags:${workspaceId}`;
  let compiledFlags: any[] | null = null;
  const cached = await redis.get(workspaceCacheKey);

  if (cached) {
    try {
      compiledFlags = JSON.parse(cached);
    } catch {
      await redis.del(workspaceCacheKey);
    }
  }

  // --- Fetch from DB if cache miss ---
  if (!compiledFlags) {
    const flags = await prisma.flag.findMany({
      where: { workspaceId },
      include: { rules: true },
    });
    compiledFlags = flags.map(f => compileFlag(f));
    await redis.set(workspaceCacheKey, JSON.stringify(compiledFlags), "EX", 300); // 5 min
  }

  // --- Find flag ---
  const flag = compiledFlags.find(f => f.key === body.flagKey);
  if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

  // --- Evaluate ---
  const result = evaluateFlag(flag, body.unitId, body.attributes);

  return NextResponse.json(result);
}
