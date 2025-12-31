# データベース設計

## ER図

```
┌─────────────────┐       ┌─────────────────┐
│     users       │       │   diagnoses     │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │───┐   │ id (PK)         │
│ lineUserId      │   │   │ userId (FK)     │◄──┐
│ displayName     │   └──▶│ type            │   │
│ diagnosisId(FK) │───────│ scores (JSON)   │   │
│ linkCode        │       │ answers (JSON)  │   │
│ linkCodeExpires │       │ createdAt       │   │
│ stepDay         │       └─────────────────┘   │
│ lastStepAt      │                             │
│ status          │       ┌─────────────────┐   │
│ createdAt       │       │ delivery_logs   │   │
│ updatedAt       │       ├─────────────────┤   │
└─────────────────┘       │ id (PK)         │   │
         │                │ userId (FK)     │───┘
         │                │ type            │
         └───────────────▶│ day             │
                          │ content         │
                          │ sentAt          │
                          │ status          │
                          │ error           │
                          └─────────────────┘

┌─────────────────┐
│  feed_articles  │
├─────────────────┤
│ id (PK)         │
│ feedUrl         │
│ title           │
│ url             │
│ summary         │
│ publishedAt     │
│ fetchedAt       │
└─────────────────┘
```

## テーブル定義

### users

ユーザー情報を管理。

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | 主キー |
| lineUserId | VARCHAR(64) | Yes | NULL | LINE ユーザーID |
| displayName | VARCHAR(128) | Yes | NULL | LINE 表示名 |
| diagnosisId | UUID | Yes | NULL | 診断結果への参照 |
| linkCode | CHAR(8) | Yes | NULL | 紐付け用コード |
| linkCodeExpiresAt | TIMESTAMP | Yes | NULL | リンクコード有効期限 |
| stepDay | INTEGER | No | 0 | ステップ配信日 (0-10) |
| lastStepAt | TIMESTAMP | Yes | NULL | 最終ステップ配信日時 |
| status | VARCHAR(16) | No | 'pending' | pending/linked/unfollowed |
| createdAt | TIMESTAMP | No | NOW() | 作成日時 |
| updatedAt | TIMESTAMP | No | NOW() | 更新日時 |

**Indexes:**
- `lineUserId` (UNIQUE)
- `linkCode` (UNIQUE, WHERE linkCode IS NOT NULL)
- `status, stepDay` (配信対象検索用)

### diagnoses

診断結果を保存。

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | 主キー |
| userId | UUID | Yes | NULL | ユーザーへの参照 |
| type | VARCHAR(16) | No | - | conservative/balanced/aggressive/learner |
| scores | JSONB | No | - | スコア詳細 |
| answers | JSONB | No | - | 回答データ |
| createdAt | TIMESTAMP | No | NOW() | 診断日時 |

**Indexes:**
- `userId`
- `type`
- `createdAt`

### delivery_logs

配信履歴を記録。

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | 主キー |
| userId | UUID | No | - | ユーザーへの参照 |
| type | VARCHAR(16) | No | - | step/digest |
| day | INTEGER | Yes | NULL | ステップ日 (1-10) |
| content | TEXT | No | - | 送信内容 |
| sentAt | TIMESTAMP | No | NOW() | 送信日時 |
| status | VARCHAR(16) | No | - | sent/failed |
| error | TEXT | Yes | NULL | エラー内容 |

**Indexes:**
- `userId, type`
- `sentAt`

### feed_articles

RSSフィードから取得した記事。

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| id | UUID | No | uuid_generate_v4() | 主キー |
| feedUrl | VARCHAR(512) | No | - | フィードURL |
| title | VARCHAR(256) | No | - | 記事タイトル |
| url | VARCHAR(512) | No | - | 記事URL |
| summary | TEXT | Yes | NULL | AI要約 |
| publishedAt | TIMESTAMP | No | - | 記事公開日時 |
| fetchedAt | TIMESTAMP | No | NOW() | 取得日時 |

**Indexes:**
- `url` (UNIQUE)
- `feedUrl, publishedAt`

## Prismaスキーマ

```prisma
// 詳細は db/prisma/schema.prisma を参照
```

## マイグレーション戦略

1. 初期マイグレーション: 全テーブル作成
2. 増分マイグレーション: `prisma migrate dev` で管理
3. 本番適用: `prisma migrate deploy`

## パフォーマンス考慮

### インデックス設計
- 配信対象ユーザー検索を最適化
- LINE ID検索の高速化
- 時系列クエリ対応

### JSONBフィールド
- scores, answers は JSONB で柔軟に保存
- 必要に応じて GIN インデックスを追加可能
