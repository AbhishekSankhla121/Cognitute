import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getUserSession } from "../../../../../lib/auth";
import redis from "../../../../../lib/redis";

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
