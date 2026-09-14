# 家計簿ダッシュボード

Supabaseの `budget_categories` / `expenses` テーブルを使った、自分専用の家計簿ダッシュボードです。
ナレッジDB Webアプリと同様に、ブラウザはSupabaseへ直接接続しません。

```text
Browser --Basic認証--> Cloudflare Pages Functions --Secret key--> Supabase REST API
```

## セットアップ

```bash
npm install
cp .dev.vars.example .dev.vars
# .dev.vars に認証情報とサーバー専用Supabase接続情報を設定
npm run dev:pages
```

`npm run dev:pages` はFunctionsを含むサイトを `http://localhost:8788` で起動します。
`.dev.vars` はGit管理外です。Secret keyやパスワードをコミットしないでください。

実データへ接続せずUIだけを確認する場合：

```bash
cp .env.example .env.local
npm run dev
```

## 実行時の環境変数

| 変数 | 必須 | 説明 |
| --- | --- | --- |
| `DASHBOARD_PASSWORD` | 必須 | 閲覧用パスワード（ASCIIのみ） |
| `DASHBOARD_USER` | 任意 | 閲覧用ユーザー名。既定は `admin` |
| `SUPABASE_URL` | 必須 | `knowledge-db` のプロジェクトURL |
| `SUPABASE_SECRET_KEY` | 必須 | Cloudflare Functionsだけが使う `sb_secret_...` キー |

`SUPABASE_SECRET_KEY` は強い権限を持つため、Cloudflareでは暗号化されたSecretとして保存します。
`VITE_` 変数には設定せず、ブラウザのJavaScriptやログへ出さないでください。

## 開発コマンド

```bash
npm run dev       # UIのみの開発サーバー
npm run dev:pages # Functions込みのローカルサーバー
npm run build     # 型チェック + 本番ビルド
npm run lint      # oxlint
npm test          # API・認証・入力検証
npm run preview   # ビルド成果物のプレビュー
```

## 機能

- 表示月の選択（ドロップダウン・前月／翌月ボタン）
- 選択月の支出・収入・収支・前月差
- 選択月までの12か月の収支推移
- 選択月のカテゴリ別支出内訳
- 選択月の収支明細（検索・カテゴリ・支払者・期間フィルター）
- `budget_categories` をカテゴリマスターとして使用

金額が正の行は支出、負の行または `80_収入` カテゴリの行は収入として扱います。

## データとAPI

Supabaseプロジェクト `plwlxwidpqbunugfxjhp` の次のテーブルを参照します。

- `budget_categories(id, name, notion_url)`
- `expenses(id, transaction_date, amount, title, category, payer, memo, notion_url, notion_created_at, created_at)`

画面は同一オリジンの読み取り専用APIから全ページを取得します。

- `GET /api/expenses`
- `GET /api/budget-categories`

APIは取得列、並び順、対象テーブル、1回あたり最大1,000件をサーバー側で固定しています。
POSTなどの書き込みメソッドは受け付けません。

> [!WARNING]
> 現在のanon読み取り権限は、Functions版の本番表示確認後に `supabase/disable-anon-access.sql` で無効化します。SQLを先に実行すると、移行前の画面が停止します。

## セキュリティ構成

`functions/_middleware.ts` が静的ファイルとAPIを含むサイト全体をBasic認証で保護します。
`DASHBOARD_PASSWORD` が未設定の場合は503で閉じ、認証後もキャッシュ、外部スクリプト、
iframe埋め込み、検索エンジン登録を禁止します。

FunctionsだけがSupabase Secret keyを保持し、ブラウザへは必要な列だけを返します。
受信データも画面側で型・必須値・ページ情報を検証します。

## 技術スタック

- React + Vite + TypeScript
- Tailwind CSS v4
- Cloudflare Pages Functions
- Supabase REST API
- Recharts

## Cloudflare Pagesへのデプロイ

ナレッジDBと同じCloudflare PagesのGitHub連携方式を想定します。

| 項目 | 値 |
| --- | --- |
| Framework preset | **None** |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | `.node-version`（22） |

Cloudflare PagesのProductionとPreviewの両方へ、上記4つの環境変数を設定します。
`DASHBOARD_PASSWORD` と `SUPABASE_SECRET_KEY` はSecretとして保存してください。

移行は次の順番で行います。

1. Cloudflare PagesプロジェクトをGitHubリポジトリへ接続する。
2. Previewへ環境変数を設定し、Basic認証後に実データ表示を確認する。
3. Productionへ同じ構成を設定してデプロイする。
4. 本番の件数・最新取引・月別集計をSupabaseと照合する。
5. `supabase/disable-anon-access.sql` を実行する。
6. 本番表示を再確認し、旧anon keyからのSELECTが拒否されることを確認する。
