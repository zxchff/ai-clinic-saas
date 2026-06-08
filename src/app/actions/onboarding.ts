"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { revalidatePath } from "next/cache";

export async function submitOnboarding(businessName: string, industry: string) {
  const session = await getServerSession(authOptions);
  
  // @ts-ignore
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  // Find the user's client profile
  const client = await prisma.client.findFirst({
    // @ts-ignore
    where: { userId: session.user.id },
  });

  if (!client) {
    throw new Error("Client profile not found. Please log out and log back in.");
  }

  // Generate a custom rulebook based on industry
  let rulebook = "";
  if (industry === "Medical / Dental") {
    rulebook = "We are a medical clinic. We accept most major insurances. We offer cleanings, fillings, and checkups. We are open Monday through Friday 8am to 5pm.";
  } else if (industry === "Home Services (Plumbing, HVAC, etc.)") {
    rulebook = "We are a home services company. We charge a $75 dispatch fee which is waived if you proceed with repairs. We offer 24/7 emergency service. We handle plumbing, heating, and cooling.";
  } else if (industry === "Real Estate") {
    rulebook = "We are a real estate agency. We help clients buy, sell, and rent properties. We offer free home valuations. We require pre-approval before showing houses.";
  } else if (industry === "Legal Services") {
    rulebook = "We are a law firm. We offer free 30-minute initial consultations. We specialize in personal injury, family law, and estate planning. All case details are strictly confidential.";
  } else {
    rulebook = "We are a professional business. We pride ourselves on excellent customer service. Please let us know how we can help you today.";
  }

  // Update the client profile
  await prisma.client.update({
    where: { id: client.id },
    data: {
      name: businessName,
      industry: industry,
      rulebook: rulebook
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}
