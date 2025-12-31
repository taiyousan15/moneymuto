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
 * 回答からスコアを計算（生の合計スコアを返す）
 */
export function calculateScores(config: DiagnosisConfig, answers: Answer[]): Scores {
  const totalScores: Scores = {
    safety: 0,
    growth: 0,
    knowledge: 0,
    action: 0,
  };

  for (const answer of answers) {
    const question = getQuestion(config, answer.questionId);
    if (!question) continue;

    const option = getOption(question, answer.optionId);
    if (!option) continue;

    totalScores.safety += option.scores.safety;
    totalScores.growth += option.scores.growth;
    totalScores.knowledge += option.scores.knowledge;
    totalScores.action += option.scores.action;
  }

  return totalScores;
}

/**
 * スコアから金融タイプを判定
 */
export function determineType(scores: Scores): DiagnosisType {
  // 優先順位:
  // 1. 学習派: 知識スコアが30未満
  // 2. 堅実派: 安全性スコアが60以上
  // 3. 積極派: 成長性スコアが60以上
  // 4. バランス派: それ以外

  if (scores.knowledge < 30) {
    return { id: 'learner', name: '学習派', description: '知識が必要', advice: [] };
  }

  if (scores.safety >= 60) {
    return { id: 'conservative', name: '堅実派', description: '安全性重視', advice: [] };
  }

  if (scores.growth >= 60) {
    return { id: 'aggressive', name: '積極派', description: '成長性重視', advice: [] };
  }

  return { id: 'balanced', name: 'バランス派', description: 'バランス重視', advice: [] };
}

/**
 * 診断を実行
 */
export function runDiagnosis(config: DiagnosisConfig, answers: Answer[]): DiagnosisResult {
  const scores = calculateScores(config, answers);
  const typeResult = determineType(scores);

  // configからタイプ情報を取得（より詳細なアドバイスがある場合）
  const configType = config.types.find((t) => t.id === typeResult.id);
  const advice = configType?.advice || typeResult.advice;

  return {
    id: crypto.randomUUID(),
    type: typeResult.id,
    typeName: configType?.name || typeResult.name,
    scores,
    advice,
    linkCode: generateLinkCode(),
    linkCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
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
