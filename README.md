# telegram-tiktok-preview-bot

A Telegram bot that watches a group chat for TikTok links and replies with a `kktiktok.com` rewrite, which Telegram can render as a working inline preview.

> **Note:** Telegram bots cannot edit messages sent by other users — only their own. This bot therefore replies to the sender's message rather than editing it in place.

## What it rewrites

| In                                             | Out                                                |
| ---------------------------------------------- | -------------------------------------------------- |
| `https://www.tiktok.com/@user/video/123?x=1`   | `https://www.kktiktok.com/@user/video/123?x=1`    |
| `https://vm.tiktok.com/AbC123/`                | `https://vm.kktiktok.com/AbC123/`                 |
| `https://vt.tiktok.com/XyZ/`                   | `https://vt.kktiktok.com/XyZ/`                    |
| `https://m.tiktok.com/...`                     | `https://m.kktiktok.com/...`                      |

Lookalike domains (`eviltiktok.com`, `tiktoknews.com`, `tiktok.com.evil.com`) are deliberately ignored.

## Setup

1. **Create a bot** via [@BotFather](https://t.me/BotFather):
   - Send `/newbot`, follow the prompts, and save the **token** it gives you.
2. **Disable privacy mode** (so the bot sees every group message, not just commands):
   - In @BotFather: `/setprivacy` → pick your bot → **Disable**.
3. **Configure**:
   ```sh
   cp .env.example .env
   # then paste the token into .env: BOT_TOKEN=...
   ```
4. **Install & run**:
   ```sh
   npm install
   npm run build && npm start
   # or, while iterating:
   npm run dev
   ```
   Console will print `@<your-bot-username> polling`.
5. **Add the bot to your group chat** and post a TikTok link — it should reply with the rewritten URL.

> If you added the bot to the group **before** disabling privacy mode, kick it and re-add it so the new setting takes effect.

## Scripts

| Command            | Purpose                                          |
| ------------------ | ------------------------------------------------ |
| `npm run dev`      | Run from source with auto-reload (`tsx watch`).  |
| `npm run build`    | Compile TypeScript to `dist/`.                   |
| `npm start`        | Run the compiled bot from `dist/`.               |
| `npm test`         | Run unit tests for the URL rewriter.             |
| `npm run typecheck`| Type-check without emitting.                     |

## Project layout

```
src/
  index.ts          entrypoint, loads BOT_TOKEN, starts polling
  bot.ts            createBot(token) — wires handlers
  handleMessage.ts  on('message') handler
  rewriteLinks.ts   pure function: (text, entities) → rewritten URLs
tests/
  rewriteLinks.test.ts
```

The rewrite logic is intentionally a pure function so it can be exhaustively unit-tested without touching Telegram.
