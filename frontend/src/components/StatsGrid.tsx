interface StatsGridProps {
  summary: {
    total_time_sec: number;
    moving_time_sec: number;
    static_time_sec: number;
    tut_percentage: number;
    avg_wall_distance_cm: number;
    off_balance_percentage: number;
    dyno_count: number;
    max_reach_m: number;
    total_distance_m: number;
  };
}

const StatsGrid = ({ summary }: StatsGridProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-rock-800/60 text-sm font-semibold mb-1">Czas całkowity</p>
            <p className="text-xl font-bold text-rock-800">{summary.total_time_sec} s</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-rock-800/60 text-sm font-semibold mb-1">Czas w ruchu</p>
            <p className="text-xl font-bold text-ocean-500">{summary.moving_time_sec} s</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm">
            <p className="text-rock-800/60 text-sm font-semibold mb-1">Czas w bloku</p>
            <p className="text-xl font-bold text-rock-800/70">{summary.static_time_sec} s</p>
        </div>
        <div className="bg-ocean-500 p-4 rounded-lg shadow-sm">
            <p className="text-white/80 text-sm font-semibold mb-1">Płynność (TUT)</p>
            <p className="text-2xl font-extrabold text-white">{summary.tut_percentage}%</p>
        </div>
        <div className="bg-sand-200/50 p-4 rounded-lg shadow-sm border border-rock-300/50">
            <p className="text-rock-800/80 text-sm font-semibold mb-1">Średni dystans do ściany</p>
            <p className="text-2xl font-extrabold text-rock-800">{summary.avg_wall_distance_cm} cm</p>
            <p className="text-xs text-rock-800/60 mt-1">Im mniej, tym lepsza praca bioder</p>
        </div>
        <div className={`p-4 rounded-lg shadow-sm border ${summary.off_balance_percentage > 20 ? "bg-red-50 border-red-200" : "bg-green-50 border-green-200"}`}>
            <p className="text-rock-800/80 text-sm font-semibold mb-1">Czas poza balansem</p>
            <p className={`text-2xl font-extrabold ${summary.off_balance_percentage > 20 ? "text-red-600" : "text-green-600"}`}>
                {summary.off_balance_percentage}%
            </p>
        <p className="text-xs text-rock-800/60 mt-1">Czas spędzony w nieoptymalnych pozycjach</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-rock-300/30 col-span-2 md:col-span-1">
            <p className="text-rock-800/80 text-sm font-semibold mb-1">Skoki & Dyno</p>
            <p className="text-2xl font-extrabold text-orange-500">{summary.dyno_count}</p>
            <p className="text-xs text-rock-800/60 mt-1">Dynamiczne strzały CoM</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-rock-300/30 col-span-2 md:col-span-1">
            <p className="text-rock-800/80 text-sm font-semibold mb-1">Max rozpiętość</p>
            <p className="text-2xl font-extrabold text-ocean-500">{summary.max_reach_m} m</p>
            <p className="text-xs text-rock-800/60 mt-1">W maksymalnym wychyleniu</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-rock-300/30 col-span-2 md:col-span-2 bg-gradient-to-br from-emerald-50 to-white">
            <p className="text-rock-800/80 text-sm font-semibold mb-1">Pokonany dystans na ścianie</p>
            <p className="text-2xl font-extrabold text-emerald-600">{summary.total_distance_m} m</p>
            <p className="text-xs text-emerald-800/60 mt-1">Całkowita droga Środka Ciężkości</p>
        </div>
    </div>
  );
};

export default StatsGrid;