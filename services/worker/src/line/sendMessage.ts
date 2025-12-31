export interface LineMessage {
  type: 'text' | 'flex';
  text?: string;
  altText?: string;
  contents?: any;
}

export interface SendResult {
  success: boolean;
  userId: string;
  error?: string;
}

const LINE_API_BASE = 'https://api.line.me/v2/bot';

async function getAccessToken(): Promise<string> {
  const token = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  if (!token) {
    throw new Error('LINE_CHANNEL_ACCESS_TOKEN not set');
  }
  return token;
}

export async function sendPushMessage(
  userId: string,
  messages: LineMessage[]
): Promise<SendResult> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${LINE_API_BASE}/message/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        to: userId,
        messages: messages.map((msg) => {
          if (msg.type === 'text') {
            return { type: 'text', text: msg.text };
          }
          return {
            type: 'flex',
            altText: msg.altText,
            contents: msg.contents,
          };
        }),
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return {
        success: false,
        userId,
        error: `LINE API error: ${response.status} - ${error}`,
      };
    }

    return { success: true, userId };
  } catch (error) {
    return {
      success: false,
      userId,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendMulticastMessage(
  userIds: string[],
  messages: LineMessage[]
): Promise<SendResult[]> {
  // LINE APIのマルチキャストは最大500人まで
  const MAX_RECIPIENTS = 500;
  const results: SendResult[] = [];

  for (let i = 0; i < userIds.length; i += MAX_RECIPIENTS) {
    const batch = userIds.slice(i, i + MAX_RECIPIENTS);

    try {
      const accessToken = await getAccessToken();

      const response = await fetch(`${LINE_API_BASE}/message/multicast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          to: batch,
          messages: messages.map((msg) => {
            if (msg.type === 'text') {
              return { type: 'text', text: msg.text };
            }
            return {
              type: 'flex',
              altText: msg.altText,
              contents: msg.contents,
            };
          }),
        }),
      });

      if (response.ok) {
        results.push(
          ...batch.map((userId) => ({ success: true, userId }))
        );
      } else {
        const error = await response.text();
        results.push(
          ...batch.map((userId) => ({
            success: false,
            userId,
            error: `LINE API error: ${response.status} - ${error}`,
          }))
        );
      }
    } catch (error) {
      results.push(
        ...batch.map((userId) => ({
          success: false,
          userId,
          error: error instanceof Error ? error.message : 'Unknown error',
        }))
      );
    }
  }

  return results;
}

export async function getProfile(userId: string): Promise<{
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
} | null> {
  try {
    const accessToken = await getAccessToken();

    const response = await fetch(`${LINE_API_BASE}/profile/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export function createDigestFlexMessage(
  userName: string,
  articles: Array<{
    title: string;
    summary: string;
    link: string;
  }>
): LineMessage {
  return {
    type: 'flex',
    altText: '今週の金融ニュースダイジェスト',
    contents: {
      type: 'bubble',
      header: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'text',
            text: '📰 今週のダイジェスト',
            weight: 'bold',
            size: 'xl',
          },
          {
            type: 'text',
            text: `${userName}さんへ`,
            size: 'sm',
            color: '#666666',
          },
        ],
      },
      body: {
        type: 'box',
        layout: 'vertical',
        spacing: 'md',
        contents: articles.slice(0, 3).map((article) => ({
          type: 'box',
          layout: 'vertical',
          spacing: 'sm',
          contents: [
            {
              type: 'text',
              text: article.title,
              weight: 'bold',
              size: 'sm',
              wrap: true,
            },
            {
              type: 'text',
              text: article.summary,
              size: 'xs',
              color: '#666666',
              wrap: true,
            },
          ],
        })),
      },
      footer: {
        type: 'box',
        layout: 'vertical',
        contents: [
          {
            type: 'button',
            action: {
              type: 'uri',
              label: '詳しく見る',
              uri: articles[0]?.link || 'https://example.com',
            },
            style: 'primary',
          },
        ],
      },
    },
  };
}
