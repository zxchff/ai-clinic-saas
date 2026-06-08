import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import ClientCard from "@/components/ClientCard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Find the clinic belonging to this user
  let client = await prisma.client.findFirst({
    // @ts-ignore
    where: { userId: session.user.id },
  });

  // If this is a brand new user, create a blank clinic for them automatically
  if (!client) {
    client = await prisma.client.create({
      data: {
        name: `${session.user.name}'s Clinic`,
        rulebook: "You are a helpful AI receptionist.",
        // @ts-ignore
        userId: session.user.id,
      },
    });
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Welcome, {session.user.name}</h1>
            <p className="text-zinc-500 mt-1">Manage your AI Receptionist settings.</p>
          </div>
          
          <div className="flex items-center gap-4">
            <img src={session.user.image || ""} alt="Profile" className="w-10 h-10 rounded-full border border-zinc-200 dark:border-zinc-800" />
            <form action="/api/auth/signout" method="POST">
              <button type="submit" className="text-sm font-medium hover:underline text-zinc-500">
                Sign Out
              </button>
            </form>
          </div>
        </header>

        {/* We reuse the exact same ClientCard component, but it only shows their specific clinic! */}
        <ClientCard client={client} />
      </div>
    </div>
  );
}
