import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function Dashboard() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1>Dashboard</h1>
      <p>Welcome, {session.user.name}!</p>
      <p>Email: {session.user.email}</p>
      <p>
        <a href="/">← Home</a>
      </p>
    </main>
  );
}
