import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import stepMessages from '../../../../../../../config/step_messages.json';

// Cron認証
function verifyCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.warn('CRON_SECRET not set');
    return false;
  }

  return authHeader === `Bearer ${cronSecret}`;
}

type DiagnosisType = 'conservative' | 'balanced' | 'aggressive' | 'learner';

interface StepMessage {
  day: number;
  subject: string;
  content: string;
}

export async function POST(request: NextRequest) {
  // 認証チェック
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    console.log(`Starting step mail delivery (dryRun: ${dryRun})`);

    // 配信対象ユーザー取得
    // - ステータスがlinked
    // - stepDayが1〜10
    // - 今日まだ配信していない（lastStepAtが今日より前）
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const users = await prisma.user.findMany({
      where: {
        status: 'linked',
        stepDay: { gte: 1, lte: 10 },
        lineUserId: { not: null },
        OR: [
          { lastStepAt: null },
          { lastStepAt: { lt: today } },
        ],
      },
      include: {
        diagnosis: true,
      },
    });

    console.log(`Found ${users.length} users for step mail delivery`);

    let sent = 0;
    let failed = 0;
    const errors: { userId: string; error: string }[] = [];

    for (const user of users) {
      try {
        // 診断タイプを取得（デフォルトはbalanced）
        const diagnosisType = (user.diagnosis?.type as DiagnosisType) || 'balanced';

        // ステップメッセージを取得
        const messages = (stepMessages.messages as Record<DiagnosisType, StepMessage[]>)[diagnosisType];
        const stepMessage = messages?.find((m) => m.day === user.stepDay);

        if (!stepMessage) {
          console.warn(`No message found for type ${diagnosisType} day ${user.stepDay}`);
          continue;
        }

        // ユーザー名取得
        const displayName = await getLineDisplayName(user.lineUserId!);

        // メッセージをパーソナライズ
        const personalizedContent = stepMessage.content.replace(
          /おはようございます！/,
          `${displayName || 'ユーザー'}さん、おはようございます！`
        );

        if (!dryRun) {
          // LINE送信
          await sendPushMessage(user.lineUserId!, personalizedContent);

          // ユーザー情報更新
          await prisma.user.update({
            where: { id: user.id },
            data: {
              stepDay: user.stepDay + 1,
              lastStepAt: new Date(),
            },
          });

          // 配信ログ保存
          await prisma.deliveryLog.create({
            data: {
              userId: user.id,
              type: 'step',
              day: user.stepDay,
              content: stepMessage.subject,
              status: 'sent',
            },
          });
        }

        sent++;
        console.log(`Sent step ${user.stepDay} to ${user.id} (${diagnosisType})`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          userId: user.id,
          error: errorMessage,
        });
        console.error(`Failed to send step mail to ${user.id}:`, error);

        // エラーログ保存
        if (!dryRun) {
          await prisma.deliveryLog.create({
            data: {
              userId: user.id,
              type: 'step',
              day: user.stepDay,
              status: 'failed',
              errorMessage,
            },
          });
        }
      }
    }

    return NextResponse.json({
      processed: users.length,
      sent,
      failed,
      errors,
      dryRun,
    });
  } catch (error) {
    console.error('Step mail cron error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

async function getLineDisplayName(lineUserId: string): Promise<string | null> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) return null;

  try {
    const response = await fetch(
      `https://api.line.me/v2/bot/profile/${lineUserId}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) return null;

    const profile = await response.json();
    return profile.displayName;
  } catch {
    return null;
  }
}

async function sendPushMessage(lineUserId: string, text: string) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set');
  }

  const response = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      to: lineUserId,
      messages: [{ type: 'text', text }],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`LINE API error: ${response.status} - ${errorBody}`);
  }
}
