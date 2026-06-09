export default async function TestChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  return (
    <div className="min-h-screen bg-zinc-50 font-sans">
      {/* Fake Dental Clinic Header */}
      <header className="bg-white border-b border-zinc-200 px-8 py-6 flex justify-between items-center shadow-sm">
        <h1 className="text-2xl font-bold text-blue-600 flex items-center gap-2">
          🦷 Zach's Dental Clinic
        </h1>
        <nav className="hidden md:flex gap-6 text-zinc-600 font-medium">
          <span className="cursor-pointer hover:text-blue-600">Services</span>
          <span className="cursor-pointer hover:text-blue-600">Our Team</span>
          <span className="cursor-pointer hover:text-blue-600">Contact</span>
        </nav>
      </header>

      {/* Fake Hero Section */}
      <main className="max-w-5xl mx-auto px-8 py-20 flex flex-col items-center text-center">
        <h2 className="text-5xl font-extrabold text-zinc-900 tracking-tight mb-6">
          A Better Smile Starts Here.
        </h2>
        <p className="text-xl text-zinc-500 max-w-2xl mb-10">
          Experience world-class dental care in a relaxing environment. We are currently accepting new patients!
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl transition-all">
          Book an Appointment
        </button>
      </main>

      {/* Inject the Chatbot Script */}
      <script dangerouslySetInnerHTML={{ __html: `window.AI_CLINIC_CLIENT_ID = "${id}";` }} />
      <script src={`https://ai-clinic-saas-eight.vercel.app/widget.js?v=${Date.now()}`} data-client={id} async></script>
    </div>
  );
}
