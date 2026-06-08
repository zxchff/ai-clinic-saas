import prisma from "@/lib/prisma";
import { createClient, deleteClient } from "@/app/actions/client";
import ClientCard from "@/components/ClientCard";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agency Dashboard</h1>
            <p className="text-zinc-500 mt-1">Manage your clients and their AI agents.</p>
          </div>
          
          <form action={createClient} className="flex gap-2 bg-white dark:bg-zinc-900 p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
            <input 
              name="name" 
              placeholder="e.g. Miami Chiropractic" 
              required
              className="px-3 py-2 bg-zinc-50 dark:bg-zinc-800 rounded-lg text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
              + Add Client
            </button>
          </form>
        </header>

        {clients.length === 0 && (
          <div className="text-center py-24 text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
            You have no clients yet. Add one above!
          </div>
        )}

        {clients.map((client) => (
          <div key={client.id} className="mb-16">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 font-bold">
                  {client.name.substring(0,2).toUpperCase()}
                </div>
                <div>
                  <h2 className="font-semibold text-lg">{client.name}</h2>
                  <p className="text-xs text-zinc-500">Added: {client.createdAt.toLocaleDateString()}</p>
                </div>
              </div>
              <form action={async () => { "use server"; await deleteClient(client.id); }}>
                <button type="submit" className="text-sm text-red-600 hover:text-red-800 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors">
                  Delete
                </button>
              </form>
            </div>

            {/* This new component handles the popup modal! */}
            <ClientCard client={client} />
          </div>
        ))}
      </div>
    </div>
  );
}
