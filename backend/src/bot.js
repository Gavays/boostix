const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

// Команда /start
bot.start((ctx) => {
  ctx.reply(
    '🤖 *Добро пожаловать в Boostix!*\n\n' +
    'Умное продвижение в соцсетях — быстро, безопасно, выгодно.\n\n' +
    'Нажмите кнопку ниже, чтобы открыть панель управления:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🚀 Открыть Boostix', web_app: { url: 'https://your-app-url.com' } }],
        ],
      },
    },
  );
});

// Команда /help
bot.help((ctx) => {
  ctx.reply(
    '🎯 *Возможности Boostix:*\n\n' +
    '• Умный подбор — вставьте ссылку, бот определит платформу\n' +
    '• Автопродвижение — выставите бюджет и цель\n' +
    '• Реферальная система — зарабатывайте на приглашениях\n' +
    '• Аналитика — отслеживайте рост в реальном времени',
    { parse_mode: 'Markdown' },
  );
});

// Запуск бота
bot.launch(() => {
  console.log('🤖 Telegram бот запущен');
});

// Обработка ошибок
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;