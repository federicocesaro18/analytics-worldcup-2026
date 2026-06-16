const TABS = [
  { id: 'scelte',    label: 'Risposte Fanta Mondiale' },
  { id: 'gironi',    label: 'Fase a Gironi' },
  { id: 'tabellone', label: 'Fase a Eliminazione' },
  { id: 'classifica',label: 'Classifica Generale' },
  { id: 'marcatori', label: 'Classifica Marcatori' },
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
