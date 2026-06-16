import { useSheetData } from '../hooks/useSheetData'
import { calcStandings } from '../utils/parseData'

function GroupBlock({ name, matches }) {
  const standings = calcStandings(matches)
  return (
    <div className="group-block">
      <div className="group-title">{name}</div>
      <div className="group-inner">
        <div>
          <div className="section-label">Classifica</div>
          <table>
            <thead>
              <tr>
                <th className="td-idx">#</th>
                <th>Squadra</th>
                <th className="td-num">Pts</th>
                <th className="td-num">G</th>
                <th className="td-num">V</th>
                <th className="td-num">N</th>
                <th className="td-num">P</th>
                <th className="td-num">GD</th>
              </tr>
            </thead>
            <tbody>
              {standings.map((s, i) => (
                <tr key={s.Squadra}>
                  <td className="td-idx td-num">{i + 1}</td>
                  <td>{s.Squadra}</td>
                  <td className="td-num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.Pts}</td>
                  <td className="td-num">{s.G}</td>
                  <td className="td-num">{s.V}</td>
                  <td className="td-num">{s.N}</td>
                  <td className="td-num">{s.P}</td>
                  <td className="td-num">{s.GD > 0 ? `+${s.GD}` : s.GD}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div>
          <div className="section-label">Partite</div>
          <table>
            <thead>
              <tr><th>Partita</th><th className="td-num">Risultato</th></tr>
            </thead>
            <tbody>
              {matches.map((m, i) => {
                const r = (m['Risultato'] ?? '').trim()
                return (
                  <tr key={i}>
                    <td>{(m['Partita'] ?? '').trim() || '—'}</td>
                    <td className="td-num" style={{ color: r ? 'var(--accent)' : 'var(--muted)' }}>
                      {r || '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default function Gironi() {
  const { data, loading, error, refetch } = useSheetData('Partite')

  if (loading) return <div className="loading">Caricamento...</div>
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>

  const catCol = Object.keys(data[0] ?? {}).find(k => ['cat', 'categoria'].includes(k.trim().toLowerCase()))
  const gironi = data
    .filter(r => (r[catCol] ?? '').toLowerCase().includes('girone'))
    .reduce((acc, r) => {
      const g = (r[catCol] ?? '').trim()
      if (!acc[g]) acc[g] = []
      acc[g].push(r)
      return acc
    }, {})

  const groups = Object.keys(gironi).sort()

  return (
    <div className="page">
      <div className="page-title">Risultati: fase a gironi</div>
      <button className="refresh-btn" onClick={refetch}>↻ Aggiorna</button>
      {groups.length === 0
        ? <div className="empty-box">Nessuna partita dei gironi disponibile.</div>
        : <div className="gironi-grid">
            {groups.map(g => <GroupBlock key={g} name={g} matches={gironi[g]} />)}
          </div>
      }
    </div>
  )
}
