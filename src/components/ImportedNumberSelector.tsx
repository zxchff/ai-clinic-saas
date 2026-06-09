"use client";

import { useEffect, useState } from "react";
import { getImportedNumbers, attachExistingNumber } from "@/app/actions/vapi";

export default function ImportedNumberSelector({ clientId }: { clientId: string }) {
  const [numbers, setNumbers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAttaching, setIsAttaching] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadNumbers() {
      const res = await getImportedNumbers();
      if (res.numbers) {
        setNumbers(res.numbers);
        if (res.numbers.length > 0) setSelectedId(res.numbers[0].id);
      } else {
        setError(res.error || "Failed to load numbers");
      }
      setIsLoading(false);
    }
    loadNumbers();
  }, []);

  const handleAttach = async () => {
    if (!selectedId) return;
    setIsAttaching(true);
    setError("");
    
    const selectedNumber = numbers.find(n => n.id === selectedId);
    
    const res = await attachExistingNumber(clientId, selectedId, selectedNumber?.number || "Unknown Number");
    
    if (res.error) {
      setError(res.error);
      setIsAttaching(false);
    }
    // If success, the server action revalidates the page, so it will automatically reload and show the new number!
  };

  if (isLoading) return <div className="text-xs text-zinc-500 mt-4">Checking Vapi for imported numbers...</div>;
  if (numbers.length === 0) return null; // Don't show anything if they haven't imported any Twilio numbers yet

  return (
    <div className="mt-4 pt-4 border-t border-zinc-800">
      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-3">Or Attach Imported Number</p>
      
      <div className="flex gap-2">
        <select 
          value={selectedId} 
          onChange={(e) => setSelectedId(e.target.value)}
          className="bg-zinc-950 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 flex-1"
        >
          {numbers.map(n => (
            <option key={n.id} value={n.id}>{n.name || n.number}</option>
          ))}
        </select>
        
        <button 
          onClick={handleAttach} 
          disabled={isAttaching}
          className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap"
        >
          {isAttaching ? "Attaching..." : "Attach Number"}
        </button>
      </div>
      
      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
    </div>
  );
}
