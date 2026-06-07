"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({});

export async function simulateIncomingEmail(formData: FormData) {
  const clientId = formData.get("clientId") as string;
  const fromName = formData.get("fromName") as string;
  const fromEmail = formData.get("fromEmail") as string;
  const subject = formData.get("subject") as string;
  const body = formData.get("body") as string;

  if (!clientId || !body) return;

  // 1. Fetch Client Rulebook
  const client = await prisma.client.findUnique({ where: { id: clientId } });
  if (!client) return;

  const systemInstruction = `You are an AI Email Assistant for a business.
  
BUSINESS CORE KNOWLEDGE:
${client.rulebook}

EMAIL PERSONALITY & FORMATTING INSTRUCTIONS:
${client.emailInstructions}

INSTRUCTIONS:
You just received an email from a customer named ${fromName} (${fromEmail}).
Subject: ${subject}
Message: ${body}

Draft a professional, polite email reply answering their questions based ONLY on the rulebook. 
Do not include subject lines, just the body of the email. Sign off politely.`;

  // 2. Draft Reply using Gemini
  let aiDraft = "";
  try {
    const chatSession = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: { systemInstruction }
    });
    const response = await chatSession.sendMessage({ message: "Draft the reply email." });
    aiDraft = response.text || "Failed to generate reply.";
  } catch (e) {
    console.error("AI Error:", e);
    aiDraft = "Error connecting to AI. Please check API key.";
  }

  // 3. Save to Database
  await prisma.email.create({
    data: {
      clientId,
      fromName,
      fromEmail,
      subject,
      body,
      aiDraft,
      status: "DRAFTED"
    }
  });

  revalidatePath(`/admin/email/${clientId}`);
}
