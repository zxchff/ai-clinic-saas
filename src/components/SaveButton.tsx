"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";

export default function SaveButton({ defaultText = "Save Settings" }: { defaultText?: string }) {
  const { pending } = useFormStatus();
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!pending && justSaved) {
      const timer = setTimeout(() => setJustSaved(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pending, justSaved]);

  // If we just submitted the form, trigger the success state once it's no longer pending
  useEffect(() => {
    if (pending) {
      setJustSaved(true);
    }
  }, [pending]);

  if (pending) {
    return (
      <button disabled className="bg-zinc-600 text-zinc-300 px-4 py-2 rounded-lg font-bold text-sm cursor-wait flex items-center gap-2 transition-colors">
        <svg className="animate-spin h-4 w-4 text-zinc-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Saving...
      </button>
    );
  }

  if (justSaved) {
    return (
      <button disabled className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Saved!
      </button>
    );
  }

  return (
    <button type="submit" className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg font-bold transition-colors text-sm shadow-lg">
      {defaultText}
    </button>
  );
}
