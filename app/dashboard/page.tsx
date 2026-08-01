import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export const metadata = {
  title: "Dashboard - AI Scan Backend",
};

export default async function Dashboard() {
  let session = null;

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    try {
      session = await getServerSession(authOptions);
    } catch {
      // Auth not configured yet
    }
  }

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
      <p>
        <Link href="/">← Home</Link>
      </p>
    </main>
  );
}