import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getUserSession } from "../../../../../lib/auth";
import redis from "../../../../../lib/redis";
import { broadcastFlagUpdate } from "../../../../../lib/ws-brodcast";

export async function GET() {
  const user = await getUserSession();
  if (!user) {
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

    let flags = null
    const workspaceCacheKey = `flag:${currentUser.workspaceId}`;
    const workspaceDataCached =await redis.get(workspaceCacheKey);
  
 
  if (workspaceDataCached) {
    try {
      flags = JSON.parse(workspaceDataCached);
    } catch {
      await redis.del(workspaceCacheKey); 
    }
  }
  
  if(!flags){
  const flagsdata = await prisma.flag.findMany({
    where: { workspaceId: currentUser.workspaceId },
    include: { rules: true },
  });
   if (!flagsdata) {
      return NextResponse.json({ error: "all workspaceData not found" }, { status: 404 });
    }
    flags = flagsdata
    await redis.set(workspaceCacheKey, JSON.stringify(flags), "EX", 60);
}

  return NextResponse.json({
    flags,
    access: currentUser.role,
    workspaceId: currentUser.workspaceId,
  });
}

export async function POST(req: NextRequest) {
  try {
    // ✅ Check auth
   const user = await getUserSession();
    if (!user.id) {
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


    const body = await req.json();

    const { key, defaultValue, isEnabled, workspaceId, rules } = body;

    if (!key || !workspaceId) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // ✅ Create flag with optional rules
    const flag = await prisma.flag.create({
      data: {
        key,
        defaultValue: defaultValue ?? false,
        isEnabled: isEnabled ?? true,
        workspaceId,
        rules: rules
          ? {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              create: rules.map((r: any) => ({
                order: r.order,
                attribute: r.attribute,
                comparator: r.comparator,
                value: r.value,
                rolloutPercent: r.rolloutPercent,
              })),
            }
          : undefined,
      },
      include: { rules: true },
    });
   
     await prisma.auditLog.create({
    data: {
      action: "POST_FLAG",
      flagId: flag.id,
      userId: user.id,
      meta: {
        updatedFields: body,
      },
    },
  });
    await broadcastFlagUpdate(flag);
    await redis.del(`flag:${workspaceId}`);
    return NextResponse.json(flag, { status: 201 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    console.error("Error creating flag:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


