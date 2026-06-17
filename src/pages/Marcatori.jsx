import { useSheetData } from '../hooks/useSheetData'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Marcatori() {
  const { data, loading, error, refetch } = useSheetData('Marcatori')

  if (loading) return <div className="loading">Caricamento...</div>
  if (error)   return <div className="page"><div className="error-box">{error}</div></div>

  const golCol    = Object.keys(data[0] ?? {}).find(k => k.trim().toLowerCase() === 'gol')
  const giocCol   = Object.keys(data[0] ?? {}).find(k => k.trim().toLowerCase() === 'giocatore')
  const squadraCol = Object.keys(data[0] ?? {}).find(k => k.trim().toLowerCase() === 'squadra')

  const sorted = [...data]
    .map(r => ({
      label: `${(r[giocCol] ?? '').trim()} (${(r[squadraCol] ?? '').trim()})`,
      giocatore: (r[giocCol] ?? '').trim(),
      squadra:   (r[squadraCol] ?? '').trim(),
      gol:       parseInt(r[golCol] ?? '0') || 0,
    }))
    .filter(r => r.gol > 0)
    .sort((a, b) => b.gol - a.gol)

  const top10 = [...sorted].slice(0, 10)

  if (sorted.length === 0) return (
    <div className="page">
      <div className="page-title">Classifica Marcatori</div>
      <div className="empty-box">Nessun marcatore disponibile.</div>
    </div>
  )

  return (
    <div className="page">
      <div className="page-title">Classifica Marcatori</div>
      <button className="refresh-btn" onClick={refetch}>↻ Aggiorna</button>

      <div className="chart-wrap">
        <div className="section-label" style={{ marginBottom: 14 }}>Top 10</div>
        <ResponsiveContainer width="100%" height={340}>
          <BarChart data={top10} layout="vertical" margin={{ left: 8, right: 40, top: 0, bottom: 0 }}>
            <XAxis type="number" allowDecimals={false} tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category" dataKey="label" width={210}
              tick={{ fill: '#f0f0f0', fontSize: 13 }} axisLine={false} tickLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgba(66,133,244,0.08)' }}
              contentStyle={{ background: '#2d2d2d', border: '1px solid #3d3d3d', borderRadius: 6, color: '#f0f0f0' }}
              formatter={(v) => [v, 'Gol']}
            />
            <Bar dataKey="gol" radius={[0, 4, 4, 0]} label={{ position: 'right', fill: '#f0f0f0', fontSize: 13 }}>
              {top10.map((_, i) => (
                <Cell key={i} fill={i === top10.length - 1 ? '#1a73e8' : '#4285f4'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="section-label" style={{ marginBottom: 8 }}>Classifica completa</div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th className="td-idx">#</th>
              <th>Giocatore</th>
              <th>Squadra</th>
              <th className="td-num">Gol</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((r, i) => (
              <tr key={i}>
                <td className="td-idx td-num">{i + 1}</td>
                <td style={{ fontWeight: 600 }}>{r.giocatore}</td>
                <td style={{ color: 'var(--muted)' }}>{r.squadra}</td>
                <td className="td-num" style={{ color: 'var(--accent)', fontWeight: 700 }}>{r.gol}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
