import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import prisma from '@/lib/prisma';
import { bookAppointment } from '@/lib/googleCalendar';

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    // Standard inbound email webhook parsing (e.g. from SendGrid or generic parser)
    // For this example, we expect JSON with { clientId, fromEmail, fromName, subject, body }
    const payload = await req.json();
    const { clientId, fromEmail, fromName, subject, body } = payload;

    if (!clientId || !fromEmail) {
      return NextResponse.json({ error: "Missing clientId or fromEmail" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    const systemPrompt = `CORE KNOWLEDGE BASE:\n${client.rulebook}\n\nEMAIL DRATER INSTRUCTIONS:\n${client.emailInstructions}\n\nCRITICAL SCHEDULING RULES:\n${client.schedulingRules || "You can book appointments at any valid business time."}\nYou MUST STRICTLY enforce these scheduling rules when using the book_appointment tool. If the patient requests a valid time, use the tool to book it, and then write an email reply confirming the time. If they request an invalid time, write an email reply offering a valid alternative.`;

    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
        tools: [
          {
            functionDeclarations: [
              {
                name: "book_appointment",
                description: "Books an appointment on the clinic's Google Calendar. ONLY call this when the user has provided their name, phone number, and requested a specific date and time.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "The date of the appointment in YYYY-MM-DD format." },
                    time: { type: Type.STRING, description: "The time of the appointment in HH:MM format (24-hour)." },
                    patientName: { type: Type.STRING, description: "The name of the patient." },
                    patientPhone: { type: Type.STRING, description: "The phone number of the patient. If not provided in the email, use 'Unknown'." },
                  },
                  required: ["date", "time", "patientName", "patientPhone"],
                },
              },
            ],
          },
        ],
      }
    });

    const userMessage = `From: ${fromName} <${fromEmail}>\nSubject: ${subject}\n\nBody: ${body}`;
    let response = await chatSession.sendMessage({ message: userMessage });

    // Check if Gemini called the Calendar Tool
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "book_appointment") {
        const args = call.args as any;
        const result = await bookAppointment(clientId, args.patientName, args.patientPhone, args.date, args.time);
        
        response = await chatSession.sendMessage({
          message: [
            {
              functionResponse: {
                name: "book_appointment",
                response: result,
              }
            }
          ] as any
        });
      }
    }

    // Save the drafted AI email reply to the database
    const newEmail = await prisma.email.create({
      data: {
        clientId: client.id,
        fromEmail,
        fromName: fromName || "Unknown",
        subject: `Re: ${subject}`,
        body: body,
        aiDraft: response.text,
        status: "DRAFTED"
      }
    });

    return NextResponse.json({ success: true, emailId: newEmail.id });

  } catch (error: any) {
    console.error("Email Webhook Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
