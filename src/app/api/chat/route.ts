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

    // ===== SERVER-SIDE BOOKING TRACKER =====
    // Gemini cannot reliably track info across turns, so WE extract it ourselves
    // and inject a summary into the prompt so Gemini physically cannot miss it.
    const allUserMessages = messages
      .filter((m: any) => m.role === 'user')
      .map((m: any) => m.content)
      .join(' ');
    const allMessages = messages.map((m: any) => m.content).join(' ');

    // Extract name: look for common name patterns
    let extractedName: string | null = null;
    let extractedPhone: string | null = null;
    let extractedDate: string | null = null;
    let extractedTime: string | null = null;

    // Phone: any sequence of 6+ digits
    const phoneMatch = allUserMessages.match(/\b(\d{6,15})\b/);
    if (phoneMatch) extractedPhone = phoneMatch[1];

    // Name: look for standalone words that aren't numbers/dates/times
    // Check if the AI confirmed a name in its responses
    const nameFromAI = allMessages.match(/(?:name is|name down|hello|hi)\s+([A-Za-z]+)/i);
    if (nameFromAI) extractedName = nameFromAI[1];
    // Also check user messages for a simple name (word that's not a number, month, or time keyword)
    if (!extractedName) {
      const months = ['january','february','march','april','may','june','july','august','september','october','november','december','jan','feb','mar','apr','jun','jul','aug','sep','oct','nov','dec'];
      const timeWords = ['am','pm','oclock','o\'clock','morning','afternoon','evening','appointment','book','hi','hello','hey','yes','no','ok','please','thanks','thank'];
      for (const msg of messages) {
        if (msg.role !== 'user') continue;
        const words = msg.content.split(/[\s,]+/);
        for (const word of words) {
          const clean = word.toLowerCase().replace(/[^a-z]/g, '');
          if (clean.length >= 2 && clean.length <= 20 
              && !/^\d+$/.test(word) 
              && !months.includes(clean) 
              && !timeWords.includes(clean)) {
            extractedName = word;
            break;
          }
        }
        if (extractedName) break;
      }
    }

    // Date: look for patterns like "5 june", "june 5", "5/6", etc.
    const datePatterns = [
      /(\d{1,2})\s*(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)/i,
      /(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s*(\d{1,2})/i,
    ];
    for (const pattern of datePatterns) {
      const match = allUserMessages.match(pattern);
      if (match) {
        const monthNames: Record<string, string> = { jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03', apr: '04', april: '04', may: '05', jun: '06', june: '06', jul: '07', july: '07', aug: '08', august: '08', sep: '09', september: '09', oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12' };
        let dayStr: string, monthStr: string;
        if (/^\d/.test(match[1])) {
          dayStr = match[1];
          monthStr = match[2].toLowerCase().substring(0, 3);
        } else {
          monthStr = match[1].toLowerCase().substring(0, 3);
          dayStr = match[2];
        }
        const monthNum = monthNames[monthStr] || monthNames[match[1].toLowerCase()] || monthNames[match[2].toLowerCase()];
        if (monthNum) {
          extractedDate = `${now.getFullYear()}-${monthNum}-${dayStr.padStart(2, '0')}`;
        }
        break;
      }
    }

    // Time: look for patterns like "5 oclock", "4 pm", "16:00"
    const timePatterns = [
      /(\d{1,2})\s*(?:o'?clock|oclock)/i,
      /(\d{1,2})\s*(?:pm|p\.m\.)/i,
      /(\d{1,2})\s*(?:am|a\.m\.)/i,
      /(\d{1,2}):(\d{2})/,
    ];
    for (const pattern of timePatterns) {
      const match = allUserMessages.match(pattern);
      if (match) {
        let hour = parseInt(match[1]);
        const isPM = /pm|p\.m\.|oclock|o'clock/i.test(match[0]);
        const isAM = /am|a\.m\./i.test(match[0]);
        if (isPM && hour < 12) hour += 12;
        if (isAM && hour === 12) hour = 0;
        // If they just said "oclock" and hour <= 6, assume PM (e.g., "4 oclock" = 16:00)
        if (/oclock|o'clock/i.test(match[0]) && hour <= 6) hour += 12;
        const minutes = match[2] || '00';
        extractedTime = `${String(hour).padStart(2, '0')}:${minutes}`;
        break;
      }
    }

    // Build the tracker summary
    const tracker = `
[BOOKING TRACKER - Information collected from this conversation so far:]
- Name: ${extractedName || 'NOT YET PROVIDED'}
- Phone: ${extractedPhone || 'NOT YET PROVIDED'}
- Date: ${extractedDate || 'NOT YET PROVIDED'}
- Time: ${extractedTime || 'NOT YET PROVIDED'}
${extractedName ? `Do NOT ask for the patient's name again - it is "${extractedName}".` : ''}
${extractedPhone ? `Do NOT ask for the phone number again - it is "${extractedPhone}".` : ''}
${extractedDate ? `Do NOT ask for the date again - it is "${extractedDate}".` : ''}
${extractedTime ? `Do NOT ask for the time again - it is "${extractedTime}".` : ''}
ONLY ask for the items marked "NOT YET PROVIDED". If ALL 4 are filled, IMMEDIATELY call book_appointment.`;

    // ===== AUTO-BOOKING: If we have all 4 pieces, skip Gemini entirely =====
    if (extractedName && extractedPhone && extractedDate && extractedTime && clientId) {
      try {
        const { bookAppointment } = await import('@/lib/googleCalendar');
        const result = await bookAppointment(clientId, extractedName, extractedPhone, extractedDate, extractedTime, 60);
        if (result.success) {
          return NextResponse.json({ reply: `✅ Appointment successfully booked for ${extractedName} on ${extractedDate} at ${extractedTime}! I've added it to the calendar. Is there anything else I can help you with?` });
        } else {
          return NextResponse.json({ reply: `❌ I couldn't book the appointment: ${result.message || result.error}` });
        }
      } catch (e: any) {
        // If auto-booking fails, fall through to Gemini
        console.error("Auto-booking failed:", e);
      }
    }

    const lastUserMessage = messages[messages.length - 1].content;
    const contents = [
      ...history,
      { role: 'user', parts: [{ text: lastUserMessage + '\n' + tracker }] }
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
