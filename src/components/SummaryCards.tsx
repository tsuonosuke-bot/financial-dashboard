import { useMemo } from 'react'
import {
  monthLabel,
  summarizeMonth,
  yen,
} from '../lib/finance'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
  selectedMonth: string
}

export function SummaryCards({ expenses, selectedMonth }: Props) {
  const summary = useMemo(() => summarizeMonth(expenses, selectedMonth), [expenses, selectedMonth])
  const spendingChangeLabel = summary.spendingDiff === 0
    ? '前月と同額'
    : `${yen.format(Math.abs(summary.spendingDiff))}${summary.spendingDiff > 0 ? '増' : '減'}`

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
        <p className="summary-label">支出の前月比較</p>
        <p className={`summary-value ${summary.spendingDiff <= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
          {spendingChangeLabel}
        </p>
        <p className="summary-note">
          前月 {yen.format(summary.previousMonthSpending)} → 今月 {yen.format(summary.spending)}
        </p>
      </div>
    </section>
  )
}
