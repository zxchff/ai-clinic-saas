import prisma from "@/lib/prisma";
import EmailForm from "@/components/EmailForm";

export default async function EmailSimulator({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params;
  const client = await prisma.client.findUnique({
    where: { id: resolvedParams.id },
    include: { emails: { orderBy: { createdAt: "desc" } } }
  });

  if (!client) return <div>Client not found.</div>;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 p-8">
      <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
        
        {/* Left Column: The Inbox */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col h-[80vh]">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
            Inbox: {client.name}
          </h2>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {client.emails.length === 0 && (
              <p className="text-zinc-500 text-sm text-center py-10">No emails yet. Simulate one!</p>
            )}
            
            {client.emails.map(email => (
              <div key={email.id} className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50 dark:bg-zinc-950">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-bold text-sm">{email.fromName}</h4>
                    <p className="text-xs text-zinc-500">{email.fromEmail}</p>
                  </div>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                    {email.status}
                  </span>
                </div>
                <h5 className="font-semibold text-sm mb-1">{email.subject}</h5>
                <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">{email.body}</p>
                
                <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-3 border border-indigo-100 dark:border-indigo-900/50">
                  <p className="text-xs font-bold text-indigo-700 dark:text-indigo-400 mb-2">AI Generated Draft:</p>
                  <p className="text-sm text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap font-mono">
                    {email.aiDraft}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: The Simulator Tool */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 p-6 h-fit">
          <h2 className="text-xl font-bold mb-4">Simulate Patient Email</h2>
          <p className="text-sm text-zinc-500 mb-6">Type a fake email. Our AI will read it, check the rulebook for {client.name}, and generate a draft reply.</p>
          
          <EmailForm clientId={client.id} />
        </div>

      </div>
    </div>
  );
}
