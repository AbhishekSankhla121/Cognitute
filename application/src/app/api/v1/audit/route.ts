import {  NextResponse } from "next/server";
import prisma from "../../../../../lib/prisma"; // adjust path as needed
import { getUserSession } from "../../../../../lib/auth";

export async function GET() {
  
  const user = await getUserSession();
    if (!user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  try {
    // Fetch all audit logs related to a specific workspace or flag
    const logs = await prisma.auditLog.findMany({
      where: {
        
           userId: user.id

      },
      include: {
        flag: true,
        user: true
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    return NextResponse.json({ logs }, { status: 200 });
  } catch (err) {
    console.error("Error fetching audit logs:", err);
    return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 });
  }
}
