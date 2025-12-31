import Parser from 'rss-parser';

export interface FeedItem {
  title: string;
  link: string;
  content: string;
  pubDate: Date;
  source: string;
  category: string;
}

export interface FeedSource {
  name: string;
  url: string;
  category: string;
  priority: number;
}

const parser = new Parser({
  timeout: 10000,
  maxRedirects: 3,
});

export async function fetchRss(source: FeedSource): Promise<FeedItem[]> {
  try {
    const feed = await parser.parseURL(source.url);

    return feed.items.map((item) => ({
      title: item.title || '',
      link: item.link || '',
      content: item.contentSnippet || item.content || '',
      pubDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      source: source.name,
      category: source.category,
    }));
  } catch (error) {
    console.error(`Failed to fetch RSS from ${source.name}:`, error);
    return [];
  }
}

export async function fetchAllFeeds(sources: FeedSource[]): Promise<FeedItem[]> {
  const results = await Promise.allSettled(
    sources.map((source) => fetchRss(source))
  );

  const items: FeedItem[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled') {
      items.push(...result.value);
    }
  }

  // 日付順にソート（新しい順）
  items.sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return items;
}

export function filterRecentItems(
  items: FeedItem[],
  hours: number = 168 // デフォルト1週間
): FeedItem[] {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  return items.filter((item) => item.pubDate >= cutoff);
}

export function selectTopItems(
  items: FeedItem[],
  count: number = 5,
  diversify: boolean = true
): FeedItem[] {
  if (!diversify) {
    return items.slice(0, count);
  }

  // カテゴリを分散させて選択
  const byCategory = new Map<string, FeedItem[]>();
  for (const item of items) {
    const existing = byCategory.get(item.category) || [];
    existing.push(item);
    byCategory.set(item.category, existing);
  }

  const selected: FeedItem[] = [];
  const categories = Array.from(byCategory.keys());
  let categoryIndex = 0;

  while (selected.length < count) {
    const category = categories[categoryIndex % categories.length];
    const categoryItems = byCategory.get(category) || [];

    if (categoryItems.length > 0) {
      selected.push(categoryItems.shift()!);
    }

    categoryIndex++;

    // すべてのカテゴリが空になったら終了
    if (Array.from(byCategory.values()).every((arr) => arr.length === 0)) {
      break;
    }
  }

  return selected;
}
