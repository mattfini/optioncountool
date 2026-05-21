export default function Totals({ ideal, actual }) {
  const diff = actual - ideal
  const positive = diff >= 0

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#1e3d4a] border-t-2 border-[#2d5a6b] shadow-2xl">
      <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex gap-6">
          <div className="text-center">
            <div className="text-[#c8b89a] text-xs font-medium uppercase tracking-wide">Ideal</div>
            <div className="text-white font-bold text-lg leading-tight">{ideal}</div>
          </div>
          <div className="text-center">
            <div className="text-[#c8b89a] text-xs font-medium uppercase tracking-wide">Actual</div>
            <div className="text-white font-bold text-lg leading-tight">{actual}</div>
          </div>
        </div>
        <div className="text-center">
          <div className="text-[#c8b89a] text-xs font-medium uppercase tracking-wide">Difference</div>
          <div className={`font-bold text-2xl leading-tight ${positive ? 'text-green-400' : 'text-red-400'}`}>
            {positive && diff > 0 ? '+' : ''}{diff}
          </div>
        </div>
      </div>
    </div>
  )
}
