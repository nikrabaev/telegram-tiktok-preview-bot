import { describe, expect, it } from 'vitest';
import { rewriteLinks } from '../src/rewriteLinks.js';

type Entity = {
  type: string;
  offset: number;
  length: number;
  url?: string;
};

const urlEntity = (text: string, url: string): Entity => {
  const offset = text.indexOf(url);
  if (offset < 0) throw new Error(`url not found in text: ${url}`);
  return { type: 'url', offset, length: url.length };
};

describe('rewriteLinks', () => {
  describe('with URL entities', () => {
    it('rewrites a basic www.tiktok.com URL', () => {
      const text = 'check this out https://www.tiktok.com/@user/video/123';
      const url = 'https://www.tiktok.com/@user/video/123';
      expect(rewriteLinks(text, [urlEntity(text, url)])).toEqual([
        'https://www.kktiktok.com/@user/video/123',
      ]);
    });

    it('rewrites a bare tiktok.com URL', () => {
      const text = 'https://tiktok.com/@x/video/1';
      expect(rewriteLinks(text, [urlEntity(text, text)])).toEqual([
        'https://kktiktok.com/@x/video/1',
      ]);
    });

    it('preserves query parameters', () => {
      const url = 'https://www.tiktok.com/@user/video/123?is_from_webapp=1&sender_device=pc';
      expect(rewriteLinks(url, [urlEntity(url, url)])).toEqual([
        'https://www.kktiktok.com/@user/video/123?is_from_webapp=1&sender_device=pc',
      ]);
    });

    it('rewrites vm.tiktok.com short links', () => {
      const url = 'https://vm.tiktok.com/AbC123/';
      expect(rewriteLinks(url, [urlEntity(url, url)])).toEqual([
        'https://vm.kktiktok.com/AbC123/',
      ]);
    });

    it('rewrites vt.tiktok.com short links', () => {
      const url = 'https://vt.tiktok.com/XyZ/';
      expect(rewriteLinks(url, [urlEntity(url, url)])).toEqual([
        'https://vt.kktiktok.com/XyZ/',
      ]);
    });

    it('rewrites m.tiktok.com URLs', () => {
      const url = 'https://m.tiktok.com/v/123.html';
      expect(rewriteLinks(url, [urlEntity(url, url)])).toEqual([
        'https://m.kktiktok.com/v/123.html',
      ]);
    });

    it('handles mixed-case host', () => {
      const url = 'HTTPS://WWW.TikTok.COM/x';
      expect(rewriteLinks(url, [urlEntity(url, url)])).toEqual([
        'https://www.kktiktok.com/x',
      ]);
    });

    it('rewrites multiple links in one message in original order', () => {
      const text =
        'first https://vm.tiktok.com/aaa/ and second https://www.tiktok.com/@u/video/2';
      const e1 = urlEntity(text, 'https://vm.tiktok.com/aaa/');
      const e2 = urlEntity(text, 'https://www.tiktok.com/@u/video/2');
      expect(rewriteLinks(text, [e1, e2])).toEqual([
        'https://vm.kktiktok.com/aaa/',
        'https://www.kktiktok.com/@u/video/2',
      ]);
    });

    it('deduplicates identical input URLs', () => {
      const text =
        'https://vm.tiktok.com/aaa/ and again https://vm.tiktok.com/aaa/';
      const url = 'https://vm.tiktok.com/aaa/';
      // both entities point to the same URL string
      const offsets: Entity[] = [];
      let from = 0;
      while (true) {
        const off = text.indexOf(url, from);
        if (off < 0) break;
        offsets.push({ type: 'url', offset: off, length: url.length });
        from = off + url.length;
      }
      expect(offsets).toHaveLength(2);
      expect(rewriteLinks(text, offsets)).toEqual([
        'https://vm.kktiktok.com/aaa/',
      ]);
    });

    it('ignores non-tiktok URLs', () => {
      const text = 'https://www.youtube.com/watch?v=abc';
      expect(rewriteLinks(text, [urlEntity(text, text)])).toEqual([]);
    });

    it('does not match lookalike domains (eviltiktok.com)', () => {
      const text = 'https://eviltiktok.com/x';
      expect(rewriteLinks(text, [urlEntity(text, text)])).toEqual([]);
    });

    it('does not match tiktok.com.evil.com', () => {
      const text = 'https://tiktok.com.evil.com/x';
      expect(rewriteLinks(text, [urlEntity(text, text)])).toEqual([]);
    });

    it('handles text_link entities (URL stored on entity, not in text)', () => {
      const text = 'click here for the video';
      const entities: Entity[] = [
        {
          type: 'text_link',
          offset: 0,
          length: 'click here'.length,
          url: 'https://www.tiktok.com/@u/video/9',
        },
      ];
      expect(rewriteLinks(text, entities)).toEqual([
        'https://www.kktiktok.com/@u/video/9',
      ]);
    });

    it('skips malformed URLs without throwing', () => {
      const text = 'see http://[notaurl]';
      const entities: Entity[] = [
        { type: 'url', offset: 4, length: 'http://[notaurl]'.length },
      ];
      expect(rewriteLinks(text, entities)).toEqual([]);
    });

    it('ignores entity types other than url and text_link', () => {
      const text = 'hello @someone';
      const entities: Entity[] = [
        { type: 'mention', offset: 6, length: 8 },
      ];
      expect(rewriteLinks(text, entities)).toEqual([]);
    });
  });

  describe('fallback regex (no entities)', () => {
    it('rewrites a tiktok URL when entities are absent', () => {
      const text = 'look https://www.tiktok.com/@u/video/1 cool';
      expect(rewriteLinks(text, undefined)).toEqual([
        'https://www.kktiktok.com/@u/video/1',
      ]);
    });

    it('does not rewrite scheme-less host (Telegram-only behavior)', () => {
      const text = 'visit www.tiktok.com/@u';
      expect(rewriteLinks(text, undefined)).toEqual([]);
    });

    it('handles multiple links via fallback', () => {
      const text =
        'a https://vm.tiktok.com/x/ b https://www.tiktok.com/@u/video/2 c';
      expect(rewriteLinks(text, undefined)).toEqual([
        'https://vm.kktiktok.com/x/',
        'https://www.kktiktok.com/@u/video/2',
      ]);
    });
  });

  describe('inputs that yield nothing', () => {
    it('returns [] for undefined text and entities', () => {
      expect(rewriteLinks(undefined, undefined)).toEqual([]);
    });

    it('returns [] for empty text', () => {
      expect(rewriteLinks('', [])).toEqual([]);
    });

    it('returns [] when text contains the word "tiktok" but no URL', () => {
      expect(rewriteLinks('I love tiktok content', undefined)).toEqual([]);
    });
  });
});
