import assert from 'node:assert/strict'
import test from 'node:test'
import { filterExpensesByCategory } from '../src/lib/finance.ts'
import type { Expense } from '../src/lib/types.ts'

const expenses: Expense[] = [
  {
    id: 1,
    transaction_date: '2026-09-01',
    amount: 1200,
    title: '昼食',
    category: '10_食費',
    payer: null,
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
    payer: null,
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
