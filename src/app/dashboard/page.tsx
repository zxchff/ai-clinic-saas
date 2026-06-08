import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AgencyDashboard() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // SECURITY: Lock down to Admin only!
  if (session.user.email !== "zachfransman8@gmail.com") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-500 mb-4">Unauthorized Access</h1>
          <p>You do not have permission to view the Agency Command Center.</p>
        </div>
      </div>
    );
  }

  // Find ALL clients for the Command Center
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Agency Command Center</h1>
            <p className="text-zinc-500 mt-1">Manage all your AI Receptionist clients.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard/client/new"
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              + Add New Client
            </Link>
            <img src={session.user.image || ""} alt="Profile" className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800" />
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm font-medium hover:underline text-zinc-500">
                Sign Out
              </button>
            </form>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">
              <h3 className="text-xl font-medium text-zinc-400">No clients yet.</h3>
              <p className="text-zinc-500 mt-2">Click "Add New Client" to onboard your first customer!</p>
            </div>
          )}

          {clients.map((client) => (
            <Link href={`/dashboard/client/${client.id}`} key={client.id}>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer shadow-sm hover:shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-semibold truncate pr-4">{client.name}</h2>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                    {client.industry || "General"}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>{client.vapiPhoneNumber || "No Phone Assigned"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className={client.googleRefreshToken ? "text-green-500" : ""}>
                      {client.googleRefreshToken ? "Calendar Connected" : "Calendar Pending"}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
