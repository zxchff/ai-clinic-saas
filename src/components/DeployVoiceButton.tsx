"use client";

import { useTransition } from "react";
import { deployVoiceAI } from "@/app/actions/vapi";

export default function DeployVoiceButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button 
      onClick={() => startTransition(() => deployVoiceAI(clientId))}
      disabled={isPending}
      className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
      {isPending ? "Provisioning Number..." : "Deploy Voice AI"}
    </button>
  );
}
