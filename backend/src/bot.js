const { Telegraf } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.BOT_TOKEN);

const WEB_APP_URL = 'https://boostix-app.onrender.com';

bot.start((ctx) => {
  const user = ctx.from;
  const payload = ctx.message?.text?.split(' ')[1] || '';
  
  // Извлекаем реферальный ID если есть
  let refParam = '';
  if (payload.startsWith('ref_')) {
    refParam = payload.replace('ref_', '');
  }

  ctx.reply(
    '🤖 *Добро пожаловать в Boostix!*\n\n' +
    '🎯 Умный подбор услуг\n' +
    '📊 Детальная аналитика\n' +
    '🤖 Автопродвижение\n' +
    '👥 Реферальная система\n' +
    '🛡 Гарантия от банов\n\n' +
    'Нажмите кнопку ниже, чтобы начать:',
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{
            text: '🚀 Открыть Boostix',
            web_app: { url: `${WEB_APP_URL}?tg_id=${user.id}&tg_name=${encodeURIComponent(user.first_name)}${refParam ? '&ref=' + refParam : ''}` }
          }],
        ],
      },
    },
  );
});

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

bot.launch(() => {
  console.log('🤖 Telegram бот запущен');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

module.exports = bot;