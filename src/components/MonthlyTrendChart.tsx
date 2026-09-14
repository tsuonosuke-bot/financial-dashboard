import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { amountOf, isIncome, isSpending, monthKey, monthLabel, shiftMonthKey, yen } from '../lib/finance'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
  selectedMonth: string
}

export function MonthlyTrendChart({ expenses, selectedMonth }: Props) {
  const data = useMemo(() => {
    const totals = new Map<string, { spending: number; income: number }>()
    for (const expense of expenses) {
      const key = monthKey(expense.transaction_date)
      const current = totals.get(key) ?? { spending: 0, income: 0 }
      if (isSpending(expense)) current.spending += amountOf(expense)
      if (isIncome(expense)) current.income += Math.abs(amountOf(expense))
      totals.set(key, current)
    }

    return Array.from({ length: 12 }, (_, index) => shiftMonthKey(selectedMonth, index - 11))
      .map((month) => ({
        month,
        ...(totals.get(month) ?? { spending: 0, income: 0 }),
        balance: (totals.get(month)?.income ?? 0) - (totals.get(month)?.spending ?? 0),
      }))
  }, [expenses, selectedMonth])

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Cash flow</p>
          <h2 className="panel-title">月別収支推移</h2>
        </div>
        <span className="panel-caption">〜 {monthLabel(selectedMonth)}</span>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data} margin={{ top: 12, right: 8, left: 8, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => yen.format(Number(value))} />
          <Legend />
          <Bar dataKey="spending" name="支出" fill="#6366f1" radius={[4, 4, 0, 0]} />
          <Bar dataKey="income" name="収入" fill="#38bdf8" radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="balance" name="収支" stroke="#059669" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  )
}
