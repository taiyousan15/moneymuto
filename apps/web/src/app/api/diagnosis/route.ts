import { NextRequest, NextResponse } from 'next/server';
// import { PrismaClient } from '@prisma/client';
// import { runDiagnosis, generateLinkCode } from '@money-onboarding/core';
// import diagnosisConfig from '../../../../config/diagnosis_questions.json';

// const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answers } = body;

    // 回答のバリデーション
    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json(
        { error: { code: 'INVALID_ANSWERS', message: '回答形式が不正です' } },
        { status: 400 }
      );
    }

    // 診断を実行（本番では core パッケージを使用）
    // const result = runDiagnosis(diagnosisConfig, answers);

    // 仮の結果（本番ではDBに保存）
    const result = {
      id: crypto.randomUUID(),
      type: 'balanced',
      typeName: 'バランス派',
      scores: {
        safety: 55,
        growth: 60,
        knowledge: 50,
        action: 55,
      },
      advice: [
        '分散投資の考え方は正しいです',
        '定期的なリバランスが重要です',
        '目標に合わせたポートフォリオ設計を',
      ],
      linkCode: generateRandomCode(),
      linkCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    };

    // DBに保存（本番で有効化）
    // const diagnosis = await prisma.diagnosis.create({
    //   data: {
    //     type: result.type,
    //     scores: result.scores,
    //     answers: answers,
    //   },
    // });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Diagnosis error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '診断処理でエラーが発生しました' } },
      { status: 500 }
    );
  }
}

function generateRandomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
