import { describe, it, expect } from 'vitest';
import {
  calculateScores,
  determineType,
  runDiagnosis,
  generateLinkCode,
} from '../packages/core/src/diagnosis/scoring';
import type { DiagnosisConfig, Answer } from '../packages/core/src/diagnosis/types';

// テスト用の設定
const testConfig: DiagnosisConfig = {
  version: '1.0',
  questions: [
    {
      id: 'q1',
      text: 'テスト質問1',
      options: [
        { id: 'q1_a', text: 'オプションA', scores: { safety: 20, growth: 0, knowledge: 10, action: 5 } },
        { id: 'q1_b', text: 'オプションB', scores: { safety: 0, growth: 20, knowledge: 5, action: 15 } },
        { id: 'q1_c', text: 'オプションC', scores: { safety: 10, growth: 10, knowledge: 10, action: 10 } },
        { id: 'q1_d', text: 'オプションD', scores: { safety: 5, growth: 5, knowledge: 0, action: 0 } },
      ],
    },
    {
      id: 'q2',
      text: 'テスト質問2',
      options: [
        { id: 'q2_a', text: 'オプションA', scores: { safety: 15, growth: 5, knowledge: 10, action: 5 } },
        { id: 'q2_b', text: 'オプションB', scores: { safety: 5, growth: 15, knowledge: 5, action: 10 } },
        { id: 'q2_c', text: 'オプションC', scores: { safety: 10, growth: 10, knowledge: 10, action: 10 } },
        { id: 'q2_d', text: 'オプションD', scores: { safety: 0, growth: 0, knowledge: 5, action: 0 } },
      ],
    },
  ],
  types: [
    {
      id: 'conservative',
      name: '堅実派',
      description: '安全性重視',
      condition: { primaryAxis: 'safety', minScore: 60 },
      advice: ['アドバイス1'],
    },
    {
      id: 'aggressive',
      name: '積極派',
      description: '成長性重視',
      condition: { primaryAxis: 'growth', minScore: 60 },
      advice: ['アドバイス2'],
    },
    {
      id: 'learner',
      name: '学習派',
      description: '知識が必要',
      condition: { primaryAxis: 'knowledge', minScore: 0, maxScore: 30 },
      advice: ['アドバイス3'],
    },
    {
      id: 'balanced',
      name: 'バランス派',
      description: 'バランス重視',
      condition: { primaryAxis: 'safety' },
      advice: ['アドバイス4'],
    },
  ],
};

describe('calculateScores', () => {
  it('should calculate scores correctly from answers', () => {
    const answers: Answer[] = [
      { questionId: 'q1', optionId: 'q1_a' }, // safety: 20, growth: 0, knowledge: 10, action: 5
      { questionId: 'q2', optionId: 'q2_a' }, // safety: 15, growth: 5, knowledge: 10, action: 5
    ];

    const scores = calculateScores(testConfig, answers);

    expect(scores.safety).toBe(35);
    expect(scores.growth).toBe(5);
    expect(scores.knowledge).toBe(20);
    expect(scores.action).toBe(10);
  });

  it('should handle empty answers', () => {
    const answers: Answer[] = [];

    const scores = calculateScores(testConfig, answers);

    expect(scores.safety).toBe(0);
    expect(scores.growth).toBe(0);
    expect(scores.knowledge).toBe(0);
    expect(scores.action).toBe(0);
  });

  it('should ignore invalid question IDs', () => {
    const answers: Answer[] = [
      { questionId: 'invalid', optionId: 'q1_a' },
      { questionId: 'q1', optionId: 'q1_c' },
    ];

    const scores = calculateScores(testConfig, answers);

    expect(scores.safety).toBe(10);
    expect(scores.growth).toBe(10);
  });
});

describe('determineType', () => {
  it('should return conservative for high safety scores', () => {
    const scores = { safety: 70, growth: 30, knowledge: 40, action: 35 };
    const type = determineType(scores);
    expect(type.id).toBe('conservative');
  });

  it('should return aggressive for high growth scores', () => {
    const scores = { safety: 30, growth: 70, knowledge: 40, action: 50 };
    const type = determineType(scores);
    expect(type.id).toBe('aggressive');
  });

  it('should return learner for low knowledge scores', () => {
    const scores = { safety: 40, growth: 40, knowledge: 20, action: 30 };
    const type = determineType(scores);
    expect(type.id).toBe('learner');
  });

  it('should return balanced as default', () => {
    const scores = { safety: 50, growth: 50, knowledge: 50, action: 50 };
    const type = determineType(scores);
    expect(type.id).toBe('balanced');
  });
});

describe('runDiagnosis', () => {
  it('should return complete diagnosis result', () => {
    const answers: Answer[] = [
      { questionId: 'q1', optionId: 'q1_a' },
      { questionId: 'q2', optionId: 'q2_a' },
    ];

    const result = runDiagnosis(testConfig, answers);

    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('type');
    expect(result).toHaveProperty('typeName');
    expect(result).toHaveProperty('scores');
    expect(result).toHaveProperty('advice');
    expect(result).toHaveProperty('linkCode');
    expect(result).toHaveProperty('linkCodeExpiresAt');
  });

  it('should generate valid link code', () => {
    const answers: Answer[] = [
      { questionId: 'q1', optionId: 'q1_c' },
      { questionId: 'q2', optionId: 'q2_c' },
    ];

    const result = runDiagnosis(testConfig, answers);

    expect(result.linkCode).toMatch(/^[A-Z0-9]{8}$/);
  });
});

describe('generateLinkCode', () => {
  it('should generate 8 character alphanumeric code', () => {
    const code = generateLinkCode();

    expect(code).toHaveLength(8);
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });

  it('should generate unique codes', () => {
    const codes = new Set<string>();

    for (let i = 0; i < 100; i++) {
      codes.add(generateLinkCode());
    }

    // 100回生成して、ほぼすべてユニークであることを確認
    expect(codes.size).toBeGreaterThan(95);
  });
});
