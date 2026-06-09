"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CommandCopilot({ clientId, token }: { clientId: string, token?: string }) {
  const [prompt, setPrompt] = useState("");
  const [messages, setMessages] = useState<{role: "user" | "ai", text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const userText = prompt;
    setPrompt("");
    setMessages(prev => [...prev, { role: "user", text: userText }]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, prompt: userText, token })
      });
      
      const data = await res.json();
      
      if (data.error) {
        setMessages(prev => [...prev, { role: "ai", text: `Error: ${data.error}` }]);
      } else {
        setMessages(prev => [...prev, { role: "ai", text: data.reply }]);
        
        // If the AI successfully updated the database, refresh the page to show the new settings!
        if (data.reply.toLowerCase().includes("done") || data.reply.toLowerCase().includes("updated")) {
          router.refresh();
        }
      }
    } catch (e: any) {
      setMessages(prev => [...prev, { role: "ai", text: "Failed to reach Copilot API." }]);
    }

    setIsLoading(false);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-blue-900/50 relative overflow-hidden mb-8 shadow-[0_0_40px_-15px_rgba(59,130,246,0.3)]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
          <span className="text-lg">🤖</span>
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">SaaS Copilot</h2>
          <p className="text-xs text-blue-400">Natural Language Command Center</p>
        </div>
      </div>

      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`px-4 py-2 rounded-xl max-w-[80%] text-sm ${
              msg.role === "user" ? "bg-blue-600/20 text-blue-100 border border-blue-500/30 rounded-br-sm" : 
              "bg-zinc-800/50 text-zinc-300 border border-zinc-700 rounded-bl-sm"
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="px-4 py-2 rounded-xl bg-zinc-800/50 text-zinc-500 border border-zinc-700 text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce"></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.2s"}}></span>
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: "0.4s"}}></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Command the AI (e.g. 'Set business hours to 9-5')"
          className="flex-1 bg-zinc-950/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
        >
          Send
        </button>
      </form>
    </div>
  );
}
