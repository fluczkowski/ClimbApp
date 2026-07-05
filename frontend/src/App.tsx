import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import type { Session } from "@supabase/supabase-js";
import Header from "./components/Header";
import AnalysisView from "./components/AnalysisView";
import HistoryView from "./components/HistoryView";

function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"analysis" | "history">("analysis");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-12 px-5 font-sans min-h-screen">
      <Header session={session} />
      
      {session && (
        <>
          <div className="flex justify-start gap-2 mb-0">
            <button
              onClick={() => setActiveTab("analysis")}
              className={`px-6 py-3 font-bold rounded-t-xl transition-all ${
                activeTab === "analysis" ? "bg-white text-ocean-600 border-t-4 border-ocean-500 shadow-sm" : "bg-sand-100 text-rock-400 hover:bg-sand-200 hover:text-rock-600 border-t-4 border-transparent"
              }`}
            >
              Analiza wideo
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-6 py-3 font-bold rounded-t-xl transition-all ${
                activeTab === "history" ? "bg-white text-ocean-600 border-t-4 border-ocean-500 shadow-sm" : "bg-sand-100 text-rock-400 hover:bg-sand-200 hover:text-rock-600 border-t-4 border-transparent"
              }`}
            >
              Historia
            </button>
          </div>

          <main className={`bg-white p-8 shadow-xl shadow-rock-300/20 border border-sand-200 ${
            activeTab === "analysis" ? "rounded-b-2xl rounded-tr-2xl" : "rounded-2xl"
          }`}>
            <div className={activeTab === "analysis" ? "block" : "hidden"}>
              <AnalysisView session={session} />
            </div>            
            {activeTab === "history" && (
              <HistoryView session={session} />
            )}
          </main>
        </>
      )}
    </div>
  );
}

export default App;