"use client";

import { createClient } from "@/lib/supabase/client";

export default function GoogleButton() {
  const supabase = createClient();

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      className="mt-4 w-full rounded-lg border px-4 py-2 text-sm"
    >
      Sign in with Google
    </button>
  );
}