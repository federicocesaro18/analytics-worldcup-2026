// Gironi: calcola classifica da lista partite (con scontri diretti come 2° criterio)
export function calcStandings(matches) {
  const teams = {}
  const h2h = {}  // h2h[a][b] = { pts, gf, gs } per le partite A vs B

  for (const m of matches) {
    const partita   = (m['Partita'] ?? '').trim()
    const risultato = (m['Risultato'] ?? '').trim()
    if (!partita.includes(' - ')) continue

    const [teamA, teamB] = partita.split(' - ', 2).map(s => s.trim())
    for (const t of [teamA, teamB]) {
      if (!teams[t]) teams[t] = { G: 0, V: 0, N: 0, P: 0, GF: 0, GS: 0, Pts: 0 }
      if (!h2h[t]) h2h[t] = {}
    }

    const score = risultato.match(/^(\d+)\s*[-:]\s*(\d+)/)
    if (!score) continue

    const ga = parseInt(score[1]), gb = parseInt(score[2])
    teams[teamA].G++; teams[teamB].G++
    teams[teamA].GF += ga; teams[teamA].GS += gb
    teams[teamB].GF += gb; teams[teamB].GS += ga

    if (!h2h[teamA][teamB]) h2h[teamA][teamB] = { pts: 0, gf: 0, gs: 0 }
    if (!h2h[teamB][teamA]) h2h[teamB][teamA] = { pts: 0, gf: 0, gs: 0 }
    h2h[teamA][teamB].gf += ga; h2h[teamA][teamB].gs += gb
    h2h[teamB][teamA].gf += gb; h2h[teamB][teamA].gs += ga

    if (ga > gb) {
      teams[teamA].V++; teams[teamA].Pts += 3; teams[teamB].P++
      h2h[teamA][teamB].pts += 3
    } else if (gb > ga) {
      teams[teamB].V++; teams[teamB].Pts += 3; teams[teamA].P++
      h2h[teamB][teamA].pts += 3
    } else {
      teams[teamA].N++; teams[teamA].Pts++; teams[teamB].N++; teams[teamB].Pts++
      h2h[teamA][teamB].pts++; h2h[teamB][teamA].pts++
    }
  }

  // Ordine: Pts → H2H Pts → H2H GD → H2H GF → GD totale → GF totale
  const entries = Object.entries(teams)
    .map(([name, s]) => ({ Squadra: name, ...s, GD: s.GF - s.GS }))
    .sort((a, b) => b.Pts - a.Pts)

  const result = []
  let i = 0
  while (i < entries.length) {
    const pts = entries[i].Pts
    let j = i
    while (j < entries.length && entries[j].Pts === pts) j++
    const group = entries.slice(i, j)

    if (group.length > 1) {
      const names = new Set(group.map(t => t.Squadra))
      const gh2h = {}
      for (const t of group) {
        gh2h[t.Squadra] = { pts: 0, gf: 0, gs: 0 }
        for (const opp of names) {
          if (opp === t.Squadra) continue
          const r = h2h[t.Squadra]?.[opp]
          if (r) { gh2h[t.Squadra].pts += r.pts; gh2h[t.Squadra].gf += r.gf; gh2h[t.Squadra].gs += r.gs }
        }
      }
      group.sort((a, b) => {
        const ah = gh2h[a.Squadra], bh = gh2h[b.Squadra]
        return (bh.pts - ah.pts) ||
               ((bh.gf - bh.gs) - (ah.gf - ah.gs)) ||
               (bh.gf - ah.gf) ||
               (b.GD - a.GD) ||
               (b.GF - a.GF)
      })
    }

    result.push(...group)
    i = j
  }

  return { standings: result, h2h }
}

// Returns true if `other` could end up ranked above `team` assuming they tie on points.
// Uses H2H as first tiebreaker (already decided if match played).
// Falls back to "could rank above" if H2H is fully tied and GD can still change.
export function otherCouldRankAbove(team, other, h2h) {
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
export function isConfirmedTop2(standings, pos, h2h) {
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

// Symmetric to isConfirmedTop2: team at `pos` is confirmed OUT of top 2 if at least
// 2 other teams already have more points than this team could ever reach (or tie
// it and would win the tiebreaker). Points only ever go up, so this is permanent.
export function isConfirmedEliminatedFromTop2(standings, pos, h2h) {
  const team = standings[pos]
  const teamMaxPts = team.Pts + 3 * (3 - team.G)
  let aboveCount = 0
  for (let i = 0; i < standings.length; i++) {
    if (i === pos) continue
    const other = standings[i]
    if (other.Pts > teamMaxPts) {
      aboveCount++
    } else if (other.Pts === teamMaxPts && otherCouldRankAbove(team, other, h2h)) {
      aboveCount++
    }
    if (aboveCount >= 2) return true
  }
  return false
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
