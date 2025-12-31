/**
 * 診断スコアリングロジック
 */

import type {
  Answer,
  DiagnosisConfig,
  DiagnosisResult,
  DiagnosisType,
  Scores,
} from './types';
import { getQuestion, getOption } from './questions';

/**
 * 回答からスコアを計算
 */
export function calculateScores(config: DiagnosisConfig, answers: Answer[]): Scores {
  const totalScores: Scores = {
    safety: 0,
    growth: 0,
    knowledge: 0,
    action: 0,
  };

  let validAnswers = 0;

  for (const answer of answers) {
    const question = getQuestion(config, answer.questionId);
    if (!question) continue;

    const option = getOption(question, answer.optionId);
    if (!option) continue;

    totalScores.safety += option.scores.safety;
    totalScores.growth += option.scores.growth;
    totalScores.knowledge += option.scores.knowledge;
    totalScores.action += option.scores.action;
    validAnswers++;
  }

  // 最大スコア（各質問10点 × 質問数）で正規化して0-100にする
  const maxPossible = validAnswers * 10;
  if (maxPossible === 0) {
    return { safety: 0, growth: 0, knowledge: 0, action: 0 };
  }

  return {
    safety: Math.round((totalScores.safety / maxPossible) * 100),
    growth: Math.round((totalScores.growth / maxPossible) * 100),
    knowledge: Math.round((totalScores.knowledge / maxPossible) * 100),
    action: Math.round((totalScores.action / maxPossible) * 100),
  };
}

/**
 * スコアから金融タイプを判定
 */
export function determineType(scores: Scores): DiagnosisType {
  // 優先順位:
  // 1. 学習派: 知識スコアが40%未満
  // 2. 堅実派: 安全性スコアが70%以上
  // 3. 積極派: 成長性スコアが70%以上
  // 4. バランス派: それ以外

  if (scores.knowledge < 40) {
    return 'learner';
  }

  if (scores.safety >= 70) {
    return 'conservative';
  }

  if (scores.growth >= 70) {
    return 'aggressive';
  }

  return 'balanced';
}

/**
 * 診断を実行
 */
export function runDiagnosis(config: DiagnosisConfig, answers: Answer[]): DiagnosisResult {
  const scores = calculateScores(config, answers);
  const type = determineType(scores);
  const typeInfo = config.types[type];

  return {
    type,
    typeName: typeInfo.name,
    scores,
    advice: typeInfo.advice,
  };
}

/**
 * リンクコードを生成
 */
export function generateLinkCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * リンクコードの形式を検証
 */
export function isValidLinkCode(code: string): boolean {
  return /^[A-Z0-9]{8}$/.test(code);
}
