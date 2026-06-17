const TABS = [
  {
    id: 'scelte', label: 'Scelte',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="5" y="2" width="14" height="20" rx="2"/>
        <line x1="9" y1="8" x2="15" y2="8"/>
        <line x1="9" y1="12" x2="15" y2="12"/>
        <line x1="9" y1="16" x2="12" y2="16"/>
      </svg>
    ),
  },
  {
    id: 'classifica', label: 'Classifica',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="12" width="4" height="9"/>
        <rect x="10" y="7" width="4" height="14"/>
        <rect x="17" y="3" width="4" height="18"/>
      </svg>
    ),
  },
  {
    id: 'gironi', label: 'Gironi',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="8" height="8" rx="1"/>
        <rect x="13" y="3" width="8" height="8" rx="1"/>
        <rect x="3" y="13" width="8" height="8" rx="1"/>
        <rect x="13" y="13" width="8" height="8" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'tabellone', label: 'Bracket',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="2" y="4" width="6" height="4" rx="1"/>
        <rect x="2" y="16" width="6" height="4" rx="1"/>
        <rect x="9" y="10" width="6" height="4" rx="1"/>
        <rect x="16" y="10" width="6" height="4" rx="1"/>
        <polyline points="8,6 11,6 11,12 9,12"/>
        <polyline points="8,18 11,18 11,12"/>
        <line x1="15" y1="12" x2="16" y2="12"/>
      </svg>
    ),
  },
  {
    id: 'marcatori', label: 'Gol',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="12" cy="12" r="9"/>
        <path d="M12 3c0 0 3 4 3 9s-3 9-3 9"/>
        <path d="M3 12h18"/>
        <path d="M5.5 7.5c2 1 4 1.5 6.5 1.5s4.5-.5 6.5-1.5"/>
        <path d="M5.5 16.5c2-1 4-1.5 6.5-1.5s4.5.5 6.5 1.5"/>
      </svg>
    ),
  },
]

export default function BottomNav({ active, setActive }) {
  return (
    <nav className="bottom-nav">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`bottom-tab${active === t.id ? ' active' : ''}`}
          onClick={() => setActive(t.id)}
        >
          {t.icon}
          <span>{t.label}</span>
        </button>
      ))}
    </nav>
  )
}
