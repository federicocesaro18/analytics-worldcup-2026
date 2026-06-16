// Gironi: calcola classifica da lista partite
export function calcStandings(matches) {
  const teams = {}

  for (const m of matches) {
    const partita   = (m['Partita'] ?? '').trim()
    const risultato = (m['Risultato'] ?? '').trim()
    if (!partita.includes(' - ')) continue

    const [teamA, teamB] = partita.split(' - ', 2).map(s => s.trim())
    for (const t of [teamA, teamB]) {
      if (!teams[t]) teams[t] = { G: 0, V: 0, N: 0, P: 0, GF: 0, GS: 0, Pts: 0 }
    }

    const score = risultato.match(/^(\d+)\s*[-:]\s*(\d+)/)
    if (!score) continue

    const ga = parseInt(score[1]), gb = parseInt(score[2])
    teams[teamA].G++; teams[teamB].G++
    teams[teamA].GF += ga; teams[teamA].GS += gb
    teams[teamB].GF += gb; teams[teamB].GS += ga

    if (ga > gb)      { teams[teamA].V++; teams[teamA].Pts += 3; teams[teamB].P++ }
    else if (gb > ga) { teams[teamB].V++; teams[teamB].Pts += 3; teams[teamA].P++ }
    else              { teams[teamA].N++; teams[teamA].Pts++; teams[teamB].N++; teams[teamB].Pts++ }
  }

  return Object.entries(teams)
    .map(([name, s]) => ({ Squadra: name, ...s, GD: s.GF - s.GS }))
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
}

// Bracket: parsa categoria → { roundKey, sortNum, label }
const ROUND_ORDER  = { S: 1, O: 2, Q: 3, SF: 4, Finale: 5 }
const ROUND_NAMES  = { S: 'Sedicesimi', O: 'Ottavi', Q: 'Quarti', SF: 'Semifinali', Finale: 'Finali' }
const FINALE_NAMES = { 12: 'Finale 1°-2°', 34: 'Finale 3°-4°' }

export function parseCat(cat) {
  cat = (cat ?? '').trim()

  let m = cat.match(/^[Ff]inale(\d+)$/)
  if (m) {
    const n = parseInt(m[1])
    return { roundKey: 'Finale', sortNum: n, label: FINALE_NAMES[n] ?? `Finale ${n}`, order: 5 }
  }
  for (const prefix of ['SF', 'Q', 'O', 'S']) {
    m = cat.match(new RegExp(`^${prefix}(\\d+)$`, 'i'))
    if (m) {
      const n = parseInt(m[1])
      const key = prefix.toUpperCase()
      return { roundKey: key, sortNum: n, label: `${ROUND_NAMES[key]} ${n}`, order: ROUND_ORDER[key] }
    }
  }
  return null
}

// Gestisce "2-1", "1-1 r5-3" (rigori), "1:0"
export function parseMatchScore(risultato) {
  const s = (risultato ?? '').trim()
  const m = s.match(/^(\d+)\s*[-:]\s*(\d+)(?:\s+r(\d+)-(\d+))?/i)
  if (!m) return { scoreA: null, scoreB: null, penA: null, penB: null }
  return {
    scoreA: m[1],
    scoreB: m[2],
    penA: m[3] ?? null,
    penB: m[4] ?? null,
  }
}

export { ROUND_NAMES, ROUND_ORDER }
