import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest as expensesRoute } from '../functions/api/expenses.ts'

const env = {
  SUPABASE_URL: 'https://project.supabase.co',
  SUPABASE_SECRET_KEY: 'secret-test-key',
}

function createRequest(body: unknown, headers: Record<string, string> = {}) {
  return new Request('https://dashboard.example/api/expenses', {
    method: 'POST',
    headers: {
      Origin: 'https://dashboard.example',
      'Content-Type': 'application/json',
      'X-Dashboard-Action': 'expense-create',
      ...headers,
    },
    body: JSON.stringify(body),
  })
}

const validInput = {
  transaction_date: '2026-09-15',
  amount: 1200,
  title: 'ランチ',
  category: '01_食費',
  payer: '本人',
  memo: null,
  type: 'expense',
}

test('家計簿を検証して1件登録する', async () => {
  const originalFetch = globalThis.fetch
  let seenInit: RequestInit | undefined
  globalThis.fetch = async (_input, init) => {
    seenInit = init
    return Response.json([{ id: 7, ...validInput, created_at: '2026-09-15T00:00:00Z' }])
  }
  try {
    const response = await expensesRoute({ request: createRequest(validInput), env })
    assert.equal(response.status, 201)
    const headers = seenInit?.headers as Record<string, string>
    assert.equal(headers.apikey, 'secret-test-key')
    assert.equal(headers.Prefer, 'return=representation')
    assert.deepEqual(JSON.parse(String(seenInit?.body)), {
      transaction_date: '2026-09-15', amount: 1200, title: 'ランチ', category: '01_食費', payer: '本人', memo: null,
    })
  } finally {
    globalThis.fetch = originalFetch
  }
})

test('収入は負数に正規化し、別オリジンと不正金額を拒否する', async () => {
  const originalFetch = globalThis.fetch
  let inserted: Record<string, unknown> | undefined
  globalThis.fetch = async (_input, init) => {
    inserted = JSON.parse(String(init?.body)) as Record<string, unknown>
    return Response.json([{ id: 8 }])
  }
  try {
    const income = await expensesRoute({ request: createRequest({ ...validInput, type: 'income' }), env })
    assert.equal(income.status, 201)
    assert.equal(inserted?.amount, -1200)
    const crossOrigin = await expensesRoute({
      request: createRequest(validInput, { Origin: 'https://attacker.example' }), env,
    })
    assert.equal(crossOrigin.status, 403)
    const invalidAmount = await expensesRoute({ request: createRequest({ ...validInput, amount: 0 }), env })
    assert.equal(invalidAmount.status, 400)
  } finally {
    globalThis.fetch = originalFetch
  }
})
