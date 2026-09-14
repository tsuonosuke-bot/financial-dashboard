import assert from 'node:assert/strict'
import test from 'node:test'
import { filterExpensesByCategory, filterExpensesByPayer, summarizeMonth } from '../src/lib/finance.ts'
import type { Expense } from '../src/lib/types.ts'

const expenses: Expense[] = [
  {
    id: 1,
    transaction_date: '2026-09-01',
    amount: 1200,
    title: '昼食',
    category: '10_食費',
    payer: '健介',
    memo: null,
    notion_url: null,
    notion_created_at: null,
    created_at: '2026-09-01',
  },
  {
    id: 2,
    transaction_date: '2026-09-02',
    amount: 3000,
    title: '電車',
    category: '20_交通費',
    payer: '家族',
    memo: null,
    notion_url: null,
    notion_created_at: null,
    created_at: '2026-09-02',
  },
]

test('カテゴリ未選択では全明細を返す', () => {
  assert.equal(filterExpensesByCategory(expenses, ''), expenses)
})

test('カテゴリキーが完全一致する明細だけを返す', () => {
  assert.deepEqual(filterExpensesByCategory(expenses, '10_食費').map((expense) => expense.id), [1])
})

test('該当カテゴリがなければ空配列を返す', () => {
  assert.deepEqual(filterExpensesByCategory(expenses, '99_その他'), [])
})

test('支払者未選択では全明細を返す', () => {
  assert.equal(filterExpensesByPayer(expenses, ''), expenses)
})

test('選択した支払者の明細だけを返す', () => {
  assert.deepEqual(filterExpensesByPayer(expenses, '家族').map((expense) => expense.id), [2])
})

test('カテゴリと支払者のフィルターを組み合わせられる', () => {
  const byCategory = filterExpensesByCategory(expenses, '10_食費')
  assert.deepEqual(filterExpensesByPayer(byCategory, '健介').map((expense) => expense.id), [1])
  assert.deepEqual(filterExpensesByPayer(byCategory, '家族'), [])
})

test('前月比較は収入を含めず支出だけで計算する', () => {
  const comparisonExpenses: Expense[] = [
    ...expenses,
    { ...expenses[0], id: 3, transaction_date: '2026-08-10', amount: 5000 },
    { ...expenses[0], id: 4, transaction_date: '2026-08-25', amount: -500000, category: '80_収入' },
    { ...expenses[0], id: 5, transaction_date: '2026-09-25', amount: -600000, category: '80_収入' },
  ]

  const summary = summarizeMonth(comparisonExpenses, '2026-09')

  assert.equal(summary.spending, 4200)
  assert.equal(summary.previousMonthSpending, 5000)
  assert.equal(summary.spendingDiff, -800)
  assert.equal(summary.income, 600000)
})
