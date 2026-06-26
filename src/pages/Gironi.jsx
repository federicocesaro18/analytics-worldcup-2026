import { useMemo } from 'react'
import { useSheetData } from '../hooks/useSheetData'
import { calcStandings, isConfirmedTop2 } from '../utils/parseData'

function GroupBlock({ name, matches, standings, h2h, top8Thirds }) {
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
              {standings.map((s, i) => {
                const confirmed = i < 2 && isConfirmedTop2(standings, i, h2h)
                const bestThird = i === 2 && top8Thirds.has(s.Squadra)
                const rowClass = confirmed ? 'row-qualified' : bestThird ? 'row-third' : ''
                return (
                  <tr key={s.Squadra} className={rowClass}>
                    <td className="td-idx td-num">{i + 1}</td>
                    <td>{s.Squadra}</td>
                    <td className="td-num" style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.Pts}</td>
                    <td className="td-num">{s.G}</td>
                    <td className="td-num">{s.V}</td>
                    <td className="td-num">{s.N}</td>
                    <td className="td-num">{s.P}</td>
                    <td className="td-num">{s.GD > 0 ? `+${s.GD}` : s.GD}</td>
                  </tr>
                )
              })}
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

  const { gironi, groups, allStandings, allH2H, top8Thirds } = useMemo(() => {
    if (!data.length) return { gironi: {}, groups: [], allStandings: [], allH2H: [], top8Thirds: new Set() }

    const catCol = Object.keys(data[0]).find(k => ['cat', 'categoria'].includes(k.trim().toLowerCase()))
    const gironi = data
      .filter(r => (r[catCol] ?? '').toLowerCase().includes('girone'))
      .reduce((acc, r) => {
        const g = (r[catCol] ?? '').trim()
        if (!acc[g]) acc[g] = []
        acc[g].push(r)
        return acc
      }, {})

    const groups = Object.keys(gironi).sort()
    const allData = groups.map(g => calcStandings(gironi[g]))
    const allStandings = allData.map(d => d.standings)
    const allH2H = allData.map(d => d.h2h)

    // Best 8 thirds: only consider teams that have finished all 3 group matches
    const thirds = allStandings
      .filter(s => s.length >= 3 && s[2].G === 3)
      .map(s => s[2])
      .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
    const top8Thirds = new Set(thirds.slice(0, 8).map(t => t.Squadra))

    return { gironi, groups, allStandings, allH2H, top8Thirds }
  }, [data])

  if (loading) return <div className="loading">Caricamento...</div>
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>

  return (
    <div className="page">
      <div className="page-title">Risultati: fase a gironi</div>
      <button className="refresh-btn" onClick={refetch}>↻ Aggiorna</button>
      {groups.length === 0
        ? <div className="empty-box">Nessuna partita dei gironi disponibile.</div>
        : <>
            <div className="gironi-grid">
              {groups.map((g, i) => (
                <GroupBlock
                  key={g}
                  name={g}
                  matches={gironi[g]}
                  standings={allStandings[i]}
                  h2h={allH2H[i]}
                  top8Thirds={top8Thirds}
                />
              ))}
            </div>
            <p className="caption">🟢 Qualificata matematicamente · 🟡 Attualmente tra le migliori 8 terze (provvisorio)</p>
          </>
      }
    </div>
  )
}
