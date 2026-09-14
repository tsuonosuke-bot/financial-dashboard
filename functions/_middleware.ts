interface Env {
  DASHBOARD_PASSWORD?: string
  DASHBOARD_USER?: string
}

interface MiddlewareContext {
  request: Request
  env: Env
  next: () => Promise<Response>
}

const REALM = 'Basic realm="financial-dashboard", charset="UTF-8"'

function withPrivacyHeaders(response: Response): Response {
  const secured = new Response(response.body, response)
  secured.headers.set('Cache-Control', 'private, no-store')
  secured.headers.set('Content-Security-Policy', "default-src 'self'; connect-src 'self'; img-src 'self' data:; style-src 'self'; style-src-elem 'self'; style-src-attr 'unsafe-inline'; script-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'")
  secured.headers.set('Referrer-Policy', 'no-referrer')
  secured.headers.set('Vary', 'Authorization')
  secured.headers.set('X-Content-Type-Options', 'nosniff')
  secured.headers.set('X-Frame-Options', 'DENY')
  secured.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return secured
}

function unauthorized(): Response {
  return withPrivacyHeaders(new Response('認証が必要です。\n', {
    status: 401,
    headers: {
      'WWW-Authenticate': REALM,
      'Content-Type': 'text/plain; charset=utf-8',
    },
  }))
}

function safeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false
  let diff = 0
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index)
  }
  return diff === 0
}

export const onRequest = async (context: MiddlewareContext): Promise<Response> => {
  const expectedPassword = context.env.DASHBOARD_PASSWORD
  if (!expectedPassword) {
    return withPrivacyHeaders(new Response(
      'DASHBOARD_PASSWORDが未設定です。Cloudflare Pagesの環境変数に設定してください。\n',
      { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } },
    ))
  }

  const header = context.request.headers.get('Authorization')
  if (!header?.startsWith('Basic ')) return unauthorized()

  let decoded: string
  try {
    decoded = atob(header.slice('Basic '.length))
  } catch {
    return unauthorized()
  }

  const separator = decoded.indexOf(':')
  if (separator < 0) return unauthorized()
  const userOk = safeEqual(decoded.slice(0, separator), context.env.DASHBOARD_USER || 'admin')
  const passwordOk = safeEqual(decoded.slice(separator + 1), expectedPassword)
  if (!userOk || !passwordOk) return unauthorized()

  return withPrivacyHeaders(await context.next())
}
