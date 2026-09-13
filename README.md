# 家計簿ダッシュボード

Supabase の `budget_categories` / `expenses` テーブルを使った家計簿ダッシュボードのプロトタイプです。

## セットアップ

```bash
npm install
cp .env.example .env
# .env に Supabase の URL と anon key を設定
npm run dev
```

`.env` の中身:

```
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 機能

- 月別支出推移(折れ線グラフ)
- カテゴリ別支出割合(円グラフ)
- 支出一覧(カテゴリ・支払者・期間で絞り込み)
- 今月/先月の合計サマリーカード

## 技術スタック

- React + Vite + TypeScript
- Tailwind CSS v4
- Supabase JS Client
- Recharts
