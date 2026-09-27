import { PieChart, Pie, Cell } from 'recharts'

const ACCENT = '#8b6fe0'
const TRACK  = '#2f2440'  // surface

export default function ProgressDonut({ percent = 0, size = 140 }) {
  const filled = Math.min(100, Math.max(0, percent))
  const data = [
    { value: filled },
    { value: 100 - filled },
  ]

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          cx={size / 2 - 1}
          cy={size / 2 - 1}
          innerRadius={size * 0.34}
          outerRadius={size * 0.46}
          startAngle={90}
          endAngle={-270}
          dataKey="value"
          strokeWidth={0}
        >
          <Cell fill={ACCENT} />
          <Cell fill={TRACK} />
        </Pie>
      </PieChart>

      {/* Centered label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-white font-bold" style={{ fontSize: size * 0.2 }}>
          {filled}%
        </span>
        <span className="text-muted" style={{ fontSize: size * 0.09 }}>weekly</span>
      </div>
    </div>
  )
}
