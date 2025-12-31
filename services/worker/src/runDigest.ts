import { PrismaClient } from '@prisma/client';
import { fetchAllFeeds, filterRecentItems, selectTopItems } from './feeds/fetchRss';
import { summarizeArticles, formatDigestMessage } from './summarize/summarizeArticle';
import { sendPushMessage, getProfile } from './line/sendMessage';
import feedSources from '../../../config/feed_sources.json';

const prisma = new PrismaClient();

interface DigestOptions {
  dryRun?: boolean;
  userIds?: string[];
  maxArticles?: number;
}

export async function runDigest(options: DigestOptions = {}): Promise<{
  processed: number;
  sent: number;
  failed: number;
  errors: Array<{ userId: string; error: string }>;
}> {
  const { dryRun = false, userIds, maxArticles = 5 } = options;

  console.log(`Starting digest job (dryRun: ${dryRun})`);

  // 1. 配信対象ユーザー取得
  const users = await prisma.user.findMany({
    where: {
      status: 'linked',
      stepDay: { gte: 10 }, // ステップメール完了後
      ...(userIds ? { id: { in: userIds } } : {}),
    },
    include: {
      diagnosis: true,
    },
  });

  console.log(`Found ${users.length} users for digest delivery`);

  if (users.length === 0) {
    return { processed: 0, sent: 0, failed: 0, errors: [] };
  }

  // 2. RSSフィード取得
  console.log('Fetching RSS feeds...');
  const allItems = await fetchAllFeeds(feedSources.sources);
  const recentItems = filterRecentItems(allItems, 168); // 1週間分
  const topItems = selectTopItems(recentItems, maxArticles);

  console.log(`Fetched ${allItems.length} items, selected ${topItems.length} for digest`);

  // 3. ユーザータイプ別に記事を要約
  const typeGroups = new Map<string, typeof users>();
  for (const user of users) {
    const type = user.diagnosis?.type || 'balanced';
    const group = typeGroups.get(type) || [];
    group.push(user);
    typeGroups.set(type, group);
  }

  let sent = 0;
  let failed = 0;
  const errors: Array<{ userId: string; error: string }> = [];

  // 4. タイプ別に処理
  for (const [type, typeUsers] of typeGroups) {
    console.log(`Processing ${typeUsers.length} users of type: ${type}`);

    // タイプ別に記事を要約
    const summarized = await summarizeArticles(topItems, type);

    // 各ユーザーに送信
    for (const user of typeUsers) {
      try {
        // ユーザー名取得
        let displayName = 'ユーザー';
        if (user.lineUserId) {
          const profile = await getProfile(user.lineUserId);
          if (profile) {
            displayName = profile.displayName;
          }
        }

        // ダイジェストメッセージ作成
        const message = formatDigestMessage(displayName, summarized);

        if (!dryRun && user.lineUserId) {
          // LINE送信
          const result = await sendPushMessage(user.lineUserId, [
            { type: 'text', text: message },
          ]);

          if (!result.success) {
            throw new Error(result.error);
          }

          // 配信ログ保存
          await prisma.deliveryLog.create({
            data: {
              userId: user.id,
              type: 'digest',
              status: 'sent',
            },
          });
        }

        sent++;
        console.log(`Sent digest to user ${user.id}`);
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ userId: user.id, error: errorMessage });
        console.error(`Failed to send digest to user ${user.id}:`, errorMessage);

        // エラーログ保存
        if (!dryRun) {
          await prisma.deliveryLog.create({
            data: {
              userId: user.id,
              type: 'digest',
              status: 'failed',
              errorMessage,
            },
          });
        }
      }
    }
  }

  // 5. 記事をDBに保存（重複は無視）
  if (!dryRun) {
    for (const item of topItems) {
      try {
        await prisma.feedArticle.upsert({
          where: { url: item.link },
          create: {
            url: item.link,
            title: item.title,
            content: item.content,
            source: item.source,
            category: item.category,
            publishedAt: item.pubDate,
            fetchedAt: new Date(),
          },
          update: {
            fetchedAt: new Date(),
          },
        });
      } catch {
        // 重複エラーは無視
      }
    }
  }

  console.log(`Digest job completed: ${sent} sent, ${failed} failed`);

  return {
    processed: users.length,
    sent,
    failed,
    errors,
  };
}

// CLIから直接実行時
if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes('--dry-run');

  runDigest({ dryRun })
    .then((result) => {
      console.log('Result:', result);
      process.exit(result.failed > 0 ? 1 : 0);
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}
