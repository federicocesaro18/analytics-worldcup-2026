import { useState, useEffect, useCallback } from 'react'
import Papa from 'papaparse'

const SHEET_ID = '1ZsHBl8suoicCagbai4l0-UGku40HUklC5VDtkccaTds'
const TTL = 120_000 // 2 minutes

const cache = {}

function sheetUrl(name) {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(name)}`
}

export function useSheetData(sheetName) {
  const [data, setData]     = useState(cache[sheetName]?.data ?? [])
  const [loading, setLoading] = useState(!cache[sheetName])
  const [error, setError]   = useState(null)

  const fetch_ = useCallback(async (force = false) => {
    const cached = cache[sheetName]
    if (!force && cached && Date.now() - cached.ts < TTL) {
      setData(cached.data)
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const res  = await fetch(sheetUrl(sheetName))
      const text = await res.text()
      const { data: rows } = Papa.parse(text, { header: true, skipEmptyLines: true })
      const clean = rows.filter(r => Object.values(r).some(v => v?.trim()))
      cache[sheetName] = { data: clean, ts: Date.now() }
      setData(clean)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [sheetName])

  useEffect(() => { fetch_() }, [fetch_])

  return { data, loading, error, refetch: () => fetch_(true) }
}
