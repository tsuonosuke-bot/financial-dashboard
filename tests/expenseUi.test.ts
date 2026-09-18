import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('家計簿の登録メニューを表示し、専用APIへ送信する', async () => {
  const [app, modal, api] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/ExpenseFormModal.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/lib/api.ts', import.meta.url), 'utf8'),
  ])
  assert.match(app, /家計簿を記録/)
  assert.match(modal, /type === 'expense'/)
  assert.match(modal, /type === 'income'/)
  assert.match(api, /X-Dashboard-Action.*expense-create/s)
})

test('明細一覧で種別・金額・日付・キーワード・並び順を組み合わせられる', async () => {
  const table = await readFile(new URL('../src/components/ExpenseTable.tsx', import.meta.url), 'utf8')
  assert.match(table, /支出・収入すべて/)
  assert.match(table, /金額 下限/)
  assert.match(table, /金額 上限/)
  assert.match(table, /amount-desc/)
  assert.match(table, /transaction_date < dateFrom/)
  assert.match(table, /expense\.category.*expense\.payer/s)
})

test('カテゴリ条件で複数選択と除外を切り替えられる', async () => {
  const [app, filter] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/CategoryFilter.tsx', import.meta.url), 'utf8'),
  ])
  assert.match(app, /filterExpensesByCategories/)
  assert.match(filter, /含める/)
  assert.match(filter, /除外する/)
  assert.match(filter, /type="checkbox"/)
  assert.match(filter, /すべて選択/)
  assert.match(filter, /すべて解除/)
  assert.match(filter, /aria-label="カテゴリをすべて選択"/)
  assert.match(app, /onSelectAll/)
})

test('月別収支推移は支出をカテゴリ別の積み上げ棒で表示する', async () => {
  const chart = await readFile(new URL('../src/components/MonthlyTrendChart.tsx', import.meta.url), 'utf8')
  assert.match(chart, /categories\.map/)
  assert.match(chart, /stackId="spending"/)
  assert.match(chart, /height=\{360\}/)
  assert.doesNotMatch(chart, /dataKey="spending"/)
})
