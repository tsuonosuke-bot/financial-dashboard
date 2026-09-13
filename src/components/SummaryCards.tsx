import { useMemo } from 'react'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
}

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7) // YYYY-MM
}

export function SummaryCards({ expenses }: Props) {
  const { thisMonthTotal, lastMonthTotal, thisMonthLabel, lastMonthLabel } = useMemo(() => {
    const now = new Date()
    const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonth = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`

    let thisMonthTotal = 0
    let lastMonthTotal = 0
    for (const e of expenses) {
      const key = monthKey(e.transaction_date)
      if (key === thisMonth) thisMonthTotal += Number(e.amount)
      else if (key === lastMonth) lastMonthTotal += Number(e.amount)
    }

    return {
      thisMonthTotal,
      lastMonthTotal,
      thisMonthLabel: thisMonth,
      lastMonthLabel: lastMonth,
    }
  }, [expenses])

  const diff = thisMonthTotal - lastMonthTotal

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="rounded-lg bg-white p-4 shadow">
        <p className="text-sm text-gray-500">今月の合計 ({thisMonthLabel})</p>
        <p className="mt-1 text-2xl font-bold text-gray-800">{yen.format(thisMonthTotal)}</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <p className="text-sm text-gray-500">先月の合計 ({lastMonthLabel})</p>
        <p className="mt-1 text-2xl font-bold text-gray-800">{yen.format(lastMonthTotal)}</p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow">
        <p className="text-sm text-gray-500">前月比</p>
        <p className={`mt-1 text-2xl font-bold ${diff >= 0 ? 'text-red-600' : 'text-blue-600'}`}>
          {diff >= 0 ? '+' : ''}
          {yen.format(diff)}
        </p>
      </div>
    </div>
  )
}
