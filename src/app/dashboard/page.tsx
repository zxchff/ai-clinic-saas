import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import CrmSpreadsheet from "@/components/CrmSpreadsheet";

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
        <CrmSpreadsheet initialClients={JSON.parse(JSON.stringify(clients))} todayStr={today.toISOString()} />
      </div>
    </div>
  );
}
