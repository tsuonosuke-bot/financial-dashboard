import { categoryLabel, type CategoryFilterMode } from '../lib/finance'

type Props = {
  categories: string[]
  selected: string[]
  mode: CategoryFilterMode
  onModeChange: (mode: CategoryFilterMode) => void
  onToggle: (category: string) => void
  onClear: () => void
}

function summaryLabel(selected: string[], mode: CategoryFilterMode) {
  if (selected.length === 0) return 'すべてのカテゴリ'
  if (selected.length === 1) return `${categoryLabel(selected[0])}を${mode === 'include' ? '含む' : '除外'}`
  return `${selected.length}カテゴリを${mode === 'include' ? '含む' : '除外'}`
}

export function CategoryFilter({ categories, selected, mode, onModeChange, onToggle, onClear }: Props) {
  return (
    <details className="category-filter">
      <summary aria-label="カテゴリ条件を開く">
        <span>{summaryLabel(selected, mode)}</span>
        <span aria-hidden="true">⌄</span>
      </summary>
      <div className="category-filter-popover">
        <div className="category-mode" role="group" aria-label="カテゴリの絞り込み方法">
          <button type="button" aria-pressed={mode === 'include'} className={mode === 'include' ? 'active' : ''} onClick={() => onModeChange('include')}>含める</button>
          <button type="button" aria-pressed={mode === 'exclude'} className={mode === 'exclude' ? 'active' : ''} onClick={() => onModeChange('exclude')}>除外する</button>
        </div>
        <p className="category-filter-help">チェックしたカテゴリを{mode === 'include' ? '表示します' : '一覧と集計から除きます'}</p>
        <div className="category-options">
          {categories.map((category) => (
            <label key={category}>
              <input
                type="checkbox"
                aria-label={categoryLabel(category)}
                checked={selected.includes(category)}
                onChange={() => onToggle(category)}
              />
              <span>{categoryLabel(category)}</span>
            </label>
          ))}
        </div>
        <div className="category-filter-footer">
          <span>{selected.length ? `${selected.length}件選択中` : '選択なし'}</span>
          <button type="button" onClick={onClear} disabled={selected.length === 0}>選択をクリア</button>
        </div>
      </div>
    </details>
  )
}
