"use client";

import { useFormStatus } from "react-dom";
import { simulateIncomingEmail } from "@/app/actions/email";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button 
      type="submit" 
      disabled={pending}
      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {pending ? "AI is typing reply..." : "Send Simulated Email"}
    </button>
  );
}

export default function EmailForm({ clientId }: { clientId: string }) {
  const handleSubmit = async (formData: FormData) => {
    await simulateIncomingEmail(formData);
    // Optionally reset form here, but keeping it simple
  };

  return (
    <form action={handleSubmit} className="space-y-4">
      <input type="hidden" name="clientId" value={clientId} />
      <div className="flex gap-4">
        <input name="fromName" placeholder="Patient Name (e.g. John)" required className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
        <input name="fromEmail" placeholder="Email" defaultValue="john@example.com" className="flex-1 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <input name="subject" placeholder="Subject" defaultValue="Question about appointment" className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
      <textarea name="body" placeholder="Type the patient's message here..." required className="w-full h-32 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
      
      <SubmitButton />
    </form>
  );
}
