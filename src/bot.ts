import { Bot } from 'grammy';
import { handleMessage } from './handleMessage.js';

export function createBot(token: string): Bot {
  const bot = new Bot(token);

  bot.on('message', handleMessage);

  bot.catch((err) => {
    console.error('bot error:', err);
  });

  return bot;
}
