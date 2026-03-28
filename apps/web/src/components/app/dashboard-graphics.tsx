export function VolumeChart() {
  return (
    <svg viewBox="0 0 580 132" xmlns="http://www.w3.org/2000/svg" className="dash-chart">
      <defs>
        <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4d9de0" stopOpacity=".22" />
          <stop offset="100%" stopColor="#4d9de0" stopOpacity="0" />
        </linearGradient>
      </defs>
      <line x1="38" y1="12" x2="574" y2="12" stroke="#202020" strokeWidth="1" />
      <line x1="38" y1="40" x2="574" y2="40" stroke="#202020" strokeWidth="1" />
      <line x1="38" y1="68" x2="574" y2="68" stroke="#202020" strokeWidth="1" />
      <line x1="38" y1="96" x2="574" y2="96" stroke="#202020" strokeWidth="1" />
      <line x1="38" y1="113" x2="574" y2="113" stroke="#1a1a1a" strokeWidth="1" />
      <text x="34" y="14" fill="#5a5a5a" fontSize="7.5" fontFamily="DM Mono" textAnchor="end">150k</text>
      <text x="34" y="42" fill="#5a5a5a" fontSize="7.5" fontFamily="DM Mono" textAnchor="end">100k</text>
      <text x="34" y="70" fill="#5a5a5a" fontSize="7.5" fontFamily="DM Mono" textAnchor="end">50k</text>
      <text x="34" y="98" fill="#5a5a5a" fontSize="7.5" fontFamily="DM Mono" textAnchor="end">10k</text>
      <rect x="46" y="100" width="12" height="13" fill="#4d9de0" opacity=".4" rx="1.5" />
      <rect x="59" y="107" width="6" height="6" fill="#585858" opacity=".35" rx="1" />
      <rect x="101" y="88" width="12" height="25" fill="#4d9de0" opacity=".5" rx="1.5" />
      <rect x="114" y="104" width="6" height="9" fill="#585858" opacity=".35" rx="1" />
      <rect x="156" y="76" width="12" height="37" fill="#4d9de0" opacity=".55" rx="1.5" />
      <rect x="169" y="101" width="6" height="12" fill="#585858" opacity=".35" rx="1" />
      <rect x="211" y="28" width="12" height="85" fill="#4d9de0" opacity=".72" rx="1.5" />
      <rect x="224" y="97" width="6" height="16" fill="#585858" opacity=".4" rx="1" />
      <rect x="266" y="50" width="12" height="63" fill="#4d9de0" opacity=".62" rx="1.5" />
      <rect x="279" y="100" width="6" height="13" fill="#585858" opacity=".35" rx="1" />
      <rect x="321" y="40" width="12" height="73" fill="#4d9de0" opacity=".67" rx="1.5" />
      <rect x="334" y="98" width="6" height="15" fill="#585858" opacity=".35" rx="1" />
      <rect x="376" y="60" width="12" height="53" fill="#4d9de0" opacity=".55" rx="1.5" />
      <rect x="389" y="102" width="6" height="11" fill="#585858" opacity=".35" rx="1" />
      <rect x="431" y="18" width="12" height="95" fill="#4d9de0" opacity=".88" rx="1.5" />
      <rect x="444" y="100" width="6" height="13" fill="#585858" opacity=".35" rx="1" />
      <rect x="486" y="90" width="12" height="23" fill="#4d9de0" opacity=".2" rx="1.5" />
      <rect x="541" y="96" width="12" height="17" fill="#4d9de0" opacity=".14" rx="1.5" />
      <path d="M52,106 C90,96 128,82 164,70 C200,58 234,88 272,66 C308,44 342,36 378,42 C414,48 450,22 488,28 L488,113 L52,113 Z" fill="url(#gArea)" />
      <path d="M52,106 C90,96 128,82 164,70 C200,58 234,88 272,66 C308,44 342,36 378,42 C414,48 450,22 488,28" fill="none" stroke="#4d9de0" strokeWidth="1.8" />
      <path d="M52,110 C90,105 128,99 164,91 C200,83 234,96 272,84 C308,72 342,58 378,62 C414,66 450,44 488,48" fill="none" stroke="#3ccfcf" strokeWidth="1.3" strokeDasharray="4,3" opacity=".65" />
      <line x1="437" y1="12" x2="437" y2="113" stroke="#2c2c2c" strokeWidth="1" strokeDasharray="2,3" />
      <circle cx="437" cy="22" r="3.5" fill="#141414" stroke="#4d9de0" strokeWidth="1.5" />
      <circle cx="437" cy="46" r="3" fill="#141414" stroke="#3ccfcf" strokeWidth="1.5" />
      <rect x="448" y="10" width="95" height="44" rx="4" fill="#0f0f0f" stroke="#2c2c2c" strokeWidth="1" />
      <text x="454" y="22" fill="#707070" fontSize="7.5" fontFamily="DM Mono">14h — pico diario</text>
      <circle cx="453" cy="31" r="3" fill="#4d9de0" opacity=".7" />
      <text x="459" y="34" fill="#999" fontSize="7.5" fontFamily="DM Mono">Registros</text>
      <text x="536" y="34" fill="#f5f5f5" fontSize="7.5" fontFamily="DM Mono" textAnchor="end">42.1k</text>
      <circle cx="453" cy="43" r="3" fill="#3ccfcf" opacity=".7" />
      <text x="459" y="46" fill="#999" fontSize="7.5" fontFamily="DM Mono">Volume</text>
      <text x="536" y="46" fill="#f5f5f5" fontSize="7.5" fontFamily="DM Mono" textAnchor="end">0.8 GB</text>
      {['06h', '07h', '08h', '09h', '11h', '12h', '13h', '14h ●', '15h', '16h'].map((label, index) => {
        const positions = [52, 107, 162, 217, 272, 327, 382, 437, 492, 547]
        const highlight = label.includes('●')
        const dimmed = label === '15h' || label === '16h'
        return (
          <text
            key={label}
            x={positions[index]}
            y="127"
            fill={highlight ? '#4d9de0' : '#5a5a5a'}
            opacity={dimmed ? '.45' : '1'}
            fontSize="7.5"
            fontFamily="DM Mono"
            textAnchor="middle"
            fontWeight={highlight ? '600' : undefined}
          >
            {label}
          </text>
        )
      })}
    </svg>
  )
}

export function WeeklyBars() {
  return (
    <svg viewBox="0 0 240 36" className="dash-mini-bars">
      <rect x="0" y="22" width="28" height="14" fill="var(--signal-blue)" rx="2" opacity=".35" />
      <rect x="34" y="16" width="28" height="20" fill="var(--signal-blue)" rx="2" opacity=".45" />
      <rect x="68" y="10" width="28" height="26" fill="var(--signal-blue)" rx="2" opacity=".55" />
      <rect x="102" y="4" width="28" height="32" fill="var(--signal-blue)" rx="2" opacity=".7" />
      <rect x="136" y="8" width="28" height="28" fill="var(--signal-blue)" rx="2" opacity=".6" />
      <rect x="170" y="18" width="28" height="18" fill="var(--signal-blue)" rx="2" opacity=".4" />
      <rect x="204" y="0" width="28" height="36" fill="var(--signal-blue)" rx="2" opacity=".88" />
      {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab', 'Hj'].map((label, index) => (
        <text
          key={label}
          x={14 + index * 34}
          y="50"
          textAnchor="middle"
          fill={label === 'Hj' ? '#4d9de0' : '#5a5a5a'}
          fontSize="7"
          fontFamily="DM Mono"
        >
          {label}
        </text>
      ))}
    </svg>
  )
}

export function DistributionDonut() {
  return (
    <svg viewBox="0 0 110 110" width="96" height="96">
      <circle cx="55" cy="55" r="40" fill="none" stroke="#1a1a1a" strokeWidth="13" />
      <circle cx="55" cy="55" r="40" fill="none" stroke="#3ecf8e" strokeWidth="13" strokeDasharray="222 29" strokeDashoffset="63" />
      <circle cx="55" cy="55" r="40" fill="none" stroke="#4d9de0" strokeWidth="13" strokeDasharray="15 236" strokeDashoffset="-159" />
      <circle cx="55" cy="55" r="40" fill="none" stroke="#e05c5c" strokeWidth="13" strokeDasharray="14 237" strokeDashoffset="-174" />
      <circle cx="55" cy="55" r="40" fill="none" stroke="#9b7fe8" strokeWidth="13" strokeDasharray="3 248" strokeDashoffset="-188" />
      <text x="55" y="51" textAnchor="middle" fill="#f5f5f5" fontSize="17" fontWeight="300" fontFamily="Plus Jakarta Sans" letterSpacing="-1">148</text>
      <text x="55" y="63" textAnchor="middle" fill="#5a5a5a" fontSize="7" fontFamily="DM Mono" letterSpacing=".06em">JOBS</text>
    </svg>
  )
}
