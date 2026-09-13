import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
}

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export function MonthlyTrendChart({ expenses }: Props) {
  const data = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of expenses) {
      const key = e.transaction_date.slice(0, 7)
      totals.set(key, (totals.get(key) ?? 0) + Number(e.amount))
    }
    return Array.from(totals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, total]) => ({ month, total }))
  }, [expenses])

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">月別支出推移</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `${Math.round(v / 1000)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(v) => yen.format(Number(v))} />
          <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
