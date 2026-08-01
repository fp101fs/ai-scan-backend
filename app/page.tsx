import { auth, signIn, signOut } from "@/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main style={{ padding: 40, fontFamily: "system-ui, sans-serif" }}>
      <h1>AI Scan Backend</h1>

      {session?.user ? (
        <>
          <p>Signed in as {session.user.name}</p>
          <p>
            <a href="/dashboard">Go to Dashboard →</a>
          </p>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit">Sign out</button>
          </form>
        </>
      ) : (
        <form
          action={async () => {
            "use server";
            await signIn("google", { redirectTo: "/dashboard" });
          }}
        >
          <button type="submit">Sign in with Google</button>
        </form>
      )}
    </main>
  );
}
