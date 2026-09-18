import { useMemo } from 'react'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { categoryColor } from '../lib/chartColors'
import { buildMonthlyTrendData, categoryLabel, monthLabel, yen } from '../lib/finance'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
  selectedMonth: string
}

export function MonthlyTrendChart({ expenses, selectedMonth }: Props) {
  const { categories, data } = useMemo(
    () => buildMonthlyTrendData(expenses, selectedMonth),
    [expenses, selectedMonth],
  )

  return (
    <section className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Cash flow</p>
          <h2 className="panel-title">月別収支推移</h2>
        </div>
        <span className="panel-caption">〜 {monthLabel(selectedMonth)}</span>
      </div>
      <div className="trend-legend" aria-label="月別収支推移の凡例">
        {categories.map((category) => (
          <span key={category} className="trend-legend-item" aria-label={`支出カテゴリ ${categoryLabel(category)}`}>
            <i style={{ background: categoryColor(category) }} />
            {categoryLabel(category)}
          </span>
        ))}
        <span className="trend-legend-item"><i className="income-legend" />収入</span>
        <span className="trend-legend-item"><i className="balance-legend" />収支</span>
      </div>
      <ResponsiveContainer width="100%" height={360}>
        <ComposedChart data={data} barCategoryGap="18%" margin={{ top: 16, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `${Math.round(value / 1000)}k`} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => yen.format(Number(value))}
            labelFormatter={(label) => monthLabel(String(label))}
          />
          {categories.map((category, index) => (
            <Bar
              key={category}
              dataKey={category}
              name={categoryLabel(category)}
              stackId="spending"
              fill={categoryColor(category)}
              maxBarSize={34}
              radius={index === categories.length - 1 ? [4, 4, 0, 0] : 0}
            />
          ))}
          <Bar dataKey="income" name="収入" fill="#38bdf8" maxBarSize={34} radius={[4, 4, 0, 0]} />
          <Line type="monotone" dataKey="balance" name="収支" stroke="#059669" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </section>
  )
}
