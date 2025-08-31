/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import redis from "../../../../../../lib/redis";
import {broadcastFlagUpdate, broadcastType} from "../../../../../../lib/ws-brodcast"
import { getUserSession } from "../../../../../../lib/auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
   const user = await getUserSession();
      if (!user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
  
  const { id } = await params;
  const flag = await prisma.flag.findUnique({
    where: { id },
    include: { rules: true },
  });

  if (!flag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  return NextResponse.json(flag);
}

// PUT /api/v1/flags/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
   const user = await getUserSession();
    if (!user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { id } = await params;
  const body = await req.json();

     // Validate that the flag exists
    const existingFlag = await prisma.flag.findUnique({
      where: { id },
      include: { rules: true },
    });

    if (!existingFlag) {
      return NextResponse.json({ error: "Flag not found" }, { status: 404 });
    }

    // ✅ Only update fields that are provided in the request
    const updateData: any = {};

    if (body.key !== undefined) {
      // Check if key is unique within the workspace
      if (body.key !== existingFlag.key) {
        const existingKey = await prisma.flag.findFirst({
          where: {
            key: body.key,
            workspaceId: existingFlag.workspaceId,
            id: { not: id }
          }
        });

        if (existingKey) {
          return NextResponse.json(
            { error: "Flag key must be unique within the workspace" },
            { status: 400 }
          );
        }
      }
      updateData.key = body.key;
    }

    if (body.defaultValue !== undefined) {
      updateData.defaultValue = body.defaultValue;
    }

    if (body.isEnabled !== undefined) {
      updateData.isEnabled = body.isEnabled;
    }

    // ✅ Handle workspaceId update if provided (with validation)
    if (body.workspaceId !== undefined && body.workspaceId !== existingFlag.workspaceId) {
      // Verify the new workspace exists
      const newWorkspace = await prisma.workspace.findUnique({
        where: { id: body.workspaceId }
      });

      if (!newWorkspace) {
        return NextResponse.json(
          { error: "Workspace not found" },
          { status: 404 }
        );
      }

      // Check if key is unique in the new workspace
      const existingKeyInNewWorkspace = await prisma.flag.findFirst({
        where: {
          key: existingFlag.key,
          workspaceId: body.workspaceId,
          id: { not: id }
        }
      });

      if (existingKeyInNewWorkspace) {
        return NextResponse.json(
          { error: "Flag key already exists in the target workspace" },
          { status: 400 }
        );
      }

      updateData.workspaceId = body.workspaceId;
    }

    // ✅ Update only the fields that were provided
    const updatedFlag = await prisma.flag.update({
      where: { id },
      data: updateData,
      include: {
        rules: true,
        workspace: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });
  
     await prisma.auditLog.create({
    data: {
      action: "PATCH_FLAG",
      flagId: updatedFlag.id,
      userId: user.id,
      meta: {
        updatedFields: body,
      },
    },
  });

await redis.set(
  `flag:${updatedFlag.workspaceId}:${updatedFlag.key}`,
  JSON.stringify(updatedFlag),
  "EX", 
  60   
);




await broadcastFlagUpdate(updatedFlag);
  return NextResponse.json(updatedFlag);
}



export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
   const user = await getUserSession();
    if (!user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

  const { id } = params;
  const body = await req.json();

  const existingFlag = await prisma.flag.findUnique({
    where: { id },
    include: { rules: true },
  });

  if (!existingFlag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });


  const updateData: any = {};
  if (body.key !== undefined) updateData.key = body.key;
  if (body.defaultValue !== undefined) updateData.defaultValue = body.defaultValue;
  if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled;

 
  const rulesUpdate = body.rules?.map((r: any) => {
    if (r.id) {
    
      return {
        where: { id: r.id },
        data: {
          order: r.order,
          attribute: r.attribute,
          comparator: r.comparator,
          value: r.value,
          rolloutPercent: r.rolloutPercent,
        },
      };
    } else {
      // Create new rule
      return {
        create: {
          order: r.order,
          attribute: r.attribute,
          comparator: r.comparator,
          value: r.value,
          rolloutPercent: r.rolloutPercent,
        },
      };
    }
  });

  
  const updatedFlag = await prisma.flag.update({
    where: { id },
    data: {
      ...updateData,
      rules: rulesUpdate ? { 
        update: rulesUpdate.filter((u: any) => 'where' in u),
        create: rulesUpdate.filter((u: any) => 'create' in u).map((u: { create: any; }) => u.create),
      } : undefined,
    },
    include: { rules: true, workspace: { select: { id: true, name: true } } },
  });
 await prisma.auditLog.create({
    data: {
      action: "PUT_FLAG",
      flagId: updatedFlag.id,
      userId: user.id,
      meta: {
        updatedFields: body,
      },
    },
  });
  // Update cache
  await redis.set(
    `flag:${updatedFlag.workspaceId}:${updatedFlag.key}`,
    JSON.stringify(updatedFlag),
    "EX",
    60
  );
await redis.del(`flag:${updatedFlag.workspaceId}`);
  // Broadcast update
  await broadcastFlagUpdate(updatedFlag);

  return NextResponse.json(updatedFlag);
}


export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = await params;

  // ✅ Get current user session
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

  
  const existingFlag = await prisma.flag.findUnique({
    where: { id },
    include: { rules: true },
  });

  if (!existingFlag) {
    return NextResponse.json({ error: "Flag not found" }, { status: 404 });
  }
  if (existingFlag.workspaceId !== currentUser.workspaceId) {
    return NextResponse.json({ error: "You are not authorized to delete this flag" }, { status: 403 });
  }

  try {
    await prisma.flagRule.deleteMany({
      where: { flagId: id },
    });

   const res= await prisma.flag.delete({
      where: { id },
    });
     await prisma.auditLog.create({
    data: {
      action: "POST_FLAG",
      flagId: id,
      userId:currentUser.id,
      meta: {
        updatedFields: res,
      },
    },
  });
    await broadcastType(res.id,"delete");
    await redis.del(`flag:${existingFlag.workspaceId}:${existingFlag.key}`);

    return NextResponse.json({ message: "Flag deleted successfully" });
  } catch (err) {
    console.error("Error deleting flag:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}