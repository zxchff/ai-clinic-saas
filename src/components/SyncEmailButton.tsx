"use client";

export default function SyncEmailButton({ clientId }: { clientId: string }) {
  return (
    <button 
      onClick={async (e) => {
        e.preventDefault();
        const btn = e.currentTarget;
        btn.innerHTML = 'Syncing...';
        btn.disabled = true;
        try {
          const res = await fetch('/api/email-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ clientId })
          });
          const data = await res.json();
          alert(data.message || data.error || 'Sync Complete!');
        } catch (err) {
          alert('Failed to sync inbox');
        }
        btn.innerHTML = '🔄 Sync Inbox Now';
        btn.disabled = false;
      }}
      className="bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-400 border border-emerald-800 px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center gap-2 cursor-pointer"
    >
      🔄 Sync Inbox Now
    </button>
  );
}
