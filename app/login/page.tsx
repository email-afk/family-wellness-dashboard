import { signInWithEmail } from "./actions";

export default function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ sent?: string; error?: string }>;
}) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-8">
      <div className="rounded-lg border border-white/70 bg-white/75 p-6 shadow-soft backdrop-blur">
        <h1 className="text-3xl font-semibold tracking-normal text-ink">Sign in</h1>
        <p className="mt-2 text-sm leading-6 text-moss">
          Use a magic link for the starter. You can add passwords, passkeys, or household
          invites once the family model is set.
        </p>
        <form action={signInWithEmail} className="mt-6 grid gap-3">
          <label className="text-sm font-medium text-ink" htmlFor="email">
            Email
          </label>
          <input
            className="rounded-lg border border-moss/20 bg-white px-3 py-2 text-ink outline-none ring-clay/30 focus:ring-4"
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
          />
          <button className="mt-2 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white">
            Send magic link
          </button>
        </form>
        <LoginNotice searchParams={searchParams} />
      </div>
    </main>
  );
}

async function LoginNotice({
  searchParams
}: {
  searchParams?: Promise<{ sent?: string; error?: string }>;
}) {
  const params = searchParams ? await searchParams : {};
  if (params.sent) {
    return <p className="mt-4 text-sm font-medium text-moss">Check your email for the sign-in link.</p>;
  }
  if (params.error) {
    return <p className="mt-4 text-sm font-medium text-coral">{params.error}</p>;
  }
  return null;
}
