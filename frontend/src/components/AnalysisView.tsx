import { useState, useRef, useEffect } from "react";
import VideoUploader from "./VideoUploader";
import { Loader2 } from "lucide-react";
import VelocityChart from "./VelocityChart";
import StatsGrid from "./StatsGrid";
import SymmetryBar from "./SymmetryBar";
import type { Session } from "@supabase/supabase-js";
import type { AnalysisResult } from "../types";
import { saveVideoToDB, loadVideoFromDB, clearVideoFromDB } from "../utils/indexedDB";
import { useVideoOverlay } from "../hooks/useVideoOverlay";

interface AnalysisViewProps {
  session: Session;
}

export default function AnalysisView({ session }: AnalysisViewProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setisAnalyzing] = useState<boolean>(false);
  const [climberHeight, setClimberHeight] = useState<number>(1.70);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showOverlay, setShowOverlay] = useState<boolean>(true);
  const [showSkeleton, setShowSkeleton] = useState<boolean>(true);

  const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState<boolean>(() => sessionStorage.getItem("isAnalysisSaved") === "true");

  const [result, setResult] = useState<AnalysisResult | null>(() => {
    const saved = sessionStorage.getItem("currentAnalysis");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return null; }
    }
    return null;
  });

  useVideoOverlay(videoRef, canvasRef, result, showOverlay, showSkeleton);

  useEffect(() => {
    loadVideoFromDB().then((file) => {
      if (file) setVideoFile(file);
    });
  }, []);

  const handleVideoSelected = (file: File) => {
    setVideoFile(file);
    saveVideoToDB(file);
    setResult(null);
    setIsSaved(false);
    sessionStorage.removeItem("currentAnalysis");
    sessionStorage.removeItem("isAnalysisSaved");
  };

  const handleSave = async () => {
    if (!result || !session?.user?.id) return;
    setIsSaving(true);
    const dbPayload = {
      user_id: session.user.id,
      video_filename: result.filename,
      total_time_sec: result.summary.total_time_sec,
      tut_percentage: result.summary.tut_percentage,
      avg_wall_distance_cm: result.summary.avg_wall_distance_cm,
      off_balance_percentage: result.summary.off_balance_percentage,
      dyno_count: result.summary.dyno_count,
      total_distance_m: result.summary.total_distance_m,
      frame_data: result.summary.frame_data,
      moving_time_sec: result.summary.moving_time_sec,
      static_time_sec: result.summary.static_time_sec,
      symmetry_left: result.summary.symmetry_left,
      symmetry_right: result.summary.symmetry_right,
      max_reach_m: result.summary.max_reach_m
    };

    try {
      const response = await fetch(`${API_URL}/save-analysis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dbPayload),
      });
      const responseData = await response.json();

      if (response.ok && responseData.status === "success") {
        setIsSaved(true);
        sessionStorage.setItem("isAnalysisSaved", "true");
      } else {
        alert("Błąd zapisu do bazy: " + responseData.message);
      }
    } catch (e) {
      alert("Błąd połączenia z serwerem.");
    }
    setIsSaving(false);
  };

  const handleJumpToTime = (timestamp: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = timestamp;
    }
  };

  const handleReset = () => {
    setVideoFile(null);
    setResult(null);
    setIsSaved(false);
    sessionStorage.removeItem("currentAnalysis");
    sessionStorage.removeItem("isAnalysisSaved");
    clearVideoFromDB();
  };

  const handleAnalyze = async () => {
    if (!videoFile) return;
    setisAnalyzing(true);

    const formData = new FormData();
    formData.append("file", videoFile);
    formData.append("climber_height", climberHeight.toString());
    if (session?.user?.id) formData.append("user_id", session.user.id);

    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) throw new Error("Błąd komunikacji z serwerem");
      
      const data = await response.json();
      if (data.status === "success") {
        setResult(data as AnalysisResult);
        try {
          sessionStorage.setItem("currentAnalysis", JSON.stringify(data));
          sessionStorage.setItem("isAnalysisSaved", "false");
        } catch (e) {
          console.warn("Analiza zbyt duża dla sessionStorage.");
        }
      } else {
        alert("Błąd analizy: " + data.message);
      }
    } catch (error: any) {
      alert(`Analiza przerwana!\nPowód: ${error.message}`);
    } finally {
      setisAnalyzing(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300">
      {!videoFile ? (
        <VideoUploader onVideoSelected={handleVideoSelected} />
      ) : (
        <div className="flex flex-col gap-6">
          <div className="relative bg-rock-800 rounded-xl overflow-hidden shadow-inner">
            <video
              ref={videoRef}
              src={URL.createObjectURL(videoFile)}
              controls
              className="w-full max-h-[400px] object-contain"
            />
            <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full pointer-events-none" />
          </div>

          {!result ? (
            <div className="flex flex-col items-center gap-4 mt-2">
              {isAnalyzing ? (
                <div className="flex flex-col items-center text-ocean-500 p-4">
                  <Loader2 className="animate-spin w-10 h-10 mb-2" />
                  <p className="font-bold text-lg animate-pulse">AI analizuje plik...</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 bg-sand-200/50 px-5 py-3 rounded-xl border border-rock-300">
                    <label htmlFor="heightInput" className="text-rock-800 font-bold">Twój wzrost (m):</label>
                    <input
                      id="heightInput"
                      type="number"
                      step="0.01"
                      min="1.00"
                      max="2.50"
                      value={climberHeight}
                      onChange={(e) => setClimberHeight(parseFloat(e.target.value))}
                      className="w-24 px-3 py-1 rounded-lg bg-white border border-rock-300 focus:outline-none focus:ring-2 focus:ring-ocean-500 text-center font-bold text-rock-800"
                    />
                  </div>
                  <div className="flex gap-4">
                    <button onClick={handleReset} className="px-6 py-3 border-2 border-rock-300 rounded-xl text-rock-800 hover:bg-sand-200/50 font-bold transition-colors">
                      Zmień plik
                    </button>
                    <button onClick={handleAnalyze} className="px-8 py-3 rounded-xl bg-ocean-500 hover:bg-ocean-500/90 text-white font-bold shadow-md transition-all">
                      Analizuj przejście
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="mt-4 p-6 bg-sand-100 rounded-xl border border-rock-300/30">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-rock-800 mb-4 border-b border-rock-300/30 pb-2">Raport z przejścia</h3>
                <div className="flex gap-3">
                  <button onClick={() => setShowSkeleton(!showSkeleton)} className={`px-4 py-2 rounded-lg font-bold transition-colors ${showSkeleton ? "bg-ocean-500 text-white shadow-md" : "bg-sand-200 text-rock-800/60 border border-rock-300"}`}>
                    {showSkeleton ? "Ukryj szkielet" : "Pokaż szkielet"}
                  </button>
                  <button onClick={() => setShowOverlay(!showOverlay)} className={`px-4 py-2 rounded-lg font-bold transition-colors ${showOverlay ? "bg-ocean-500 text-white shadow-md" : "bg-sand-200 text-rock-800/60 border border-rock-300"}`}>
                    {showOverlay ? "Ukryj balans" : "Pokaż balans"}
                  </button>
                </div>
              </div>
              <VelocityChart data={result.chart_data} onChartClick={handleJumpToTime} />
              <StatsGrid summary={result.summary} />
              <SymmetryBar leftPercent={result.summary.symmetry_left} rightPercent={result.summary.symmetry_right} />
              <div className="flex justify-center mt-6 gap-4">
                <button onClick={handleSave} disabled={isSaving || isSaved} className={`px-8 py-2 rounded-lg font-bold shadow-md transition-all ${isSaved ? "bg-green-500 text-white cursor-default" : "bg-ocean-500 text-white hover:bg-ocean-600"}`}>
                  {isSaving ? "Zapisuję..." : isSaved ? "Zapisano" : "Zapisz przejście"}
                </button>
                <button onClick={handleReset} className="px-6 py-2 border-2 border-rock-300 rounded-lg text-rock-800 hover:bg-white font-bold transition-colors">
                  Kolejne wideo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}