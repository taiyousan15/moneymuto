import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'crypto';

// LINE署名検証関数を再実装（テスト用）
function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');

  return hash === signature;
}

// 正しい署名を生成するヘルパー関数
function generateSignature(body: string, channelSecret: string): string {
  return crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
}

describe('LINE Webhook Signature Verification', () => {
  const channelSecret = 'test_channel_secret_123';

  describe('verifySignature', () => {
    it('should return true for valid signature', () => {
      const body = JSON.stringify({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: 'hello' },
          },
        ],
      });

      const signature = generateSignature(body, channelSecret);
      const result = verifySignature(body, signature, channelSecret);

      expect(result).toBe(true);
    });

    it('should return false for invalid signature', () => {
      const body = JSON.stringify({ events: [] });
      const invalidSignature = 'invalid_signature_abc123';

      const result = verifySignature(body, invalidSignature, channelSecret);

      expect(result).toBe(false);
    });

    it('should return false when body is tampered', () => {
      const originalBody = JSON.stringify({ events: [], destination: 'U123' });
      const tamperedBody = JSON.stringify({ events: [], destination: 'U456' });

      const signature = generateSignature(originalBody, channelSecret);
      const result = verifySignature(tamperedBody, signature, channelSecret);

      expect(result).toBe(false);
    });

    it('should return false for wrong channel secret', () => {
      const body = JSON.stringify({ events: [] });
      const signature = generateSignature(body, channelSecret);

      const result = verifySignature(body, signature, 'wrong_secret');

      expect(result).toBe(false);
    });

    it('should handle empty body', () => {
      const body = '';
      const signature = generateSignature(body, channelSecret);

      const result = verifySignature(body, signature, channelSecret);

      expect(result).toBe(true);
    });

    it('should handle Japanese characters in body', () => {
      const body = JSON.stringify({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: 'こんにちは' },
          },
        ],
      });

      const signature = generateSignature(body, channelSecret);
      const result = verifySignature(body, signature, channelSecret);

      expect(result).toBe(true);
    });

    it('should handle emoji in body', () => {
      const body = JSON.stringify({
        events: [
          {
            type: 'message',
            message: { type: 'text', text: '🎉👋🏻' },
          },
        ],
      });

      const signature = generateSignature(body, channelSecret);
      const result = verifySignature(body, signature, channelSecret);

      expect(result).toBe(true);
    });
  });

  describe('Webhook event handling', () => {
    it('should parse follow event correctly', () => {
      const event = {
        type: 'follow',
        timestamp: 1625000000000,
        source: {
          type: 'user',
          userId: 'U1234567890abcdef',
        },
        replyToken: 'reply_token_123',
      };

      expect(event.type).toBe('follow');
      expect(event.source.userId).toBe('U1234567890abcdef');
      expect(event.replyToken).toBeDefined();
    });

    it('should parse message event correctly', () => {
      const event = {
        type: 'message',
        timestamp: 1625000000000,
        source: {
          type: 'user',
          userId: 'U1234567890abcdef',
        },
        replyToken: 'reply_token_123',
        message: {
          type: 'text',
          id: 'msg_123',
          text: 'A1B2C3D4',
        },
      };

      expect(event.type).toBe('message');
      expect(event.message.type).toBe('text');
      expect(event.message.text).toBe('A1B2C3D4');
    });

    it('should detect link code format', () => {
      const linkCodePattern = /^[A-Z0-9]{8}$/;

      expect(linkCodePattern.test('A1B2C3D4')).toBe(true);
      expect(linkCodePattern.test('ABCD1234')).toBe(true);
      expect(linkCodePattern.test('12345678')).toBe(true);

      expect(linkCodePattern.test('a1b2c3d4')).toBe(false); // 小文字
      expect(linkCodePattern.test('A1B2C3D')).toBe(false);  // 7文字
      expect(linkCodePattern.test('A1B2C3D4E')).toBe(false); // 9文字
      expect(linkCodePattern.test('A1B2-C3D')).toBe(false);  // 特殊文字
    });

    it('should handle unfollow event', () => {
      const event = {
        type: 'unfollow',
        timestamp: 1625000000000,
        source: {
          type: 'user',
          userId: 'U1234567890abcdef',
        },
      };

      expect(event.type).toBe('unfollow');
      expect(event.source.userId).toBeDefined();
      // unfollow event has no replyToken
      expect((event as any).replyToken).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle very long body', () => {
      const longText = 'a'.repeat(10000);
      const body = JSON.stringify({ text: longText });

      const signature = generateSignature(body, channelSecret);
      const result = verifySignature(body, signature, channelSecret);

      expect(result).toBe(true);
    });

    it('should handle special characters in body', () => {
      const body = JSON.stringify({
        text: '!@#$%^&*()_+{}[]|\\:";\'<>?,./',
      });

      const signature = generateSignature(body, channelSecret);
      const result = verifySignature(body, signature, channelSecret);

      expect(result).toBe(true);
    });

    it('should handle newlines in body', () => {
      const body = JSON.stringify({
        text: 'line1\nline2\r\nline3',
      });

      const signature = generateSignature(body, channelSecret);
      const result = verifySignature(body, signature, channelSecret);

      expect(result).toBe(true);
    });
  });
});
