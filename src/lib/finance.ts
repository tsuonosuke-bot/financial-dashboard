import type { Expense } from './types'

export const yen = new Intl.NumberFormat('ja-JP', {
  style: 'currency',
  currency: 'JPY',
  maximumFractionDigits: 0,
})

export function monthKey(date: string) {
  return date.slice(0, 7)
}

export function currentMonthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function previousMonthKey(date = new Date()) {
  return currentMonthKey(new Date(date.getFullYear(), date.getMonth() - 1, 1))
}

export function shiftMonthKey(month: string, offset: number) {
  const [year, monthNumber] = month.split('-').map(Number)
  return currentMonthKey(new Date(year, monthNumber - 1 + offset, 1))
}

export function monthLabel(month: string) {
  const [year, monthNumber] = month.split('-').map(Number)
  return `${year}年${monthNumber}月`
}

export function amountOf(expense: Expense) {
  return Number(expense.amount)
}

export function isIncome(expense: Expense) {
  return amountOf(expense) < 0 || expense.category.startsWith('80_')
}

export function isSpending(expense: Expense) {
  return amountOf(expense) > 0 && !isIncome(expense)
}

export function categoryLabel(category: string) {
  return category.replace(/^\d+_/, '')
}
