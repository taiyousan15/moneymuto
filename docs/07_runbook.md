# 運用手順書 (Runbook)

## 日常運用

### 1. ヘルスチェック

```bash
# Webアプリ
curl https://your-domain.com/api/health

# 期待レスポンス
{"status":"ok","timestamp":"2024-01-01T00:00:00Z"}
```

### 2. ログ確認

```bash
# Vercelログ
vercel logs --follow

# 特定エラーを検索
vercel logs | grep -i error
```

### 3. DBステータス確認

```sql
-- アクティブユーザー数
SELECT COUNT(*) FROM users WHERE status = 'linked';

-- 今日の診断数
SELECT COUNT(*) FROM diagnoses WHERE createdAt >= CURRENT_DATE;

-- ステップ配信待ちユーザー
SELECT COUNT(*) FROM users
WHERE stepDay < 10
  AND lastStepAt < NOW() - INTERVAL '24 hours';
```

## 定期タスク

### ステップ配信（毎日10:00）

```bash
# 手動実行
curl -X POST https://your-domain.com/api/cron/step \
  -H "Authorization: Bearer $CRON_SECRET"

# 確認
curl https://your-domain.com/api/cron/step/status
```

### ダイジェスト配信（毎週月曜10:00）

```bash
# 手動実行
curl -X POST https://your-domain.com/api/cron/digest \
  -H "Authorization: Bearer $CRON_SECRET"

# ドライラン（送信せず確認）
curl -X POST https://your-domain.com/api/cron/digest \
  -H "Authorization: Bearer $CRON_SECRET" \
  -d '{"dryRun":true}'
```

### RSSフィード更新（毎日6:00）

```bash
curl -X POST https://your-domain.com/api/cron/feeds \
  -H "Authorization: Bearer $CRON_SECRET"
```

## インシデント対応

### LINE配信失敗

#### 症状
- ユーザーにメッセージが届かない
- delivery_logsにfailedが多数

#### 対応
1. LINE APIステータス確認: https://developers.line.biz/status/
2. アクセストークン有効性確認
3. レート制限確認

```bash
# 再送信（特定ユーザー）
curl -X POST https://your-domain.com/api/admin/resend \
  -H "Authorization: Bearer $ADMIN_SECRET" \
  -d '{"userId":"xxx","type":"step","day":3}'
```

### 診断API遅延

#### 症状
- 診断結果表示が遅い（> 3秒）
- タイムアウトエラー

#### 対応
1. Vercel関数ログで処理時間確認
2. DBクエリ確認（Prisma Studio）
3. 一時的に静的結果を返すフォールバック

```bash
# DBパフォーマンス確認
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

### DBディスク容量不足

#### 症状
- 書き込みエラー
- Prisma接続エラー

#### 対応
1. 古いログデータ削除

```sql
-- 90日以上前の配信ログを削除
DELETE FROM delivery_logs WHERE sentAt < NOW() - INTERVAL '90 days';

-- 古い記事データを削除
DELETE FROM feed_articles WHERE fetchedAt < NOW() - INTERVAL '30 days';
```

2. VACUUMで領域回収

```sql
VACUUM FULL;
```

## スケールアップ

### ユーザー増加時

1. **DB接続プール拡大**
```env
DATABASE_URL="postgresql://...?connection_limit=20"
```

2. **Vercel Edge Functions検討**
- 診断APIをEdgeに移行

3. **LINE配信バッチ化**
- 同時送信数を制限

### 負荷分散

1. **リードレプリカ追加**
- 読み取りクエリをレプリカへ

2. **Redis導入**
- セッション、レート制限

## バックアップ・リストア

### 手動バックアップ

```bash
# PostgreSQLダンプ
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql
```

### リストア

```bash
# DBリストア
psql $DATABASE_URL < backup_20240101.sql
```

### 自動バックアップ（Supabase等）
- プロバイダー管理画面で設定

## 障害時連絡先

| 役割 | 担当 | 連絡先 |
|------|------|--------|
| 開発責任者 | - | - |
| インフラ | - | - |
| LINE公式サポート | - | https://developers.line.biz/ja/support/ |

## 監視アラート

### 設定するアラート

| 条件 | 重要度 | 対応 |
|------|--------|------|
| エラーレート > 5% | High | 即時対応 |
| レスポンス > 3秒 | Medium | 調査 |
| DB接続失敗 | Critical | 即時対応 |
| LINE API失敗 | High | 確認 |

### Sentry設定（推奨）

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  environment: process.env.NODE_ENV,
});
```
