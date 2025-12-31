# Money Onboarding System

お金の診断アプリ - LINE連携型オンボーディングシステム

## 概要

ユーザーの金融リテラシーを診断し、パーソナライズされたコンテンツを配信するシステム。

### 主要機能

1. **診断機能**: 10問の質問でユーザーの金融タイプを診断
2. **LINE連携**: 診断結果をLINEに送信、ステップ配信で教育コンテンツを提供
3. **ダイジェスト配信**: RSSフィードから金融ニュースを要約して定期配信

## 技術スタック

- **Frontend**: Next.js 15 (App Router)
- **Database**: PostgreSQL + Prisma
- **LINE**: LINE Messaging API
- **AI**: Claude API (要約・コンテンツ生成)
- **Hosting**: Vercel

## プロジェクト構成

```
money-onboarding/
├── docs/                    # ドキュメント
├── config/                  # 設定ファイル
├── db/                      # データベース (Prisma)
├── packages/core/           # 共有ライブラリ (診断ロジック)
├── apps/web/                # Next.js Webアプリ
├── services/worker/         # バックグラウンドワーカー
├── scripts/                 # ユーティリティスクリプト
└── tests/                   # 統合テスト
```

## クイックスタート

```bash
# 依存関係インストール
npm install

# 環境変数設定
cp .env.example .env
# .env を編集

# データベースセットアップ
npx prisma migrate dev

# 開発サーバー起動
npm run dev
```

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `DATABASE_URL` | PostgreSQL接続URL |
| `LINE_CHANNEL_SECRET` | LINE Channel Secret |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Channel Access Token |
| `ANTHROPIC_API_KEY` | Claude API Key |

## ドキュメント

- [00_overview.md](docs/00_overview.md) - システム概要
- [01_requirements.md](docs/01_requirements.md) - 要件定義
- [02_specifications.md](docs/02_specifications.md) - 仕様書
- [03_api_spec.md](docs/03_api_spec.md) - API仕様
- [04_db_design.md](docs/04_db_design.md) - DB設計
- [05_workflow_user.md](docs/05_workflow_user.md) - ユーザーフロー
- [06_workflow_developer.md](docs/06_workflow_developer.md) - 開発者フロー
- [07_runbook.md](docs/07_runbook.md) - 運用手順書
- [08_copy_and_line_messages.md](docs/08_copy_and_line_messages.md) - コピー・LINEメッセージ

## 開発

```bash
# テスト実行
npm test

# 型チェック
npm run typecheck

# Lint
npm run lint
```

## デプロイ

```bash
# Vercelデプロイ
vercel deploy --prod
```

---

Built with TAISUN v2
