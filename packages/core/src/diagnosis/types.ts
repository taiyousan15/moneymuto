/**
 * 診断関連の型定義
 */

// スコアの各軸
export interface Scores {
  safety: number;    // 安全性志向
  growth: number;    // 成長性志向
  knowledge: number; // 金融知識
  action: number;    // 行動力
}

// 金融タイプID
export type DiagnosisTypeId = 'conservative' | 'balanced' | 'aggressive' | 'learner';

// 金融タイプ情報
export interface DiagnosisType {
  id: DiagnosisTypeId;
  name: string;
  description: string;
  advice: string[];
}

// 質問の選択肢
export interface QuestionOption {
  id: string;
  text: string;
  scores: Scores;
}

// 質問
export interface Question {
  id: string;
  order?: number;
  text: string;
  options: QuestionOption[];
}

// ユーザーの回答
export interface Answer {
  questionId: string;
  optionId: string;
}

// 診断結果
export interface DiagnosisResult {
  id: string;
  type: DiagnosisTypeId;
  typeName: string;
  scores: Scores;
  advice: string[];
  linkCode: string;
  linkCodeExpiresAt: string;
}

// タイプ条件
export interface TypeCondition {
  primaryAxis: keyof Scores;
  minScore?: number;
  maxScore?: number;
}

// タイプ情報（設定用）
export interface TypeInfo {
  id: DiagnosisTypeId;
  name: string;
  description: string;
  condition: TypeCondition;
  advice: string[];
}

// 診断設定
export interface DiagnosisConfig {
  version: string;
  questions: Question[];
  types: TypeInfo[];
}
