"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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
  if (formData.has("nextFollowUpDate")) {
    const val = formData.get("nextFollowUpDate") as string;
    if (val) dataToUpdate.nextFollowUpDate = new Date(val);
  }

  await prisma.client.update({
    where: { id: clientId },
    data: dataToUpdate
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/client/${clientId}`);
}
