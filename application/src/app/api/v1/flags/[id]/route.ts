/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import prisma from "../../../../../../lib/prisma";
import redis from "../../../../../../lib/redis";
import {broadcastFlagUpdate} from "../../../../../../lib/ws-brodcast"

// Assume you have a singleton WS server or pub/sub channel somewhere


// GET /api/v1/flags/:id
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
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
            id: { not: id } // Exclude current flag
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
  


await redis.set(
  `flag:${updatedFlag.workspaceId}:${updatedFlag.key}`,
  JSON.stringify(updatedFlag),
  "EX", // string, not object
  60    // TTL in seconds
);




await broadcastFlagUpdate(updatedFlag);
  return NextResponse.json(updatedFlag);
}



export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  const body = await req.json();

  // Get existing flag
  const existingFlag = await prisma.flag.findUnique({
    where: { id },
    include: { rules: true },
  });

  if (!existingFlag) return NextResponse.json({ error: "Flag not found" }, { status: 404 });

  // Prepare flag update
  const updateData: any = {};
  if (body.key !== undefined) updateData.key = body.key;
  if (body.defaultValue !== undefined) updateData.defaultValue = body.defaultValue;
  if (body.isEnabled !== undefined) updateData.isEnabled = body.isEnabled;

  // Prepare rules update
  const rulesUpdate = body.rules?.map((r: any) => {
    if (r.id) {
      // Update existing rule
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

  // Update flag and rules
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