"use client";

import { useState } from "react";

export default function VoiceSelector({ 
  defaultVoice = "rachel", 
  defaultCountry = "+1" 
}: { 
  defaultVoice?: string;
  defaultCountry?: string;
}) {
  const [voiceId, setVoiceId] = useState(defaultVoice);
  const [country, setCountry] = useState(defaultCountry);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVoice = e.target.value;
    setVoiceId(newVoice);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance("Hi, I'm your AI assistant. I'm ready to take calls.");
      
      // Simulate different voices by adjusting pitch and rate
      if (newVoice === "rachel") {
        utterance.pitch = 1.2;
        utterance.rate = 1.0;
      } else if (newVoice === "drew") {
        utterance.pitch = 0.8;
        utterance.rate = 0.9;
      } else if (newVoice === "mimi") {
        utterance.pitch = 1.5;
        utterance.rate = 1.1;
      } else if (newVoice === "clyde") {
        utterance.pitch = 0.5;
        utterance.rate = 0.85;
      }

      window.speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="grid grid-cols-2 gap-4 mt-4">
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">Region (Phone Number)</label>
        <select 
          name="countryCode"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all text-sm"
        >
          <option value="+1">US/CA (+1)</option>
          <option value="+44">UK (+44)</option>
          <option value="+61">AU (+61)</option>
          <option value="+27">ZA (+27)</option>
          <option value="+91">IN (+91)</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-zinc-400 mb-2">AI Voice Persona</label>
        <select 
          name="voiceId"
          value={voiceId}
          onChange={handleVoiceChange}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all text-sm"
        >
          <option value="rachel">Rachel (Friendly Female)</option>
          <option value="drew">Drew (Professional Male)</option>
          <option value="mimi">Mimi (Energetic Female)</option>
          <option value="clyde">Clyde (Deep Male)</option>
        </select>
      </div>
    </div>
  );
}
