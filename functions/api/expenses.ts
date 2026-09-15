import {
  fetchSupabasePage,
  insertSupabaseRow,
  jsonResponse,
  methodNotAllowed,
  readPagination,
  type SupabaseEnv,
} from '../_shared/supabaseRest.ts'
import { readExpenseInput, validateExpenseMutationRequest } from '../_shared/expenseValidation.ts'

type FunctionContext = {
  request: Request
  env: SupabaseEnv
}

const SELECT_COLUMNS = 'id,transaction_date,amount,title,category,payer,memo,notion_url,notion_created_at,created_at'

export const onRequest = async (context: FunctionContext): Promise<Response> => {
  if (context.request.method === 'GET') {
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
  if (context.request.method !== 'POST') return methodNotAllowed('GET, POST')
  const guard = validateExpenseMutationRequest(context.request)
  if (guard) return jsonResponse({ error: guard.error }, guard.status)
  const input = await readExpenseInput(context.request)
  if (!input.ok) return jsonResponse({ error: input.error }, input.status)
  return insertSupabaseRow(context.env, 'expenses', SELECT_COLUMNS, input.value)
}
