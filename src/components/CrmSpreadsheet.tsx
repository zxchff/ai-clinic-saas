"use client";

import { useState } from "react";
import Link from "next/link";
import { updateClientField } from "@/app/actions/crm";

export default function CrmSpreadsheet({ initialClients, todayStr }: { initialClients: any[], todayStr: string }) {
  const [clients, setClients] = useState(initialClients);
  const [search, setSearch] = useState("");
  const today = new Date(todayStr);

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.industry && c.industry.toLowerCase().includes(search.toLowerCase()))
  );

  const handleEdit = async (clientId: string, field: string, value: string) => {
    // Optimistic UI update
    setClients(prev => prev.map(c => c.id === clientId ? { ...c, [field]: value } : c));
    
    // Server save
    await updateClientField(clientId, field, value);
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Spreadsheet Toolbar */}
      <div className="bg-zinc-900 border-b border-white/10 p-4 flex justify-between items-center">
        <div className="relative w-full max-w-md">
          <svg className="w-5 h-5 absolute left-3 top-2.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input 
            type="text" 
            placeholder="Search clients..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-zinc-100 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="text-zinc-500 text-sm font-mono">
          {filteredClients.length} rows
        </div>
      </div>

      {/* Spreadsheet Grid */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-white/5 text-zinc-400 border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs">Client Name</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs w-40">Status</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs w-32">Retainer ($)</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs w-24">Due Day</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs w-36">Follow-Up 1</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs w-36">Follow-Up 2</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs w-36">Follow-Up 3</th>
              <th className="px-4 py-3 font-medium uppercase tracking-wider text-xs text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredClients.length === 0 && (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-zinc-500">
                  {search ? "No clients match your search." : "No clients found. Click '+ Add New Client' above."}
                </td>
              </tr>
            )}
            {filteredClients.map((client) => {
               const isOverdue = client.status === "ACTIVE" && client.paymentDueDate && today.getDate() > client.paymentDueDate;
               
               // Helper for follow up alerts
               const isDue = (dateStr: string) => dateStr && new Date(dateStr) <= today && client.status !== "ACTIVE";

               return (
              <tr key={client.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-4 py-3 font-semibold text-white">
                  {client.name}
                  <div className="text-xs text-zinc-500 font-normal">{client.industry || "General"}</div>
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={client.status || "LEAD"} 
                    onChange={(e) => handleEdit(client.id, "status", e.target.value)}
                    className={`w-full bg-transparent font-bold uppercase tracking-wider text-xs focus:outline-none cursor-pointer ${
                      client.status === 'ACTIVE' ? 'text-emerald-400' :
                      client.status === 'PITCHING' ? 'text-amber-400' :
                      client.status === 'CHURNED' ? 'text-red-400' :
                      'text-zinc-400'
                    }`}
                  >
                    <option value="LEAD" className="bg-zinc-900 text-zinc-400">LEAD</option>
                    <option value="PITCHING" className="bg-zinc-900 text-amber-400">PITCHING</option>
                    <option value="ACTIVE" className="bg-zinc-900 text-emerald-400">ACTIVE</option>
                    <option value="CHURNED" className="bg-zinc-900 text-red-400">CHURNED</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="number" 
                    value={client.monthlyRetainer || ""} 
                    onChange={(e) => handleEdit(client.id, "monthlyRetainer", e.target.value)}
                    placeholder="0"
                    className="w-full bg-transparent font-mono text-zinc-300 focus:outline-none focus:bg-white/10 rounded px-1 -ml-1 transition-colors"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="1" max="31"
                      value={client.paymentDueDate || ""} 
                      onChange={(e) => handleEdit(client.id, "paymentDueDate", e.target.value)}
                      placeholder="DD"
                      className="w-12 bg-transparent font-mono text-zinc-300 focus:outline-none focus:bg-white/10 rounded px-1 -ml-1 transition-colors"
                    />
                    {isOverdue && client.status === "ACTIVE" && <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Overdue!"></span>}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="date" 
                    value={client.followUp1 ? new Date(client.followUp1).toISOString().split('T')[0] : ""} 
                    onChange={(e) => handleEdit(client.id, "followUp1", e.target.value)}
                    className={`w-full bg-transparent focus:outline-none focus:bg-white/10 rounded px-1 -ml-1 transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 ${isDue(client.followUp1) ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="date" 
                    value={client.followUp2 ? new Date(client.followUp2).toISOString().split('T')[0] : ""} 
                    onChange={(e) => handleEdit(client.id, "followUp2", e.target.value)}
                    className={`w-full bg-transparent focus:outline-none focus:bg-white/10 rounded px-1 -ml-1 transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 ${isDue(client.followUp2) ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <input 
                    type="date" 
                    value={client.followUp3 ? new Date(client.followUp3).toISOString().split('T')[0] : ""} 
                    onChange={(e) => handleEdit(client.id, "followUp3", e.target.value)}
                    className={`w-full bg-transparent focus:outline-none focus:bg-white/10 rounded px-1 -ml-1 transition-colors cursor-pointer [&::-webkit-calendar-picker-indicator]:invert [&::-webkit-calendar-picker-indicator]:opacity-50 ${isDue(client.followUp3) ? 'text-amber-400 font-bold' : 'text-zinc-400'}`}
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/dashboard/client/${client.id}`} className="text-blue-400 hover:text-blue-300 font-medium text-sm transition-colors opacity-0 group-hover:opacity-100">
                    Open &rarr;
                  </Link>
                </td>
              </tr>
            )})}
          </tbody>
        </table>
      </div>
    </div>
  );
}
