import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. Get the incoming phone number to identify the clinic
    const formData = await req.formData();
    const toPhoneNumber = formData.get("To") as string;
    
    // 2. Generate TwiML (Twilio XML) to answer the call
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="Polly.Matthew-Neural">Please wait while I connect you to the AI Receptionist.</Say>
    <Connect>
        <Stream url="wss://${req.headers.get("host")}/api/voice/stream">
            <Parameter name="clinicPhone" value="${toPhoneNumber}" />
        </Stream>
    </Connect>
</Response>`;

    // 3. Return the XML so Twilio knows what to do
    return new NextResponse(twiml, {
      status: 200,
      headers: { "Content-Type": "text/xml" },
    });
  } catch (error) {
    console.error("Twilio Webhook Error:", error);
    return new NextResponse("Error handling call", { status: 500 });
  }
}
