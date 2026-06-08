"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PayPalSubscribeButton({ 
  clientId, 
  engineType, 
  price,
  title
}: { 
  clientId: string;
  engineType: "VOICE" | "CHAT" | "EMAIL";
  price: string;
  title: string;
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="text-right">
        <span className="text-2xl font-bold text-white">${price}</span>
        <span className="text-zinc-500 text-sm">/month</span>
      </div>
      
      {isProcessing ? (
        <div className="bg-zinc-800 text-zinc-400 px-6 py-2 rounded-lg font-medium text-sm flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Processing...
        </div>
      ) : (
        <div className="w-[200px] z-10 relative">
          <PayPalScriptProvider options={{ 
            clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
            currency: "USD",
            intent: "capture"
          }}>
            <PayPalButtons 
              style={{ layout: "horizontal", color: "blue", shape: "pill", label: "pay", height: 40 }}
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      description: `${title} Subscription`,
                      amount: {
                        currency_code: "USD",
                        value: price,
                      },
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                setIsProcessing(true);
                // Capture the funds
                if (actions.order) {
                  await actions.order.capture();
                }
                
                // Tell our server that the payment was successful
                const res = await fetch("/api/paypal/verify", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    clientId,
                    engineType,
                    orderId: data.orderID
                  })
                });

                if (res.ok) {
                  router.refresh(); // Instantly unlocks the Deploy button!
                } else {
                  alert("Payment verified but failed to unlock engine. Please contact support.");
                  setIsProcessing(false);
                }
              }}
              onError={(err) => {
                console.error("PayPal Checkout Error:", err);
                alert("Payment failed or was cancelled.");
              }}
            />
          </PayPalScriptProvider>
        </div>
      )}
    </div>
  );
}
