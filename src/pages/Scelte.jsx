import { useSheetData } from '../hooks/useSheetData'
import { risultatiToDict, POSITION_COLS, BONUS_RULES } from '../utils/scoring'

const PRED_COLS = [
  'Primo posto', 'Secondo posto', 'Terzo posto', 'Quarto posto',
  'Squadra rivelazione', 'Squadra delusione',
  'Squadra del Capocannoniere', 'Squadra del miglior giocatore',
  'Squadra miglior portiere', 'Squadra miglior giovane',
  'Destino dei campioni',
]

const DISPLAY_LABELS = {
  'Primo posto': '1° posto', 'Secondo posto': '2° posto',
  'Terzo posto': '3° posto', 'Quarto posto': '4° posto',
  'Squadra rivelazione': 'Rivelazione', 'Squadra delusione': 'Delusione',
  'Squadra del Capocannoniere': 'Capocannoniere',
  'Squadra del miglior giocatore': 'Miglior giocatore',
  'Squadra miglior portiere': 'Miglior portiere',
  'Squadra miglior giovane': 'Miglior giovane',
  'Destino dei campioni': 'Destino campioni',
}

function teamClass(value, col, risultati) {
  if (!value || !Object.keys(risultati).length) return ''
  const v = value.toLowerCase()
  if (POSITION_COLS.includes(col)) {
    const pos = POSITION_COLS.indexOf(col) + 1
    const actualTop4 = {}
    POSITION_COLS.forEach((c, i) => {
      const t = (risultati[c] ?? '').toLowerCase()
      if (t) actualTop4[t] = i + 1
    })
    const actualPos = actualTop4[v]
    if (actualPos === undefined) return 'pts-zero'
    if (actualPos === pos) return 'pts-max'
    return 'pts-part'
  }
  const risKey = BONUS_RULES.find(r => r[0] === col)?.[1]
  if (!risKey) return ''
  const actual = (risultati[risKey] ?? '').toLowerCase()
  if (!actual) return ''
  return v === actual ? 'pts-max' : 'pts-zero'
}

export default function Scelte() {
  const { data, loading, error, refetch } = useSheetData('Risposte')
  const { data: risData } = useSheetData('Risultati')
  const risultati = risultatiToDict(risData)

  if (loading) return <div className="loading">Caricamento...</div>
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>

  return (
    <div className="page">
      <div className="page-title">Risposte Fanta Mondiale</div>
      <button className="refresh-btn" onClick={refetch}>↻ Aggiorna</button>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="td-idx">#</th>
              <th>Nome</th>
              {PRED_COLS.filter(c => data[0]?.[c] !== undefined).map(c => (
                <th key={c}>{DISPLAY_LABELS[c] ?? c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <td className="td-idx td-num">{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{row['Nome']} {row['Cognome']}</td>
                {PRED_COLS.filter(c => data[0]?.[c] !== undefined).map(c => {
                  const val = (row[c] ?? '').trim()
                  const cls = teamClass(val, c, risultati)
                  return <td key={c} className={cls}>{val || '—'}</td>
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="caption">
        Partecipanti: {data.length}
        {Object.keys(risultati).length > 0
          ? ' · 🟢 Corretto  🟠 Parziale  🔴 Sbagliato'
          : ' · I colori si attivano quando i risultati saranno inseriti'}
      </p>
    </div>
  )
}
