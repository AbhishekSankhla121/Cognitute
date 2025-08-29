import prisma from "./prisma";
import redis from "./redis";
import { x86 as murmurhash3 } from "murmurhash3js-revisited";

function stringToUint8Array(str: string) {
  const encoder = new TextEncoder();
  return encoder.encode(str);
}

interface EvalResult {
  value: boolean;
  reason: string;
}

export async function evaluateFlag(
  flagKey: string,
  unitId: string,
  attributes: Record<string, string>,
  workspaceId: string
): Promise<EvalResult> {
  const cacheKey = `flag:${workspaceId}:${flagKey}`;
  let flagData = await redis.get(cacheKey);

  if (!flagData) {
    const dbFlag = await prisma.flag.findFirst({
      where: { key: flagKey, workspaceId },
      include: { rules: { orderBy: { order: "asc" } } },
    });

    if (!dbFlag) return { value: false, reason: "Flag not found" };

    flagData = JSON.stringify(dbFlag);
    await redis.set(cacheKey, flagData, "EX", 60); 
  }

  const flag = JSON.parse(flagData);

  if (!flag.isEnabled) return { value: false, reason: "Flag disabled" };

  for (const rule of flag.rules) {
    const userValue = attributes[rule.attribute];
    if (!userValue) continue;

    let match = false;
    if (rule.comparator === "equals" && userValue === rule.value) match = true;
    if (rule.comparator === "in" && rule.value.split(",").includes(userValue)) match = true;

    if (match) {
      if (rule.rollout != null) {
        const hash = murmurhash3.hash32(stringToUint8Array(`${workspaceId}:${flagKey}:${unitId}`)) % 100;
        if (hash >= rule.rollout) continue;
      }
      return { value: true, reason: `Rule matched: ${rule.attribute}` };
    }
  }

  return { value: flag.defaultValue, reason: "Default value" };
}
