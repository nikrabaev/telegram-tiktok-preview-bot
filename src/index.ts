import 'dotenv/config';
import { createBot } from './bot.js';

const token = process.env.BOT_TOKEN;
if (!token) {
  console.error('BOT_TOKEN is missing. Copy .env.example to .env and paste your token.');
  process.exit(1);
}

const bot = createBot(token);

const stop = (signal: string) => {
  console.log(`received ${signal}, stopping...`);
  void bot.stop();
};
process.once('SIGINT', () => stop('SIGINT'));
process.once('SIGTERM', () => stop('SIGTERM'));

void bot.start({
  onStart: ({ username }) => {
    console.log(`@${username} polling`);
  },
});
