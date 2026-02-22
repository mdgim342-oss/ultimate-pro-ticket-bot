const express = require('express');
const { Telegraf, Markup } = require('telegraf');
const dotenv = require('dotenv');
const Fuse = require('fuse.js');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const SUPPORT_GROUP_LINK = process.env.SUPPORT_GROUP_LINK || "https://t.me/+pT5CQm1MGag1OWM1";

// বট ইনিশিয়ালাইজ করুন
const bot = new Telegraf(BOT_TOKEN);

// Express 미들웨어
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// হেলথ চেক এন্ডপয়েন্ট (Render-এর জন্য জরুরি) [citation:2]
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// ওয়েবহুক এন্ডপয়েন্ট [citation:4]
app.post(`/webhook/${BOT_TOKEN}`, (req, res) => {
  bot.handleUpdate(req.body, res);
});

// রুট এন্ডপয়েন্ট
app.get('/', (req, res) => {
  res.send('Telegram Support Bot is running!');
});

// ========== সলিউশন ইঞ্জিন ==========
const solutionsDB = [
  {
    category: 'login',
    keywords: ['login', 'signin', 'password', 'forgot', 'can\'t login', 'access', 'log in'],
    solution: `🔐 *Login Issue Solution*\n\n` +
      `1. Check your internet connection\n` +
      `2. Clear browser cache and cookies\n` +
      `3. Reset your password using 'Forgot Password' option\n` +
      `4. Use latest version of Telegram\n\n` +
      `Still having issues? Contact support group.`
  },
  {
    category: 'payment',
    keywords: ['payment', 'pay', 'money', 'transaction', 'failed', 'refund', 'bkash', 'nagad', 'card'],
    solution: `💰 *Payment Issue Solution*\n\n` +
      `1. Check your balance before transaction\n` +
      `2. Verify payment method details\n` +
      `3. Wait 10-15 minutes for transaction confirmation\n` +
      `4. Contact your bank/payment provider\n\n` +
      `For refund issues, please contact support group.`
  },
  {
    category: 'technical',
    keywords: ['technical', 'error', 'bug', 'crash', 'slow', 'problem', 'issue', 'not working', 'glitch'],
    solution: `⚙️ *Technical Issue Solution*\n\n` +
      `1. Restart the application\n` +
      `2. Clear app cache and data\n` +
      `3. Update to latest version\n` +
      `4. Restart your device\n` +
      `5. Reinstall the application\n\n` +
      `If problem persists, contact support group.`
  }
];

// Fuse.js কনফিগারেশন (ফাজি সার্চের জন্য)
const fuseOptions = {
  includeScore: true,
  threshold: 0.4,
  keys: ['keywords']
};

const fuse = new Fuse(solutionsDB, fuseOptions);

function findSolution(message) {
  const results = fuse.search(message.toLowerCase());
  if (results.length > 0 && results[0].score < 0.4) {
    return results[0].item.solution;
  }
  return null;
}

// ========== বট কমান্ড হ্যান্ডলার ==========

// /start কমান্ড
bot.start((ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📝 রিপোর্ট প্রবলেম', 'report')],
    [Markup.button.callback('❓ কমন প্রবলেম', 'common')],
    [Markup.button.url('👥 সাপোর্ট গ্রুপ', SUPPORT_GROUP_LINK)]
  ]);
  
  ctx.reply(
    `👋 স্বাগতম ${ctx.from.first_name}!\n\n` +
    `আমি আপনার সাপোর্ট অ্যাসিস্ট্যান্ট। কীভাবে সাহায্য করতে পারি?`,
    keyboard
  );
});

// /support কমান্ড
bot.command('support', (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔐 লগইন সমস্যা', 'solution_login')],
    [Markup.button.callback('💰 পেমেন্ট সমস্যা', 'solution_payment')],
    [Markup.button.callback('⚙️ টেকনিক্যাল সমস্যা', 'solution_technical')],
    [Markup.button.callback('📝 নিজের সমস্যা লিখুন', 'report')],
    [Markup.button.url('👥 সাপোর্ট গ্রুপ', SUPPORT_GROUP_LINK)]
  ]);
  
  ctx.reply('🆘 *সাপোর্ট মেনু*\n\nআপনার সমস্যার ধরণ সিলেক্ট করুন:', {
    parse_mode: 'Markdown',
    ...keyboard
  });
});

// ইনলাইন বাটন হ্যান্ডলার
bot.action(/solution_(.+)/, (ctx) => {
  const category = ctx.match[1];
  const solutionMap = {
    'login': solutionsDB[0].solution,
    'payment': solutionsDB[1].solution,
    'technical': solutionsDB[2].solution
  };
  
  const solution = solutionMap[category] || 'সলিউশন পাওয়া যায়নি।';
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('👥 সাপোর্ট গ্রুপে জয়েন করুন', SUPPORT_GROUP_LINK)],
    [Markup.button.callback('🔙 মেনুতে ফিরুন', 'back_to_menu')]
  ]);
  
  ctx.editMessageText(solution, {
    parse_mode: 'Markdown',
    ...keyboard
  });
});

bot.action('report', (ctx) => {
  ctx.reply(
    '📝 *আপনার সমস্যা বিস্তারিত লিখুন*\n\n' +
    'নিচের তথ্যগুলো অন্তর্ভুক্ত করুন:\n' +
    '• কী সমস্যা হয়েছে?\n' +
    '• কখন হয়েছে?\n' + 
    '• কোনো এরর মেসেজ দেখিয়েছে?\n\n' +
    'আমি আপনার সমস্যা বিশ্লেষণ করে সমাধান দেওয়ার চেষ্টা করব।'
  );
});

bot.action('common', (ctx) => {
  let commonIssues = '*কমন সমস্যা সমূহ:*\n\n';
  solutionsDB.forEach(item => {
    commonIssues += `• ${item.category}: ${item.keywords.slice(0, 3).join(', ')}...\n`;
  });
  
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('🔙 মেনুতে ফিরুন', 'back_to_menu')]
  ]);
  
  ctx.editMessageText(commonIssues, {
    parse_mode: 'Markdown',
    ...keyboard
  });
});

bot.action('back_to_menu', (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.callback('📝 রিপোর্ট প্রবলেম', 'report')],
    [Markup.button.callback('❓ কমন প্রবলেম', 'common')],
    [Markup.button.url('👥 সাপোর্ট গ্রুপ', SUPPORT_GROUP_LINK)]
  ]);
  
  ctx.editMessageText('🆘 *সাপোর্ট মেনু*\n\nকীভাবে সাহায্য করতে পারি?', {
    parse_mode: 'Markdown',
    ...keyboard
  });
});

// টেক্সট মেসেজ হ্যান্ডলার
bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  
  // কমান্ড চেক করুন
  if (message.startsWith('/')) return;
  
  // সলিউশন খুঁজুন
  const solution = findSolution(message);
  
  if (solution) {
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.callback('✅ হেল্পফুল', 'helpful')],
      [Markup.button.callback('❌ হেল্পফুল না', 'not_helpful')]
    ]);
    
    await ctx.reply(solution, {
      parse_mode: 'Markdown',
      ...keyboard
    });
  } else {
    // সলিউশন না পেলে গ্রুপে পাঠান
    const keyboard = Markup.inlineKeyboard([
      [Markup.button.url('👥 সাপোর্ট গ্রুপে জয়েন করুন', SUPPORT_GROUP_LINK)]
    ]);
    
    await ctx.reply(
      `🤔 আমি আপনার সমস্যার স্বয়ংক্রিয় সমাধান খুঁজে পাইনি।\n\n` +
      `দয়া করে আমাদের সাপোর্ট গ্রুপে জয়েন করুন:\n${SUPPORT_GROUP_LINK}`,
      keyboard
    );
    
    // লগ করুন (অপশনাল)
    console.log(`Unresolved issue from user ${ctx.from.id}: ${message}`);
  }
});

bot.action('helpful', (ctx) => {
  ctx.editMessageText('🙏 আপনার ফিডব্যাকের জন্য ধন্যবাদ! আরও সাহায্যের প্রয়োজন হলে /support দিন।');
});

bot.action('not_helpful', (ctx) => {
  const keyboard = Markup.inlineKeyboard([
    [Markup.button.url('👥 সাপোর্ট গ্রুপে জয়েন করুন', SUPPORT_GROUP_LINK)]
  ]);
  
  ctx.editMessageText(
    '😔 সলিউশনটি কাজ না করার জন্য দুঃখিত। দয়া করে সাপোর্ট গ্রুপে জয়েন করুন:',
    keyboard
  );
});

// ========== ওয়েবহুক সেটআপ ==========
// লোকাল টেস্টিং এর জন্য কমেন্ট আউট করুন
// bot.launch();

// প্রোডাকশনে ওয়েবহুক ব্যবহার করুন [citation:4]
bot.setWebHook(`${process.env.RENDER_URL}/bot${process.env.BOT_TOKEN}`);

// ========== সার্ভার স্টার্ট ==========
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`🤖 Bot webhook: https://${process.env.RENDER_EXTERNAL_URL}/webhook/${BOT_TOKEN}`);
  console.log(`✅ Health check: http://localhost:${PORT}/health`);
});

// গ্রেসফুল শাটডাউন
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
