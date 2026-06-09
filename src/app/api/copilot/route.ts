import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from '@google/genai';
import prisma from '@/lib/prisma';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const { clientId, prompt, token } = await req.json();

    // 1. Verify Authorization (Either Admin Session OR Portal Token)
    let isAuthorized = false;
    const session = await getServerSession(authOptions);
    
    const client = await prisma.client.findUnique({ where: { id: clientId } });
    if (!client) return NextResponse.json({ error: "Client not found" }, { status: 404 });

    if (session?.user?.email && ["zachfransman8@gmail.com", "fransmanmarketing@gmail.com"].includes(session.user.email)) {
      isAuthorized = true;
    } else if (token && client.portalToken === token) {
      isAuthorized = true;
    }

    if (!isAuthorized) {
      return NextResponse.json({ error: "Unauthorized access to Copilot" }, { status: 401 });
    }

    // 2. Give Gemini the current state of the database so it knows what it is editing
    const systemInstruction = `You are the Admin Copilot for an AI SaaS platform. 
Your job is to listen to the user's natural language request and edit the database configuration for their client named "${client.name}".
You have access to a tool called 'update_client_settings'. ALWAYS use this tool to apply changes if the user is asking to change rules, hours, instructions, or voice.

CURRENT DATABASE STATE FOR ${client.name}:
- Core Rulebook: ${client.rulebook || "Empty"}
- Phone Instructions: ${client.phoneInstructions || "Empty"}
- Chatbot Instructions: ${client.chatInstructions || "Empty"}
- Email Instructions: ${client.emailInstructions || "Empty"}
- Voice ID: ${client.voiceId || "rachel"}

If the user says "Make the chatbot speak Spanish", use the tool to append "Speak in Spanish." to the chatInstructions. 
If the user says "We are closed on Fridays", use the tool to append "We are closed on Fridays." to the Core Rulebook.
IMPORTANT: Do not overwrite the entire field unless requested. If they ask to ADD a rule, rewrite the current state + the new rule.
After you use the tool, briefly tell the user what you updated (e.g., "Done! I've updated the rulebook to reflect that you are closed on Fridays.").`;

    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              {
                name: "update_client_settings",
                description: "Updates the AI settings in the database for the client.",
                parameters: {
                  type: Type.OBJECT,
                  properties: {
                    rulebook: { type: Type.STRING, description: "The complete, updated Core Rulebook." },
                    phoneInstructions: { type: Type.STRING, description: "The complete, updated Phone Receptionist Instructions." },
                    chatInstructions: { type: Type.STRING, description: "The complete, updated Website Chatbot Instructions." },
                    emailInstructions: { type: Type.STRING, description: "The complete, updated Email Drafter Instructions." },
                    voiceId: { type: Type.STRING, description: "The ID of the Voice (e.g. alloy, shimmer, rachel, etc)." }
                  }
                }
              }
            ]
          }
        ]
      }
    });

    // Send the user's prompt to Gemini
    let response = await chatSession.sendMessage({ message: prompt });

    // Handle the Tool Call
    if (response.functionCalls && response.functionCalls.length > 0) {
      const call = response.functionCalls[0];
      if (call.name === "update_client_settings") {
        const args = call.args as any;
        
        // Build the update object dynamically based on what Gemini decided to change
        const dataToUpdate: any = {};
        if (args.rulebook !== undefined) dataToUpdate.rulebook = args.rulebook;
        if (args.phoneInstructions !== undefined) dataToUpdate.phoneInstructions = args.phoneInstructions;
        if (args.chatInstructions !== undefined) dataToUpdate.chatInstructions = args.chatInstructions;
        if (args.emailInstructions !== undefined) dataToUpdate.emailInstructions = args.emailInstructions;
        if (args.voiceId !== undefined) dataToUpdate.voiceId = args.voiceId;

        // Execute the database update
        await prisma.client.update({
          where: { id: clientId },
          data: dataToUpdate
        });

        // Tell Gemini the database update was successful so it can generate its final response
        response = await chatSession.sendMessage({
          message: [
            {
              functionResponse: {
                name: "update_client_settings",
                response: { success: true, message: "Database successfully updated." },
              }
            }
          ] as any
        });
      }
    }

    return NextResponse.json({ reply: response.text });

  } catch (error: any) {
    console.error("Copilot Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
