import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getUnreadEmails, markEmailAsRead, sendEmailReply } from "@/lib/gmail";
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function POST(req: Request) {
  try {
    const { clientId } = await req.json();

    if (!clientId) {
      return NextResponse.json({ error: "Missing clientId" }, { status: 400 });
    }

    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    if (!client.googleRefreshToken) {
      return NextResponse.json({ error: "Client has not connected Google account" }, { status: 400 });
    }

    // 1. Fetch unread emails
    const unreadEmails = await getUnreadEmails(client.googleRefreshToken);
    
    if (unreadEmails.length === 0) {
      return NextResponse.json({ message: "No unread emails found.", processed: 0 });
    }

    let processedCount = 0;

    // 2. Setup Gemini Prompt
    const now = new Date();
    const currentDate = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const currentTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    const systemPrompt = `[CRITICAL SYSTEM INFO: Today is ${currentDate}. The current time is ${currentTime}. Assume all appointments are for the current year unless specified otherwise.]\n\nCORE KNOWLEDGE BASE:\n${client.rulebook}\n\nEMAIL WRITER INSTRUCTIONS:\nYou are reading an incoming email from a patient. Write a professional email reply back to them. DO NOT act like a chatbot. Act like a human receptionist replying to an email.\n${client.emailInstructions || ""}\n\nCRITICAL SCHEDULING RULES:\n${client.schedulingRules || "You can book appointments at any valid business time."}\nYou MUST STRICTLY enforce these scheduling rules when using the book_appointment tool.\n\nCRITICAL LENIENCY DIRECTIVE: Do not be overly strict when asking for information. If they provide partial information, happily accept it and only ask for what is missing. You MUST collect their phone number to book, but ask for it nicely.`;

    const config = {
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
                  date: { type: Type.STRING, description: "The date of the appointment in YYYY-MM-DD format." },
                  time: { type: Type.STRING, description: "The time of the appointment in HH:MM format (24-hour UTC)." },
                  durationMinutes: { type: Type.NUMBER, description: "The duration of the appointment in minutes based on what the patient asked for." },
                  patientName: { type: Type.STRING, description: "The name of the patient." },
                  patientPhone: { type: Type.STRING, description: "The phone number of the patient." },
                },
                required: ["date", "time", "patientName", "patientPhone"],
              },
            },
          ],
        },
      ],
    };

    // 3. Process each email
    for (const email of unreadEmails) {
      console.log(`Processing email from ${email.from}: ${email.subject}`);
      
      const emailContent = `From: ${email.from}\nSubject: ${email.subject}\nDate: ${email.date}\n\nMessage:\n${email.body}`;
      
      const contents = [
        { role: 'user', parts: [{ text: emailContent }] }
      ];

      let response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: contents,
        config: config as any
      });

      let finalReplyText = response.text;

      // Check for function calls
      if (response.functionCalls && response.functionCalls.length > 0) {
        const call = response.functionCalls[0];
        
        if (call.name === "check_availability") {
          const args = call.args as any;
          const { checkAvailability } = await import('@/lib/googleCalendar');
          const result = await checkAvailability(client.id, args.date);
          
          const nextContents = [
            ...contents,
            { role: 'model', parts: [{ functionCall: call }] },
            { role: 'user', parts: [{ functionResponse: { name: "check_availability", response: result } }] }
          ];

          response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: nextContents as any,
             config: { systemInstruction: systemPrompt }
          });
          
          finalReplyText = response.text;
        }
        
        else if (call.name === "book_appointment") {
          const args = call.args as any;
          const { bookAppointment } = await import('@/lib/googleCalendar');
          
          const result = await bookAppointment(client.id, args.patientName, args.patientPhone, args.date, args.time, args.durationMinutes);
          
          if (result.success) {
            finalReplyText = "✅ Your appointment has been successfully booked and added to the calendar. Is there anything else I can help you with?";
          } else {
            finalReplyText = `❌ I'm sorry, I couldn't book the appointment: ${result.message || result.error}`;
          }
        }
      }

      // 4. Send the reply via Gmail API
      // Extract pure email address from "Name <email@domain.com>" format
      const toEmailMatch = email.from.match(/<([^>]+)>/);
      const toEmail = toEmailMatch ? toEmailMatch[1] : email.from;
      
      if (finalReplyText) {
        await sendEmailReply(client.googleRefreshToken, toEmail, email.subject, finalReplyText, email.threadId || "");
        console.log(`Sent reply to ${toEmail}`);
      }

      // 5. Mark the original email as read
      await markEmailAsRead(client.googleRefreshToken, email.id);
      processedCount++;
    }

    return NextResponse.json({ message: "Emails processed successfully", processed: processedCount });

  } catch (error: any) {
    console.error("Email Sync Error:", error);
    return NextResponse.json({ error: error.message || error.toString() }, { status: 500 });
  }
}
