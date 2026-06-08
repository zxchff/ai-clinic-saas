import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import DeployVoiceButton from "@/components/DeployVoiceButton";
import VoiceSelector from "@/components/VoiceSelector";

import { deployChatbot, deployEmailBot, undeployEngine } from "@/app/actions/vapi";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);

  const allowedEmails = ["zachfransman8@gmail.com", "fransmanmarketing@gmail.com"];
  if (!session?.user || !allowedEmails.includes(session.user.email as string)) {
    redirect("/login");
  }

  const client = await prisma.client.findUnique({
    where: { id }
  });

  if (!client) redirect("/dashboard");

  // Server Action to update the client's brain
  async function updateAI(formData: FormData) {
    "use server";
    
    const dataToUpdate: any = {};
    if (formData.has("phoneInstructions")) dataToUpdate.phoneInstructions = formData.get("phoneInstructions") as string;
    if (formData.has("chatInstructions")) dataToUpdate.chatInstructions = formData.get("chatInstructions") as string;
    if (formData.has("emailInstructions")) dataToUpdate.emailInstructions = formData.get("emailInstructions") as string;
    if (formData.has("countryCode")) dataToUpdate.countryCode = formData.get("countryCode") as string;
    if (formData.has("voiceId")) dataToUpdate.voiceId = formData.get("voiceId") as string;

    await prisma.client.update({
      where: { id },
      data: dataToUpdate
    });

    revalidatePath(`/dashboard/client/${id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          &larr; Back to Command Center
        </Link>
        
        <header className="flex justify-between items-end mb-10 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-bold tracking-tight text-white">{client.name}</h1>
              <span className="px-3 py-1 text-xs font-semibold uppercase tracking-wider rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                {client.industry || "General"}
              </span>
            </div>
            <p className="text-zinc-400">Manage the AI Engine for this client.</p>
          </div>
          
          <div className="flex gap-3">
            <DeployVoiceButton clientId={client.id} />
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Deploy Chatbot
            </button>
          </div>
        </header>

        <div className="space-y-12">
          
          <div className="grid grid-cols-1 gap-8">
            
            {/* 1. Voice AI Engine */}
            <form action={updateAI} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500"></div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      📞 Voice AI Engine
                      {client.vapiPhoneNumber ? (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Not Deployed</span>
                      )}
                    </h2>
                    <p className="text-zinc-400 mt-1">24/7 inbound and outbound phone receptionist.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg font-bold transition-colors text-sm">
                      Save Settings
                    </button>
                    {client.vapiPhoneNumber ? (
                      <button formAction={async () => { "use server"; await undeployEngine(client.id, "VOICE"); }} className="bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Stop Engine
                      </button>
                    ) : (
                      <DeployVoiceButton clientId={client.id} />
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Voice Receptionist Instructions</label>
                  <textarea 
                    name="phoneInstructions"
                    defaultValue={client.phoneInstructions || client.rulebook}
                    rows={5}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed"
                    placeholder="Speak professionally. Ask for patient name..."
                  />
                </div>
                
                <VoiceSelector defaultVoice={client.voiceId || "rachel"} defaultCountry={client.countryCode || "+1"} />
              </div>
            </form>

            {/* 2. Website Chatbot Engine */}
            <form action={updateAI} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-purple-500"></div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      💬 Website Chatbot
                      {client.chatbotEmbedCode ? (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Not Deployed</span>
                      )}
                    </h2>
                    <p className="text-zinc-400 mt-1">Embeddable smart widget for the client's website.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg font-bold transition-colors text-sm">
                      Save Settings
                    </button>
                    {client.chatbotEmbedCode ? (
                      <button formAction={async () => { "use server"; await undeployEngine(client.id, "CHAT"); }} className="bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Stop Engine
                      </button>
                    ) : (
                      <button formAction={async () => { "use server"; await deployChatbot(client.id); }} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Deploy Chatbot
                      </button>
                    )}
                  </div>
                </div>
                {client.chatbotEmbedCode && (
                  <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Website Embed Code</p>
                    <code className="text-xs text-purple-400 break-all">{client.chatbotEmbedCode}</code>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Chatbot Instructions</label>
                  <textarea 
                    name="chatInstructions"
                    defaultValue={client.chatInstructions}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-purple-500 transition-all font-mono text-sm leading-relaxed"
                    placeholder="Keep answers short. Use emojis. Ask for email..."
                  />
                </div>
              </div>
            </form>

            {/* 3. Email Automation Engine */}
            <form action={updateAI} className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden relative shadow-lg">
              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      ✉️ Email Automation
                      {client.connectedEmail ? (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Not Deployed</span>
                      )}
                    </h2>
                    <p className="text-zinc-400 mt-1">Auto-draft replies to inbound patient emails.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button type="submit" className="bg-white hover:bg-zinc-200 text-black px-4 py-2 rounded-lg font-bold transition-colors text-sm">
                      Save Settings
                    </button>
                    {client.connectedEmail ? (
                      <button formAction={async () => { "use server"; await undeployEngine(client.id, "EMAIL"); }} className="bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Stop Engine
                      </button>
                    ) : (
                      <a href={`/api/clients/${client.id}/gmail/auth`} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Connect Gmail
                      </a>
                    )}
                  </div>
                </div>
                {client.connectedEmail && (
                  <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Connected Account</p>
                    <p className="text-lg font-medium text-emerald-400">{client.connectedEmail}</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email Writer Instructions</label>
                  <textarea 
                    name="emailInstructions"
                    defaultValue={client.emailInstructions}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-emerald-500 transition-all font-mono text-sm leading-relaxed"
                    placeholder="Write formally. Always include the clinic signature..."
                  />
                </div>
              </div>
            </form>

          </div>
        </div>
      </div>
    </div>
  );
}
