import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard/client/${clientId}?error=NoAuthCode`);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/clients/${clientId}/gmail/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get the email address of the authenticated user
    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const connectedEmail = userInfo.data.email;

    if (!connectedEmail) {
      throw new Error("Could not retrieve email address from Google.");
    }

    // Save to the database
    // Note: Google only sends refresh_token on the first authorization (or when prompt="consent" is used)
    await prisma.client.update({
      where: { id: clientId },
      data: {
        connectedEmail: connectedEmail,
        ...(tokens.refresh_token && { googleRefreshToken: tokens.refresh_token }),
      }
    });

    // Redirect back to the dashboard
    return NextResponse.redirect(`${appUrl}/dashboard/client/${clientId}?success=GmailConnected`);
  } catch (error) {
    console.error("Error exchanging OAuth code:", error);
    return NextResponse.redirect(`${appUrl}/dashboard/client/${clientId}?error=OAuthFailed`);
  }
}
