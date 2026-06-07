"use client";

import { useState } from "react";
import { updateRulebook, updatePhone } from "@/app/actions/client";

const ModalShell = ({ title, desc, value, onChange, onCancel, onSave, isSaving }: any) => (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
    <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
      <h2 className="text-2xl font-bold mb-2">{title}</h2>
      <p className="text-zinc-500 mb-6">{desc}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-64 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl mb-6 font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
      />
      <div className="flex justify-end gap-4">
        <button 
          onClick={onCancel}
          className="px-6 py-2 rounded-lg font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
        >
          Cancel
        </button>
        <button 
          onClick={onSave}
          disabled={isSaving}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50"
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  </div>
);

export default function ClientCard({ client }: { client: any }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  const [rulebookText, setRulebookText] = useState(client.rulebook);
  const [chatText, setChatText] = useState(client.chatInstructions);
  const [phoneText, setPhoneText] = useState(client.phoneInstructions);
  const [emailText, setEmailText] = useState(client.emailInstructions);
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateRulebook(client.id, rulebookText, chatText, phoneText, emailText);
    setIsSaving(false);
    setActiveModal(null);
  };



  const getDaysDifference = (date: Date) => {
    const diffTime = date.getTime() - new Date().getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const daysUntilNextBill = client.nextBillingDate ? getDaysDifference(new Date(client.nextBillingDate)) : null;
  // If past due, lastPaidDate + 30 days is roughly when it was due. Or we can just use nextBillingDate if we didn't advance it.
  // For simplicity, let's just use a dummy date logic or use nextBillingDate.
  const daysPastDue = client.nextBillingDate ? Math.abs(getDaysDifference(new Date(client.nextBillingDate))) : 0;

  return (
    <div className="mb-16 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
      
      {/* Financial Header */}
      <div className="flex items-center justify-between mb-6 pb-6 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h2 className="text-2xl font-black mb-1">{client.name}</h2>
          <div className="flex gap-4 text-sm text-zinc-500">
            <span>Price: ${client.monthlyPrice}/mo</span>
            {client.lastPaidDate && <span>Last Paid: {new Date(client.lastPaidDate).toLocaleDateString()}</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {client.billingStatus === "ACTIVE" && (
            <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              ● ACTIVE (Due in {daysUntilNextBill ?? 30} days)
            </span>
          )}
          {client.billingStatus === "PAST_DUE" && (
            <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">
              ● PAST DUE: {daysPastDue} DAYS LATE (${client.monthlyPrice})
            </span>
          )}
          {client.billingStatus === "TRIAL" && (
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold tracking-wide">● 30-DAY TRIAL</span>
          )}
          
          <button className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Copy Stripe Payment Link
          </button>
        </div>
      </div>
      {activeModal === "core" && (
        <ModalShell 
          title="Core Knowledge Base" 
          desc={`Write the facts for ${client.name} (Prices, Address, FAQ). All tools will read this.`}
          value={rulebookText} 
          onChange={setRulebookText} 
          onCancel={() => setActiveModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
      {activeModal === "chat" && (
        <ModalShell 
          title="Chatbot Personality" 
          desc={`How should the website widget talk? (e.g. use emojis, short responses)`}
          value={chatText} 
          onChange={setChatText} 
          onCancel={() => setActiveModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
      {activeModal === "phone" && (
        <ModalShell 
          title="Phone Voice Personality" 
          desc={`How should the voice AI speak? (e.g. speak slowly, never use emojis)`}
          value={phoneText} 
          onChange={setPhoneText} 
          onCancel={() => setActiveModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}
      {activeModal === "email" && (
        <ModalShell 
          title="Email AI Formatting" 
          desc={`How should the email bot write? (e.g. use formal signatures)`}
          value={emailText} 
          onChange={setEmailText} 
          onCancel={() => setActiveModal(null)}
          onSave={handleSave}
          isSaving={isSaving}
        />
      )}

      {/* 3 Products Grid */}
      <div className="grid md:grid-cols-3 gap-6 mt-6">
        
        {/* Product 1: Chatbot */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </div>
            <button onClick={() => setActiveModal("core")} className="text-xs bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold">
              Edit Core Facts
            </button>
          </div>
          <h4 className="text-lg font-bold mb-2">Website Chatbot</h4>
          <p className="text-sm text-zinc-500 mb-6 flex-1">
            Answers patient questions on their website and books appointments 24/7.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveModal("chat")}
              className="flex-1 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-colors shadow-md"
            >
              Chat Personality
            </button>
            <a 
              href={`/?id=${client.id}`}
              target="_blank"
              className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 py-2.5 px-4 rounded-lg text-sm font-medium hover:bg-indigo-200 transition-colors flex items-center justify-center"
              title="Test Chatbot"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path><polyline points="15 3 21 3 21 9"></polyline><line x1="10" y1="14" x2="21" y2="3"></line></svg>
            </a>
          </div>
        </div>

        {/* Product 2: Phone AI */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col relative opacity-80">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <button onClick={() => setActiveModal("core")} className="text-xs bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold">
              Edit Core Facts
            </button>
          </div>
          <h4 className="text-lg font-bold mb-2">Phone Receptionist</h4>
          <p className="text-sm text-zinc-500 mb-6 flex-1">
            Answers forwarded clinic calls using a human-like voice AI via Twilio.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveModal("phone")}
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Voice Rules
            </button>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
            <label className="text-xs font-bold text-zinc-500 mb-1 block">Twilio Number</label>
            <div className="flex gap-2">
              <input 
                id={`phone-input-${client.id}`}
                type="text" 
                defaultValue={client.phone || ""} 
                placeholder="+1 (555) 000-0000" 
                className="w-full text-sm bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 px-3 py-2 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
              <button 
                onClick={async (e) => {
                  const input = document.getElementById(`phone-input-${client.id}`) as HTMLInputElement;
                  const btn = e.currentTarget;
                  btn.textContent = "Saving...";
                  await updatePhone(client.id, input.value);
                  btn.textContent = "Saved!";
                  setTimeout(() => btn.textContent = "Save", 2000);
                }}
                className="bg-zinc-800 text-white px-3 py-2 rounded-lg text-xs font-bold hover:bg-zinc-700 w-16"
              >
                Save
              </button>
            </div>
          </div>
        </div>

        {/* Product 3: Email AI */}
        <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 flex flex-col relative opacity-80">
          <div className="flex justify-between items-start mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            </div>
            <button onClick={() => setActiveModal("core")} className="text-xs bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 px-3 py-1.5 rounded-lg font-bold">
              Edit Core Facts
            </button>
          </div>
          <h4 className="text-lg font-bold mb-2">Email Auto-Responder</h4>
          <p className="text-sm text-zinc-500 mb-6 flex-1">
            Monitors the clinic inbox and drafts intelligent replies to patient inquiries.
          </p>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveModal("email")}
              className="flex-1 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white py-2.5 rounded-lg text-sm font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm"
            >
              Email Rules
            </button>
            <a href={`/admin/email/${client.id}`} className="bg-[#4285F4] hover:bg-[#3367D6] text-white py-2.5 px-4 rounded-lg text-sm font-medium transition-colors flex items-center justify-center" title="Open Inbox Simulator">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path><rect x="2" y="4" width="20" height="16" rx="2"></rect></svg>
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
