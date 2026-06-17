import { useMemo } from 'react'
import { useSheetData } from '../hooks/useSheetData'
import { useIsMobile } from '../hooks/useIsMobile'
import { parseCat, parseMatchScore, ROUND_NAMES } from '../utils/parseData'

// ─── layout constants ────────────────────────────────────────────────────────
const SLOT_H   = 82    // px – slot height in the densest round (R32)
const COL_W    = 174   // px – match card width
const CONN_W   = 20    // px – horizontal connector width
const LINE_CLR = '#3a3a3a'

// ─── small sub-components ────────────────────────────────────────────────────
function TeamRow({ name, score, pen, won, played }) {
  const color = !played ? '#bbb' : won ? '#e8e8e8' : '#aaa'
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 8px', gap:4 }}>
      <span style={{ color, fontSize:13, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontWeight: won ? 700 : 400, maxWidth:118 }}>
        {name || 'TBD'}
      </span>
      {played && (
        <span style={{ display:'flex', alignItems:'baseline', gap:3, flexShrink:0 }}>
          <span style={{ color:'#4285f4', fontWeight:700, fontSize:13 }}>{score}</span>
          {pen !== null && (
            <span style={{ color: won ? '#f0b429' : '#666', fontSize:10, fontWeight:600 }}>({pen})</span>
          )}
        </span>
      )}
    </div>
  )
}

function MatchCard({ match }) {
  if (!match) return (
    <div style={{ width:COL_W, background:'#252525', borderRadius:6, border:'1px solid #333', padding:'10px 8px', color:'#444', fontSize:12, textAlign:'center' }}>
      TBD
    </div>
  )
  const { label, teamA, teamB, scoreA, scoreB, penA, penB } = match
  const played = scoreA !== null && scoreA !== undefined && scoreA !== ''
  const sA = parseInt(scoreA), sB = parseInt(scoreB)
  const pA = penA !== null ? parseInt(penA) : null
  const pB = penB !== null ? parseInt(penB) : null
  // rigori decidono il vincitore se i tempi regolamentari sono pari
  const wonA = played && (sA > sB || (sA === sB && pA !== null && pA > pB))
  const wonB = played && (sB > sA || (sB === sA && pB !== null && pB > pA))
  return (
    <div style={{ width:COL_W, background:'#2d2d2d', borderRadius:6, borderLeft:`3px solid ${played ? '#4285f4' : '#444'}`, overflow:'hidden' }}>
      <div style={{ fontSize:10, color:'#555', padding:'4px 8px 0', letterSpacing:'.3px' }}>{label}</div>
      <TeamRow name={teamA} score={scoreA} pen={penA} won={wonA} played={played} />
      <div style={{ height:1, background:'#3d3d3d', margin:'0 8px' }} />
      <TeamRow name={teamB} score={scoreB} pen={penB} won={wonB} played={played} />
    </div>
  )
}

// ─── one column of the bracket ───────────────────────────────────────────────
// side: 'left' | 'right'
// connector drawn on right (left side) or left (right side) of card
// isInner: if true, no connector drawn (SF → Final edge)
function BracketCol({ round, baseSlots, side, isInner }) {
  const n          = round.matches.length
  const slotsEach  = baseSlots / n        // how many base-slots this match occupies
  const slotH      = SLOT_H * slotsEach   // actual px height per slot

  const connSide   = side === 'left' ? 'right' : 'left'

  return (
    <div style={{ display:'flex', flexDirection:'column' }}>
      {/* column title */}
      <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:8, width: COL_W + (isInner ? 0 : CONN_W), textAlign: side === 'right' ? 'right' : 'left' }}>
        {round.name}
      </div>

      {/* slots */}
      {round.matches.map((match, i) => {
        const isTopOfPair = i % 2 === 0
        const hasPair     = isTopOfPair && (i + 1 < n)

        return (
          <div key={i} style={{ height:slotH, position:'relative', display:'flex', alignItems:'center', width: COL_W + (isInner ? 0 : CONN_W) }}>

            {/* spacer on left for right-side connectors */}
            {side === 'right' && !isInner && <div style={{ width:CONN_W, flexShrink:0 }} />}

            {/* match card */}
            <MatchCard match={match} />

            {/* spacer on right for left-side connectors */}
            {side === 'left' && !isInner && <div style={{ width:CONN_W, flexShrink:0 }} />}

            {/* horizontal connector */}
            {!isInner && (
              <div style={{ position:'absolute', [connSide]:0, top:'50%', width:CONN_W, height:2, background:LINE_CLR, transform:'translateY(-1px)' }} />
            )}

            {/* vertical connector between top and bottom of a pair */}
            {!isInner && hasPair && (
              <div style={{ position:'absolute', [connSide]:0, top:'50%', height:'100%', width:2, background:LINE_CLR }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── center: Final + Bronze ───────────────────────────────────────────────────
function CenterCol({ finale12, finale34, baseSlots }) {
  const totalH = SLOT_H * baseSlots
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight: totalH + 28, gap:24, padding:'0 8px' }}>
      <div>
        <div style={{ fontSize:11, color:'#4285f4', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:700, marginBottom:8, textAlign:'center' }}>Finale</div>
        <MatchCard match={finale12} />
      </div>
      <div>
        <div style={{ fontSize:11, color:'#555', textTransform:'uppercase', letterSpacing:'.5px', fontWeight:600, marginBottom:8, textAlign:'center' }}>3°-4° posto</div>
        <MatchCard match={finale34} />
      </div>
    </div>
  )
}

// ─── mobile: lista per round ──────────────────────────────────────────────────
function MobileTabellone({ rounds, finale12, finale34, refetch }) {
  const ROUND_KEYS = ['S', 'O', 'Q', 'SF']
  const sections = []
  for (const key of ROUND_KEYS) {
    const matches = rounds[key]
    if (matches?.length) sections.push({ name: ROUND_NAMES[key], matches, key })
  }
  if (finale12 || finale34) {
    sections.push({
      name: 'Finali',
      matches: [finale12, finale34].filter(Boolean),
      key: 'Finale',
    })
  }

  return (
    <div className="page">
      <div className="page-title">Fase a eliminazione</div>
      <button className="refresh-btn" onClick={refetch}>↻ Aggiorna</button>
      {sections.map(section => (
        <div key={section.key} className="mobile-round-section">
          <div className="mobile-round-title">{section.name}</div>
          {section.matches.map((match, i) => (
            <div key={i} className="mobile-match-wrap">
              <MatchCard match={match} />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── main component ───────────────────────────────────────────────────────────
export default function Tabellone() {
  const { data, loading, error, refetch } = useSheetData('Partite')
  const isMobile = useIsMobile()

  const bracket = useMemo(() => {
    if (!data.length) return null

    const catCol = Object.keys(data[0]).find(k => ['cat','categoria'].includes(k.trim().toLowerCase()))
    const rounds = {}

    for (const row of data) {
      const cat = (row[catCol] ?? '').trim()
      if (cat.toLowerCase().includes('girone')) continue
      const parsed = parseCat(cat)
      if (!parsed) continue

      const partita = (row['Partita'] ?? '').trim()
      let teamA = '', teamB = ''
      if (partita.includes(' - ')) [teamA, teamB] = partita.split(' - ', 2).map(s => s.trim())
      const { scoreA, scoreB, penA, penB } = parseMatchScore(row['Risultato'])

      rounds[parsed.roundKey] = rounds[parsed.roundKey] ?? []
      rounds[parsed.roundKey].push({ ...parsed, teamA, teamB, scoreA, scoreB, penA, penB })
    }

    for (const k of Object.keys(rounds)) {
      rounds[k].sort((a, b) => a.sortNum - b.sortNum)
    }

    // split into left/right halves (first half of each round → left, second → right)
    const half = (arr) => {
      const mid = Math.ceil(arr.length / 2)
      return [arr.slice(0, mid), arr.slice(mid)]
    }

    const [sL, sR]   = half(rounds.S  ?? [])
    const [oL, oR]   = half(rounds.O  ?? [])
    const [qL, qR]   = half(rounds.Q  ?? [])
    const [sfL, sfR] = half(rounds.SF ?? [])

    const leftRounds  = []
    const rightRounds = []

    if (sL.length)  leftRounds.push({ name:'Sedicesimi', matches:sL, key:'S-L' })
    if (oL.length)  leftRounds.push({ name:'Ottavi',     matches:oL, key:'O-L' })
    if (qL.length)  leftRounds.push({ name:'Quarti',     matches:qL, key:'Q-L' })
    if (sfL.length) leftRounds.push({ name:'Semifinali', matches:sfL,key:'SF-L' })

    // right side is stored outside→inside but rendered inside→outside
    if (sfR.length) rightRounds.push({ name:'Semifinali', matches:sfR,key:'SF-R' })
    if (qR.length)  rightRounds.push({ name:'Quarti',     matches:qR, key:'Q-R' })
    if (oR.length)  rightRounds.push({ name:'Ottavi',     matches:oR, key:'O-R' })
    if (sR.length)  rightRounds.push({ name:'Sedicesimi', matches:sR, key:'S-R' })

    const finaleMatches = rounds.Finale ?? []
    const finale12 = finaleMatches.find(m => m.sortNum === 12) ?? null
    const finale34 = finaleMatches.find(m => m.sortNum === 34) ?? null

    // base slots = number of matches in the outermost round (densest)
    const outerCount = Math.max(sL.length || 0, oL.length || 0, qL.length || 0, sfL.length || 1)
    const baseSlots  = outerCount

    return { leftRounds, rightRounds, finale12, finale34, baseSlots, rounds }
  }, [data])

  if (loading) return <div className="loading">Caricamento...</div>
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>
  if (!bracket || (!bracket.leftRounds.length && !bracket.rightRounds.length)) {
    return (
      <div className="page">
        <div className="page-title">Risultati: fase a eliminazione</div>
        <div className="empty-box">Nessuna partita a eliminazione diretta disponibile.</div>
      </div>
    )
  }

  const { leftRounds, rightRounds, finale12, finale34, baseSlots, rounds } = bracket

  if (isMobile) {
    return <MobileTabellone rounds={rounds} finale12={finale12} finale34={finale34} refetch={refetch} />
  }

  return (
    <div className="page">
      <div className="page-title">Risultati: fase a eliminazione</div>
      <button className="refresh-btn" onClick={refetch}>↻ Aggiorna</button>

      <div style={{ overflowX:'auto', paddingBottom:16 }}>
        <div style={{ display:'inline-flex', alignItems:'flex-start', gap:0 }}>

          {/* Left half: R32 → SF */}
          {leftRounds.map((round, i) => (
            <BracketCol
              key={round.key}
              round={round}
              baseSlots={baseSlots}
              side="left"
              isInner={i === leftRounds.length - 1}
            />
          ))}

          {/* Center: Final + Bronze */}
          <CenterCol finale12={finale12} finale34={finale34} baseSlots={baseSlots} />

          {/* Right half: SF → R32 */}
          {rightRounds.map((round, i) => (
            <BracketCol
              key={round.key}
              round={round}
              baseSlots={baseSlots}
              side="right"
              isInner={i === 0}
            />
          ))}

        </div>
      </div>
    </div>
  )
}
