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

## 開発コマンド

```bash
npm run dev      # 開発サーバー起動
npm run build    # 型チェック + 本番ビルド
npm run lint     # oxlint
npm run preview  # ビルド成果物のプレビュー
```

## 機能

- 月別支出推移(折れ線グラフ)
- カテゴリ別支出割合(円グラフ)
- 支出一覧(カテゴリ・支払者・期間で絞り込み)
- 今月/先月の合計サマリーカード

## データソース

Supabase(プロジェクトID: `plwlxwidpqbunugfxjhp`)の以下のテーブルを参照します。

- `budget_categories(id, name, notion_url)`
- `expenses(id, transaction_date, amount, title, category, payer, memo, notion_url, notion_created_at, created_at)`

いずれも anon ロールで SELECT 可能な RLS ポリシーが設定済みです。

## 技術スタック

- React + Vite + TypeScript
- Tailwind CSS v4
- Supabase JS Client
- Recharts

## デプロイ

現時点ではホスティング先未設定のプロトタイプです。Vercel / Netlify など GitHub 連携型のホスティングへデプロイする場合は、対象サービスでこのリポジトリを連携し、環境変数 `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` をビルド設定に登録してください。
