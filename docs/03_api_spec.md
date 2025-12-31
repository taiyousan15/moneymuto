# API仕様書

## エンドポイント一覧

| Method | Path | 説明 |
|--------|------|------|
| POST | `/api/diagnosis` | 診断結果送信 |
| GET | `/api/diagnosis/[id]` | 診断結果取得 |
| POST | `/api/line/webhook` | LINE Webhook |
| POST | `/api/cron/digest` | ダイジェスト配信 (cron) |
| POST | `/api/cron/step` | ステップ配信 (cron) |

---

## POST /api/diagnosis

診断回答を送信し、結果を取得する。

### Request

```typescript
{
  answers: {
    questionId: string;
    optionId: string;
  }[];
}
```

### Response

```typescript
// 200 OK
{
  id: string;
  type: 'conservative' | 'balanced' | 'aggressive' | 'learner';
  typeName: string;  // 日本語名
  scores: {
    safety: number;
    growth: number;
    knowledge: number;
    action: number;
  };
  advice: string[];
  linkCode: string;
  linkCodeExpiresAt: string;  // ISO8601
}
```

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 400 | INVALID_ANSWERS | 回答形式が不正 |
| 400 | MISSING_ANSWERS | 必須の質問に未回答 |

---

## GET /api/diagnosis/[id]

診断結果を取得する。

### Parameters

| Name | Type | Description |
|------|------|-------------|
| id | string | 診断ID (UUID) |

### Response

```typescript
// 200 OK
{
  id: string;
  type: string;
  typeName: string;
  scores: {...};
  advice: string[];
  createdAt: string;
}
```

### Errors

| Status | Code | Description |
|--------|------|-------------|
| 404 | NOT_FOUND | 診断結果が見つからない |

---

## POST /api/line/webhook

LINE Messaging APIからのWebhook受信。

### Headers

```
X-Line-Signature: <signature>
```

### Request

LINE Webhook Event形式
https://developers.line.biz/ja/reference/messaging-api/#webhook-event-objects

### Response

```typescript
// 200 OK
{}
```

### 処理フロー

#### follow イベント
1. ユーザーをDBに登録
2. ウェルカムメッセージ送信
3. リンクコード入力を案内

#### message イベント (text)
1. テキストがリンクコード形式かチェック
2. リンクコードの場合:
   - 診断結果と紐付け
   - 紐付け完了メッセージ送信
   - ステップ配信開始
3. それ以外:
   - ヘルプメッセージ送信

#### unfollow イベント
1. ユーザーステータスを `unfollowed` に更新

---

## POST /api/cron/digest

ダイジェスト配信を実行（Vercel Cron または手動呼び出し）。

### Headers

```
Authorization: Bearer <CRON_SECRET>
```

### Request

```typescript
{
  dryRun?: boolean;  // true の場合は実際に送信しない
}
```

### Response

```typescript
// 200 OK
{
  processed: number;
  sent: number;
  failed: number;
  errors: {
    userId: string;
    error: string;
  }[];
}
```

### 処理フロー

1. アクティブユーザー一覧を取得
2. 各ユーザーに対して:
   - RSSフィードから最新記事を取得
   - Claude APIで要約生成
   - LINEメッセージ送信
   - 配信ログ記録

---

## POST /api/cron/step

ステップメッセージ配信を実行。

### Headers

```
Authorization: Bearer <CRON_SECRET>
```

### Response

```typescript
// 200 OK
{
  processed: number;
  sent: number;
  completed: number;  // 10日目完了したユーザー
}
```

### 処理フロー

1. ステップ配信対象ユーザーを取得
   - `stepDay < 10`
   - `lastStepAt` から24時間以上経過
2. 各ユーザーに対して:
   - タイプ別ステップメッセージを送信
   - `stepDay` をインクリメント
   - `lastStepAt` を更新

---

## 共通エラーレスポンス

```typescript
{
  error: {
    code: string;
    message: string;
    details?: any;
  }
}
```

## 認証

### LINE Webhook署名検証

```typescript
import crypto from 'crypto';

function verifySignature(body: string, signature: string, secret: string): boolean {
  const hash = crypto
    .createHmac('SHA256', secret)
    .update(body)
    .digest('base64');
  return hash === signature;
}
```

### Cron認証

```typescript
function verifyCronSecret(request: Request): boolean {
  const auth = request.headers.get('Authorization');
  return auth === `Bearer ${process.env.CRON_SECRET}`;
}
```
