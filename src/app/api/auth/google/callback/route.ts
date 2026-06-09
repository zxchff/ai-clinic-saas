import { NextResponse } from "next/server";
import { google } from "googleapis";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const clientId = searchParams.get("state");

  if (!code || !clientId) {
    return NextResponse.json({ error: "Missing code or state" }, { status: 400 });
  }

  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
  let appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;
  if (!appUrl.startsWith("http")) appUrl = `https://${appUrl}`;
  if (appUrl.endsWith("/")) appUrl = appUrl.slice(0, -1);

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${appUrl}/api/auth/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    
    if (tokens.refresh_token) {
      await prisma.client.update({
        where: { id: clientId },
        data: { 
          googleRefreshToken: tokens.refresh_token,
          // We'll use the primary calendar for now
          calendarId: "primary" 
        }
      });
    }

    return NextResponse.redirect(`${appUrl}/dashboard/client/${clientId}`);
  } catch (error) {
    console.error("Error exchanging token:", error);
    return NextResponse.json({ error: "Failed to authenticate" }, { status: 500 });
  }
}
