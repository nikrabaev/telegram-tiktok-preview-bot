import type { Context } from 'grammy';
import { rewriteLinks } from './rewriteLinks.js';

export async function handleMessage(ctx: Context): Promise<void> {
  const msg = ctx.message;
  if (!msg) return;

  const text = msg.text ?? msg.caption;
  const entities = msg.entities ?? msg.caption_entities;
  const rewrites = rewriteLinks(text, entities);
  if (rewrites.length === 0) return;

  await ctx.reply(rewrites.join('\n'), {
    reply_parameters: { message_id: msg.message_id },
  });
}
