import React from "react";

export default function SharedKnowledgeFields({ client }: { client: any }) {
  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-white/5">
      <div className="flex justify-between items-start">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">📅 Scheduling Rules & Instructions</label>
          <p className="text-xs text-zinc-500 mb-2">Configure when the AI is allowed to book appointments.</p>
        </div>
        <div>
          {client.googleRefreshToken ? (
            <span className="bg-green-950/50 text-green-400 border border-green-900/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
              Calendar Connected
            </span>
          ) : (
            <div className="flex flex-col gap-2 items-end">
              <a href={`/api/auth/google?clientId=${client.id}`} className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                Connect Google Calendar
              </a>
              <p className="text-[10px] text-zinc-500 text-right">Redirect URI: <br/><code>https://ai-clinic-saas-eight.vercel.app/api/auth/google/callback</code></p>
            </div>
          )}
        </div>
      </div>

      <textarea 
        name="schedulingRules"
        defaultValue={client.schedulingRules || ""}
        rows={4}
        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed shadow-inner"
        placeholder="E.g. No appointments on Fridays. Lunch break from 12-1pm."
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Open Time</label>
          <input 
            type="time" 
            name="activeTimeStart" 
            defaultValue={client.activeTimeStart || "09:00"} 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-300 mb-2">Close Time</label>
          <input 
            type="time" 
            name="activeTimeEnd" 
            defaultValue={client.activeTimeEnd || "17:00"} 
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all"
          />
        </div>
      </div>
      
      <div className="pt-4 border-t border-white/5">
        <label className="block text-sm font-medium text-zinc-300 mb-2">General Rulebook & Business Info</label>
        <textarea 
          name="rulebook"
          defaultValue={client.rulebook || ""}
          rows={6}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed"
          placeholder="Business Name: Zach's Dental\nAddress: 123 Main St...\nServices: Teeth Whitening, Implants..."
        />
      </div>
    </div>
  );
}
