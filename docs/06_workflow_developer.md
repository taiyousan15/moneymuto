# 開発者ワークフロー

## 開発環境セットアップ

### 1. リポジトリクローン

```bash
git clone <repo-url>
cd taisun_agent/projects/money-onboarding
```

### 2. 依存関係インストール

```bash
# ルートでインストール
npm install

# 各パッケージで個別インストール（必要に応じて）
cd packages/core && npm install
cd apps/web && npm install
cd services/worker && npm install
```

### 3. 環境変数設定

```bash
cp .env.example .env
# .env を編集
```

### 4. データベースセットアップ

```bash
# PostgreSQL起動（Docker推奨）
docker run -d \
  --name money-onboarding-db \
  -e POSTGRES_USER=dev \
  -e POSTGRES_PASSWORD=dev \
  -e POSTGRES_DB=money_onboarding \
  -p 5432:5432 \
  postgres:15

# マイグレーション実行
cd db
npx prisma migrate dev

# シードデータ投入（任意）
npx tsx seed.ts
```

### 5. 開発サーバー起動

```bash
# Webアプリ
cd apps/web
npm run dev
# → http://localhost:3000

# ワーカー（別ターミナル）
cd services/worker
npm run dev
```

## 開発フロー

### ブランチ戦略

```
main
  └── develop
        ├── feature/xxx
        ├── fix/xxx
        └── docs/xxx
```

### コミットメッセージ

```
<type>(<scope>): <subject>

# Types:
# feat: 新機能
# fix: バグ修正
# docs: ドキュメント
# style: フォーマット
# refactor: リファクタリング
# test: テスト
# chore: ビルド/ツール

# Examples:
feat(diagnosis): add scoring algorithm
fix(line): handle webhook timeout
docs(api): update endpoint documentation
```

## ローカルテスト

### ユニットテスト

```bash
npm test
```

### 特定テストのみ

```bash
npm test -- --grep "diagnosis"
```

### カバレッジ

```bash
npm run test:coverage
```

## LINE開発

### ngrokでローカル公開

```bash
# ngrokインストール
brew install ngrok

# トンネル作成
ngrok http 3000
# → https://xxxx.ngrok.io

# LINE Developerコンソールで設定
# Webhook URL: https://xxxx.ngrok.io/api/line/webhook
```

### テストメッセージ送信

```bash
cd scripts
npx tsx send_test_message.ts
```

### Webhook確認

```bash
# LINE Developerコンソールの「検証」ボタン
# または curl:
curl -X POST https://xxxx.ngrok.io/api/line/webhook \
  -H "Content-Type: application/json" \
  -H "X-Line-Signature: test" \
  -d '{"events":[]}'
```

## デバッグ

### ログ確認

```bash
# アプリログ
tail -f apps/web/.next/server/logs/*.log

# Prismaクエリログ
DATABASE_URL="..." npx prisma studio
```

### DBデータ確認

```bash
npx prisma studio
# → http://localhost:5555
```

## デプロイ

### ステージング

```bash
# Vercelプレビュー
git push origin feature/xxx
# → 自動でプレビューURLが発行される
```

### 本番

```bash
# mainにマージ
git checkout main
git merge develop
git push origin main
# → 自動デプロイ
```

### 手動デプロイ

```bash
vercel deploy --prod
```

## トラブルシューティング

### Prismaエラー

```bash
# スキーマ再生成
npx prisma generate

# DBリセット（開発環境のみ）
npx prisma migrate reset
```

### ビルドエラー

```bash
# キャッシュクリア
rm -rf .next node_modules/.cache
npm run build
```

### LINE Webhookエラー

1. 署名検証失敗 → `LINE_CHANNEL_SECRET` 確認
2. タイムアウト → 処理を非同期化
3. 再試行ループ → 即座に200を返す

## コード規約

### TypeScript

- strictモード有効
- any禁止（eslint警告）
- 型定義は `types.ts` にまとめる

### ファイル構成

```
feature/
├── index.ts        # エクスポート
├── types.ts        # 型定義
├── feature.ts      # メインロジック
├── feature.test.ts # テスト
└── utils.ts        # ユーティリティ（必要に応じて）
```

### Prisma

- モデル名: PascalCase
- フィールド名: camelCase
- リレーション: 明示的に定義

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/ci.yml で自動実行
- Lint
- TypeCheck
- Test
- Build
```

### Vercel

- `main` → 本番環境
- その他ブランチ → プレビュー環境
