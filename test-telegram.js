// Тест: отправка одного фото в Telegram
const { Telegraf } = require('telegraf');
const fs = require('path');

const BOT_TOKEN = '8685365269:AAEn8td5dEXUrye9ZeuqtS19A-hH8yEMvgU';
const CHANNEL = '-1001424548860';

const bot = new Telegraf(BOT_TOKEN);

async function test() {
    console.log('🧪 Тест отправки в Telegram...\n');
    
    // Проверяем бота
    try {
        const me = await bot.telegram.getMe();
        console.log(`✅ Бот: @${me.username}`);
    } catch (e) {
        console.log(`❌ Ошибка бота: ${e.message}`);
        console.log('   Проверь токен!');
        return;
    }
    
    // Проверяем канал
    try {
        const chat = await bot.telegram.getChat(CHANNEL);
        console.log(`✅ Канал: ${chat.title || CHANNEL}`);
    } catch (e) {
        console.log(`❌ Ошибка канала: ${e.message}`);
        console.log('   1. Убедись что бот — администратор канала');
        console.log('   2. Проверь ID канала (должен быть -100...)');
        return;
    }
    
    // Отправляем тестовое фото
    try {
        const testFile = fs.join(__dirname, 'public', 'cars-media', '020320', '1.jpg');
        await bot.telegram.sendPhoto(CHANNEL, { source: testFile }, { caption: 'Тест' });
        console.log('✅ Тестовое фото отправлено!');
        console.log('\n🎉 Всё работает!');
    } catch (e) {
        console.log(`❌ Ошибка отправки: ${e.message}`);
        console.log('   Проверь что файл существует');
    }
    
    process.exit(0);
}

test().catch(console.error);
