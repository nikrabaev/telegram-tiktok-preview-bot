type EntityLike = {
  type: string;
  offset: number;
  length: number;
  url?: string;
};

const TARGET_HOST = 'tiktok.com';
const REPLACEMENT_HOST = 'kktiktok.com';
const URL_REGEX = /https?:\/\/[^\s]+/gi;

function isTikTokHost(hostname: string): boolean {
  const host = hostname.toLowerCase();
  if (host === TARGET_HOST) return true;
  return host.endsWith('.' + TARGET_HOST);
}

function rewriteHost(hostname: string): string {
  const host = hostname.toLowerCase();
  if (host === TARGET_HOST) return REPLACEMENT_HOST;
  // host ends with `.tiktok.com` — keep the subdomain prefix.
  const prefix = host.slice(0, host.length - TARGET_HOST.length);
  return prefix + REPLACEMENT_HOST;
}

function tryRewrite(rawUrl: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return null;
  }
  if (!isTikTokHost(parsed.hostname)) return null;
  parsed.hostname = rewriteHost(parsed.hostname);
  return parsed.toString();
}

export function rewriteLinks(
  text: string | undefined,
  entities: ReadonlyArray<EntityLike> | undefined,
): string[] {
  const candidates: string[] = [];

  if (entities && entities.length > 0) {
    for (const entity of entities) {
      if (entity.type === 'url' && text) {
        candidates.push(text.slice(entity.offset, entity.offset + entity.length));
      } else if (entity.type === 'text_link' && entity.url) {
        candidates.push(entity.url);
      }
    }
  } else if (text) {
    const matches = text.match(URL_REGEX);
    if (matches) candidates.push(...matches);
  }

  const seen = new Set<string>();
  const out: string[] = [];
  for (const candidate of candidates) {
    const rewritten = tryRewrite(candidate);
    if (rewritten === null) continue;
    if (seen.has(rewritten)) continue;
    seen.add(rewritten);
    out.push(rewritten);
  }
  return out;
}
