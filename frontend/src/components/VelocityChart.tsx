import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ReferenceLine
} from "recharts";

interface VelocityChartProps {
    data: Array<{
        timestamp: number;
        com_velocity_smooth: number;
        movement_phase: string;
    }>;
    onChartClick: (timestamp: number) => void;
}

export default function VelocityChart({ data, onChartClick }: VelocityChartProps) {
    const CustomTooltip = ({active, payload, label}: any) => {
        if (active && payload && payload.length) {
            const velocity = payload[0].value;
            const phase = payload[0].payload.movement_phase;

            return (
                <div className="bg-white p-3 rounded-lg shadow-lg border border-sand-200">
                    <p className="font-bold text-rock-800 mb-1">{`Czas: ${label.toFixed(2)} s`}</p>
                    <p className="text-ocean-500">
                        Prędkość: <span className="font-bold">{velocity.toFixed(3)}</span>
                    </p>
                    <p className={`text-sm mt-1 font-semibold ${phase === "Ruch" ? "text-green" : "text-rock-800/60"}`}>
                        Faza: {phase}
                    </p>
                    <p className="text-xs text-rock-800/40 mt-2 italic">
                        Kliknij, aby przewinąć wideo
                    </p>
                </div>
            )
        }
        return null;
    }

    return (
        <div className="w-full h-[300px] mt-8 mb-8 bg-white p-4 pb-14 rounded-xl border border-rock-300/30">
            <h4 className="text-lg font-bold text-rock-800 mb-4 pl-2">Wykres płynności ruchu (Prędkość CoM)</h4>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={data}
                    margin={{top: 5, right:20, left: -20, bottom: 0}}
                    onClick={(state: any) => {
            
                        if (state && state.activeLabel !== undefined && state.activeLabel !== null) {
                        const timeAsNumber = parseFloat(state.activeLabel);
                        onChartClick(timeAsNumber);
                        } 
                    }}
                    style={{ cursor: "pointer" }}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        tickCount={10}
                        tickFormatter={(val) => `${val.toFixed(1)}s`}
                        stroke="#94a3b8"
                        fontSize={12}
                    />
                    <YAxis
                        stroke="#94a3b8"
                        fontSize={12}
                        tickFormatter={(val) => val.toFixed(2)}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine y={0.15} stroke="#ef4444" strokeDasharray="3 3" label={{position: "top", value: "Próg ruchu", fill: "#ef4444", fontSize: 12 }} />
                    <defs>
                        <linearGradient id="colorVelocity" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#5f9ea0" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#5f9ea0" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <Area
                        type="monotone"
                        dataKey="com_velocity_smooth"
                        stroke="#5f9ea0"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorVelocity)"
                        activeDot={{ r: 6, fill: "#693D1E", strokeWidth: 2}}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    )
}