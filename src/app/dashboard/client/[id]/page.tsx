import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import DeployVoiceButton from "@/components/DeployVoiceButton";
import VoiceSelector from "@/components/VoiceSelector";
import SaveButton from "@/components/SaveButton";
import WebCallButton from "@/components/WebCallButton";
import ImportedNumberSelector from "@/components/ImportedNumberSelector";
import ClientPortalButton from "@/components/ClientPortalButton";
import CommandCopilot from "@/components/CommandCopilot";
import SharedKnowledgeFields from "@/components/SharedKnowledgeFields";

import { deployChatbot, deployEmailBot, undeployEngine } from "@/app/actions/vapi";
import { updateCRMFields, deleteClient, globalKillSwitch } from "@/app/actions/crm";

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
    if (formData.has("schedulingRules")) dataToUpdate.schedulingRules = formData.get("schedulingRules") as string;
    if (formData.has("activeTimeStart")) dataToUpdate.activeTimeStart = formData.get("activeTimeStart") as string;
    if (formData.has("activeTimeEnd")) dataToUpdate.activeTimeEnd = formData.get("activeTimeEnd") as string;
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
            <ClientPortalButton clientId={client.id} portalToken={client.portalToken || ""} />
            <DeployVoiceButton clientId={client.id} />
            
            {/* Global Kill Switch */}
            <form action={async () => { "use server"; await globalKillSwitch(client.id); }}>
              <button type="submit" className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-bold transition-colors text-sm shadow-lg shadow-red-900/20">
                🛑 GLOBAL KILL SWITCH
              </button>
            </form>
          </div>
        </header>

        <div className="space-y-12">
          
          {/* CRM SETTINGS PANEL */}
          <form action={updateCRMFields.bind(null, client.id)} className="glass-panel rounded-2xl p-6 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="flex justify-between items-center mb-6 relative z-10">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                📊 CRM & Billing Settings
              </h2>
              <SaveButton defaultText="Save CRM Data" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Lead Status</label>
                <select name="status" defaultValue={client.status || "LEAD"} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500">
                  <option value="LEAD">Lead (Prospect)</option>
                  <option value="PITCHING">Pitching (In Talks)</option>
                  <option value="ACTIVE">Active (Paying)</option>
                  <option value="CHURNED">Churned (Cancelled)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Monthly Retainer ($)</label>
                <input type="number" name="monthlyRetainer" defaultValue={client.monthlyRetainer || 0} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-emerald-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Payment Due Day (1-31)</label>
                <input type="number" min="1" max="31" name="paymentDueDate" defaultValue={client.paymentDueDate || ""} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500 font-mono" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Last Payment Date</label>
                <input type="date" name="lastPaymentDate" defaultValue={client.lastPaymentDate ? client.lastPaymentDate.toISOString().split('T')[0] : ""} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500" />
              </div>
            </div>
            
            {/* 3-Step Follow Up */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 relative z-10 border-t border-white/5 pt-6">
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Follow-Up 1</label>
                <input type="date" name="followUp1" defaultValue={client.followUp1 ? client.followUp1.toISOString().split('T')[0] : ""} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Follow-Up 2</label>
                <input type="date" name="followUp2" defaultValue={client.followUp2 ? client.followUp2.toISOString().split('T')[0] : ""} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500" />
              </div>
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Follow-Up 3</label>
                <input type="date" name="followUp3" defaultValue={client.followUp3 ? client.followUp3.toISOString().split('T')[0] : ""} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-zinc-100 focus:outline-none focus:border-amber-500" />
              </div>
            </div>
          </form>

          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
          
          <div className="space-y-8">
            <CommandCopilot clientId={client.id} />
            {/* 1. Voice AI Engine */}
            <form action={updateAI} className="glass-panel glow-voice rounded-2xl overflow-hidden relative shadow-lg group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:bg-violet-600/20"></div>
              <div className="p-8 relative z-10">
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
                  <div className="flex items-center gap-3 flex-wrap">
                    <SaveButton />
                    {client.googleRefreshToken ? (
                      <span className="bg-green-950/50 text-green-400 border border-green-900/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        Calendar Active
                      </span>
                    ) : (
                      <a href={`/api/auth/google?clientId=${client.id}`} className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Connect Google Calendar
                      </a>
                    )}

                    {client.googleSheetsId ? (
                      <span className="bg-green-950/50 text-green-400 border border-green-900/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        Sheets Active
                      </span>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <a href={`/api/clients/${client.id}/sheets/auth`} className="bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                          Connect Google Sheets
                        </a>
                      </div>
                    )}

                    {client.googleRefreshToken ? (
                      <span className="bg-green-950/50 text-green-400 border border-green-900/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        Calendar Active
                      </span>
                    ) : (
                      <a href={`/api/auth/google?clientId=${client.id}`} className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Connect Google Calendar
                      </a>
                    )}

                    {client.vapiPhoneNumber ? (
                      <>
                        <span className="bg-green-950/50 text-green-400 border border-green-900/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                          </span>
                          {client.vapiPhoneNumber}
                        </span>
                        <WebCallButton client={client} />
                        <button formAction={async () => { "use server"; await undeployEngine(client.id, "VOICE"); }} className="bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                          Stop Engine
                        </button>
                      </>
                    ) : (
                      <>
                        <DeployVoiceButton clientId={client.id} />
                        <ImportedNumberSelector clientId={client.id} />
                      </>
                    )}
                  </div>
                </div>



                <div className="mt-8">
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Voice Receptionist Instructions</label>
                  <textarea 
                    name="phoneInstructions"
                    defaultValue={client.phoneInstructions || ""}
                    rows={5}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed"
                    placeholder="Speak professionally. Ask for patient name..."
                  />
                </div>
                
                <VoiceSelector defaultVoice={client.voiceId || "rachel"} defaultCountry={client.countryCode || "+1"} />
                <SharedKnowledgeFields client={client} />
              </div>
            </form>

            {/* 2. Website Chatbot Engine */}
            <form action={updateAI} className="glass-panel glow-chat rounded-2xl overflow-hidden relative shadow-lg group">
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-3xl -mr-20 -mb-20 pointer-events-none transition-opacity group-hover:bg-cyan-600/20"></div>
              <div className="p-8 relative z-10">
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
                    <p className="text-zinc-400 mt-1">Embeddable smart widget for the client&apos;s website.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SaveButton />
                    {client.googleRefreshToken ? (
                      <span className="bg-green-950/50 text-green-400 border border-green-900/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        Calendar Connected
                      </span>
                    ) : (
                      <a href={`/api/auth/google?clientId=${client.id}`} className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Connect Google Calendar
                      </a>
                    )}
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
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Website Embed Code</p>
                      <Link href={`/test-chat/${client.id}`} target="_blank" className="bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 px-3 py-1 rounded text-xs font-bold transition-colors">
                        Preview Widget ↗
                      </Link>
                    </div>
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
                <SharedKnowledgeFields client={client} />
              </div>
            </form>

            {/* 3. Email Automation Engine */}
            <form action={updateAI} className="glass-panel glow-email rounded-2xl overflow-hidden relative shadow-lg group">
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none transition-opacity group-hover:bg-emerald-600/20"></div>
              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      ✉️ Email Automation Engine
                      {client.connectedEmail ? (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-green-500/10 text-green-400 border border-green-500/20">Active</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Not Deployed</span>
                      )}
                    </h2>
                    <p className="text-zinc-400 mt-1">Auto-replies to incoming patient emails instantly.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SaveButton />
                    {client.googleRefreshToken ? (
                      <span className="bg-green-950/50 text-green-400 border border-green-900/50 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                        Calendar Connected
                      </span>
                    ) : (
                      <a href={`/api/auth/google?clientId=${client.id}`} className="bg-blue-900/40 hover:bg-blue-800/60 text-blue-400 border border-blue-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Connect Google Calendar
                      </a>
                    )}
                    {client.connectedEmail ? (
                      <button formAction={async () => { "use server"; await undeployEngine(client.id, "EMAIL"); }} className="bg-red-950/50 hover:bg-red-900 border border-red-900/50 text-red-400 hover:text-red-300 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Stop Engine
                      </button>
                    ) : (
                      <button formAction={async () => { "use server"; await deployEmailBot(client.id); }} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
                        Deploy Email Bot
                      </button>
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
                <SharedKnowledgeFields client={client} />
              </div>
            </form>

            {/* DANGER ZONE - DELETE CLIENT */}
            <div className="mt-12 p-8 border border-red-900/30 rounded-2xl bg-red-950/10">
              <h3 className="text-red-500 font-bold text-lg mb-2">Danger Zone</h3>
              <p className="text-zinc-400 text-sm mb-6">Deleting a client will permanently destroy all their AI engines, prompt settings, and CRM data. This action cannot be reversed.</p>
              
              <form action={async (formData: FormData) => { 
                "use server"; 
                const p = formData.get("passcode") as string;
                await deleteClient(client.id, p); 
              }} className="flex gap-4 items-center">
                <input type="password" name="passcode" placeholder="Master Password" required className="bg-zinc-900 border border-red-900/50 rounded-lg px-4 py-2 text-red-100 focus:outline-none focus:border-red-500" />
                <button type="submit" className="bg-red-900/50 hover:bg-red-600 text-white border border-red-800 px-6 py-2 rounded-lg font-bold transition-colors">
                  Permanently Delete Client
                </button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
  );
}
