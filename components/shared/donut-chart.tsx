export type DonutSegment = {
  label: string
  value: number
  color: string
}

export function DonutChart({
  segments,
  centerValue,
  centerLabel,
  size = 150,
  thickness = 20,
}: {
  segments: DonutSegment[]
  centerValue: string
  centerLabel?: string
  size?: number
  thickness?: number
}) {
  const total = segments.reduce((acc, s) => acc + s.value, 0) || 1
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={thickness}
        />
        {segments.map((s, index) => {
          const length = (s.value / total) * circumference
          const dash = `${length} ${circumference - length}`
          const offset = segments
            .slice(0, index)
            .reduce((sum, segment) => sum + (segment.value / total) * circumference, 0)
          return (
            <circle
              key={s.label}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={dash}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-foreground">{centerValue}</span>
        {centerLabel && (
          <span className="text-[11px] text-muted-foreground">{centerLabel}</span>
        )}
      </div>
    </div>
  )
}
