"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deployVoiceAI(clientId: string, countryCode: string = "+1") {
  // SIMULATOR: We are pretending to call the Vapi & Twilio APIs here.
  // In a real production environment with a Vapi API key, this would do:
  // 1. POST https://api.vapi.ai/assistant to create the assistant with the client's rulebook
  // 2. POST https://api.vapi.ai/phone-number to buy a Twilio number and attach the assistant

  // Simulate API latency (2.5 seconds to feel realistic)
  await new Promise(resolve => setTimeout(resolve, 2500));

  // Generate a realistic looking fake phone number for the demo
  const areaCode = Math.floor(Math.random() * 800) + 200;
  const prefix = Math.floor(Math.random() * 800) + 200;
  const line = Math.floor(Math.random() * 9000) + 1000;
  const fakePhoneNumber = `${countryCode} (${areaCode}) ${prefix}-${line}`;

  // Update the database to show the provisioned number
  await prisma.client.update({
    where: { id: clientId },
    data: {
      vapiPhoneNumber: fakePhoneNumber,
    }
  });

  // Tell Next.js to refresh the client detail page so the new number shows up instantly
  revalidatePath(`/dashboard/client/${clientId}`);
  
  return { success: true, phoneNumber: fakePhoneNumber };
}

export async function deployChatbot(clientId: string) {
  await new Promise(resolve => setTimeout(resolve, 2000));

  const fakeEmbedCode = `<script src="https://ai-clinic.saas/widget.js" data-client="${clientId}"></script>`;

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
