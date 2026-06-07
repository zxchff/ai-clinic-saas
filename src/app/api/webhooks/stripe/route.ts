import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.text();
    // In production, we would use: const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    const event = JSON.parse(body);

    // Securely listen to Stripe events
    switch (event.type) {
      case "invoice.payment_succeeded": {
        const stripeCustomerId = event.data.object.customer;
        // 1. Find who this is in our database
        const client = await prisma.client.findFirst({ where: { stripeCustomerId } });
        
        if (client) {
          // 2. Mark them as Paid!
          await prisma.client.update({
            where: { id: client.id },
            data: {
              billingStatus: "ACTIVE",
              lastPaidDate: new Date(),
              nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
            }
          });
        }
        break;
      }
      
      case "invoice.payment_failed": {
        const stripeCustomerId = event.data.object.customer;
        const client = await prisma.client.findFirst({ where: { stripeCustomerId } });
        
        if (client) {
          // 2. Mark them as Past Due!
          await prisma.client.update({
            where: { id: client.id },
            data: { billingStatus: "PAST_DUE" }
          });

          // 3. Send Notification to Agency Owner
          console.log(`[URGENT NOTIFICATION] 🚨 ${client.name} just failed to pay their $${client.monthlyPrice} invoice! Their subscription is now Past Due.`);
          // In production: await sendEmail("admin@youragency.com", "Payment Failed", `...`);
        }
        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("Webhook Error:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 400 });
  }
}
