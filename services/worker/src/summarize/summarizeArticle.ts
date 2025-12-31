import Anthropic from '@anthropic-ai/sdk';
import type { FeedItem } from '../feeds/fetchRss';

export interface SummarizedArticle {
  title: string;
  link: string;
  summary: string;
  keyPoints: string[];
  relevance: string;
  source: string;
  category: string;
}

const anthropic = new Anthropic();

export async function summarizeArticle(
  article: FeedItem,
  userType: string
): Promise<SummarizedArticle> {
  const typeContext = getTypeContext(userType);

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `以下の金融ニュース記事を、${typeContext}の投資初心者向けに要約してください。

タイトル: ${article.title}
内容: ${article.content}

以下のJSON形式で回答してください：
{
  "summary": "2-3文での要約",
  "keyPoints": ["ポイント1", "ポイント2", "ポイント3"],
  "relevance": "このユーザータイプにとってなぜ重要かの一文"
}`,
      },
    ],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    throw new Error('Unexpected response type');
  }

  const result = JSON.parse(content.text);

  return {
    title: article.title,
    link: article.link,
    summary: result.summary,
    keyPoints: result.keyPoints,
    relevance: result.relevance,
    source: article.source,
    category: article.category,
  };
}

export async function summarizeArticles(
  articles: FeedItem[],
  userType: string,
  maxConcurrent: number = 3
): Promise<SummarizedArticle[]> {
  const results: SummarizedArticle[] = [];

  // 並列数を制限して処理
  for (let i = 0; i < articles.length; i += maxConcurrent) {
    const batch = articles.slice(i, i + maxConcurrent);
    const batchResults = await Promise.allSettled(
      batch.map((article) => summarizeArticle(article, userType))
    );

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        console.error('Failed to summarize article:', result.reason);
      }
    }
  }

  return results;
}

function getTypeContext(userType: string): string {
  const contexts: Record<string, string> = {
    conservative: '安全性を重視する堅実派',
    balanced: 'リスクとリターンのバランスを取るバランス派',
    aggressive: '積極的にリターンを追求する積極派',
    learner: 'これから学び始める学習派',
  };

  return contexts[userType] || 'バランス派';
}

export function formatDigestMessage(
  userName: string,
  articles: SummarizedArticle[]
): string {
  let message = `📰 今週の金融ニュースダイジェスト\n\n`;
  message += `${userName}さん、\n今週も重要なニュースをまとめました！\n\n`;
  message += `━━━━━━━━━━━━━━━━\n\n`;

  for (const article of articles) {
    message += `■ ${article.title}\n\n`;
    message += `${article.summary}\n\n`;
    message += `💡 ${article.relevance}\n\n`;
    message += `👉 詳しく読む: ${article.link}\n\n`;
    message += `━━━━━━━━━━━━━━━━\n\n`;
  }

  message += `来週もお届けします！`;

  return message;
}
