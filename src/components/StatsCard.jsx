export default function StatsCard({ label, value }) {
  return (
    <div className="bg-surface rounded-2xl p-5 flex flex-col gap-1 flex-1">
      <span className="text-muted text-xs font-medium uppercase tracking-wider">{label}</span>
      <span className="text-white text-3xl font-bold leading-tight">{value}</span>
    </div>
  )
}
