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
  const allowedEmails = ["zachfransman8@gmail.com", "fransmanmarketing@gmail.com"];
  if (!allowedEmails.includes(session.user.email as string)) {
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

  // Calculate CRM Stats
  let totalMRR = 0;
  let overdueCount = 0;
  let followUpCount = 0;
  
  const today = new Date();
  
  clients.forEach(c => {
    if (c.status === "ACTIVE" && c.monthlyRetainer) {
      totalMRR += c.monthlyRetainer;
    }
    
    if (c.status === "ACTIVE" && c.paymentDueDate) {
      const currentDay = today.getDate();
      if (currentDay > c.paymentDueDate) {
         if (!c.lastPaymentDate || c.lastPaymentDate.getMonth() !== today.getMonth() || c.lastPaymentDate.getFullYear() !== today.getFullYear()) {
             overdueCount++;
         }
      }
    }
    
    if (c.status !== "ACTIVE") {
      if (c.followUp1 && c.followUp1 <= today) followUpCount++;
      if (c.followUp2 && c.followUp2 <= today) followUpCount++;
      if (c.followUp3 && c.followUp3 <= today) followUpCount++;
    }
  });

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Agency Command Center</h1>
            <p className="text-zinc-500 mt-1">Manage all your clients, payments, and AI engines.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/dashboard/client/new" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-lg shadow-blue-900/20">
              + Add New Client
            </Link>
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm font-medium hover:text-white text-zinc-500 transition-colors">
                Sign Out
              </button>
            </form>
          </div>
        </header>

        {/* AI Billing Assistant Widget */}
        <div className="glass-panel rounded-2xl p-6 mb-8 border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
              <span className="text-2xl">🤖</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Billing AI Assistant</h2>
              <p className="text-sm text-zinc-400">Monitoring your cash flow in real-time.</p>
            </div>
          </div>
          
          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Monthly Recurring</p>
              <p className="text-2xl font-bold text-emerald-400">${totalMRR.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Overdue Payments</p>
              <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-300'}`}>{overdueCount}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Follow-Ups Due</p>
              <p className={`text-2xl font-bold ${followUpCount > 0 ? 'text-amber-400' : 'text-zinc-300'}`}>{followUpCount}</p>
            </div>
          </div>
        </div>

        {/* CRM Spreadsheet View */}
        <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-white/5 text-zinc-400 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Client Name</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Retainer</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Due Day</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs">Voice AI</th>
                  <th className="px-6 py-4 font-medium uppercase tracking-wider text-xs text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {clients.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-zinc-500">
                      No clients found. Click "Add New Client" to start building your empire.
                    </td>
                  </tr>
                )}
                {clients.map((client) => {
                   const isOverdue = client.status === "ACTIVE" && client.paymentDueDate && today.getDate() > client.paymentDueDate && (!client.lastPaymentDate || client.lastPaymentDate.getMonth() !== today.getMonth());
                   return (
                  <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-semibold text-white">
                      {client.name}
                      <div className="text-xs text-zinc-500 font-normal">{client.industry || "General"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md border ${
                        client.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        client.status === 'PITCHING' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        client.status === 'CHURNED' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-zinc-800 text-zinc-400 border-zinc-700'
                      }`}>
                        {client.status || 'LEAD'}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-zinc-300">
                      ${client.monthlyRetainer?.toLocaleString() || '0'}/mo
                    </td>
                    <td className="px-6 py-4">
                      {client.paymentDueDate ? (
                        <div className="flex items-center gap-2">
                          <span className="text-zinc-300 font-mono">Day {client.paymentDueDate}</span>
                          {isOverdue && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Overdue!"></span>}
                        </div>
                      ) : <span className="text-zinc-600">-</span>}
                    </td>
                    <td className="px-6 py-4">
                      {client.vapiPhoneNumber ? (
                        <span className="text-emerald-400 font-mono text-xs bg-emerald-400/10 px-2 py-1 rounded">Live</span>
                      ) : (
                        <span className="text-zinc-600 text-xs">Offline</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link href={`/dashboard/client/${client.id}`} className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100">
                        Open Command Center &rarr;
                      </Link>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
