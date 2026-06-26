import { calcStandings, parseCat, parseMatchScore, isConfirmedTop2, isConfirmedEliminatedFromTop2 } from './parseData'

const ROUND_SEQUENCE = ['GIRONI', 'SEDICESIMI', 'OTTAVI', 'QUARTI', 'SEMIFINALE', 'FINALE', 'CAMPIONI']
const CAT_TO_ROUND   = { S: 'SEDICESIMI', O: 'OTTAVI', Q: 'QUARTI', SF: 'SEMIFINALE' }
const roundIdx = name => ROUND_SEQUENCE.indexOf(name)

// Builds the live tournament status from the raw "Partite" sheet rows:
// group qualification (per team) + knockout progress (furthest round, eliminations,
// champion/runner-up/3rd/4th) used to evaluate every prediction category live,
// before the organizer manually fills the final "Risultati" sheet.
export function buildLiveStatus(partiteData) {
  const empty = { groupResult: {}, groupInfo: {}, furthestRound: {}, eliminatedAt: {}, champion: null, runnerUp: null, thirdPlace: null, fourthPlace: null }
  if (!partiteData?.length) return empty

  const catCol = Object.keys(partiteData[0]).find(k => ['cat', 'categoria'].includes(k.trim().toLowerCase()))
  if (!catCol) return empty

  // ---- Gironi: qualification per team ----
  const gironi = partiteData
    .filter(r => (r[catCol] ?? '').toLowerCase().includes('girone'))
    .reduce((acc, r) => {
      const g = (r[catCol] ?? '').trim()
      if (!acc[g]) acc[g] = []
      acc[g].push(r)
      return acc
    }, {})

  const groupData    = Object.values(gironi).map(rows => calcStandings(rows))
  const allStandings = groupData.map(d => d.standings)

  const thirds = allStandings
    .filter(s => s.length >= 3 && s[2].G === 3)
    .map(s => s[2])
    .sort((a, b) => b.Pts - a.Pts || b.GD - a.GD || b.GF - a.GF)
  const top8Thirds = new Set(thirds.slice(0, 8).map(t => t.Squadra.toLowerCase()))

  const groupResult = {} // teamLower -> 'top2' | 'third_best8' | 'eliminated' | 'pending'
  const groupInfo   = {} // teamLower -> { standings, pos, h2h, finished }  (for math-confirmation checks)

  groupData.forEach(({ standings, h2h }) => {
    const finished = standings.length >= 3 && standings.every(s => s.G === 3)
    standings.forEach((s, pos) => {
      const key = s.Squadra.toLowerCase()
      groupInfo[key] = { standings, pos, h2h, finished }
      if (!finished) { groupResult[key] = 'pending'; return }
      if (pos < 2) groupResult[key] = 'top2'
      else groupResult[key] = top8Thirds.has(key) ? 'third_best8' : 'eliminated'
    })
  })

  // ---- Tabellone: furthest round reached + eliminations + final placements ----
  const furthestRound = {}
  const eliminatedAt  = {}
  let champion = null, runnerUp = null, thirdPlace = null, fourthPlace = null

  const bracketRows = partiteData
    .map(r => ({ row: r, cat: parseCat(r[catCol]) }))
    .filter(x => x.cat)

  for (const { row, cat } of bracketRows) {
    const partita = (row['Partita'] ?? '').trim()
    if (!partita.includes(' - ')) continue
    const [aRaw, bRaw] = partita.split(' - ', 2).map(s => s.trim())
    const a = aRaw.toLowerCase(), b = bRaw.toLowerCase()
    const roundName    = cat.roundKey === 'Finale' ? 'FINALE' : CAT_TO_ROUND[cat.roundKey]
    const isBronzeMatch = cat.roundKey === 'Finale' && cat.sortNum === 34

    for (const t of [a, b]) {
      if (t && t !== 'tbd') {
        if (!furthestRound[t] || roundIdx(roundName) > roundIdx(furthestRound[t])) furthestRound[t] = roundName
      }
    }

    if (a === 'tbd' || b === 'tbd' || !a || !b) continue
    const { scoreA, scoreB, penA, penB } = parseMatchScore(row['Risultato'])
    if (scoreA === null) continue

    const sA = parseInt(scoreA), sB = parseInt(scoreB)
    let aWon
    if (sA !== sB) aWon = sA > sB
    else if (penA !== null) aWon = parseInt(penA) > parseInt(penB)
    else continue // pareggio non risolto (no rigori), nessun vincitore

    const winner = aWon ? a : b, loser = aWon ? b : a

    if (isBronzeMatch) {
      thirdPlace = winner; fourthPlace = loser
    } else if (roundName === 'FINALE') {
      champion = winner; runnerUp = loser
      eliminatedAt[loser] = 'FINALE'
    } else {
      eliminatedAt[loser] = roundName
    }
  }

  return { groupResult, groupInfo, furthestRound, eliminatedAt, champion, runnerUp, thirdPlace, fourthPlace }
}

function isOutOfTop4(team, live) {
  if (live.groupResult[team] === 'eliminated') return true
  const elim = live.eliminatedAt[team]
  if (elim && roundIdx(elim) <= roundIdx('QUARTI')) return true
  return false
}

function finalFate(team, live) {
  if (live.champion === team)   return 'CHAMPION'
  if (live.runnerUp === team)   return 'RUNNERUP'
  if (live.thirdPlace === team) return 'THIRD'
  if (live.fourthPlace === team) return 'FOURTH'
  if (live.eliminatedAt[team] === 'SEMIFINALE') return 'SEMI_PENDING' // ha perso la SF, finalina ancora da giocare
  if (isOutOfTop4(team, live)) return 'OUT'
  if (live.furthestRound[team] === 'FINALE') return 'IN_FINAL' // in finale, esito non ancora deciso
  return 'ALIVE'
}

// posIndex: 0=Primo, 1=Secondo, 2=Terzo, 3=Quarto posto
export function top4Status(teamRaw, posIndex, live) {
  if (!teamRaw) return null
  const team = teamRaw.trim().toLowerCase()
  const fate = finalFate(team, live)
  const want = ['CHAMPION', 'RUNNERUP', 'THIRD', 'FOURTH'][posIndex]

  if (['CHAMPION', 'RUNNERUP', 'THIRD', 'FOURTH'].includes(fate)) return fate === want ? 'green' : 'red'
  if (fate === 'OUT') return 'red'
  if (fate === 'SEMI_PENDING') return posIndex < 2 ? 'red' : null // garantita 3a/4a, non puo' essere 1a/2a
  if (fate === 'IN_FINAL')     return posIndex >= 2 ? 'red' : null // garantita 1a/2a, non puo' essere 3a/4a
  return null
}

// "Squadra rivelazione": bonus acquisito se arriva almeno agli ottavi (poi resta valido per sempre)
export function rivelazioneStatus(teamRaw, live) {
  if (!teamRaw) return null
  const team = teamRaw.trim().toLowerCase()
  const reached = live.furthestRound[team]
  if (reached && roundIdx(reached) >= roundIdx('OTTAVI')) return 'green'
  if (live.groupResult[team] === 'eliminated') return 'red'
  if (live.eliminatedAt[team] === 'SEDICESIMI') return 'red'
  return null
}

// "Squadra delusione": bonus acquisito se NON finisce nei primi 2 del girone
// (passare come una delle migliori terze conta comunque come delusione)
export function delusioneStatus(teamRaw, live) {
  if (!teamRaw) return null
  const team = teamRaw.trim().toLowerCase()
  const info = live.groupInfo[team]
  if (!info) return null

  if (info.finished) return info.pos >= 2 ? 'green' : 'red'
  if (info.pos < 2) return isConfirmedTop2(info.standings, info.pos, info.h2h) ? 'red' : null
  return isConfirmedEliminatedFromTop2(info.standings, info.pos, info.h2h) ? 'green' : null
}

function isFullyEliminated(team, live) {
  if (live.groupResult[team] === 'eliminated') return true
  const elim = live.eliminatedAt[team]
  if (!elim) return false
  if (elim === 'SEMIFINALE') return live.thirdPlace === team || live.fourthPlace === team
  return true // SEDICESIMI / OTTAVI / QUARTI / FINALE: nessuna partita rimasta
}

// "Squadra del Capocannoniere": impossibile se la squadra non ha più partite da giocare
// e un giocatore di un'altra squadra ha già più gol del suo miglior marcatore
export function capocannoniereStatus(teamRaw, marcatoriData, live) {
  if (!teamRaw || !marcatoriData?.length) return null
  const team = teamRaw.trim().toLowerCase()
  if (!isFullyEliminated(team, live)) return null

  const bestByTeam = {}
  for (const r of marcatoriData) {
    const t = (r['Squadra'] ?? '').trim().toLowerCase()
    if (!t) continue
    const g = parseInt(r['Gol'] ?? '0') || 0
    if (!bestByTeam[t] || g > bestByTeam[t]) bestByTeam[t] = g
  }

  const teamBest = bestByTeam[team] ?? 0
  const othersMax = Math.max(0, ...Object.entries(bestByTeam).filter(([t]) => t !== team).map(([, g]) => g))
  return othersMax > teamBest ? 'red' : null
}

// "Destino dei campioni": confronta il pronostico (GIRONI/SEDICESIMI/.../CAMPIONI) con
// l'esito attuale/già determinato del percorso della squadra
export function destinoStatus(teamRaw, predictedRaw, live) {
  if (!teamRaw) return null
  const team = teamRaw.trim().toLowerCase()
  const pred = (predictedRaw ?? '').trim().toUpperCase()
  const predIdx = roundIdx(pred)
  if (predIdx === -1) return null

  if (live.champion === team) return pred === 'CAMPIONI' ? 'green' : 'red'

  const elim = live.eliminatedAt[team]
  if (elim) return pred === elim ? 'green' : 'red'

  if (live.groupResult[team] === 'eliminated') return pred === 'GIRONI' ? 'green' : 'red'

  const groupQualified = live.groupResult[team] === 'top2' || live.groupResult[team] === 'third_best8'
  const reached = live.furthestRound[team]
  const reachedIdx = reached ? roundIdx(reached) : (groupQualified ? roundIdx('SEDICESIMI') : 0)

  if (predIdx < reachedIdx) return 'red' // ha già superato quella fase da viva
  return null
}
