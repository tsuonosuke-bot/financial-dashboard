import { useMemo } from 'react'
import {
  amountOf,
  isIncome,
  isSpending,
  monthKey,
  monthLabel,
  shiftMonthKey,
  yen,
} from '../lib/finance'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
  selectedMonth: string
}

export function SummaryCards({ expenses, selectedMonth }: Props) {
  const summary = useMemo(() => {
    const lastMonth = shiftMonthKey(selectedMonth, -1)
    let spending = 0
    let income = 0
    let lastMonthSpending = 0

    for (const expense of expenses) {
      const key = monthKey(expense.transaction_date)
      if (key === selectedMonth && isSpending(expense)) spending += amountOf(expense)
      if (key === selectedMonth && isIncome(expense)) income += Math.abs(amountOf(expense))
      if (key === lastMonth && isSpending(expense)) lastMonthSpending += amountOf(expense)
    }

    return {
      selectedMonth,
      spending,
      income,
      balance: income - spending,
      spendingDiff: spending - lastMonthSpending,
    }
  }, [expenses, selectedMonth])

  return (
    <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label={`${monthLabel(selectedMonth)}の概要`}>
      <div className="summary-card border-l-4 border-l-indigo-500">
        <p className="summary-label">選択月の支出</p>
        <p className="summary-value">{yen.format(summary.spending)}</p>
        <p className="summary-note">{monthLabel(summary.selectedMonth)}</p>
      </div>
      <div className="summary-card border-l-4 border-l-sky-500">
        <p className="summary-label">選択月の収入</p>
        <p className="summary-value text-sky-700">{yen.format(summary.income)}</p>
        <p className="summary-note">負の金額を収入として集計</p>
      </div>
      <div className="summary-card border-l-4 border-l-emerald-500">
        <p className="summary-label">選択月の収支</p>
        <p className={`summary-value ${summary.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {summary.balance >= 0 ? '+' : ''}{yen.format(summary.balance)}
        </p>
        <p className="summary-note">収入 − 支出</p>
      </div>
      <div className="summary-card border-l-4 border-l-amber-500">
        <p className="summary-label">支出の前月差</p>
        <p className={`summary-value ${summary.spendingDiff <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {summary.spendingDiff >= 0 ? '+' : ''}{yen.format(summary.spendingDiff)}
        </p>
        <p className="summary-note">マイナスは支出減</p>
      </div>
    </section>
  )
}
