import { useEffect, useMemo, useState } from 'react'
import { categoryLabel } from '../lib/finance'
import type { BudgetCategory, ExpenseDraft } from '../lib/types'

type Props = {
  categories: BudgetCategory[]
  payers: string[]
  saving: boolean
  error: string | null
  onClose: () => void
  onSave: (draft: ExpenseDraft) => void
}

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function ExpenseFormModal({ categories, payers, saving, error, onClose, onSave }: Props) {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [date, setDate] = useState(todayKey)
  const [amount, setAmount] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [payer, setPayer] = useState('')
  const [memo, setMemo] = useState('')

  const visibleCategories = useMemo(() => {
    const matching = categories.filter((item) => type === 'income' ? item.name.startsWith('80_') : !item.name.startsWith('80_'))
    return matching.length ? matching : categories
  }, [categories, type])

  const selectedCategory = visibleCategories.some((item) => item.name === category)
    ? category
    : (visibleCategories[0]?.name || '')

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose() }
    document.addEventListener('keydown', close)
    return () => document.removeEventListener('keydown', close)
  }, [onClose, saving])

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    onSave({
      transaction_date: date,
      amount: Number(amount),
      title,
      category: selectedCategory,
      payer: payer.trim() || null,
      memo: memo.trim() || null,
      type,
    })
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget && !saving) onClose() }}>
      <section className="entry-modal" role="dialog" aria-modal="true" aria-labelledby="expense-modal-title">
        <div className="entry-modal-head">
          <div><p className="eyebrow">New transaction</p><h2 id="expense-modal-title">家計簿を記録</h2></div>
          <button type="button" className="modal-close" aria-label="閉じる" onClick={onClose} disabled={saving}>×</button>
        </div>
        <form onSubmit={submit}>
          <div className="type-switch" role="group" aria-label="収支の種別">
            <button type="button" className={type === 'expense' ? 'active' : ''} onClick={() => setType('expense')}>支出</button>
            <button type="button" className={type === 'income' ? 'active' : ''} onClick={() => setType('income')}>収入</button>
          </div>
          <div className="entry-grid">
            <label className="entry-field"><span>日付 <b>必須</b></span><input type="date" value={date} onChange={(event) => setDate(event.target.value)} required /></label>
            <label className="entry-field"><span>金額 <b>必須</b></span><div className="amount-field"><span>¥</span><input type="number" min="1" max="1000000000" step="1" inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="0" autoFocus required /></div></label>
            <label className="entry-field full-field"><span>内容 <b>必須</b></span><input type="text" maxLength={200} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例: スーパー、給与" required /></label>
            <label className="entry-field"><span>カテゴリ <b>必須</b></span><select value={selectedCategory} onChange={(event) => setCategory(event.target.value)} required>{visibleCategories.map((item) => <option key={item.id} value={item.name}>{categoryLabel(item.name)}</option>)}</select></label>
            <label className="entry-field"><span>支払者</span><input type="text" maxLength={100} list="payer-options" value={payer} onChange={(event) => setPayer(event.target.value)} placeholder="任意" /><datalist id="payer-options">{payers.map((item) => <option key={item} value={item} />)}</datalist></label>
            <label className="entry-field full-field"><span>メモ</span><textarea rows={3} maxLength={2000} value={memo} onChange={(event) => setMemo(event.target.value)} placeholder="任意" /></label>
          </div>
          {error && <p className="entry-error" role="alert">{error}</p>}
          <div className="entry-actions"><button type="button" className="secondary-button" onClick={onClose} disabled={saving}>キャンセル</button><button type="submit" className="primary-button" disabled={saving}>{saving ? '保存中…' : '保存する'}</button></div>
        </form>
      </section>
    </div>
  )
}
