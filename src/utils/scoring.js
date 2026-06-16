export const POSITION_COLS  = ['Primo posto', 'Secondo posto', 'Terzo posto', 'Quarto posto']
export const POSITION_POINTS = { 1: 8, 2: 6, 3: 5, 4: 4 }

export const BONUS_RULES = [
  ['Squadra rivelazione',           'Squadra rivelazione',           5],
  ['Squadra delusione',             'Squadra delusione',             5],
  ['Squadra del Capocannoniere',    'Squadra del Capocannoniere',    4],
  ['Squadra del miglior giocatore', 'Squadra del miglior giocatore', 4],
  ['Squadra miglior portiere',      'Squadra miglior portiere',      4],
  ['Squadra miglior giovane',       'Squadra miglior giovane',       5],
  ['Destino dei campioni',          'Destino dei campioni',          4],
]

export const MAX_POINTS =
  Object.values(POSITION_POINTS).reduce((s, v) => s + v + 2, 0) +
  BONUS_RULES.reduce((s, r) => s + r[2], 0)

export const COL_LABELS = {
  'Primo posto':                    '1° posto',
  'Secondo posto':                  '2° posto',
  'Terzo posto':                    '3° posto',
  'Quarto posto':                   '4° posto',
  'Squadra rivelazione':            'Rivelazione',
  'Squadra delusione':              'Delusione',
  'Squadra del Capocannoniere':     'Capocannoniere',
  'Squadra del miglior giocatore':  'Miglior giocatore',
  'Squadra miglior portiere':       'Miglior portiere',
  'Squadra miglior giovane':        'Miglior giovane',
  'Destino dei campioni':           'Destino campioni',
}

export const MAX_PER_COL = Object.fromEntries([
  ...POSITION_COLS.map((c, i) => [COL_LABELS[c], POSITION_POINTS[i + 1] + 2]),
  ...BONUS_RULES.map(([rc, , pts]) => [COL_LABELS[rc], pts]),
])

function clean(v) {
  const s = (v ?? '').toString().trim()
  return s === 'nan' ? '' : s
}

export function risultatiToDict(rows) {
  const dict = {}
  for (const row of rows) {
    const cat = clean(row['Categoria'] ?? row['categoria'] ?? '')
    const ris = clean(row['Risultato'] ?? row['risultato'] ?? '')
    if (cat && ris) dict[cat] = ris
  }
  return dict
}

export function scoreParticipant(row, risultati) {
  const breakdown = []
  const actualTop4 = {}
  for (let pos = 1; pos <= 4; pos++) {
    const team = clean(risultati[POSITION_COLS[pos - 1]] ?? '')
    if (team) actualTop4[team.toLowerCase()] = pos
  }

  let total = 0

  // TOP 4
  for (let pos = 1; pos <= 4; pos++) {
    const col      = POSITION_COLS[pos - 1]
    const predicted = clean(row[col])
    const base     = POSITION_POINTS[pos]
    const actual   = clean(risultati[col] ?? '')

    if (!predicted) { breakdown.push({ col, predicted: '—', actual: actual || '?', pts: 0, note: '—' }); continue }
    if (!Object.keys(actualTop4).length) { breakdown.push({ col, predicted, actual: '—', pts: 0, note: '⏳' }); continue }

    const actualPos = actualTop4[predicted.toLowerCase()]
    if (actualPos === undefined) {
      breakdown.push({ col, predicted, actual: actual || '—', pts: 0, note: '❌' })
    } else if (actualPos === pos) {
      const pts = base + 2; total += pts
      breakdown.push({ col, predicted, actual, pts, note: '✅' })
    } else {
      const dist = Math.abs(pos - actualPos)
      const pts  = base - dist; total += pts
      breakdown.push({ col, predicted, actual, pts, note: `〰️ dist.${dist}` })
    }
  }

  // BONUS
  for (const [respCol, risKey, maxPts] of BONUS_RULES) {
    const predicted = clean(row[respCol])
    const actual    = clean(risultati[risKey] ?? '')

    if (!predicted) { breakdown.push({ col: respCol, predicted: '—', actual: actual || '?', pts: 0, note: '—' }); continue }
    if (!actual)    { breakdown.push({ col: respCol, predicted, actual: '—', pts: 0, note: '⏳' }); continue }

    if (predicted.toLowerCase() === actual.toLowerCase()) {
      total += maxPts
      breakdown.push({ col: respCol, predicted, actual, pts: maxPts, note: '✅' })
    } else {
      breakdown.push({ col: respCol, predicted, actual, pts: 0, note: '❌' })
    }
  }

  return { total, breakdown }
}
