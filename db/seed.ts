import { PrismaClient, DiagnosisType, UserStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // テスト用の診断結果を作成
  const diagnosis = await prisma.diagnosis.create({
    data: {
      type: DiagnosisType.balanced,
      scores: {
        safety: 55,
        growth: 60,
        knowledge: 50,
        action: 55,
      },
      answers: [
        { questionId: 'q1', optionId: 'q1_c' },
        { questionId: 'q2', optionId: 'q2_c' },
        { questionId: 'q3', optionId: 'q3_c' },
        { questionId: 'q4', optionId: 'q4_b' },
        { questionId: 'q5', optionId: 'q5_c' },
        { questionId: 'q6', optionId: 'q6_b' },
        { questionId: 'q7', optionId: 'q7_b' },
        { questionId: 'q8', optionId: 'q8_b' },
        { questionId: 'q9', optionId: 'q9_b' },
        { questionId: 'q10', optionId: 'q10_a' },
      ],
    },
  });

  console.log(`Created diagnosis: ${diagnosis.id}`);

  // テスト用ユーザーを作成
  const user = await prisma.user.create({
    data: {
      lineUserId: 'U_TEST_USER_001',
      displayName: 'テストユーザー',
      diagnosisId: diagnosis.id,
      linkCode: 'TEST1234',
      linkCodeExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      stepDay: 0,
      status: UserStatus.linked,
    },
  });

  console.log(`Created user: ${user.id}`);

  // テスト用フィード記事を作成
  const articles = await prisma.feedArticle.createMany({
    data: [
      {
        feedUrl: 'https://www.nikkei.com/rss/market.xml',
        title: '日経平均株価、3万円台を回復',
        url: 'https://example.com/article/1',
        summary: '東京株式市場で日経平均株価が3万円台を回復しました。',
        publishedAt: new Date(),
      },
      {
        feedUrl: 'https://www.nikkei.com/rss/economy.xml',
        title: '日銀、金融政策を維持',
        url: 'https://example.com/article/2',
        summary: '日本銀行は金融政策決定会合で現行の金融緩和策の維持を決定しました。',
        publishedAt: new Date(),
      },
      {
        feedUrl: 'https://zuuonline.com/rss',
        title: '初心者向け：つみたてNISAの始め方',
        url: 'https://example.com/article/3',
        summary: 'つみたてNISAの基本と始め方をわかりやすく解説します。',
        publishedAt: new Date(),
      },
    ],
  });

  console.log(`Created ${articles.count} feed articles`);

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
