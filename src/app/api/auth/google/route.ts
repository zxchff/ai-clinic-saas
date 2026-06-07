import { NextResponse } from "next/server";
import { google } from "googleapis";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  if (!clientId) {
    return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${origin}/api/auth/google/callback`
  );

  const scopes = [
    "https://www.googleapis.com/auth/calendar.events"
  ];

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    state: clientId, // We pass the client ID in the state so we know who to save it to later
    prompt: "consent", // Force consent so we always get a refresh token
  });

  return NextResponse.redirect(url);
}
