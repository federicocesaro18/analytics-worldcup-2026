const TABS = [
  { id: 'classifica', label: 'Classifica Generale' },
  { id: 'gironi',     label: 'Fase a Gironi' },
  { id: 'tabellone',  label: 'Fase a Eliminazione' },
  { id: 'marcatori',  label: 'Classifica Marcatori' },
  { id: 'scelte',     label: 'Risposte Fanta Mondiale' },
]

export default function Navbar({ active, setActive }) {
  return (
    <nav className="navbar">
      {TABS.map(t => (
        <button
          key={t.id}
          className={`nav-tab${active === t.id ? ' active' : ''}`}
          onClick={() => setActive(t.id)}
        >
          {t.label}
        </button>
      ))}
    </nav>
  )
}
