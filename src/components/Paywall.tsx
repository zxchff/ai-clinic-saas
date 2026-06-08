"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Paywall({ clientId }: { clientId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const paypalOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "test",
    components: "buttons",
    intent: "capture",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-2xl max-w-md w-full border border-zinc-200 dark:border-zinc-800 text-center">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        <h2 className="text-2xl font-black mb-2">Unlock Your Dashboard</h2>
        <p className="text-zinc-500 mb-8">
          Pay $99 to access your AI Receptionist settings, rulebooks, and analytics.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <PayPalScriptProvider options={paypalOptions}>
          <div className="min-h-[150px]">
            <PayPalButtons
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: "CAPTURE",
                  purchase_units: [
                    {
                      amount: {
                        currency_code: "USD",
                        value: "99.00",
                      },
                      custom_id: clientId,
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                setLoading(true);
                // Capture the funds
                if (!actions.order) return;
                const details = await actions.order.capture();
                
                // Call our server to verify the payment
                try {
                  const res = await fetch("/api/paypal/verify", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ subscriptionId: details.id }), // Using order ID as the receipt
                  });
                  if (res.ok) {
                    router.refresh();
                  } else {
                    setError("Payment verified, but failed to update account. Please contact support.");
                    setLoading(false);
                  }
                } catch (err) {
                  setError("An error occurred during verification.");
                  setLoading(false);
                }
              }}
              onError={(err) => {
                setError("Payment failed or was canceled. Please try again.");
              }}
            />
          </div>
        </PayPalScriptProvider>

        {loading && (
          <p className="mt-4 text-indigo-600 font-bold animate-pulse">Unlocking your dashboard...</p>
        )}
      </div>
    </div>
  );
}
