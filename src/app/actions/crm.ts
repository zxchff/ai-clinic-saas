"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { undeployEngine } from "./vapi";

export async function updateCRMFields(clientId: string, formData: FormData) {
  const dataToUpdate: any = {};
  
  if (formData.has("status")) dataToUpdate.status = formData.get("status") as string;
  if (formData.has("monthlyRetainer")) {
    const val = parseInt(formData.get("monthlyRetainer") as string, 10);
    if (!isNaN(val)) dataToUpdate.monthlyRetainer = val;
  }
  if (formData.has("paymentDueDate")) {
    const val = parseInt(formData.get("paymentDueDate") as string, 10);
    if (!isNaN(val)) dataToUpdate.paymentDueDate = val;
  }
  if (formData.has("lastPaymentDate")) {
    const val = formData.get("lastPaymentDate") as string;
    if (val) dataToUpdate.lastPaymentDate = new Date(val);
  }
  
  // 3-Step Follow Up Tracking
  if (formData.has("followUp1")) {
    const val = formData.get("followUp1") as string;
    dataToUpdate.followUp1 = val ? new Date(val) : null;
  }
  if (formData.has("followUp2")) {
    const val = formData.get("followUp2") as string;
    dataToUpdate.followUp2 = val ? new Date(val) : null;
  }
  if (formData.has("followUp3")) {
    const val = formData.get("followUp3") as string;
    dataToUpdate.followUp3 = val ? new Date(val) : null;
  }

  await prisma.client.update({
    where: { id: clientId },
    data: dataToUpdate
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/client/${clientId}`);
}

export async function deleteClient(clientId: string, passcode: string) {
  if (passcode !== "3258") {
    return { error: "Invalid Passcode" };
  }

  // First undeploy all engines to prevent orphaned Vapi costs
  await undeployEngine(clientId, "VOICE");
  await undeployEngine(clientId, "CHAT");
  await undeployEngine(clientId, "EMAIL");

  await prisma.client.delete({
    where: { id: clientId }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function globalKillSwitch(clientId: string) {
  // Instantly rip down all engines for non-payment
  await undeployEngine(clientId, "VOICE");
  await undeployEngine(clientId, "CHAT");
  await undeployEngine(clientId, "EMAIL");

  // Mark status as churned
  await prisma.client.update({
    where: { id: clientId },
    data: { status: "CHURNED" }
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/client/${clientId}`);
  return { success: true };
}
