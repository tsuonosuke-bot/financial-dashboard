import { useMemo } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
}

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

const COLORS = [
  '#4f46e5',
  '#06b6d4',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#0ea5e9',
]

export function CategoryPieChart({ expenses }: Props) {
  const data = useMemo(() => {
    const totals = new Map<string, number>()
    for (const e of expenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + Number(e.amount))
    }
    return Array.from(totals.entries())
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
  }, [expenses])

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">カテゴリ別支出割合</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            dataKey="total"
            nameKey="category"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={(entry) => (entry as unknown as { category: string }).category}
          >
            {data.map((entry, i) => (
              <Cell key={entry.category} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(v) => yen.format(Number(v))} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
