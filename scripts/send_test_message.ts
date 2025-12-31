/**
 * LINEテストメッセージ送信スクリプト
 *
 * 使用方法:
 *   npx tsx scripts/send_test_message.ts <LINE_USER_ID> [メッセージタイプ]
 *
 * メッセージタイプ:
 *   welcome  - ウェルカムメッセージ
 *   linked   - 紐付け完了メッセージ
 *   step     - ステップメッセージ（Day 1）
 *   digest   - ダイジェストメッセージ
 *
 * 例:
 *   npx tsx scripts/send_test_message.ts U1234567890abcdef welcome
 */

const LINE_API_BASE = 'https://api.line.me/v2/bot';

interface TestMessage {
  type: string;
  content: string;
}

const messages: Record<string, TestMessage> = {
  welcome: {
    type: 'ウェルカム',
    content: `友だち追加ありがとうございます！🎉

「お金の診断」公式アカウントです。

診断結果とこのアカウントを紐付けるには、診断完了後に表示された8桁のコードをこのトークに送信してください。

例: A1B2C3D4`,
  },
  linked: {
    type: '紐付け完了',
    content: `✅ 紐付けが完了しました！

あなたは「バランス派」ですね。

これから10日間、バランス派のあなたに最適な金融知識をお届けします📚

お楽しみに！`,
  },
  step: {
    type: 'ステップ（Day 1）',
    content: `📘 Day 1: お金と向き合う心構え

おはようございます！

今日から10日間のステップメールが始まります。

━━━━━━━━━━━━━━━━

■ 今日のテーマ
「お金は怖い」から「お金は味方」へ

多くの人がお金に対して漠然とした不安を持っています。

でも、お金の仕組みを理解すれば、お金はあなたの人生を豊かにする味方になります。

━━━━━━━━━━━━━━━━

■ 今日のアクション
「自分がお金に対して持っているイメージ」を3つ書き出してみましょう。

━━━━━━━━━━━━━━━━

明日は「貯金の基本」についてお届けします。
お楽しみに！`,
  },
  digest: {
    type: 'ダイジェスト',
    content: `📰 今週の金融ニュースダイジェスト

テストユーザーさん、
今週も重要なニュースをまとめました！

━━━━━━━━━━━━━━━━

■ 日経平均株価、3万円台を回復

東京株式市場で日経平均株価が3万円台を回復しました。
米国市場の好調さを受けた動きです。

💡 バランス派のあなたへ：分散投資を心がけることで、市場の変動に対応しやすくなります。

👉 詳しく読む: https://example.com/news/1

━━━━━━━━━━━━━━━━

■ 新NISA、利用者が100万人突破

2024年から始まった新NISAの利用者が100万人を突破しました。

💡 投資を始めるなら、まずはつみたて投資枠から検討してみましょう。

👉 詳しく読む: https://example.com/news/2

━━━━━━━━━━━━━━━━

来週もお届けします！`,
  },
};

async function sendTestMessage(userId: string, messageType: string): Promise<void> {
  const accessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!accessToken) {
    console.error('❌ LINE_CHANNEL_ACCESS_TOKEN が設定されていません');
    console.log('');
    console.log('以下のコマンドで環境変数を設定してください:');
    console.log('  export LINE_CHANNEL_ACCESS_TOKEN=your_token');
    process.exit(1);
  }

  const message = messages[messageType];

  if (!message) {
    console.error(`❌ 不明なメッセージタイプ: ${messageType}`);
    console.log('');
    console.log('利用可能なタイプ:');
    Object.entries(messages).forEach(([key, msg]) => {
      console.log(`  ${key.padEnd(10)} - ${msg.type}メッセージ`);
    });
    process.exit(1);
  }

  console.log(`📤 ${message.type}メッセージを送信中...`);
  console.log(`   宛先: ${userId}`);
  console.log('');

  try {
    const response = await fetch(`${LINE_API_BASE}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{ type: 'text', text: message.content }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`LINE API error: ${response.status} - ${error}`);
    }

    console.log('✅ 送信成功！');
    console.log('');
    console.log('送信内容:');
    console.log('─'.repeat(40));
    console.log(message.content);
    console.log('─'.repeat(40));
  } catch (error) {
    console.error('❌ 送信失敗:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// メイン処理
const args = process.argv.slice(2);

if (args.length < 1) {
  console.log('使用方法: npx tsx scripts/send_test_message.ts <LINE_USER_ID> [メッセージタイプ]');
  console.log('');
  console.log('メッセージタイプ:');
  Object.entries(messages).forEach(([key, msg]) => {
    console.log(`  ${key.padEnd(10)} - ${msg.type}メッセージ`);
  });
  console.log('');
  console.log('例:');
  console.log('  npx tsx scripts/send_test_message.ts U1234567890abcdef welcome');
  process.exit(1);
}

const [userId, messageType = 'welcome'] = args;

sendTestMessage(userId, messageType);
