import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient"
import type { Session } from "@supabase/supabase-js"
import { Loader2, Calendar, Activity, Target, Flame, Scale, Maximize2, AlertTriangle, Pause, Timer, Route } from "lucide-react";

interface HistoryViewProps {
    session: Session;
}

interface AnalysisRecord {
    id: string;
    created_at: string;
    video_filename: string;
    total_time_sec: number;
    tut_percentage: number;
    avg_wall_distance_cm: number;
    dyno_count: number;
    off_balance_percentage: number;
    total_distance_m: number;
    moving_time_sec: number;
    static_time_sec: number;
    symmetry_left: number;
    symmetry_right: number;
    max_reach_m: number;
}

export default function HistoryView({ session }: HistoryViewProps) {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
        setIsLoading(true)
        const { data, error } = await supabase
            .from("analyses")
            .select("id, created_at, video_filename, total_time_sec, tut_percentage, avg_wall_distance_cm, dyno_count, off_balance_percentage, total_distance_m, moving_time_sec, static_time_sec, symmetry_left, symmetry_right, max_reach_m")
            .eq("user_id", session.user.id)
            .order("created_at", { ascending: false });
        
        if(error) {
            console.error("Błąd pobierania historii:", error);
        } else if (data) {
            setHistory(data);
        }

        setIsLoading(false);
    };

    fetchHistory();
  }, [session.user.id]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });
  }
  
  return (
    <div className="animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 border-b border-rock-300/30 pb-4">
        <h2 className="text-2xl font-bold text-rock-800">Twoje poprzednie analizy</h2>
        <span className="text-sm font-bold text-ocean-600 bg-ocean-50 px-3 py-1 rounded-full border border-ocean-200">
          Zapisane przejścia: {history.length}
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-12 text-ocean-500">
          <Loader2 className="animate-spin w-12 h-12 mb-4" />
          <p className="font-bold text-lg animate-pulse">Pobieranie danych z bazy...</p>
        </div>
      ) : history.length === 0 ? (
        <div className="border-2 border-dashed border-sand-300 bg-sand-50 rounded-xl flex flex-col items-center justify-center text-rock-400 p-16">
          <Activity className="w-16 h-16 mb-4 text-sand-300" />
          <p className="font-semibold text-lg text-rock-600">Brak zapisanych analiz.</p>
          <p className="text-sm mt-2">Przeanalizuj swoje pierwsze wideo i kliknij "Zapisz przejście"!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {history.map((record) => (
            <div key={record.id} className="bg-white border border-sand-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ocean-500"></div>
              
              <div className="pl-2">
                <h3 className="font-bold text-lg text-rock-800 mb-1">{record.video_filename}</h3>
                <div className="flex items-center text-rock-400 text-sm mb-6 font-medium">
                  <Calendar className="w-4 h-4 mr-1.5" />
                  {formatDate(record.created_at)}
                  <span className="mx-2">•</span>
                  <span>Całkowity czas: {record.total_time_sec?.toFixed(1) || 0}s</span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-4">
                  <div className="flex items-center gap-3">
                    <Activity className="w-6 h-6 text-green-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">W ruchu</p>
                      <p className="font-bold text-rock-800 text-sm">{record.moving_time_sec?.toFixed(1) || 0} s</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Pause className="w-6 h-6 text-slate-400" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">W bezruchu</p>
                      <p className="font-bold text-rock-800 text-sm">{record.static_time_sec?.toFixed(1) || 0} s</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Timer className="w-6 h-6 text-ocean-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">Płynność (TUT)</p>
                      <p className="font-bold text-rock-800 text-sm">{Math.round(record.tut_percentage)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-6 h-6 text-red-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">Poza balansem</p>
                      <p className="font-bold text-rock-800 text-sm">{Math.round(record.off_balance_percentage)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Target className="w-6 h-6 text-purple-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">Śr. odległość od ściany</p>
                      <p className="font-bold text-rock-800 text-sm">{Math.round(record.avg_wall_distance_cm)} cm</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Scale className="w-6 h-6 text-indigo-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">Symetria (L/P)</p>
                      <p className="font-bold text-rock-800 text-sm">{Math.round(record.symmetry_left || 50)}% / {Math.round(record.symmetry_right || 50)}%</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Maximize2 className="w-6 h-6 text-pink-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">Max zasięg</p>
                      <p className="font-bold text-rock-800 text-sm">{record.max_reach_m?.toFixed(2) || 0} m</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Route className="w-6 h-6 text-emerald-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">Pokonany dystans</p>
                      <p className="font-bold text-rock-800 text-sm">{record.total_distance_m?.toFixed(1) || 0} m</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <div>
                      <p className="text-[11px] text-rock-400 font-bold uppercase leading-tight">Strzały (Dyno)</p>
                      <p className="font-bold text-rock-800 text-sm">{record.dyno_count}</p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}