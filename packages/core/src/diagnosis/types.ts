/**
 * 診断関連の型定義
 */

// スコアの各軸
export interface Scores {
  safety: number;    // 安全性志向 (0-100)
  growth: number;    // 成長性志向 (0-100)
  knowledge: number; // 金融知識 (0-100)
  action: number;    // 行動力 (0-100)
}

// 金融タイプ
export type DiagnosisType = 'conservative' | 'balanced' | 'aggressive' | 'learner';

// 質問の選択肢
export interface QuestionOption {
  id: string;
  text: string;
  scores: Scores;
}

// 質問
export interface Question {
  id: string;
  order: number;
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
  type: DiagnosisType;
  typeName: string;
  scores: Scores;
  advice: string[];
}

// タイプ情報
export interface TypeInfo {
  name: string;
  description: string;
  advice: string[];
}

// 診断設定
export interface DiagnosisConfig {
  version: string;
  questions: Question[];
  types: Record<DiagnosisType, TypeInfo>;
  scoring: {
    typeThresholds: Record<string, { safety?: number; growth?: number; knowledge?: number; default?: boolean }>;
  };
}
