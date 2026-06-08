import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function ClientDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  const allowedEmails = ["zachfransman8@gmail.com", "fransmanmarketing@gmail.com"];
  if (!session?.user || !allowedEmails.includes(session.user.email as string)) {
    redirect("/login");
  }

  const client = await prisma.client.findUnique({
    where: { id: params.id }
  });

  if (!client) redirect("/dashboard");

  // Server Action to update the client's brain
  async function updateAI(formData: FormData) {
    "use server";
    
    await prisma.client.update({
      where: { id: params.id },
      data: {
        rulebook: formData.get("rulebook") as string,
        chatInstructions: formData.get("chatInstructions") as string,
      }
    });

    revalidatePath(`/dashboard/client/${params.id}`);
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
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              Deploy Voice AI
            </button>
            <button className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              Deploy Chatbot
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Configuration Form */}
          <div className="lg:col-span-2 space-y-8">
            <form action={updateAI} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-cyan-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-white">The AI's Brain (Rulebook)</h2>
                <button type="submit" className="bg-white hover:bg-zinc-200 text-black px-4 py-1.5 rounded-md font-semibold text-sm transition-colors shadow-[0_0_10px_rgba(255,255,255,0.2)]">
                  Save Changes
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Core Identity & Rules</label>
                  <textarea 
                    name="rulebook"
                    defaultValue={client.rulebook}
                    rows={8}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm leading-relaxed"
                    placeholder="You are a receptionist..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-2">Chatbot Specific Instructions</label>
                  <textarea 
                    name="chatInstructions"
                    defaultValue={client.chatInstructions}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-mono text-sm leading-relaxed"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* Integrations Sidebar */}
          <div className="space-y-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                Integrations
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex justify-between items-center group hover:border-zinc-700 transition-colors">
                  <div>
                    <h4 className="font-medium text-zinc-200">Google Calendar</h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {client.googleRefreshToken ? "Connected" : "Not connected"}
                    </p>
                  </div>
                  <button className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700 transition-colors">
                    Connect
                  </button>
                </div>

                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex justify-between items-center group hover:border-zinc-700 transition-colors">
                  <div>
                    <h4 className="font-medium text-zinc-200">Google Sheets Link</h4>
                    <p className="text-xs text-zinc-500 mt-1">Log all calls/leads</p>
                  </div>
                  <button className="text-sm px-3 py-1.5 rounded-lg bg-zinc-800 text-zinc-300 group-hover:bg-zinc-700 transition-colors">
                    Setup
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Phone Engine</h3>
              {client.vapiPhoneNumber ? (
                <div className="p-4 bg-blue-900/20 border border-blue-800/50 rounded-xl">
                  <p className="text-xs text-blue-400 uppercase tracking-wider font-bold mb-1">Active Number</p>
                  <p className="text-2xl font-mono text-white">{client.vapiPhoneNumber}</p>
                </div>
              ) : (
                <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl text-center">
                  <p className="text-sm text-zinc-500 mb-3">No voice engine deployed yet.</p>
                  <button className="w-full py-2 bg-blue-600/10 text-blue-400 border border-blue-600/30 rounded-lg hover:bg-blue-600/20 transition-colors text-sm font-medium">
                    Provision Number
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
