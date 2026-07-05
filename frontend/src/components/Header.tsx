import { supabase } from "../supabaseClient";
import type { Session } from "@supabase/supabase-js";

interface HeaderProps {
    session: Session | null;
}

export default function Header({ session }: HeaderProps) {
    const signInWithGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        });
        if (error) console.error("Błąd logowania:", error.message);
    }
    return (
        <header className="mb-10 text-center">
      <h1 className="text-5xl font-extrabold mb-3 text-rock-800 tracking-tight">
        Boulder<span className="text-ocean-500">AI</span>
      </h1>
      <p className="text-rock-800/80 font-medium text-lg">
        Zautomatyzowana analiza techniki wspinaczkowej
      </p>
      <div className="mt-4">
        {!session ? (
          <button
            onClick={signInWithGoogle}
            className="px-6 py-2 bg-white border border-rock-300 rounded-lg shadow-sm font-bold text-rock-800 hover:bg-sand-100 transition-colors"
          >
            Zaloguj się przez Google
          </button>
        ) : (
          <div className="flex items-center justify-center gap-4 text-sm font-semibold text-ocean-600">
            <span>Zalogowano jako: {session.user.email}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="underline hover:text-ocean-800"
            >
              Wyloguj
            </button>
          </div>
        )}
      </div>
    </header>
    )
}