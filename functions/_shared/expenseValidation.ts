export const EXPENSE_ACTION_HEADER = 'expense-create'
const MAX_REQUEST_CHARS = 8_000

export type ExpenseCreateValue = {
  transaction_date: string
  amount: number
  title: string
  category: string
  payer: string | null
  memo: string | null
}

type ValidationResult =
  | { ok: true; value: ExpenseCreateValue }
  | { ok: false; status: number; error: string }

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
}

function requiredText(value: unknown, label: string, maxLength: number): { value: string } | { error: string } {
  if (typeof value !== 'string' || !value.trim()) return { error: `${label}は必須です。` }
  const normalized = value.trim()
  return normalized.length <= maxLength ? { value: normalized } : { error: `${label}は${maxLength}文字以内で入力してください。` }
}

function optionalText(value: unknown, label: string, maxLength: number): { value: string | null } | { error: string } {
  if (value === null || value === undefined || value === '') return { value: null }
  if (typeof value !== 'string') return { error: `${label}の形式が正しくありません。` }
  const normalized = value.trim()
  return normalized.length <= maxLength ? { value: normalized || null } : { error: `${label}は${maxLength}文字以内で入力してください。` }
}

export function validateExpenseMutationRequest(request: Request): { status: number; error: string } | null {
  let expectedOrigin: string
  try {
    expectedOrigin = new URL(request.url).origin
  } catch {
    return { status: 400, error: 'リクエストURLが正しくありません。' }
  }
  if (request.headers.get('Origin') !== expectedOrigin) return { status: 403, error: '許可されていない送信元です。' }
  if (request.headers.get('X-Dashboard-Action') !== EXPENSE_ACTION_HEADER) return { status: 403, error: '登録用ヘッダーがありません。' }
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return { status: 415, error: 'JSON形式で送信してください。' }
  const declaredLength = Number(request.headers.get('Content-Length') || '0')
  if (Number.isFinite(declaredLength) && declaredLength > MAX_REQUEST_CHARS) return { status: 413, error: 'リクエストが大きすぎます。' }
  return null
}

export async function readExpenseInput(request: Request): Promise<ValidationResult> {
  let raw: string
  try {
    raw = await request.text()
  } catch {
    return { ok: false, status: 400, error: '入力内容を読み取れませんでした。' }
  }
  if (raw.length > MAX_REQUEST_CHARS) return { ok: false, status: 413, error: 'リクエストが大きすぎます。' }
  let input: unknown
  try {
    input = JSON.parse(raw) as unknown
  } catch {
    return { ok: false, status: 400, error: 'JSONの形式が正しくありません。' }
  }
  if (!isPlainObject(input)) return { ok: false, status: 400, error: '入力内容の形式が正しくありません。' }
  const allowed = new Set(['transaction_date', 'amount', 'title', 'category', 'payer', 'memo', 'type'])
  const unknownKey = Object.keys(input).find((key) => !allowed.has(key))
  if (unknownKey) return { ok: false, status: 400, error: `登録できない項目が含まれています: ${unknownKey}` }

  if (typeof input.transaction_date !== 'string' || !validDate(input.transaction_date)) {
    return { ok: false, status: 400, error: '日付をYYYY-MM-DD形式で入力してください。' }
  }
  if (input.type !== 'expense' && input.type !== 'income') {
    return { ok: false, status: 400, error: '種別は支出または収入を選択してください。' }
  }
  if (typeof input.amount !== 'number' || !Number.isSafeInteger(input.amount) || input.amount <= 0 || input.amount > 1_000_000_000) {
    return { ok: false, status: 400, error: '金額は1〜1,000,000,000円の整数で入力してください。' }
  }
  const title = requiredText(input.title, '内容', 200)
  if ('error' in title) return { ok: false, status: 400, error: title.error }
  const category = requiredText(input.category, 'カテゴリ', 100)
  if ('error' in category) return { ok: false, status: 400, error: category.error }
  const payer = optionalText(input.payer, '支払者', 100)
  if ('error' in payer) return { ok: false, status: 400, error: payer.error }
  const memo = optionalText(input.memo, 'メモ', 2_000)
  if ('error' in memo) return { ok: false, status: 400, error: memo.error }

  return {
    ok: true,
    value: {
      transaction_date: input.transaction_date,
      amount: input.type === 'income' ? -input.amount : input.amount,
      title: title.value,
      category: category.value,
      payer: payer.value,
      memo: memo.value,
    },
  }
}
