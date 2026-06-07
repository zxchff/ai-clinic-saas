import ChatWidget from "@/components/ChatWidget";
import prisma from "@/lib/prisma";

export default async function Home({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  let latestClient = null;
  if (params.id) {
    latestClient = await prisma.client.findUnique({ where: { id: params.id } });
  }
  if (!latestClient) {
    latestClient = await prisma.client.findFirst({
      orderBy: { createdAt: "desc" }
    });
  }
  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 font-[family-name:var(--font-geist-sans)] text-zinc-900 dark:text-zinc-50">
      <div className="max-w-5xl mx-auto px-6 py-24">
        {/* Navigation Bar Placeholder */}
        <header className="flex justify-between items-center mb-24">
          <div className="font-bold text-2xl tracking-tight text-indigo-600 dark:text-indigo-400">
            AI Clinic SaaS
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 font-medium hover:text-indigo-600 transition-colors">Login</button>
            <button className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-full font-medium transition-all shadow-sm">
              Get Started
            </button>
          </div>
        </header>

        {/* Hero Section */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm font-medium mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Now in Private Beta
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-8 leading-[1.1]">
            Your AI Receptionist, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Working 24/7.
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 mb-10 leading-relaxed max-w-2xl">
            Never miss a patient booking again. Our intelligent chat widget answers questions, integrates with Google Calendar, and books appointments while you sleep.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <button className="bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-8 py-4 rounded-full font-medium text-lg hover:bg-zinc-800 dark:hover:bg-zinc-100 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2">
              View Admin Dashboard
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"></path><path d="m12 5 7 7-7 7"></path></svg>
            </button>
            <button className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-white px-8 py-4 rounded-full font-medium text-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all flex items-center justify-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8"></polygon></svg>
              Watch Demo
            </button>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid sm:grid-cols-3 gap-8 mt-32">
          {[
            { title: "Instant Setup", desc: "Just copy and paste a single script tag into your website." },
            { title: "Smart Scheduling", desc: "Reads your Google Calendar and books available slots automatically." },
            { title: "Human Handoff", desc: "Recognizes emergencies and politely tells patients to call 911." }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* The Chat Widget! */}
      <ChatWidget clientId={latestClient?.id} />
    </main>
  );
}
