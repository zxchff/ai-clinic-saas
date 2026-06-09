"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deployVoiceAI(clientId: string) {
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });
  
  if (!client) return { error: "Client not found" };

  const vapiKey = process.env.VAPI_PRIVATE_KEY;
  if (!vapiKey) {
    return { error: "VAPI_PRIVATE_KEY is missing from environment variables." };
  }

  const voiceId = client.voiceId || "rachel";
  const isOpenAI = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"].includes(voiceId);

  // 1. Create the Assistant on Vapi
  const assistantResponse = await fetch("https://api.vapi.ai/assistant", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${vapiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      name: `${client.name || "Clinic"} Receptionist`,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: client.phoneInstructions || client.rulebook || "You are a helpful receptionist." }]
      },
      voice: {
        provider: isOpenAI ? "openai" : "11labs",
        voiceId: voiceId
      }
    })
  });

  const assistant = await assistantResponse.json();
  if (assistant.error) {
    console.error("Vapi Assistant Error:", assistant);
    return { error: `Vapi Error: ${assistant.error?.message || assistant.message || "Failed to create Vapi assistant"}` };
  }

  // 2. Buy a Phone Number and attach it to the Assistant
  const phoneResponse = await fetch("https://api.vapi.ai/phone-number", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${vapiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      provider: "vapi",
      numberDesiredAreaCode: "937", // Guaranteed to work based on Vapi hints
      assistantId: assistant.id
    })
  });

  const phone = await phoneResponse.json();
  if (phone.error || phone.statusCode >= 400) {
    console.error("Vapi Phone Error:", phone);
    return { error: `Vapi Billing Error: You must add a credit card to your Vapi.ai account to purchase a phone number! (${phone.message || "Failed"})` };
  }

  const realPhoneNumber = phone.number;

  // 3. Update the database to show the real provisioned number
  await prisma.client.update({
    where: { id: clientId },
    data: {
      vapiPhoneNumber: realPhoneNumber,
    }
  });

  // Tell Next.js to refresh the client detail page so the new number shows up instantly
  revalidatePath(`/dashboard/client/${clientId}`);
  
  return { success: true, phoneNumber: realPhoneNumber };
}

export async function deployChatbot(clientId: string) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const fakeEmbedCode = `<script src="https://ai-clinic-saas-eight.vercel.app/widget.js" data-client="${clientId}"></script>`;

  await prisma.client.update({
    where: { id: clientId },
    data: { chatbotEmbedCode: fakeEmbedCode }
  });

  revalidatePath(`/dashboard/client/${clientId}`);
  return { success: true };
}

export async function deployEmailBot(clientId: string) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  await prisma.client.update({
    where: { id: clientId },
    data: { connectedEmail: "hello@clinic.com" }
  });

  revalidatePath(`/dashboard/client/${clientId}`);
  return { success: true };
}

export async function undeployEngine(clientId: string, engine: "VOICE" | "CHAT" | "EMAIL") {
  await new Promise(resolve => setTimeout(resolve, 1000));

  let data = {};
  if (engine === "VOICE") data = { vapiPhoneNumber: null };
  if (engine === "CHAT") data = { chatbotEmbedCode: null };
  if (engine === "EMAIL") data = { connectedEmail: null };

  await prisma.client.update({
    where: { id: clientId },
    data
  });

  revalidatePath(`/dashboard/client/${clientId}`);
  return { success: true };
}
