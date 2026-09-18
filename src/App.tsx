import { lazy, Suspense, useMemo, useState } from 'react'
import { CategoryFilter } from './components/CategoryFilter'
import { ExpenseFormModal } from './components/ExpenseFormModal'
import { ExpenseTable } from './components/ExpenseTable'
import { SummaryCards } from './components/SummaryCards'
import { useExpenses } from './hooks/useExpenses'
import {
  categoryLabel,
  currentMonthKey,
  filterExpensesByCategories,
  filterExpensesByPayer,
  monthKey,
  monthLabel,
  type CategoryFilterMode,
} from './lib/finance'
import type { ExpenseDraft } from './lib/types'

const MonthlyTrendChart = lazy(() => import('./components/MonthlyTrendChart').then((module) => ({ default: module.MonthlyTrendChart })))
const CategoryPieChart = lazy(() => import('./components/CategoryPieChart').then((module) => ({ default: module.CategoryPieChart })))

function App() {
  const { expenses, categories, loading, error, lastUpdatedAt, reload, demoMode, mutating, createExpense } = useExpenses()
  const [requestedMonth, setRequestedMonth] = useState(currentMonthKey())
  const [requestedCategories, setRequestedCategories] = useState<string[]>([])
  const [categoryMode, setCategoryMode] = useState<CategoryFilterMode>('include')
  const [requestedPayer, setRequestedPayer] = useState('')
  const [entryOpen, setEntryOpen] = useState(() => new URLSearchParams(window.location.search).get('new') === 'expense')
  const [actionError, setActionError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const availableMonths = useMemo(
    () => Array.from(new Set(expenses.map((expense) => monthKey(expense.transaction_date)))).sort().reverse(),
    [expenses],
  )
  const availableCategories = useMemo(
    () => Array.from(new Set([
      ...categories.map((category) => category.name),
      ...expenses.map((expense) => expense.category),
    ])).sort(),
    [categories, expenses],
  )
  const availablePayers = useMemo(
    () => Array.from(new Set(
      expenses.map((expense) => expense.payer).filter((payer): payer is string => Boolean(payer)),
    )).sort((left, right) => left.localeCompare(right, 'ja')),
    [expenses],
  )
  const selectedMonth = availableMonths.includes(requestedMonth)
    ? requestedMonth
    : (availableMonths[0] ?? requestedMonth)
  const selectedCategories = useMemo(
    () => requestedCategories.filter((category) => availableCategories.includes(category)),
    [availableCategories, requestedCategories],
  )
  const selectedCategorySummary = useMemo(() => {
    if (selectedCategories.length === 0) return ''
    if (selectedCategories.length === availableCategories.length) return 'すべてのカテゴリ'
    const labels = selectedCategories.map(categoryLabel)
    if (labels.length <= 2) return labels.join('、')
    return `${labels.slice(0, 2).join('、')} ほか${labels.length - 2}件`
  }, [availableCategories.length, selectedCategories])
  const selectedPayer = availablePayers.includes(requestedPayer) ? requestedPayer : ''
  const filteredExpenses = useMemo(
    () => filterExpensesByPayer(
      filterExpensesByCategories(expenses, selectedCategories, categoryMode),
      selectedPayer,
    ),
    [expenses, selectedCategories, categoryMode, selectedPayer],
  )
  const selectedMonthIndex = availableMonths.indexOf(selectedMonth)
  const newestTransaction = expenses.reduce(
    (latest, expense) => expense.transaction_date > latest ? expense.transaction_date : latest,
    '',
  )

  const closeEntry = () => {
    setEntryOpen(false)
    setActionError(null)
    if (new URLSearchParams(window.location.search).has('new')) window.history.replaceState(null, '', window.location.pathname)
  }

  const saveExpense = async (draft: ExpenseDraft) => {
    setActionError(null)
    try {
      const created = await createExpense(draft)
      setRequestedMonth(monthKey(created.transaction_date))
      setNotice('家計簿に保存しました。')
      closeEntry()
    } catch (caught) {
      setActionError(caught instanceof Error ? caught.message : '家計簿を保存できませんでした。')
    }
  }

  const toggleCategory = (category: string) => {
    setRequestedCategories((current) => current.includes(category)
      ? current.filter((item) => item !== category)
      : [...current, category])
  }

  return (
    <div className="app-page">
      <header className="app-header">
        <div className="app-header-inner">
          <div className="page-heading">
            <p className="eyebrow">Personal finance</p>
            <h1>家計簿</h1>
            <p>日々のお金の流れを確認・記録</p>
          </div>
          <div className="header-actions">
            <a className="hub-button" href="https://personal-dashboard-7md.pages.dev/">
              ← Hub
            </a>
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
            <button type="button" className="primary-button add-button" onClick={() => { setActionError(null); setEntryOpen(true) }} disabled={loading || demoMode}>
              ＋ 家計簿を記録
            </button>
          </div>
        </div>
      </header>

      <main className="app-main">
        {notice && <div className="save-notice" role="status"><span>{notice}</span><button type="button" aria-label="閉じる" onClick={() => setNotice(null)}>×</button></div>}
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
            <section className="month-toolbar" aria-label="表示条件の選択">
              <div>
                <p className="eyebrow">Filters</p>
                <p className="text-sm font-semibold text-slate-700">表示条件</p>
                <p className="mt-1 text-xs text-slate-500">月・カテゴリ・支払者を組み合わせて集計します</p>
              </div>
              <div className="flex w-full flex-col gap-3 sm:w-auto lg:flex-row lg:items-end">
                <div>
                  <label className="toolbar-label" htmlFor="month-filter">月</label>
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
                      id="month-filter"
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
                </div>
                <div>
                  <span className="toolbar-label">カテゴリ</span>
                  <CategoryFilter
                    categories={availableCategories}
                    selected={selectedCategories}
                    mode={categoryMode}
                    onModeChange={setCategoryMode}
                    onToggle={toggleCategory}
                    onSelectAll={() => setRequestedCategories(availableCategories)}
                    onClear={() => setRequestedCategories([])}
                  />
                </div>
                <div>
                  <label className="toolbar-label" htmlFor="payer-filter">支払者</label>
                  <select
                    id="payer-filter"
                    className="category-select"
                    value={selectedPayer}
                    onChange={(event) => setRequestedPayer(event.target.value)}
                  >
                    <option value="">すべての支払者</option>
                    {availablePayers.map((payer) => (
                      <option key={payer} value={payer}>{payer}</option>
                    ))}
                  </select>
                </div>
              </div>
            </section>
            {(selectedCategories.length > 0 || selectedPayer) && (
              <div className="active-filter" role="status">
                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  {selectedCategories.length > 0 && (
                    <span>
                      {categoryMode === 'include' ? '含める' : '除外する'}カテゴリ: {selectedCategorySummary}
                    </span>
                  )}
                  {selectedPayer && <span>支払者: {selectedPayer}</span>}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setRequestedCategories([])
                    setCategoryMode('include')
                    setRequestedPayer('')
                  }}
                >
                  すべて解除
                </button>
              </div>
            )}
            <SummaryCards expenses={filteredExpenses} selectedMonth={selectedMonth} />
            <Suspense fallback={<div className="panel grid min-h-80 place-items-center text-sm text-slate-500">グラフを読み込んでいます</div>}>
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
                <div className="xl:col-span-3"><MonthlyTrendChart expenses={filteredExpenses} selectedMonth={selectedMonth} /></div>
                <div className="xl:col-span-2"><CategoryPieChart expenses={filteredExpenses} selectedMonth={selectedMonth} /></div>
              </div>
            </Suspense>
            <ExpenseTable key={`${selectedMonth}:${categoryMode}:${selectedCategories.join(',')}:${selectedPayer}`} expenses={filteredExpenses} selectedMonth={selectedMonth} />
            <p className="text-center text-xs text-slate-400">
              {lastUpdatedAt ? `最終読み込み ${lastUpdatedAt.toLocaleString('ja-JP')}` : ''}
            </p>
          </div>
        )}
      </main>
      {entryOpen && (
        <ExpenseFormModal
          categories={categories}
          payers={availablePayers}
          saving={mutating}
          error={actionError}
          onClose={closeEntry}
          onSave={(draft) => void saveExpense(draft)}
        />
      )}
    </div>
  )
}

export default App
