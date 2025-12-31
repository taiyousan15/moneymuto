import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { runDiagnosis, generateLinkCode } from '@money-onboarding/core';
import diagnosisConfig from '../../../../../../config/diagnosis_questions.json';

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

    // 診断を実行
    const result = runDiagnosis(diagnosisConfig as any, answers);

    // リンクコード生成
    const linkCode = generateLinkCode();
    const linkCodeExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // DBに保存
    const diagnosis = await prisma.diagnosis.create({
      data: {
        type: result.type,
        scores: result.scores,
        answers: answers,
        linkCode,
        linkCodeExpiresAt,
      },
    });

    return NextResponse.json({
      id: diagnosis.id,
      type: result.type,
      typeName: result.typeName,
      scores: result.scores,
      advice: result.advice,
      linkCode,
      linkCodeExpiresAt: linkCodeExpiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Diagnosis error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: '診断処理でエラーが発生しました' } },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: { code: 'MISSING_ID', message: 'IDが必要です' } },
        { status: 400 }
      );
    }

    const diagnosis = await prisma.diagnosis.findUnique({
      where: { id },
    });

    if (!diagnosis) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: '診断結果が見つかりません' } },
        { status: 404 }
      );
    }

    // タイプ情報を取得
    const typeInfo = (diagnosisConfig as any).types.find(
      (t: any) => t.id === diagnosis.type
    );

    return NextResponse.json({
      id: diagnosis.id,
      type: diagnosis.type,
      typeName: typeInfo?.name || diagnosis.type,
      scores: diagnosis.scores,
      advice: typeInfo?.advice || [],
      linkCode: diagnosis.linkCode,
      createdAt: diagnosis.createdAt,
    });
  } catch (error) {
    console.error('Get diagnosis error:', error);
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'エラーが発生しました' } },
      { status: 500 }
    );
  }
}
