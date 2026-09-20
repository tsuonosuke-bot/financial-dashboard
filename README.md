# 家計簿ダッシュボード

Supabaseの `budget_categories` / `expenses` テーブルを使った、自分専用の家計簿ダッシュボードです。
ナレッジDB Webアプリと同様に、ブラウザはSupabaseへ直接接続しません。

```text
Browser --Basic認証 / Cloudflare Access--> Cloudflare Pages Functions --Secret key--> Supabase REST API
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
| `DASHBOARD_PASSWORD` | Basic時 | 閲覧用パスワード（ASCIIのみ） |
| `DASHBOARD_USER` | 任意 | 閲覧用ユーザー名。既定は `admin` |
| `AUTH_MODE` | 任意 | `basic`（既定）または `access` |
| `TEAM_DOMAIN` | Access時 | `https://<team>.cloudflareaccess.com` |
| `POLICY_AUD` | Access時 | Access Application Audience tag |
| `HUB_SERVICE_TOKEN` | Hub連携時 | Hubから家計簿GET APIだけを許可する共有secret |
| `SSO_SHARED_SECRET` | Hub連携時 | Hubからの署名付き認証引き継ぎを検証する共有secret |
| `SESSION_TTL_DAYS` | 任意 | 引き継いだセッションの日数。既定30 |
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
- 複数カテゴリの包含・除外（すべて選択・すべて解除に対応）、支払者による画面全体の絞り込み（月との組み合わせに対応）
- 選択月の支出・収入・収支・収支前月比
- 選択月までの12か月の収支推移（支出はカテゴリ別の積み上げ表示）
- 選択月のカテゴリ別支出内訳
- 選択月の収支明細（検索・期間・収支種別・金額範囲・並び順フィルター）
- 支出・収入・支出相殺の新規登録
- 既存明細の編集（他画面で変更されたレコードは競合として停止）
- `budget_categories` をカテゴリマスターとして使用

`80_収入` カテゴリの行は収入として扱います。それ以外のカテゴリでは、正の金額を支出、負の金額を同じカテゴリの支出に対する相殺として集計します。

## データとAPI

Supabaseプロジェクト `plwlxwidpqbunugfxjhp` の次のテーブルを参照します。

- `budget_categories(id, name, notion_url)`
- `expenses(id, transaction_date, amount, title, category, payer, memo, notion_url, notion_created_at, created_at)`

画面は同一オリジンAPIから全ページを取得し、認証済み画面から家計簿を1件ずつ登録します。

- `GET /api/expenses`
- `POST /api/expenses`
- `PATCH /api/expenses`
- `GET /api/budget-categories`

APIは取得列、並び順、対象テーブル、1回あたり最大1,000件をサーバー側で固定しています。
登録・編集時は同一オリジン・専用ヘッダー・JSON形式・日付・金額・文字数・許可項目を検証します。収入は金額を負数へ正規化して保存します。編集時は編集前の値も照合し、別画面で変更済みの場合は409を返して上書きを止めます。

> [!NOTE]
> `anon` の読み取り権限は無効化済みです。ブラウザはCloudflare Pages Functions経由でのみデータを取得します。

## セキュリティ構成

`functions/_middleware.ts` が静的ファイルとAPIを含むサイト全体をBasic認証またはCloudflare Accessで保護します。
`DASHBOARD_PASSWORD` が未設定の場合は503で閉じ、認証後もキャッシュ、外部スクリプト、
iframe埋め込み、検索エンジン登録を禁止します。

`AUTH_MODE=access` では `Cf-Access-Jwt-Assertion` の署名・issuer・audienceを検証します。
Personal Hubと他のダッシュボードを同じAccess applicationに登録すると、1回のログインで移動できます。

`AUTH_MODE=basic` では、Personal Hubと同じ `SSO_SHARED_SECRET` を設定すると署名付き引き継ぎを受け付け、対象ホストに固定したHttpOnlyセッションを作成します。`HUB_SERVICE_TOKEN` は `GET /api/expenses` のみに使え、他のAPIやメソッドはBasic認証を要求します。

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
