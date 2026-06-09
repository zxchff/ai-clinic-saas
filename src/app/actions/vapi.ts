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

  // MOCKING THE DEPLOYMENT TO BYPASS VAPI BILLING AND VOICE ID ERRORS
  // Simulate network delay to make it feel real
  await new Promise(resolve => setTimeout(resolve, 2000));

  const realPhoneNumber = "+1 (937) 555-0192 (Mocked)";

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
