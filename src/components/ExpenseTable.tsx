import { useMemo, useState } from 'react'
import { categoryLabel, isIncome, monthKey, monthLabel, yen } from '../lib/finance'
import type { Expense } from '../lib/types'

type Props = {
  expenses: Expense[]
  selectedMonth: string
}

export function ExpenseTable({ expenses, selectedMonth }: Props) {
  const pageSize = 50
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const monthExpenses = useMemo(
    () => expenses.filter((expense) => monthKey(expense.transaction_date) === selectedMonth),
    [expenses, selectedMonth],
  )

  const filtered = useMemo(() => monthExpenses.filter((expense) => {
    if (dateFrom && expense.transaction_date < dateFrom) return false
    if (dateTo && expense.transaction_date > dateTo) return false
    if (query) {
      const haystack = `${expense.title} ${expense.memo ?? ''}`.toLocaleLowerCase('ja')
      if (!haystack.includes(query.toLocaleLowerCase('ja'))) return false
    }
    return true
  }), [monthExpenses, dateFrom, dateTo, query])

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const visibleRows = useMemo(
    () => filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [currentPage, filtered],
  )

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value)
    setPage(1)
  }

  const clearFilters = () => {
    setDateFrom('')
    setDateTo('')
    setQuery('')
    setPage(1)
  }

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Transactions</p>
          <h2 className="panel-title">収支明細</h2>
        </div>
        <div className="text-right">
          <p className="text-xs font-semibold text-slate-500">{monthLabel(selectedMonth)}</p>
          <span className="mt-1 inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            {filtered.length.toLocaleString('ja-JP')}件
          </span>
        </div>
      </div>

      <div className="mb-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <input
          type="search"
          className="filter-control xl:col-span-2"
          placeholder="タイトル・メモを検索"
          value={query}
          onChange={(event) => updateFilter(setQuery, event.target.value)}
        />
        <input type="date" aria-label="開始日" className="filter-control" value={dateFrom} onChange={(event) => updateFilter(setDateFrom, event.target.value)} />
        <input type="date" aria-label="終了日" className="filter-control" value={dateTo} onChange={(event) => updateFilter(setDateTo, event.target.value)} />
        <button type="button" className="filter-reset" onClick={clearFilters}>明細条件をクリア</button>
      </div>

      <div className="max-h-[34rem] overflow-auto rounded-xl border border-slate-200">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3">日付</th>
              <th className="px-4 py-3 text-right">金額</th>
              <th className="px-4 py-3">カテゴリ</th>
              <th className="px-4 py-3">支払者</th>
              <th className="px-4 py-3">内容</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((expense) => (
              <tr key={expense.id} className="border-t border-slate-100 bg-white transition hover:bg-indigo-50/40">
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{expense.transaction_date}</td>
                <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${isIncome(expense) ? 'text-sky-700' : 'text-slate-800'}`}>
                  {yen.format(Number(expense.amount))}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">{categoryLabel(expense.category)}</span>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-slate-600">{expense.payer ?? '—'}</td>
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-800">{expense.title}</p>
                  {expense.memo && (
                    <p className="mt-0.5 max-w-xl truncate text-xs text-slate-500" title={expense.memo}>{expense.memo}</p>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="grid h-32 place-items-center bg-white text-sm text-slate-500">条件に一致する明細はありません</div>
        )}
      </div>
      {filtered.length > 0 && (
        <div className="mt-4 flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            {(currentPage - 1) * pageSize + 1}〜{Math.min(currentPage * pageSize, filtered.length)}件を表示
            <span className="ml-1 text-slate-400">/ 全{filtered.length.toLocaleString('ja-JP')}件</span>
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="pagination-button"
              disabled={currentPage === 1}
              onClick={() => setPage(currentPage - 1)}
            >
              前へ
            </button>
            <span className="min-w-20 text-center text-xs font-semibold text-slate-600">{currentPage} / {pageCount}</span>
            <button
              type="button"
              className="pagination-button"
              disabled={currentPage === pageCount}
              onClick={() => setPage(currentPage + 1)}
            >
              次へ
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
