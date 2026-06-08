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

    const { subscriptionId } = await request.json();

    // Find the user's client profile
    const user = await prisma.user.findUnique({
      // @ts-ignore
      where: { id: session.user.id },
    });

    if (!user || !user.clientId) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // In a production environment, you MUST use your PAYPAL_SECRET here to make a 
    // server-to-server API call to PayPal to verify this subscriptionId is actually ACTIVE 
    // and belongs to this user. For this prototype, we trust the client-side SDK.

    // Update the database to unlock the account!
    await prisma.client.update({
      where: { id: user.clientId },
      data: {
        billingStatus: "ACTIVE",
        paypalSubscriptionId: subscriptionId,
        lastPaidDate: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PayPal Verify Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
