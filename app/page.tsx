import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth";
import Link from "next/link";

export const metadata = {
  title: "AI Scan Backend",
  description: "Backend for AI content detection",
};

export default async function Home() {
  let session = null;

  if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
    try {
      session = await getServerSession(authOptions);
    } catch {
      // Auth not configured yet — show sign-in form anyway
    }
  }

  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1>AI Scan Backend</h1>

      {session?.user ? (
        <>
          <p>Signed in as {session.user.name}</p>
          <p>
            <Link href="/dashboard">Go to Dashboard →</Link>
          </p>
          <form
            action={async () => {
              "use server";
              const { signOut } = await import("next-auth/react");
              await signOut({ callbackUrl: "/" });
            }}
          >
            <button type="submit">Sign out</button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            "use server";
            const { signIn } = await import("next-auth/react");
            await signIn("google", { callbackUrl: "/dashboard" });
          }}
        >
          <button type="submit">Sign in with Google</button>
        </form>
      )}
    </main>
  );
}