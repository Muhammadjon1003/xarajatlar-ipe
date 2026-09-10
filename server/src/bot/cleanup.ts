import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_BOT_TOKEN = '8900984246:AAEZA3BPqzsFRadEt1wgwB6DcQfKRC0sLQQ';
const envToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
const token =
  envToken && !envToken.includes('AAFs5_BMAVXZYgydv8y_GyM1hm8aIYNC9eQ')
    ? envToken
    : DEFAULT_BOT_TOKEN;

async function cleanupBot() {
  console.log('🧹 Cleaning up old bot webhooks, commands, and menus...');

  // 1. Delete Webhook and drop any pending updates
  const deleteWebhookRes = await fetch(`https://api.telegram.org/bot${token}/deleteWebhook?drop_pending_updates=true`);
  const webhookData = await deleteWebhookRes.json();
  console.log('1. Webhook removal:', webhookData);

  // 2. Delete existing bot commands
  const deleteCommandsRes = await fetch(`https://api.telegram.org/bot${token}/deleteMyCommands`);
  const commandsData = await deleteCommandsRes.json();
  console.log('2. Command list reset:', commandsData);

  // 3. Reset Chat Menu Button to default
  const resetMenuRes = await fetch(`https://api.telegram.org/bot${token}/setChatMenuButton`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ menu_button: { type: 'default' } }),
  });
  const menuData = await resetMenuRes.json();
  console.log('3. Chat menu button reset:', menuData);

  console.log('✅ Bot cleanup successfully completed!');
}

cleanupBot().catch((err) => {
  console.error('❌ Cleanup failed:', err);
  process.exit(1);
});
