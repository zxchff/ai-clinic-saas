import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import prisma from '@/lib/prisma';

// Initialize the Google Gen AI SDK
const ai = new GoogleGenAI({});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, clientId } = body;

    // 1. Fetch the specific client from our Database!
    let systemPrompt = "You are a helpful AI receptionist.";
    
    if (clientId) {
      const client = await prisma.client.findUnique({
        where: { id: clientId }
      });
      if (client) {
        systemPrompt = `CORE KNOWLEDGE BASE:\n${client.rulebook}\n\nCHATBOT PERSONALITY INSTRUCTIONS:\n${client.chatInstructions}`;
      }
    }

    // 2. Format messages for Gemini using the dynamic Rulebook
    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: systemPrompt,
      }
    });

    const lastUserMessage = messages[messages.length - 1].content;
    const response = await chatSession.sendMessage({ message: lastUserMessage });

    return NextResponse.json({ reply: response.text });

  } catch (error: any) {
    console.error("AI Error:", error);
    return NextResponse.json(
      { reply: "I'm sorry, my brain is currently disconnected! Please make sure the API key is set." },
      { status: 500 }
    );
  }
}
