import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { onRequest as recurringRoute } from '../functions/api/recurring-expenses.ts'

const env = { SUPABASE_URL: 'https://project.supabase.co', SUPABASE_SECRET_KEY: 'secret-test-key' }

test('定期登録APIはサーバー側の固定列だけを取得する', async () => {
  const originalFetch = globalThis.fetch
  let url = ''
  globalThis.fetch = async (input) => { url = decodeURIComponent(String(input)); return Response.json([], { headers: { 'Content-Range': '*/0' } }) }
  try {
    const response = await recurringRoute({ request: new Request('https://dashboard.example/api/recurring-expenses'), env })
    assert.equal(response.status, 200)
    assert.match(url, /day_of_month/)
    assert.match(url, /order=active.desc,next_run_date.asc,id.asc/)
  } finally { globalThis.fetch = originalFetch }
})

test('定期登録の作成は同一オリジンと専用ヘッダーを要求する', async () => {
  const body = JSON.stringify({ source_expense_id: 1, frequency: 'monthly', interval_count: 1, end_date: null })
  const rejected = await recurringRoute({ request: new Request('https://dashboard.example/api/recurring-expenses', { method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json', 'X-Dashboard-Action': 'recurring-create' }, body }), env })
  assert.equal(rejected.status, 403)
})

test('再開は専用DB関数を使い、停止期間を遡及登録しない', async () => {
  const originalFetch = globalThis.fetch
  let url = ''
  globalThis.fetch = async (input) => {
    url = String(input)
    return Response.json([{ id: 1, active: true }])
  }
  try {
    const response = await recurringRoute({ request: new Request('https://dashboard.example/api/recurring-expenses', {
      method: 'PATCH',
      headers: { Origin: 'https://dashboard.example', 'Content-Type': 'application/json', 'X-Dashboard-Action': 'recurring-update' },
      body: JSON.stringify({ id: 1, active: true }),
    }), env })
    assert.equal(response.status, 200)
    assert.match(url, /rpc\/set_recurring_expense_active/)
  } finally { globalThis.fetch = originalFetch }
})

test('SQLは生成履歴の一意制約と月次基準日と日次Cronを持つ', async () => {
  const sql = await readFile(new URL('../supabase/recurring-expenses.sql', import.meta.url), 'utf8')
  assert.match(sql, /primary key \(rule_id, scheduled_for\)/)
  assert.match(sql, /p_day_of_month/)
  assert.match(sql, /materialize-recurring-expenses-jst/)
  assert.match(sql, /'10 15 \* \* \*'/)
  assert.match(sql, /while candidate <= today_jst/)
})

test('家計簿画面から定期登録管理画面を開き、内容を編集できる', async () => {
  const [app, manager, styles] = await Promise.all([
    readFile(new URL('../src/App.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/RecurringExpenseModal.tsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/index.css', import.meta.url), 'utf8'),
  ])
  assert.match(app, /aria-label="定期登録を管理"/)
  assert.match(app, /className="recurring-icon"/)
  assert.doesNotMatch(app, /↻ 定期登録/)
  assert.doesNotMatch(styles, /\.recurring-button::after\s*\{[^}]*↻/)
  assert.match(styles, /\.recurring-button\s*\{[^}]*background: #f3f0ff/)
  assert.match(styles, /@media \(max-width: 640px\)[\s\S]*\.recurring-button\s*\{[^}]*background: #59449b/)
  assert.match(app, /view.*recurring/)
  assert.match(manager, /定期登録を管理/)
  assert.match(manager, /変更を保存/)
  assert.match(manager, /次回/)
  assert.match(manager, /最終生成/)
})
