"use client";

import { useEffect, useState } from "react";
import Vapi from "@vapi-ai/web";

let vapiClient: Vapi | null = null;

export default function WebCallButton({ client }: { client: any }) {
  const [callStatus, setCallStatus] = useState<"inactive" | "loading" | "active">("inactive");

  useEffect(() => {
    // Only instantiate Vapi if the key is present
    const pubKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (pubKey && !vapiClient) {
      vapiClient = new Vapi(pubKey);
    }

    if (vapiClient) {
      vapiClient.on("call-start", () => setCallStatus("active"));
      vapiClient.on("call-end", () => setCallStatus("inactive"));
      vapiClient.on("error", (e) => {
        console.error("Vapi Web Error:", e);
        setCallStatus("inactive");
        alert("Vapi Web Error: " + (e.message || "Failed to connect microphone."));
      });
    }

    return () => {
      // Cleanup listeners on unmount
      if (vapiClient) {
        vapiClient.removeAllListeners("call-start");
        vapiClient.removeAllListeners("call-end");
        vapiClient.removeAllListeners("error");
      }
    };
  }, []);

  const handleStartCall = async () => {
    const pubKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
    if (!pubKey) {
      alert("Missing NEXT_PUBLIC_VAPI_PUBLIC_KEY in Vercel Environment Variables!");
      return;
    }

    if (!vapiClient) {
      vapiClient = new Vapi(pubKey);
    }

    if (callStatus === "active") {
      vapiClient.stop();
      return;
    }

    setCallStatus("loading");

    const voiceId = client.voiceId || "rachel";
    const isOpenAI = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"].includes(voiceId);

    const assistantOverrides = {
      name: `${client.name || "Clinic"} Web Tester`,
      model: {
        provider: "openai",
        model: "gpt-4o",
        messages: [{ role: "system", content: client.phoneInstructions || client.rulebook || "You are a helpful receptionist." }]
      },
      voice: {
        provider: isOpenAI ? "openai" : "11labs",
        voiceId: voiceId
      }
    };

    try {
      await vapiClient.start(assistantOverrides as any);
    } catch (e: any) {
      console.error(e);
      setCallStatus("inactive");
      alert("Failed to start web call: " + e.message);
    }
  };

  if (callStatus === "loading") {
    return (
      <button disabled className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/50 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 animate-pulse">
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Connecting Microphone...
      </button>
    );
  }

  if (callStatus === "active") {
    return (
      <button onClick={handleStartCall} className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/50 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
        </span>
        End Web Call
      </button>
    );
  }

  return (
    <button onClick={handleStartCall} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/50 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 transition-colors">
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
      </svg>
      Test Call (Web)
    </button>
  );
}
