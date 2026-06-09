import React from "react";

export default function SharedKnowledgeFields({ client }: { client: any }) {
  return (
    <div className="space-y-6 mt-6 pt-6 border-t border-white/5">
      <div>
        <h3 className="text-lg font-bold text-white mb-2">📅 Scheduling & Knowledge Base</h3>
        <p className="text-xs text-zinc-500 mb-2">Configure when the AI is allowed to book appointments.</p>
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
