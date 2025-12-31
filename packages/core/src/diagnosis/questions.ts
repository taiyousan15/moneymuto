/**
 * 診断質問の読み込みと管理
 */

import type { DiagnosisConfig, Question, QuestionOption } from './types';

// 質問設定を取得
export function getQuestions(config: DiagnosisConfig): Question[] {
  return config.questions.sort((a, b) => a.order - b.order);
}

// 質問を取得
export function getQuestion(config: DiagnosisConfig, questionId: string): Question | undefined {
  return config.questions.find((q) => q.id === questionId);
}

// 選択肢を取得
export function getOption(question: Question, optionId: string): QuestionOption | undefined {
  return question.options.find((o) => o.id === optionId);
}

// 次の質問を取得
export function getNextQuestion(config: DiagnosisConfig, currentQuestionId: string): Question | null {
  const questions = getQuestions(config);
  const currentIndex = questions.findIndex((q) => q.id === currentQuestionId);

  if (currentIndex === -1 || currentIndex >= questions.length - 1) {
    return null;
  }

  return questions[currentIndex + 1];
}

// 進捗を計算 (0-100)
export function calculateProgress(config: DiagnosisConfig, answeredQuestionIds: string[]): number {
  const totalQuestions = config.questions.length;
  const answeredCount = answeredQuestionIds.length;
  return Math.round((answeredCount / totalQuestions) * 100);
}

// 全問回答済みかチェック
export function isComplete(config: DiagnosisConfig, answeredQuestionIds: string[]): boolean {
  return answeredQuestionIds.length >= config.questions.length;
}
