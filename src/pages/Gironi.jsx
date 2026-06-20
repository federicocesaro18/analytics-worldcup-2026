import { useMemo } from 'react'
import { useSheetData } from '../hooks/useSheetData'
import { calcStandings } from '../utils/parseData'

// Returns true if `other` could end up ranked above `team` assuming they tie on points.
// Uses H2H as first tiebreaker (already decided if match played).
// Falls back to "could rank above" if H2H is fully tied and GD can still change.
function otherCouldRankAbove(team, other, h2h) {
  const tH = h2h[team.Squadra]?.[other.Squadra]
  const oH = h2h[other.Squadra]?.[team.Squadra]
  if (!tH || !oH) return true // H2H not played yet → uncertain

  if (oH.pts !== tH.pts) return oH.pts > tH.pts
  const oHGD = oH.gf - oH.gs, tHGD = tH.gf - tH.gs
  if (oHGD !== tHGD) return oHGD > tHGD
  if (oH.gf !== tH.gf) return oH.gf > tH.gf

  // H2H fully tied → fall back to overall GD/GF
  // If both teams finished, the ranking is already fixed; otherwise it could change
  if (team.G === 3 && other.G === 3) {
    if (other.GD !== team.GD) return other.GD > team.GD
    return other.GF > team.GF
  }
  return true // GD can still change → conservative: assume could rank above
}

// Team at `pos` is confirmed top 2 if fewer than 2 other teams could end up above it.
// "Could end up above" = can reach strictly more points OR can tie on points AND win tiebreakers.
function isConfirmedTop2(standings, pos, h2h) {
  const team = standings[pos]
  let canBeatCount = 0
  for (let i = 0; i < standings.length; i++) {
    if (i === pos) continue
    const other = standings[i]
    const maxPts = other.Pts + 3 * (3 - other.G)
    if (maxPts > team.Pts) {
      canBeatCount++
    } else if (maxPts === team.Pts && otherCouldRankAbove(team, other, h2h)) {
      canBeatCount++
    }
    if (canBeatCount >= 2) return false
  }
  return true
}

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
