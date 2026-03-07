const fs = require('fs');
const path = require('path');

// Твой токен от BotFather
const BOT_TOKEN = 'ВСТАВЬ_СЮДА_ТОКЕН_БОТА';

// Твой канал (с @ или без)
const CHANNEL = '@ams_photos'; // или ID канала (например, -1001234567890)

const SOURCE = path.join(__dirname, 'public', 'cars-media');
const MAPPING_FILE = path.join(__dirname, 'telegram-photos.json');

// Загружаем уже загруженные
let photoMap = {}; // VIN -> [ссылки на фото]
if (fs.existsSync(MAPPING_FILE)) {
    photoMap = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
}

// Отправка фото в Telegram
async function sendPhoto(filePath, caption) {
    const TelegramBot = require('node-telegram-bot-api');
    const bot = new TelegramBot(BOT_TOKEN);
    
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath);
        bot.sendPhoto(CHANNEL, stream, { caption }).then((message) => {
            // Получаем ссылку на файл
            const fileId = message.photo[message.photo.length - 1].file_id;
            bot.getFileLink(fileId).then((link) => {
                resolve(link);
            }).catch(reject);
        }).catch(reject);
    });
}

// Основная функция
async function uploadAll() {
    console.log('📁 Загрузка фото в Telegram...\n');
    
    if (BOT_TOKEN === 'ВСТАВЬ_СЮДА_ТОКЕН_БОТА') {
        console.log('❌ Вставь токен бота!');
        console.log('   Получи у @BotFather');
        return;
    }
    
    if (!fs.existsSync(SOURCE)) {
        console.log('❌ Папка cars-media не найдена!');
        return;
    }
    
    const folders = fs.readdirSync(SOURCE);
    let total = 0;
    let uploaded = 0;
    
    for (const vinFolder of folders) {
        const vinPath = path.join(SOURCE, vinFolder);
        if (!fs.statSync(vinPath).isDirectory()) continue;
        
        // Извлекаем VIN (последние 6 цифр)
        const vinMatch = vinFolder.match(/([a-zA-Z0-9]{6})$/);
        if (!vinMatch) {
            console.log(`⏭️ Пропущено: ${vinFolder} (нет VIN)`);
            continue;
        }
        
        const vinId = vinMatch[1];
        console.log(`📂 ${vinFolder} → ${vinId}`);
        
        const files = fs.readdirSync(vinPath)
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .sort();
        
        photoMap[vinId] = [];
        
        for (const file of files) {
            total++;
            const filePath = path.join(vinPath, file);
            
            try {
                const link = await sendPhoto(filePath, `${vinFolder}/${file}`);
                photoMap[vinId].push(link);
                uploaded++;
                console.log(`   ✅ ${file}`);
                
                // Сохраняем каждые 10 фото
                if (uploaded % 10 === 0) {
                    fs.writeFileSync(MAPPING_FILE, JSON.stringify(photoMap, null, 2));
                }
            } catch (e) {
                console.log(`   ❌ ${file}: ${e.message}`);
            }
        }
    }
    
    // Сохраняем результат
    fs.writeFileSync(MAPPING_FILE, JSON.stringify(photoMap, null, 2));
    
    console.log(`\n🎉 Готово!`);
    console.log(`   Загружено: ${uploaded} из ${total}`);
    console.log(`   Сохранено в: telegram-photos.json`);
}

uploadAll().catch(console.error);
