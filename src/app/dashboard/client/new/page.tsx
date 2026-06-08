import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export default async function NewClientPage() {
  const session = await getServerSession(authOptions);

  const allowedEmails = ["zachfransman8@gmail.com", "fransmanmarketing@gmail.com"];
  if (!session?.user || !allowedEmails.includes(session.user.email as string)) {
    redirect("/login");
  }

  async function createClient(formData: FormData) {
    "use server";
    
    const name = formData.get("name") as string;
    const industry = formData.get("industry") as string;

    if (!name) return;

    const newClient = await prisma.client.create({
      data: {
        name,
        industry,
        rulebook: `You are a helpful receptionist for ${name}.`,
      }
    });

    redirect(`/dashboard/client/${newClient.id}`);
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        {/* Lamborghini UI Accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500"></div>

        <Link href="/dashboard" className="text-zinc-500 hover:text-zinc-300 text-sm mb-6 inline-flex items-center gap-1 transition-colors">
          &larr; Back to Command Center
        </Link>
        
        <h1 className="text-3xl font-bold mb-2 text-white">New Client AI</h1>
        <p className="text-zinc-400 mb-8">Deploy a new receptionist engine.</p>

        <form action={createClient} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Business Name</label>
            <input 
              name="name"
              type="text" 
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-700"
              placeholder="e.g. Smith Dental Care"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Industry</label>
            <input 
              name="industry"
              type="text" 
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-zinc-700"
              placeholder="e.g. Healthcare, Plumbing, Legal"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-white text-black hover:bg-zinc-200 font-bold py-3 px-4 rounded-lg transition-all transform active:scale-95 shadow-[0_0_15px_rgba(255,255,255,0.3)]"
          >
            Deploy AI Engine
          </button>
        </form>
      </div>
    </div>
  );
}
