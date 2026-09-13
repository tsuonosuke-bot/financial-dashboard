import { CategoryPieChart } from './components/CategoryPieChart'
import { ExpenseTable } from './components/ExpenseTable'
import { MonthlyTrendChart } from './components/MonthlyTrendChart'
import { SummaryCards } from './components/SummaryCards'
import { useExpenses } from './hooks/useExpenses'

function App() {
  const { expenses, loading, error } = useExpenses()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="mb-6 text-2xl font-bold text-gray-800">家計簿ダッシュボード</h1>

      {loading && <p className="text-gray-500">読み込み中...</p>}
      {error && <p className="text-red-600">エラー: {error}</p>}

      {!loading && !error && (
        <>
          <SummaryCards expenses={expenses} />
          <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
            <MonthlyTrendChart expenses={expenses} />
            <CategoryPieChart expenses={expenses} />
          </div>
          <ExpenseTable expenses={expenses} />
        </>
      )}
    </div>
  )
}

export default App
