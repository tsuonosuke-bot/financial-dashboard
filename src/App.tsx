import { lazy, Suspense, useMemo, useState } from 'react'
import { ExpenseTable } from './components/ExpenseTable'
import { SummaryCards } from './components/SummaryCards'
import { useExpenses } from './hooks/useExpenses'
import { currentMonthKey, monthKey, monthLabel } from './lib/finance'

const MonthlyTrendChart = lazy(() => import('./components/MonthlyTrendChart').then((module) => ({ default: module.MonthlyTrendChart })))
const CategoryPieChart = lazy(() => import('./components/CategoryPieChart').then((module) => ({ default: module.CategoryPieChart })))

function App() {
  const { expenses, categories, loading, error, lastUpdatedAt, reload, demoMode } = useExpenses()
  const [requestedMonth, setRequestedMonth] = useState(currentMonthKey())
  const availableMonths = useMemo(
    () => Array.from(new Set(expenses.map((expense) => monthKey(expense.transaction_date)))).sort().reverse(),
    [expenses],
  )
  const selectedMonth = availableMonths.includes(requestedMonth)
    ? requestedMonth
    : (availableMonths[0] ?? requestedMonth)
  const selectedMonthIndex = availableMonths.indexOf(selectedMonth)
  const newestTransaction = expenses.reduce(
    (latest, expense) => expense.transaction_date > latest ? expense.transaction_date : latest,
    '',
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between lg:px-8">
          <div>
            <p className="eyebrow">Personal finance</p>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">家計簿ダッシュボード</h1>
            <p className="mt-1 text-sm text-slate-500">日々のお金の流れを、迷わず把握する。</p>
          </div>
          <div className="flex items-center gap-3">
            {!loading && !error && (
              <div className="hidden text-right text-xs text-slate-500 sm:block">
                <p>{demoMode ? 'デモデータ' : `${expenses.length.toLocaleString('ja-JP')}件`} · {categories.length}カテゴリ</p>
                <p>最新取引 {newestTransaction || '—'}</p>
              </div>
            )}
            <button type="button" onClick={reload} disabled={loading} className="refresh-button">
              <span aria-hidden="true">↻</span>
              {loading ? '更新中' : '再読み込み'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-5 py-7 lg:px-8">
        {loading && (
          <div className="panel grid min-h-64 place-items-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-9 w-9 animate-spin rounded-full border-4 border-indigo-100 border-t-indigo-600" />
              <p className="font-medium text-slate-700">Supabaseから家計簿を読み込んでいます</p>
              <p className="mt-1 text-sm text-slate-500">明細が多いため、数秒かかることがあります</p>
            </div>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6">
            <p className="font-semibold text-rose-800">データを読み込めませんでした</p>
            <p className="mt-2 text-sm text-rose-700">{error}</p>
            <button type="button" onClick={reload} className="mt-4 rounded-lg bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">
              再試行
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-6">
            {demoMode && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                デモモードです。Supabaseの実データは読み込んでいません。
              </div>
            )}
            <section className="month-toolbar" aria-label="表示月の選択">
              <div>
                <p className="eyebrow">Period</p>
                <p className="text-sm font-semibold text-slate-700">表示する月</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className="month-nav-button"
                  disabled={selectedMonthIndex < 0 || selectedMonthIndex === availableMonths.length - 1}
                  onClick={() => setRequestedMonth(availableMonths[selectedMonthIndex + 1])}
                >
                  ← 前月
                </button>
                <select
                  aria-label="表示する月"
                  className="month-select"
                  value={selectedMonth}
                  onChange={(event) => setRequestedMonth(event.target.value)}
                >
                  {availableMonths.map((month) => (
                    <option key={month} value={month}>{monthLabel(month)}</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="month-nav-button"
                  disabled={selectedMonthIndex <= 0}
                  onClick={() => setRequestedMonth(availableMonths[selectedMonthIndex - 1])}
                >
                  翌月 →
                </button>
              </div>
            </section>
            <SummaryCards expenses={expenses} selectedMonth={selectedMonth} />
            <Suspense fallback={<div className="panel grid min-h-80 place-items-center text-sm text-slate-500">グラフを読み込んでいます</div>}>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="xl:col-span-3"><MonthlyTrendChart expenses={expenses} selectedMonth={selectedMonth} /></div>
                <div className="xl:col-span-2"><CategoryPieChart expenses={expenses} selectedMonth={selectedMonth} /></div>
              </div>
            </Suspense>
            <ExpenseTable key={selectedMonth} expenses={expenses} categories={categories} selectedMonth={selectedMonth} />
            <p className="text-center text-xs text-slate-400">
              {lastUpdatedAt ? `最終読み込み ${lastUpdatedAt.toLocaleString('ja-JP')}` : ''}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
