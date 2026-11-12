import { useEffect, useState } from 'react'
import { supabase } from '../services/supabase'

let cache = null // { time, map }
let inflight = null

function fetchPrices() {
  if (cache && Date.now() - cache.time < 30000) return Promise.resolve(cache.map)
  if (inflight) return inflight
  inflight = supabase.rpc('get_public_service_prices').then(({ data, error }) => {
    inflight = null
    if (error || !data) return cache ? cache.map : {}
    const map = {}
    data.forEach((s) => {
      map[s.service_name.trim().toLowerCase()] = s
    })
    cache = { time: Date.now(), map }
    return map
  })
  return inflight
}

export function useServicePrices() {
  const [prices, setPrices] = useState(cache ? cache.map : {})

  useEffect(() => {
    let cancelled = false
    fetchPrices().then((map) => {
      if (!cancelled) setPrices(map)
    })
    return () => {
      cancelled = true
    }
  }, [])

  return prices
}