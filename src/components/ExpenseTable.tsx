import { useMemo, useState } from 'react'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
}

const yen = new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' })

export function ExpenseTable({ expenses }: Props) {
  const [categoryFilter, setCategoryFilter] = useState('')
  const [payerFilter, setPayerFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const categories = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.category))).sort(),
    [expenses],
  )
  const payers = useMemo(
    () => Array.from(new Set(expenses.map((e) => e.payer).filter((p): p is string => !!p))).sort(),
    [expenses],
  )

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter && e.category !== categoryFilter) return false
      if (payerFilter && e.payer !== payerFilter) return false
      if (dateFrom && e.transaction_date < dateFrom) return false
      if (dateTo && e.transaction_date > dateTo) return false
      return true
    })
  }, [expenses, categoryFilter, payerFilter, dateFrom, dateTo])

  const total = useMemo(() => filtered.reduce((sum, e) => sum + Number(e.amount), 0), [filtered])

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">支出一覧</h2>

      <div className="mb-4 flex flex-wrap gap-3">
        <select
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">カテゴリ: すべて</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>

        <select
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          value={payerFilter}
          onChange={(e) => setPayerFilter(e.target.value)}
        >
          <option value="">支払者: すべて</option>
          {payers.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
        />
        <span className="self-center text-sm text-gray-500">〜</span>
        <input
          type="date"
          className="rounded border border-gray-300 px-2 py-1 text-sm"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
        />

        <span className="self-center text-sm text-gray-600">
          {filtered.length}件 / 合計 {yen.format(total)}
        </span>
      </div>

      <div className="max-h-96 overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-gray-100 text-left text-gray-600">
            <tr>
              <th className="px-2 py-1">日付</th>
              <th className="px-2 py-1">金額</th>
              <th className="px-2 py-1">カテゴリ</th>
              <th className="px-2 py-1">支払者</th>
              <th className="px-2 py-1">タイトル</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="px-2 py-1">{e.transaction_date}</td>
                <td className="px-2 py-1">{yen.format(Number(e.amount))}</td>
                <td className="px-2 py-1">{e.category}</td>
                <td className="px-2 py-1">{e.payer ?? '-'}</td>
                <td className="px-2 py-1">{e.title}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
