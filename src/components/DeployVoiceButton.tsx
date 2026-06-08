"use client";

import { useTransition, useState } from "react";
import { deployVoiceAI } from "@/app/actions/vapi";

export default function DeployVoiceButton({ clientId }: { clientId: string }) {
  const [isPending, startTransition] = useTransition();
  const [countryCode, setCountryCode] = useState("+1");

  return (
    <div className="flex items-center gap-2">
      <select 
        value={countryCode}
        onChange={(e) => setCountryCode(e.target.value)}
        disabled={isPending}
        className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 text-white px-3 py-2 rounded-lg font-medium transition-colors text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="+1">US/CA (+1)</option>
        <option value="+44">UK (+44)</option>
        <option value="+61">AU (+61)</option>
        <option value="+27">ZA (+27)</option>
        <option value="+91">IN (+91)</option>
      </select>
      <button 
        onClick={() => startTransition(async () => { await deployVoiceAI(clientId, countryCode); })}
        disabled={isPending}
        className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        {isPending ? "Provisioning..." : "Deploy Voice AI"}
      </button>
    </div>
  );
}
