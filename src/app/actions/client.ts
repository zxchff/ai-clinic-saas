"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createClient(formData: FormData) {
  const name = formData.get("name") as string;
  const rulebook = formData.get("rulebook") as string;

  if (!name) return;

  await prisma.client.create({
    data: {
      name,
      rulebook: rulebook || "You are a helpful AI receptionist.",
    },
  });

  revalidatePath("/admin");
}

export async function deleteClient(id: string) {
  await prisma.client.delete({
    where: { id },
  });
  revalidatePath("/admin");
}

export async function updateRulebook(id: string, newRulebook: string, chatInstructions: string, phoneInstructions: string, emailInstructions: string) {
  await prisma.client.update({
    where: { id },
    data: { 
      rulebook: newRulebook,
      chatInstructions,
      phoneInstructions,
      emailInstructions
    },
  });
  revalidatePath("/admin");
}

export async function updatePhone(id: string, phone: string) {
  await prisma.client.update({
    where: { id },
    data: { phone },
  });
  revalidatePath("/admin");
}
