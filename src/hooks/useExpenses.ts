import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Expense } from '../lib/types'

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      setError(null)

      const pageSize = 1000
      let from = 0
      const all: Expense[] = []

      while (true) {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('transaction_date', { ascending: false })
          .range(from, from + pageSize - 1)

        if (error) {
          if (!cancelled) setError(error.message)
          break
        }
        if (!data || data.length === 0) break

        all.push(...(data as Expense[]))
        if (data.length < pageSize) break
        from += pageSize
      }

      if (!cancelled) {
        setExpenses(all)
        setLoading(false)
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [])

  return { expenses, loading, error }
}
