export function AreaLineChart({
  data,
  height = 180,
  color = "var(--chart-1)",
}: {
  data: number[]
  height?: number
  color?: string
}) {
  const width = 520
  const pad = 8
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const stepX = (width - pad * 2) / (data.length - 1)

  const points = data.map((v, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (v - min) / range) * (height - pad * 2)
    return [x, y] as const
  })

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ")

  const areaPath =
    `${linePath} L ${points[points.length - 1][0].toFixed(1)} ${height - pad} ` +
    `L ${points[0][0].toFixed(1)} ${height - pad} Z`

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-full w-full"
      preserveAspectRatio="none"
      role="img"
      aria-label="Gráfica de tendencia"
    >
      <defs>
        <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#area-fill)" />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
