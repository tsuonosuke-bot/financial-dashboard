import type { BudgetCategory, Expense } from './types'
import { parseBudgetCategory, parseExpense, parsePageEnvelope } from './apiValidation'

type ErrorBody = { error?: unknown }

async function requestJson(path: string): Promise<unknown> {
  const response = await fetch(path, {
    method: 'GET',
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  })
  if (!response.ok) {
    let message = `APIエラー (${response.status})`
    try {
      const body = (await response.json()) as ErrorBody
      if (typeof body.error === 'string') message = body.error
    } catch {
      // JSONでないエラーはHTTPステータスを使う。
    }
    throw new Error(message)
  }
  return response.json() as Promise<unknown>
}

const API_PAGE_SIZE = 1_000
const MAX_PAGE_REQUESTS = 10_000

async function getAllPages<T>(path: string, parseItem: (value: unknown) => T): Promise<T[]> {
  const result: T[] = []
  let offset = 0
  for (let requestCount = 0; requestCount < MAX_PAGE_REQUESTS; requestCount += 1) {
    const separator = path.includes('?') ? '&' : '?'
    const data = await requestJson(`${path}${separator}limit=${API_PAGE_SIZE}&offset=${offset}`)
    const page = parsePageEnvelope(data)
    if (page.offset !== offset || page.limit !== API_PAGE_SIZE) {
      throw new Error('APIのページ情報が要求内容と一致しません。')
    }
    result.push(...page.items.map(parseItem))
    if (page.items.length === 0) return result
    offset += page.items.length
    if (page.total !== null && offset >= page.total) return result
  }
  throw new Error('データ件数が安全な取得上限を超えています。')
}

export function getExpenses(): Promise<Expense[]> {
  return getAllPages('/api/expenses', parseExpense)
}

export function getBudgetCategories(): Promise<BudgetCategory[]> {
  return getAllPages('/api/budget-categories', parseBudgetCategory)
}
