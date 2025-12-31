import { NextRequest, NextResponse } from 'next/server';

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

export async function POST(request: NextRequest) {
  // 認証チェック
  if (!verifyCronSecret(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const dryRun = body.dryRun === true;

    console.log(`Starting digest delivery (dryRun: ${dryRun})`);

    // 配信対象ユーザー取得（本番ではDBから）
    // const users = await prisma.user.findMany({
    //   where: { status: 'linked', stepDay: 10 }, // ステップ完了後
    // });

    // 仮のデータ
    const users = [
      { id: '1', lineUserId: 'U001', displayName: 'テスト1', type: 'balanced' },
      { id: '2', lineUserId: 'U002', displayName: 'テスト2', type: 'learner' },
    ];

    let sent = 0;
    let failed = 0;
    const errors: { userId: string; error: string }[] = [];

    for (const user of users) {
      try {
        // RSSフィード取得・要約（本番ではworkerで実行）
        // const articles = await fetchAndSummarizeArticles(user.type);

        // ダイジェストメッセージ作成
        const message = createDigestMessage(user.displayName || 'ユーザー');

        if (!dryRun) {
          // LINE送信
          await sendPushMessage(user.lineUserId, message);
        }

        sent++;
        console.log(`Sent digest to ${user.id}`);
      } catch (error) {
        failed++;
        errors.push({
          userId: user.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
        console.error(`Failed to send digest to ${user.id}:`, error);
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
    console.error('Digest cron error:', error);
    return NextResponse.json(
      { error: 'Internal error' },
      { status: 500 }
    );
  }
}

function createDigestMessage(userName: string): string {
  return `📰 今週の金融ニュースダイジェスト

${userName}さん、
今週も重要なニュースをまとめました！

━━━━━━━━━━━━━━━━

■ 日経平均株価、3万円台を回復

東京株式市場で日経平均株価が3万円台を回復しました。

👉 詳しく読む

━━━━━━━━━━━━━━━━

■ 日銀、金融政策を維持

日本銀行は金融政策決定会合で現行の金融緩和策の維持を決定しました。

👉 詳しく読む

━━━━━━━━━━━━━━━━

来週もお届けします！`;
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
    throw new Error(`LINE API error: ${response.status}`);
  }
}
