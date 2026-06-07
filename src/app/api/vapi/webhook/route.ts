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

    if (body.message?.type === "tool-calls") {
      const results = [];

      for (const item of body.message.toolWithToolCallList) {
        const toolCall = item.toolCall;

        if (toolCall.function.name === "book_appointment") {
          const args = toolCall.function.arguments; // already parsed by Vapi usually, or might be a JSON string
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
              results.push({
                toolCallId: toolCall.id,
                result: `Successfully booked appointment. Confirmation link: ${calendarResult.link}`,
              });
            } else {
              results.push({
                toolCallId: toolCall.id,
                result: `Failed to book appointment: ${calendarResult.error}`,
              });
            }
          } catch (error: any) {
            results.push({
              toolCallId: toolCall.id,
              result: `Error booking calendar: ${error.message}`,
            });
          }
        }
      }

      return NextResponse.json({ results });
    }

    return NextResponse.json({ error: "Unknown message type" }, { status: 400 });
  } catch (error: any) {
    console.error("Vapi Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
