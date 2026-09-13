export type BudgetCategory = {
  id: number
  name: string
  notion_url: string | null
}

export type Expense = {
  id: number
  transaction_date: string
  amount: number
  title: string
  category: string
  payer: string | null
  memo: string | null
  notion_url: string | null
  notion_created_at: string | null
  created_at: string
}
