import {
  fetchSupabasePage,
  methodNotAllowed,
  readPagination,
  type SupabaseEnv,
} from '../_shared/supabaseRest.ts'

type FunctionContext = {
  request: Request
  env: SupabaseEnv
}

const SELECT_COLUMNS = 'id,transaction_date,amount,title,category,payer,memo,notion_url,notion_created_at,created_at'

export const onRequest = async (context: FunctionContext): Promise<Response> => {
  if (context.request.method !== 'GET') return methodNotAllowed()
  const pagination = readPagination(context.request)
  if (pagination instanceof Response) return pagination
  return fetchSupabasePage(context.env, {
    table: 'expenses',
    params: new URLSearchParams({
      select: SELECT_COLUMNS,
      order: 'transaction_date.desc,id.desc',
    }),
  }, pagination)
}
