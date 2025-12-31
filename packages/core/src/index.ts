/**
 * @money-onboarding/core
 *
 * お金の診断アプリのコアロジック
 */

// 型定義
export type {
  Scores,
  DiagnosisType,
  QuestionOption,
  Question,
  Answer,
  DiagnosisResult,
  TypeInfo,
  DiagnosisConfig,
} from './diagnosis/types';

// 質問関連
export {
  getQuestions,
  getQuestion,
  getOption,
  getNextQuestion,
  calculateProgress,
  isComplete,
} from './diagnosis/questions';

// スコアリング
export {
  calculateScores,
  determineType,
  runDiagnosis,
  generateLinkCode,
  isValidLinkCode,
} from './diagnosis/scoring';
