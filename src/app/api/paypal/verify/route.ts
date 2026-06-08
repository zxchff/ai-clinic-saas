import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    // @ts-ignore
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { orderId, clientId, engineType } = await request.json();

    // Find the client to make sure they own it
    const client = await prisma.client.findFirst({
      where: { 
        id: clientId,
        userId: session.user.id 
      },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found or unauthorized" }, { status: 404 });
    }

    // Determine which field to update
    const updateData: any = {
      lastPaidDate: new Date()
    };

    if (engineType === "VOICE") updateData.voiceBillingStatus = "ACTIVE";
    if (engineType === "CHAT") updateData.chatBillingStatus = "ACTIVE";
    if (engineType === "EMAIL") updateData.emailBillingStatus = "ACTIVE";

    // Update the database to unlock the account!
    await prisma.client.update({
      where: { id: client.id },
      data: updateData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayPal Verify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
