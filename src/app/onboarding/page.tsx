"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitOnboarding } from "../actions/onboarding";

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !industry) {
      setError("Please fill out all fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await submitOnboarding(businessName, industry);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        
        <h1 className="text-3xl font-black text-center mb-2">Welcome!</h1>
        <p className="text-zinc-500 text-center mb-8">Let's set up your AI Receptionist. What kind of business are you running?</p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-6 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold mb-2">Business Name</label>
            <input 
              type="text" 
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Smith Dental Care"
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-bold mb-2">Industry</label>
            <select 
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-transparent appearance-none"
            >
              <option value="" disabled>Select your industry...</option>
              <option value="Medical / Dental">Medical / Dental</option>
              <option value="Home Services (Plumbing, HVAC, etc.)">Home Services (Plumbing, HVAC, etc.)</option>
              <option value="Real Estate">Real Estate</option>
              <option value="Legal Services">Legal Services</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-colors mt-4 disabled:opacity-50"
          >
            {loading ? "Generating AI Rulebook..." : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
