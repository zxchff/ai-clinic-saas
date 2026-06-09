import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";

import DeployVoiceButton from "@/components/DeployVoiceButton";
import VoiceSelector from "@/components/VoiceSelector";
import SaveButton from "@/components/SaveButton";
import WebCallButton from "@/components/WebCallButton";
import ImportedNumberSelector from "@/components/ImportedNumberSelector";
import { undeployEngine } from "@/app/actions/vapi";

export const dynamic = "force-dynamic";

export default async function ClientPortalPage({ params, searchParams }: { params: Promise<{ id: string }>, searchParams: Promise<{ token: string }> }) {
  const { id } = await params;
  const { token } = await searchParams;

  const client = await prisma.client.findUnique({
    where: { id }
  });

  if (!client || client.portalToken !== token) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-white mb-4">Access Denied</h1>
          <p className="text-zinc-400">This secure portal link is invalid or has expired. Please contact your agency for a new link.</p>
        </div>
      </div>
    );
  }

  // Server Action to update the client's AI
  async function updateAI(formData: FormData) {
    "use server";
    
    const dataToUpdate: any = {};
    if (formData.has("rulebook")) dataToUpdate.rulebook = formData.get("rulebook") as string;
    if (formData.has("phoneInstructions")) dataToUpdate.phoneInstructions = formData.get("phoneInstructions") as string;
    if (formData.has("chatInstructions")) dataToUpdate.chatInstructions = formData.get("chatInstructions") as string;
    if (formData.has("emailInstructions")) dataToUpdate.emailInstructions = formData.get("emailInstructions") as string;
    if (formData.has("countryCode")) dataToUpdate.countryCode = formData.get("countryCode") as string;
    if (formData.has("voiceId")) dataToUpdate.voiceId = formData.get("voiceId") as string;

    await prisma.client.update({
      where: { id },
      data: dataToUpdate
    });

    revalidatePath(`/portal/${id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-end mb-10 pb-6 border-b border-zinc-800">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-black tracking-tight text-white">{client.name}</h1>
              <span className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-bold text-zinc-400">
                Command Center
              </span>
            </div>
            <p className="text-zinc-400 text-sm max-w-xl leading-relaxed">
              Welcome to your AI Command Center. Update your core knowledge base, customize your receptionist's voice, and deploy your engines here.
            </p>
          </div>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
          
          <div className="space-y-8">
            <form action={updateAI} className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    🧠 Core Knowledge Base
                  </h2>
                  <p className="text-zinc-400 mt-1 text-sm">This is the central brain for all your AI engines. Update your business hours and policies here.</p>
                </div>
                <SaveButton />
              </div>

              <textarea 
                name="rulebook"
                defaultValue={client.rulebook}
                rows={12}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed shadow-inner"
                placeholder="Business Name: Zach's Dental\nAddress: 123 Main St...\nServices: Teeth Whitening, Implants..."
              />
            </form>

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
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Voice Receptionist Instructions</label>
                  <textarea 
                    name="phoneInstructions"
                    defaultValue={client.phoneInstructions || client.rulebook}
                    rows={5}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed"
                  />
                </div>
                <VoiceSelector defaultVoice={client.voiceId || "rachel"} defaultCountry={client.countryCode || "+1"} />
              </div>
            </form>

            <form action={updateAI} className="glass-panel glow-chat rounded-2xl overflow-hidden relative shadow-lg group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:bg-blue-600/20"></div>
              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      💬 Website Chatbot
                      {client.chatbotEmbedCode ? (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-green-500/10 text-green-400 border border-green-500/20">Deployed</span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs font-bold uppercase tracking-wide rounded bg-zinc-800 text-zinc-500 border border-zinc-700">Not Deployed</span>
                      )}
                    </h2>
                    <p className="text-zinc-400 mt-1">Lead capturing AI for your website.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SaveButton />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Chatbot Personality & Instructions</label>
                  <textarea 
                    name="chatInstructions"
                    defaultValue={client.chatInstructions || client.rulebook}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed"
                  />
                </div>

                {client.chatbotEmbedCode && (
                  <div className="mb-6 p-4 bg-zinc-950 border border-zinc-800 rounded-xl mt-4">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Website Embed Code</p>
                      <a href={`/test-chat/${client.id}`} target="_blank" className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold transition-colors">
                        Preview Widget ↗
                      </a>
                    </div>
                    <code className="block text-sm text-purple-400 bg-zinc-900 p-4 rounded-lg border border-purple-900/30 break-all select-all">
                      {client.chatbotEmbedCode}
                    </code>
                    <p className="text-xs text-zinc-500 mt-2">Paste this directly into your Wix, WordPress, or Webflow header/body section.</p>
                  </div>
                )}
              </div>
            </form>

            <form action={updateAI} className="glass-panel glow-email rounded-2xl overflow-hidden relative shadow-lg group mb-10">
              <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:bg-emerald-600/20"></div>
              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                      ✉️ Email Automation Engine
                    </h2>
                    <p className="text-zinc-400 mt-1">Autonomous email responder.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <SaveButton />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">Email Drafter Instructions</label>
                  <textarea 
                    name="emailInstructions"
                    defaultValue={client.emailInstructions || client.rulebook}
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 transition-all font-mono text-sm leading-relaxed"
                  />
                </div>
              </div>
            </form>
          </div>
          
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl border border-zinc-800/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-zinc-800"></div>
              <h3 className="text-lg font-bold text-white mb-2">Account Status</h3>
              <p className="text-zinc-400 text-sm mb-4">Your AI systems are running correctly. If you need any assistance, please contact your agency.</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
