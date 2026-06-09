import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import prisma from '@/lib/prisma';

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, clientId } = body;

    // 1. Fetch the specific client from our Database!
    let systemPrompt = "You are a helpful AI receptionist.";
    
    if (!clientId) {
      return NextResponse.json({ reply: "DEBUG ERROR: The backend API received your message, but the Client ID was completely missing! The widget failed to send it." });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json({ reply: `DEBUG ERROR: The backend API received Client ID [${clientId}], but could not find Zach's Dental in the database!` });
    }

    if (!client.chatInstructions) {
      return NextResponse.json({ reply: `DEBUG ERROR: The backend successfully found Zach's Dental, but your Chatbot Instructions are blank in the database! Did you click Save Settings?` });
    }

    systemPrompt = `CORE KNOWLEDGE BASE:\n${client.rulebook}\n\nCHATBOT PERSONALITY INSTRUCTIONS:\n${client.chatInstructions}\n\nCRITICAL SCHEDULING RULES:\n${client.schedulingRules || "You can book appointments at any valid business time."}\nYou MUST STRICTLY enforce these scheduling rules when using the book_appointment tool.`;

    // 2. Format messages for Gemini using the dynamic Rulebook
    const history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      history: history,
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
                    date: {
                      type: Type.STRING,
                      description: "The date of the appointment in YYYY-MM-DD format.",
                    },
                    time: {
                      type: Type.STRING,
                      description: "The time of the appointment in HH:MM format (24-hour).",
                    },
                    patientName: {
                      type: Type.STRING,
                      description: "The name of the patient.",
                    },
                    patientPhone: {
                      type: Type.STRING,
                      description: "The phone number of the patient.",
                    },
                  },
                  required: ["date", "time", "patientName", "patientPhone"],
                },
              },
            ],
          },
        ],
      }
    });

    const lastUserMessage = messages[messages.length - 1].content;
    let response = await chatSession.sendMessage({ message: lastUserMessage });

    // 3. Check if Gemini decided to call our Calendar Tool!
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "book_appointment" && clientId) {
        const args = call.args as any;
        const { bookAppointment } = await import('@/lib/googleCalendar');
        
        // Push the event to Google Calendar
        const result = await bookAppointment(clientId, args.patientName, args.patientPhone, args.date, args.time);
        
        // Tell Gemini the result so it can reply to the user
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

    return NextResponse.json({ reply: response.text });

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { reply: `ERROR: ${error.message || error.toString()}` },
      { status: 500 }
    );
  }
}
