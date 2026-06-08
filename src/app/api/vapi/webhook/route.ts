import { NextResponse } from "next/server";
import { bookAppointment } from "@/lib/googleCalendar";

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get("clientId");

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    const body = await req.json();

    // 1. Handle Tool Calls (Booking Appointments)
    if (body.message?.type === "tool-calls") {
      const results = [];
      for (const item of body.message.toolWithToolCallList) {
        const toolCall = item.toolCall;
        if (toolCall.function.name === "book_appointment") {
          const args = toolCall.function.arguments;
          const parsedArgs = typeof args === 'string' ? JSON.parse(args) : args;
          try {
            const calendarResult = await bookAppointment(
              clientId,
              parsedArgs.patientName,
              parsedArgs.patientPhone,
              parsedArgs.date,
              parsedArgs.time
            );
            if (calendarResult.success) {
              results.push({ toolCallId: toolCall.id, result: `Successfully booked appointment.` });
            } else {
              results.push({ toolCallId: toolCall.id, result: `Failed to book appointment.` });
            }
          } catch (error: any) {
            results.push({ toolCallId: toolCall.id, result: `Error booking calendar: ${error.message}` });
          }
        }
      }
      return NextResponse.json({ results });
    }

    // 2. Handle End of Call Report (Google Sheets Lead Tracker)
    if (body.message?.type === "end-of-call-report") {
      const callData = body.message;
      
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });

      if (client?.googleSheetsId && client?.sheetsRefreshToken) {
        // Extract call details from Vapi payload
        const summary = callData.summary || "No summary provided.";
        const recordingUrl = callData.recordingUrl || "No recording available.";
        const callerNumber = callData.customer?.number || "Unknown Caller";
        const date = new Date().toLocaleString();

        // Setup Google Sheets API
        const oauth2Client = new google.auth.OAuth2(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET
        );
        oauth2Client.setCredentials({ refresh_token: client.sheetsRefreshToken });
        const sheets = google.sheets({ version: "v4", auth: oauth2Client });

        // Append the row!
        await sheets.spreadsheets.values.append({
          spreadsheetId: client.googleSheetsId,
          range: "A:D", // Assuming A: Date, B: Caller, C: Summary, D: Recording
          valueInputOption: "USER_ENTERED",
          requestBody: {
            values: [
              [date, callerNumber, summary, recordingUrl]
            ]
          }
        });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unknown message type" }, { status: 400 });
  } catch (error: any) {
    console.error("Vapi Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
