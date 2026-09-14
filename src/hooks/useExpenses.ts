import { useCallback, useEffect, useState } from 'react'
import { getBudgetCategories, getExpenses } from '../lib/api'
import { createDemoExpenses, demoCategories } from '../lib/demoData'
import type { BudgetCategory, Expense } from '../lib/types'

export function useExpenses() {
  const demoMode = import.meta.env.DEV && import.meta.env.VITE_DEMO_MODE === 'true'
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<BudgetCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null)
  const [requestId, setRequestId] = useState(0)

  const reload = useCallback(() => setRequestId((id) => id + 1), [])

  useEffect(() => {
    let cancelled = false

    async function fetchAll() {
      setLoading(true)
      setError(null)

      if (demoMode) {
        setExpenses(createDemoExpenses())
        setCategories(demoCategories)
        setLastUpdatedAt(new Date())
        setLoading(false)
        return
      }

      try {
        const [all, categoryData] = await Promise.all([getExpenses(), getBudgetCategories()])
        if (!cancelled) {
          setExpenses(all)
          setCategories(categoryData)
          setLastUpdatedAt(new Date())
          setLoading(false)
        }
      } catch (fetchError) {
        if (!cancelled) {
          setError(fetchError instanceof Error ? fetchError.message : 'データを読み込めませんでした。')
          setLoading(false)
        }
      }
    }

    fetchAll()
    return () => {
      cancelled = true
    }
  }, [demoMode, requestId])

  return { expenses, categories, loading, error, lastUpdatedAt, reload, demoMode }
}
