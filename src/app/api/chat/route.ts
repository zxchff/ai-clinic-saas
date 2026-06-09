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

    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    systemPrompt = `[SYSTEM CLOCK: Today is ${currentDate}. Current time is ${currentTime}. The current year is ${now.getFullYear()}. Always use this year for appointments unless the user specifies otherwise.]

=== RULE #1: MEMORY (THIS OVERRIDES EVERYTHING) ===
You MUST track every piece of information the user gives you across the ENTIRE conversation.
When the user provides their name, phone, date, or time — STORE IT PERMANENTLY.
NEVER ask for something the user has already told you. NEVER pretend you forgot.
If you catch yourself about to ask for something already provided, STOP and use what you have.

=== RULE #2: BOOKING LOGIC ===
To book an appointment you need exactly 4 things:
1. Patient Name
2. Phone Number  
3. Date (if they say "5 june", that means ${now.getFullYear()}-06-05)
4. Time (if they say "5 oclock" or "5 pm", that means 17:00)

As soon as you have ALL 4, IMMEDIATELY call book_appointment. Do NOT ask for confirmation. Do NOT ask AM/PM if they said "oclock" (assume PM). Do NOT ask for the year.

=== RULE #3: PERSONALITY (SECONDARY TO RULES 1 AND 2) ===
${client.chatInstructions}

=== KNOWLEDGE BASE ===
${client.rulebook}

=== SCHEDULING RULES ===
${client.schedulingRules || "You can book appointments at any valid business time."}
You MUST STRICTLY enforce these scheduling rules.`;

    // 2. Format messages for Gemini using the dynamic Rulebook
    let history = messages.slice(0, -1).map((msg: any) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    // Gemini strictly requires history to start with a 'user' message.
    // If the frontend sent the initial AI greeting ("Hi! I'm the AI..."), we MUST strip it!
    if (history.length > 0 && history[0].role === 'model') {
      history.shift();
    }

    const lastUserMessage = messages[messages.length - 1].content;
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: lastUserMessage }] }
    ];

    let response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
        tools: [
          {
            functionDeclarations: [
              {
                name: "check_availability",
                description: "Queries the Google Calendar to find all busy/occupied time slots for a specific date.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    date: { type: Type.STRING, description: "The date to check in YYYY-MM-DD format." }
                  },
                  required: ["date"]
                }
              },
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
                      description: "The time of the appointment in HH:MM format (24-hour UTC).",
                    },
                    durationMinutes: {
                      type: Type.NUMBER,
                      description: "The duration of the appointment in minutes based on what the patient asked for (e.g. 30, 60, 120).",
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

    // 3. Check if Gemini decided to call our Calendar Tools!
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      
      if (call.name === "check_availability" && clientId) {
        const args = call.args as any;
        const { checkAvailability } = await import('@/lib/googleCalendar');
        const result = await checkAvailability(clientId, args.date);
        
        const nextContents = [
          ...contents,
          { role: 'model', parts: [{ functionCall: call }] },
          { role: 'user', parts: [{ functionResponse: { name: "check_availability", response: result } }] }
        ];

        response = await ai.models.generateContent({
           model: 'gemini-2.5-flash',
           contents: nextContents as any,
           config: {
              systemInstruction: systemPrompt,
              // Intentionally stripping tools for the final turn to prevent loops
           }
        });
      }
      
      else if (call.name === "book_appointment" && clientId) {
        const args = call.args as any;
        const { bookAppointment } = await import('@/lib/googleCalendar');
        
        // Push the event to Google Calendar
        const result = await bookAppointment(clientId, args.patientName, args.patientPhone, args.date, args.time, args.durationMinutes);
        
        if (result.success) {
          return NextResponse.json({ reply: "✅ Appointment successfully booked! I've added it to the calendar. Is there anything else I can help you with?" });
        } else {
          return NextResponse.json({ reply: `❌ I couldn't book the appointment: ${result.message || result.error}` });
        }
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
