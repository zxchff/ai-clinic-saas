import { NextResponse } from "next/server";
import { google } from "googleapis";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import prisma from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state"); 

  if (!code || !state) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?error=MissingCodeOrState`);
  }

  const clientId = state; 
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const redirectUri = `${appUrl}/api/oauth/sheets/callback`;

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    redirectUri
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Use Google Sheets API to create the Spreadsheet!
    const sheets = google.sheets({ version: "v4", auth: oauth2Client });
    
    const spreadsheet = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title: "AI Voice Receptionist - Lead Tracker",
        },
      },
    });

    const spreadsheetId = spreadsheet.data.spreadsheetId;

    if (!spreadsheetId) {
      throw new Error("Failed to create Google Spreadsheet.");
    }

    // Add the Column Headers
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: "A1:D1",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          ["Date", "Caller Number", "Call Summary", "Recording Link"]
        ]
      }
    });

    // Make the header bold and format the sheet (Optional polish step using batchUpdate)
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: spreadsheetId,
      requestBody: {
        requests: [
          {
            repeatCell: {
              range: {
                sheetId: 0,
                startRowIndex: 0,
                endRowIndex: 1,
              },
              cell: {
                userEnteredFormat: {
                  backgroundColor: { red: 0.2, green: 0.2, blue: 0.2 },
                  textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
                }
              },
              fields: "userEnteredFormat(backgroundColor,textFormat)"
            }
          }
        ]
      }
    });

    // Save to the database
    await prisma.client.update({
      where: { id: clientId },
      data: {
        googleSheetsId: spreadsheetId,
        ...(tokens.refresh_token && { sheetsRefreshToken: tokens.refresh_token }),
      }
    });

    return NextResponse.redirect(`${appUrl}/dashboard/client/${clientId}?success=SheetsConnected`);
  } catch (error) {
    console.error("Error exchanging OAuth code and creating sheet:", error);
    return NextResponse.redirect(`${appUrl}/dashboard/client/${clientId}?error=SheetsOAuthFailed`);
  }
}
