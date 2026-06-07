import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.message?.type === "assistant-request") {
      const vapiPhoneNumber = body.message.call?.phoneNumber?.twilioPhoneNumber || body.message.call?.phoneNumber?.number;

      let client;
      if (vapiPhoneNumber) {
        client = await prisma.client.findFirst({
          where: { vapiPhoneNumber },
        });
      }

      if (!client) {
        // Fallback to the latest client if phone number matching fails (for testing)
        client = await prisma.client.findFirst({
          orderBy: { createdAt: "desc" },
        });
      }

      if (!client) {
        throw new Error("No client found");
      }

      const systemPrompt = `You are a helpful AI receptionist for ${client.name}.
Your personality: ${client.phoneInstructions || "Be professional, polite, and concise."}
Here are the facts about the business:
${client.rulebook}

If the user wants to book an appointment, use the book_appointment tool. You must ask for their name, phone number, and preferred date/time before booking.`;

      const protocol = req.headers.get("x-forwarded-proto") || "http";
      const host = req.headers.get("x-forwarded-host") || req.headers.get("host") || "localhost:3000";
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${protocol}://${host}`;

      return NextResponse.json({
        assistant: {
          model: {
            provider: "openai",
            model: "gpt-4o-mini",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              }
            ],
            tools: [], // Temporarily empty to test connectivity
          },
          voice: {
            provider: "11labs",
            voiceId: "bIHbv24MWmeRgasZH58o", // Rachel voice
          },
          firstMessage: `Hello! Thank you for calling ${client.name}. How can I help you today?`,
        }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Vapi Inbound Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
