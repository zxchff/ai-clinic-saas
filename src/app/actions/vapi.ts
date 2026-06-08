"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deployVoiceAI(clientId: string) {
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
  const fakePhoneNumber = `+1 (${areaCode}) ${prefix}-${line}`;

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
