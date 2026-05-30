import type { DashboardDistributionRow, DashboardSeriesPoint } from '@/lib/dashboard-command-center'

const CHART_WIDTH = 580
const CHART_HEIGHT = 132
const PLOT_LEFT = 38
const PLOT_RIGHT = 574
const PLOT_TOP = 12
const PLOT_BOTTOM = 113
const COLORS = ['#3ecf8e', '#4d9de0', '#e05c5c', '#9b7fe8', '#5a5a5a', '#f0c040']

export function VolumeChart({ points, status }: { points: DashboardSeriesPoint[]; status: string }) {
  const safePoints = points.length > 0 ? points : [{ label: '--', records: 0, volumeGb: 0, jobs: 0, failed: 0 }]
  const maxRecords = Math.max(...safePoints.map((point) => point.records), 1)
  const maxVolume = Math.max(...safePoints.map((point) => point.volumeGb), 1)
  const step = safePoints.length > 1 ? (PLOT_RIGHT - PLOT_LEFT) / (safePoints.length - 1) : 0
  const coords = safePoints.map((point, index) => ({
    x: safePoints.length > 1 ? PLOT_LEFT + index * step : (PLOT_LEFT + PLOT_RIGHT) / 2,
    y: PLOT_BOTTOM - (point.records / maxRecords) * (PLOT_BOTTOM - PLOT_TOP),
    volumeY: PLOT_BOTTOM - (point.volumeGb / maxVolume) * (PLOT_BOTTOM - PLOT_TOP),
    point,
  }))
  const linePath = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(1)},${coord.y.toFixed(1)}`).join(' ')
  const volumePath = coords.map((coord, index) => `${index === 0 ? 'M' : 'L'}${coord.x.toFixed(1)},${coord.volumeY.toFixed(1)}`).join(' ')
  const areaPath = `${linePath} L${coords.at(-1)?.x.toFixed(1) ?? PLOT_RIGHT},${PLOT_BOTTOM} L${coords[0]?.x.toFixed(1) ?? PLOT_LEFT},${PLOT_BOTTOM} Z`

  return (
    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} xmlns="http://www.w3.org/2000/svg" className="dash-chart" role="img" aria-label={`Volume 24h ${status}`}>
      <defs>
        <linearGradient id="dashVolumeArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4d9de0" stopOpacity=".22" />
          <stop offset="100%" stopColor="#4d9de0" stopOpacity="0" />
        </linearGradient>
      </defs>
      {[12, 40, 68, 96, 113].map((y) => (
        <line key={y} x1="38" y1={y} x2="574" y2={y} stroke={y === 113 ? '#1a1a1a' : '#202020'} strokeWidth="1" />
      ))}
      {['max', '75%', '50%', '25%'].map((label, index) => (
        <text key={label} x="34" y={14 + index * 28} fill="#5a5a5a" fontSize="7.5" fontFamily="DM Mono" textAnchor="end">{label}</text>
      ))}
      {coords.map((coord) => {
        const barHeight = Math.max(3, (coord.point.jobs / Math.max(...safePoints.map((point) => point.jobs), 1)) * 88)
        const failedHeight = Math.max(0, (coord.point.failed / Math.max(...safePoints.map((point) => point.failed), 1)) * 26)

        return (
          <g key={`${coord.point.label}-${coord.x}`}>
            <rect x={coord.x - 6} y={PLOT_BOTTOM - barHeight} width="12" height={barHeight} fill="#4d9de0" opacity=".55" rx="1.5" />
            {failedHeight > 0 ? <rect x={coord.x + 7} y={PLOT_BOTTOM - failedHeight} width="6" height={failedHeight} fill="#585858" opacity=".45" rx="1" /> : null}
          </g>
        )
      })}
      <path d={areaPath} fill="url(#dashVolumeArea)" opacity={status === 'backend-pending' ? '.45' : '1'} />
      <path d={linePath} fill="none" stroke="#4d9de0" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d={volumePath} fill="none" stroke="#3ccfcf" strokeWidth="1.3" strokeDasharray="4,3" opacity=".65" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((coord) => (
        <circle key={`${coord.point.label}-dot`} cx={coord.x} cy={coord.y} r="3" fill="#141414" stroke="#4d9de0" strokeWidth="1.5" />
      ))}
      {safePoints.map((point, index) => (
        <text
          key={`${point.label}-label`}
          x={coords[index]?.x ?? PLOT_LEFT}
          y="127"
          fill={index === safePoints.length - 1 ? '#4d9de0' : '#5a5a5a'}
          fontSize="7.5"
          fontFamily="DM Mono"
          textAnchor="middle"
          fontWeight={index === safePoints.length - 1 ? '600' : undefined}
        >
          {point.label}
        </text>
      ))}
    </svg>
  )
}

export function WeeklyBars({ bars }: { bars: { label: string; value: number }[] }) {
  const safeBars = bars.length > 0 ? bars : ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Hj'].map((label) => ({ label, value: 0 }))
  const maxValue = Math.max(...safeBars.map((bar) => bar.value), 1)

  return (
    <svg viewBox="0 0 240 52" className="dash-mini-bars" role="img" aria-label="Jobs por dia da semana">
      {safeBars.map((bar, index) => {
        const height = Math.max(4, (bar.value / maxValue) * 36)
        const x = index * 34

        return (
          <g key={bar.label}>
            <rect x={x} y={36 - height} width="28" height={height} fill="var(--signal-blue)" rx="2" opacity={bar.value === maxValue ? '.88' : '.45'} />
            <text x={x + 14} y="50" textAnchor="middle" fill={index === safeBars.length - 1 ? '#4d9de0' : '#5a5a5a'} fontSize="7" fontFamily="DM Mono">
              {bar.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}

export function DistributionDonut({ rows, total }: { rows: DashboardDistributionRow[]; total: number }) {
  const circumference = 2 * Math.PI * 40
  const segments = rows.reduce<{
    items: { row: DashboardDistributionRow; index: number; length: number; dashOffset: number }[]
    nextOffset: number
  }>((acc, row, index) => {
    const length = total > 0 ? (row.count / total) * circumference : 0

    return {
      items: [...acc.items, { row, index, length, dashOffset: acc.nextOffset }],
      nextOffset: acc.nextOffset - length,
    }
  }, { items: [], nextOffset: circumference * 0.25 }).items

  return (
    <svg viewBox="0 0 110 110" width="96" height="96" role="img" aria-label="Distribuicao de jobs">
      <circle cx="55" cy="55" r="40" fill="none" stroke="#1a1a1a" strokeWidth="13" />
      {segments.map(({ row, index, length, dashOffset }) => (
        <circle
          key={row.status}
          cx="55"
          cy="55"
          r="40"
          fill="none"
          stroke={colorForRow(row, index)}
          strokeWidth="13"
          strokeDasharray={`${Math.max(0, length)} ${circumference}`}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 55 55)"
        />
      ))}
      <text x="55" y="51" textAnchor="middle" fill="#f5f5f5" fontSize="17" fontWeight="300" fontFamily="Plus Jakarta Sans" letterSpacing="0">
        {total}
      </text>
      <text x="55" y="63" textAnchor="middle" fill="#5a5a5a" fontSize="7" fontFamily="DM Mono" letterSpacing="0">JOBS</text>
    </svg>
  )
}

function colorForRow(row: DashboardDistributionRow, index: number) {
  if (row.tone.startsWith('var(')) return COLORS[index % COLORS.length]
  return row.tone
}
