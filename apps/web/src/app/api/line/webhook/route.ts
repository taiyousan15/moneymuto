import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// LINE Webhook署名検証
function verifySignature(body: string, signature: string): boolean {
  const channelSecret = process.env.LINE_CHANNEL_SECRET;
  if (!channelSecret) {
    console.error('LINE_CHANNEL_SECRET not set');
    return false;
  }

  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return hash === signature;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-line-signature');

    // 署名検証
    if (!signature || !verifySignature(body, signature)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const data = JSON.parse(body);
    const events = data.events || [];

    // イベント処理（非同期でバックグラウンド処理）
    for (const event of events) {
      await handleEvent(event);
    }

    // LINEは200を即座に返す必要がある
    return NextResponse.json({});
  } catch (error) {
    console.error('Webhook error:', error);
    // エラーでも200を返す（LINEのリトライを防ぐ）
    return NextResponse.json({});
  }
}

async function handleEvent(event: any) {
  const { type, source, message, replyToken } = event;
  const userId = source?.userId;

  if (!userId) return;

  switch (type) {
    case 'follow':
      await handleFollow(userId, replyToken);
      break;
    case 'unfollow':
      await handleUnfollow(userId);
      break;
    case 'message':
      if (message?.type === 'text') {
        await handleTextMessage(userId, message.text, replyToken);
      }
      break;
    default:
      console.log('Unhandled event type:', type);
  }
}

async function handleFollow(userId: string, replyToken: string) {
  console.log('New follower:', userId);

  // ウェルカムメッセージを送信
  await sendReply(replyToken, [
    {
      type: 'text',
      text: '友だち追加ありがとうございます！🎉\n\n「お金の診断」公式アカウントです。\n\n診断結果とこのアカウントを紐付けるには、診断完了後に表示された8桁のコードをこのトークに送信してください。\n\n例: A1B2C3D4',
    },
  ]);

  // DBにユーザー登録（本番で有効化）
  // await prisma.user.upsert({
  //   where: { lineUserId: userId },
  //   create: { lineUserId: userId, status: 'pending' },
  //   update: { status: 'pending' },
  // });
}

async function handleUnfollow(userId: string) {
  console.log('User unfollowed:', userId);

  // ステータス更新（本番で有効化）
  // await prisma.user.update({
  //   where: { lineUserId: userId },
  //   data: { status: 'unfollowed' },
  // });
}

async function handleTextMessage(userId: string, text: string, replyToken: string) {
  const trimmedText = text.trim().toUpperCase();

  // リンクコード形式かチェック（8文字の英数字）
  if (/^[A-Z0-9]{8}$/.test(trimmedText)) {
    await handleLinkCode(userId, trimmedText, replyToken);
  } else {
    // ヘルプメッセージ
    await sendReply(replyToken, [
      {
        type: 'text',
        text: '💡 診断結果と紐付けるには、診断完了後に表示される8桁のコードを入力してください。\n\n例: A1B2C3D4\n\nまだ診断を受けていない方は👇\nhttps://your-domain.com',
      },
    ]);
  }
}

async function handleLinkCode(userId: string, code: string, replyToken: string) {
  console.log('Link code attempt:', userId, code);

  // 仮の実装（本番ではDBで検証）
  // const user = await prisma.user.findFirst({
  //   where: { linkCode: code, linkCodeExpiresAt: { gt: new Date() } },
  // });

  // 仮の成功レスポンス
  await sendReply(replyToken, [
    {
      type: 'text',
      text: '✅ 紐付けが完了しました！\n\nあなたは「バランス派」ですね。\n\nこれから10日間、バランス派のあなたに最適な金融知識をお届けします📚\n\nお楽しみに！',
    },
  ]);
}

async function sendReply(replyToken: string, messages: any[]) {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!accessToken) {
    console.error('LINE_CHANNEL_ACCESS_TOKEN not set');
    return;
  }

  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ replyToken, messages }),
    });
  } catch (error) {
    console.error('Failed to send reply:', error);
  }
}
