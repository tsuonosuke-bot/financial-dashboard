import { useEffect, useMemo, useState } from 'react'
import { categoryLabel } from '../lib/finance'
import type { BudgetCategory, Expense, RecurringExpense, RecurringExpenseDraft, RecurringExpenseUpdate, RecurringFrequency } from '../lib/types'

type Props = {
  expenses: Expense[]
  categories: BudgetCategory[]
  rules: RecurringExpense[]
  busy: boolean
  error: string | null
  onClose: () => void
  onCreate: (draft: RecurringExpenseDraft) => Promise<void>
  onUpdate: (draft: RecurringExpenseUpdate) => Promise<boolean>
  onToggle: (rule: RecurringExpense) => void
  onRun: () => void
}

const frequencyLabels: Record<RecurringFrequency, string> = { daily: '毎日', weekly: '毎週', monthly: '毎月' }
const formatYen = (value: number) => `${Math.round(value).toLocaleString('ja-JP')}円`

function lastRunLabel(value: string | null) {
  if (!value) return '未生成'
  const date = new Date(value)
  return Number.isNaN(date.valueOf()) ? value : date.toLocaleString('ja-JP')
}

export function RecurringExpenseModal({ expenses, categories, rules, busy, error, onClose, onCreate, onUpdate, onToggle, onRun }: Props) {
  const septemberFirst = useMemo(() => {
    const matches = expenses.filter((item) => item.transaction_date.endsWith('-09-01'))
    const targetDate = matches.reduce((latest, item) => item.transaction_date > latest ? item.transaction_date : latest, '')
    return matches.filter((item) => item.transaction_date === targetDate)
  }, [expenses])
  const available = septemberFirst.filter((item) => !rules.some((rule) => rule.source_expense_id === item.id))
  const [sourceId, setSourceId] = useState(() => available[0]?.id ?? 0)
  const [frequency, setFrequency] = useState<RecurringFrequency>('monthly')
  const [interval, setInterval] = useState(1)
  const [endDate, setEndDate] = useState('')
  const [editing, setEditing] = useState<RecurringExpense | null>(null)
  const [editFrequency, setEditFrequency] = useState<RecurringFrequency>('monthly')
  const [editInterval, setEditInterval] = useState(1)
  const [editEndDate, setEditEndDate] = useState('')
  const [editType, setEditType] = useState<'expense' | 'income' | 'offset'>('expense')
  const [editAmount, setEditAmount] = useState('')
  const [editTitle, setEditTitle] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPayer, setEditPayer] = useState('')
  const [editMemo, setEditMemo] = useState('')

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onClose() }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [busy, onClose])

  const beginEdit = (rule: RecurringExpense) => {
    setEditing(rule)
    setEditFrequency(rule.frequency)
    setEditInterval(rule.interval_count)
    setEditEndDate(rule.end_date ?? '')
    setEditType(rule.category.startsWith('80_') ? 'income' : rule.amount < 0 ? 'offset' : 'expense')
    setEditAmount(String(Math.abs(rule.amount)))
    setEditTitle(rule.title)
    setEditCategory(rule.category)
    setEditPayer(rule.payer ?? '')
    setEditMemo(rule.memo ?? '')
  }

  const visibleCategories = categories.filter((item) => editType === 'income' ? item.name.startsWith('80_') : !item.name.startsWith('80_'))
  const selectedEditCategory = visibleCategories.some((item) => item.name === editCategory) ? editCategory : (visibleCategories[0]?.name ?? editCategory)

  const submitNew = (event: React.FormEvent) => {
    event.preventDefault()
    void onCreate({ source_expense_id: sourceId || available[0]?.id, frequency, interval_count: interval, end_date: endDate || null })
  }

  const submitEdit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing) return
    void onUpdate({ id: editing.id, frequency: editFrequency, interval_count: editInterval, end_date: editEndDate || null, amount: Number(editAmount), title: editTitle, category: selectedEditCategory, payer: editPayer.trim() || null, memo: editMemo.trim() || null, type: editType }).then((saved) => { if (saved) setEditing(null) })
  }

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onClose() }}>
    <section className="entry-modal recurring-modal" role="dialog" aria-modal="true" aria-labelledby="recurring-title">
      <div className="entry-modal-head"><div><p className="eyebrow">Recurring transactions</p><h2 id="recurring-title">定期登録を管理</h2></div><button type="button" className="modal-close" aria-label="家計簿へ戻る" onClick={onClose} disabled={busy}>×</button></div>
      <div className="recurring-body">
        <div className="recurring-section-head"><div><h3>登録中のルール</h3><p>毎日0:10（日本時間）にSupabaseで自動反映します。PCの電源は不要です。</p></div><button type="button" className="secondary-button" onClick={onRun} disabled={busy}>今すぐ反映</button></div>
        <div className="recurring-list">
          {rules.length === 0 && <p className="recurring-empty">まだ定期登録はありません。</p>}
          {rules.map((rule) => <article className="recurring-rule" key={rule.id}>
            <div className="recurring-rule-main"><strong>{rule.title}</strong><span>{frequencyLabels[rule.frequency]}{rule.interval_count > 1 ? `（${rule.interval_count}${rule.frequency === 'monthly' ? 'か月' : rule.frequency === 'weekly' ? '週' : '日'}ごと）` : ''} · 次回 {rule.next_run_date}</span><small>{categoryLabel(rule.category)} · {formatYen(Math.abs(rule.amount))} · 最終生成 {lastRunLabel(rule.last_generated_at)}</small></div>
            <div className="recurring-rule-actions"><button type="button" className="rule-edit" onClick={() => beginEdit(rule)} disabled={busy}>編集</button><button type="button" className={rule.active ? 'rule-active' : 'rule-paused'} onClick={() => onToggle(rule)} disabled={busy}>{rule.active ? '有効' : '停止中'}</button></div>
          </article>)}
        </div>

        {editing && <form onSubmit={submitEdit} className="recurring-edit-form">
          <div className="recurring-section-head"><div><h3>「{editing.title}」を編集</h3><p>変更後の次回日は、今日より後の最初の予定日に再計算します。</p></div><button type="button" className="text-button" onClick={() => setEditing(null)} disabled={busy}>編集を閉じる</button></div>
          <div className="type-switch" role="group" aria-label="収支の種別"><button type="button" className={editType === 'expense' ? 'active' : ''} onClick={() => setEditType('expense')}>支出</button><button type="button" className={editType === 'income' ? 'active' : ''} onClick={() => setEditType('income')}>収入</button><button type="button" className={editType === 'offset' ? 'active' : ''} onClick={() => setEditType('offset')}>支出の相殺</button></div>
          <div className="entry-grid">
            <label className="entry-field"><span>頻度</span><select value={editFrequency} onChange={(event) => setEditFrequency(event.target.value as RecurringFrequency)}><option value="daily">毎日</option><option value="weekly">毎週</option><option value="monthly">毎月</option></select></label>
            <label className="entry-field"><span>間隔</span><input type="number" min="1" max="365" value={editInterval} onChange={(event) => setEditInterval(Number(event.target.value))} required /></label>
            <label className="entry-field"><span>金額</span><input type="number" min="1" max="1000000000" value={editAmount} onChange={(event) => setEditAmount(event.target.value)} required /></label>
            <label className="entry-field"><span>終了日（任意）</span><input type="date" min={editing.start_date} value={editEndDate} onChange={(event) => setEditEndDate(event.target.value)} /></label>
            <label className="entry-field full-field"><span>内容</span><input type="text" maxLength={200} value={editTitle} onChange={(event) => setEditTitle(event.target.value)} required /></label>
            <label className="entry-field"><span>カテゴリ</span><select value={selectedEditCategory} onChange={(event) => setEditCategory(event.target.value)} required>{visibleCategories.map((item) => <option key={item.id} value={item.name}>{categoryLabel(item.name)}</option>)}</select></label>
            <label className="entry-field"><span>支払者</span><input type="text" maxLength={100} value={editPayer} onChange={(event) => setEditPayer(event.target.value)} /></label>
            <label className="entry-field full-field"><span>メモ</span><textarea rows={2} maxLength={2000} value={editMemo} onChange={(event) => setEditMemo(event.target.value)} /></label>
          </div>
          {error && <p className="entry-error" role="alert">{error}</p>}
          <div className="entry-actions"><button type="button" className="secondary-button" onClick={() => setEditing(null)} disabled={busy}>キャンセル</button><button type="submit" className="primary-button" disabled={busy}>{busy ? '保存中…' : '変更を保存'}</button></div>
        </form>}

        {!editing && <form onSubmit={submitNew}>
          <div className="recurring-section-head"><div><h3>{septemberFirst[0]?.transaction_date ?? '9月1日'}の明細から追加</h3><p>元の明細を初回分として扱うため、同じ日付には重複登録しません。</p></div></div>
          {available.length === 0 ? <p className="recurring-empty">追加できる9月1日の明細はありません。</p> : <div className="entry-grid">
            <label className="entry-field full-field"><span>対象明細</span><select value={sourceId || available[0].id} onChange={(event) => setSourceId(Number(event.target.value))}>{available.map((item) => <option value={item.id} key={item.id}>{item.transaction_date} · {item.title} · {formatYen(Math.abs(item.amount))}</option>)}</select></label>
            <label className="entry-field"><span>頻度</span><select value={frequency} onChange={(event) => setFrequency(event.target.value as RecurringFrequency)}><option value="daily">毎日</option><option value="weekly">毎週</option><option value="monthly">毎月</option></select></label>
            <label className="entry-field"><span>間隔</span><input type="number" min="1" max="365" value={interval} onChange={(event) => setInterval(Number(event.target.value))} /></label>
            <label className="entry-field full-field"><span>終了日（任意）</span><input type="date" min={septemberFirst[0]?.transaction_date} value={endDate} onChange={(event) => setEndDate(event.target.value)} /></label>
          </div>}
          {error && <p className="entry-error" role="alert">{error}</p>}
          <div className="entry-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={busy}>家計簿へ戻る</button><button type="submit" className="primary-button" disabled={busy || available.length === 0}>{busy ? '処理中…' : '定期登録に追加'}</button></div>
        </form>}
      </div>
    </section>
  </div>
}
