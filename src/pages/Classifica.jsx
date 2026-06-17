import { useSheetData } from '../hooks/useSheetData'
import {
  risultatiToDict, scoreParticipant,
  MAX_POINTS, MAX_PER_COL, COL_LABELS, POSITION_COLS, BONUS_RULES,
} from '../utils/scoring'

const ALL_COLS = [...POSITION_COLS, ...BONUS_RULES.map(r => r[0])]

function ptsClass(pts, col, hasResults) {
  if (!hasResults) return 'pts-wait'
  if (pts === 0) return 'pts-zero'
  const max = MAX_PER_COL[COL_LABELS[col]]
  return pts >= max ? 'pts-max' : 'pts-part'
}

function totalClass(pts) {
  if (pts === 0) return 'pts-wait'
  const pct = pts / MAX_POINTS
  if (pct >= 0.6) return 'pts-max'
  if (pct >= 0.3) return 'pts-part'
  return 'pts-zero'
}

export default function Classifica() {
  const { data: risposte, loading, error, refetch } = useSheetData('Risposte')
  const { data: risData } = useSheetData('Risultati')
  const risultati = risultatiToDict(risData)
  const hasResults = Object.keys(risultati).length > 0

  if (loading) return <div className="loading">Caricamento...</div>
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>

  const rows = risposte
    .map(row => {
      const nome = `${(row['Nome'] ?? '').trim()} ${(row['Cognome'] ?? '').trim()}`.trim()
      const { total, breakdown } = scoreParticipant(row, risultati)
      const pts = Object.fromEntries(breakdown.map(b => [b.col, b.pts]))
      return { nome, total, pts }
    })
    .sort((a, b) => b.total - a.total)

  return (
    <div className="page">
      <div className="page-title">Classifica generale</div>
      <button className="refresh-btn" onClick={refetch}>↻ Aggiorna</button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="td-idx">#</th>
              <th>Nome</th>
              <th className="td-num">Totale</th>
              {ALL_COLS.map(c => <th key={c} className="td-num">{COL_LABELS[c]}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rankClass = i === 0 ? 'rank-gold' : i === 1 ? 'rank-silver' : i === 2 ? 'rank-bronze' : ''
              return (
              <tr key={r.nome} className={rankClass}>
                <td className="td-idx td-num">{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{r.nome}</td>
                <td className={`td-num totale-col ${totalClass(r.total)}`}>{r.total}</td>
                {ALL_COLS.map(c => (
                  <td key={c} className={`td-num ${ptsClass(r.pts[c] ?? 0, c, hasResults)}`}>
                    {r.pts[c] ?? 0}
                  </td>
                ))}
              </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      <p className="caption">
        Punteggio massimo: <strong>{MAX_POINTS} pt</strong>
        {' · '}
        {hasResults ? '🟢 Max  🟠 Parziale  🔴 Zero' : '⏳ In attesa dei risultati'}
      </p>
    </div>
  )
}
