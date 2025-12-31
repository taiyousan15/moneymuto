# 仕様書

## 診断ロジック

### 金融タイプ分類

| タイプ | 特徴 | スコア条件 |
|--------|------|-----------|
| 堅実派 | リスクを避け、安全性を重視 | 安全性スコア >= 70% |
| バランス派 | リスクとリターンのバランスを重視 | すべてのスコアが40-60% |
| 積極派 | 高リターンを求め、リスクを取る | 成長性スコア >= 70% |
| 学習派 | まだ知識が少なく、学習意欲が高い | 知識スコア < 40% |

### スコアリング

各質問は以下の軸でスコアリング:
- **safety**: 安全性志向 (0-10)
- **growth**: 成長性志向 (0-10)
- **knowledge**: 金融知識 (0-10)
- **action**: 行動力 (0-10)

```typescript
interface Answer {
  questionId: string;
  optionId: string;
  scores: {
    safety: number;
    growth: number;
    knowledge: number;
    action: number;
  };
}

interface DiagnosisResult {
  type: 'conservative' | 'balanced' | 'aggressive' | 'learner';
  scores: {
    safety: number;
    growth: number;
    knowledge: number;
    action: number;
  };
  advice: string[];
}
```

### 診断フロー

```
1. ユーザーがLPにアクセス
2. 「診断開始」ボタンをクリック
3. 10問の質問に順番に回答
4. 回答完了時にスコアを計算
5. 金融タイプを判定
6. 結果ページを表示
7. 結果をDBに保存（linkCode発行）
8. LINE友達追加を案内
```

## LINE連携仕様

### リンクコード

診断結果とLINEユーザーを紐付けるためのコード:

```
形式: [8文字のランダム英数字]
例: A1B2C3D4
有効期限: 24時間
```

### Webhookイベント

| イベント | 処理 |
|----------|------|
| follow | ユーザー登録、ウェルカムメッセージ送信 |
| message (text) | linkCodeの場合は紐付け処理、それ以外はヘルプ返信 |
| unfollow | ユーザーステータス更新 |

### ステップメッセージ

| Day | テーマ | 内容 |
|-----|--------|------|
| 1 | ウェルカム | 診断結果サマリー、今後の配信予告 |
| 2 | イントロダクション | 金融の基本、なぜ大切か |
| 3 | 問題提起1 | 多くの人が陥る失敗パターン |
| 4 | 問題提起2 | 放置するリスク |
| 5 | 解決策提示 | タイプ別の具体的アプローチ |
| 6 | 投資価値 | 学習への投資の重要性 |
| 7 | 信頼構築 | 実績・事例紹介 |
| 8 | コンテンツ価値 | 提供コンテンツの紹介 |
| 9 | 緊急性 | 早く始めるメリット |
| 10 | オファー | 次のステップへの案内 |

## データ仕様

### ユーザーデータ

```typescript
interface User {
  id: string;          // UUID
  lineUserId: string | null;
  displayName: string | null;
  diagnosisId: string | null;
  linkCode: string | null;
  linkCodeExpiresAt: Date | null;
  stepDay: number;     // 現在のステップ配信日 (0-10)
  lastStepAt: Date | null;
  status: 'pending' | 'linked' | 'unfollowed';
  createdAt: Date;
  updatedAt: Date;
}
```

### 診断結果データ

```typescript
interface Diagnosis {
  id: string;          // UUID
  userId: string | null;
  type: string;        // conservative | balanced | aggressive | learner
  scores: {
    safety: number;
    growth: number;
    knowledge: number;
    action: number;
  };
  answers: Answer[];
  createdAt: Date;
}
```

### 配信履歴データ

```typescript
interface DeliveryLog {
  id: string;
  userId: string;
  type: 'step' | 'digest';
  day: number | null;  // ステップの場合
  content: string;
  sentAt: Date;
  status: 'sent' | 'failed';
  error: string | null;
}
```

## API仕様

詳細は [03_api_spec.md](./03_api_spec.md) を参照。

## エラーハンドリング

| エラーコード | 説明 | 対応 |
|-------------|------|------|
| DIAGNOSIS_NOT_FOUND | 診断結果が見つからない | 再診断を案内 |
| LINK_CODE_EXPIRED | リンクコードの有効期限切れ | 再発行を案内 |
| LINE_API_ERROR | LINE API呼び出し失敗 | リトライ後、ログ記録 |
| AI_RATE_LIMIT | Claude APIレート制限 | 待機後リトライ |
