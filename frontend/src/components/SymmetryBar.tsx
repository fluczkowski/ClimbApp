interface SymmetryBarProps {
  leftPercent: number;
  rightPercent: number;
}

const SymmetryBar = ({ leftPercent, rightPercent }: SymmetryBarProps) => {
  return (
    <div className="bg-white p-5 rounded-lg shadow-sm border border-rock-300/30 mb-6">
        <h4 className="text-rock-800 font-bold mb-3 text-center">Rozkład pracy ramion na ścianie</h4>
        <div className="flex justify-between text-sm font-bold mb-2">
            <span className="text-blue-600">Lewa Ręka: {leftPercent}%</span>
            <span className="text-amber-600">Prawa Ręka: {rightPercent}%</span>
        </div>
        <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
            <div 
                className="h-full bg-blue-500 transition-all duration-1000"
                style={{ width: `${leftPercent}%` }}
            ></div>
            <div 
                className="h-full bg-amber-500 transition-all duration-1000"
                style={{ width: `${rightPercent}%` }}
            ></div>
        </div>
            <p className="text-xs text-center text-rock-800/50 mt-3">
            Analiza na podstawie pokonanego dystansu dłoni podczas ruchu.
        </p>
    </div>
  );
};

export default SymmetryBar;