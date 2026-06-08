import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  let dbConnection = false;
  let dbUsers = 0;
  
  try {
    const userCount = await prisma.user.count();
    dbConnection = true;
    dbUsers = userCount;
  } catch (error) {
    dbConnection = false;
  }

  return NextResponse.json({
    status: "Diagnostics Running",
    environmentVariables: {
      NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET,
      NEXTAUTH_URL: !!process.env.NEXTAUTH_URL,
      GOOGLE_CLIENT_ID: !!process.env.GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET: !!process.env.GOOGLE_CLIENT_SECRET,
      DATABASE_URL: !!process.env.DATABASE_URL,
    },
    databaseStatus: {
      canConnect: dbConnection,
      userTableExists: dbConnection,
    }
  });
}
