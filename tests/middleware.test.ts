import assert from 'node:assert/strict'
import test from 'node:test'
import { onRequest } from '../functions/_middleware.ts'

function request(authorization?: string) {
  return new Request('https://dashboard.example/', {
    headers: authorization ? { Authorization: authorization } : undefined,
  })
}

test('認証設定がなければフェイルクローズする', async () => {
  const response = await onRequest({ request: request(), env: {}, next: async () => new Response('secret') })
  assert.equal(response.status, 503)
  assert.equal(response.headers.get('Cache-Control'), 'private, no-store')
})

test('Basic認証とプライバシーヘッダーを全レスポンスへ適用する', async () => {
  const env = { DASHBOARD_USER: 'owner', DASHBOARD_PASSWORD: 'long-password' }
  const unauthorized = await onRequest({ request: request(), env, next: async () => new Response('secret') })
  assert.equal(unauthorized.status, 401)
  assert.match(unauthorized.headers.get('WWW-Authenticate') ?? '', /financial-dashboard/)

  const authorization = `Basic ${btoa('owner:long-password')}`
  const response = await onRequest({ request: request(authorization), env, next: async () => new Response('secret') })
  assert.equal(response.status, 200)
  assert.equal(await response.text(), 'secret')
  assert.equal(response.headers.get('X-Frame-Options'), 'DENY')
  assert.equal(response.headers.get('X-Robots-Tag'), 'noindex, nofollow')
  assert.match(response.headers.get('Content-Security-Policy') ?? '', /connect-src 'self'/)
})
