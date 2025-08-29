import { NextRequest, NextResponse } from 'next/server'
import prisma from "../../../../../lib/prisma"
export async function GET(
 req: NextRequest,res:NextResponse

) {
  const data = await prisma.user.findFirst()
  console.log(data)
  return NextResponse.json({"abhishek":"asas"});
}
