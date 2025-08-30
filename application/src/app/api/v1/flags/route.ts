import { NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma";
import { getUserSession } from "../../../../../lib/auth";

export async function GET() {
  const user = await getUserSession();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const currentUser = await prisma.user.findFirst({
    where:{
        id:user.id
    }
  })
  if(!currentUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if( !currentUser.workspaceId) return NextResponse.json({ error: "No workspace" }, { status: 401 })
const flags = await prisma.flag.findMany({
    where: {
    workspaceId: currentUser.workspaceId, 
  },
  include: { rules: true },
});

  return NextResponse.json({flags:flags,access:currentUser.role, workspaceId:currentUser.workspaceId});
}