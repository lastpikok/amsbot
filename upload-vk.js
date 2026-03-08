// Загрузка фото на VK Cloud (Mail.ru)
// Требуется: npm install webdav

const fs = require('fs');
const path = require('path');
const { createClient } = require('webdav');

// ===== НАСТРОЙКИ =====
// Получи здесь: https://o2.mail.ru/docs#webdav
const WEBDAV_URL = 'https://cloud.mail.ru/public/ТВОЯ_ПАПКА';
const WEBDAV_USER = 'ТВОЙ_EMAIL@mail.ru';
const WEBDAV_PASS = 'ПАРОЛЬ_ПРИЛОЖЕНИЯ'; // Не от почты, а пароль для приложений
// =====================

const SOURCE = path.join(__dirname, 'public', 'cars-media');
const MAPPING_FILE = path.join(__dirname, 'vk-mapping.json');

// Загружаем уже загруженные
let photoMap = {};
if (fs.existsSync(MAPPING_FILE)) {
    photoMap = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
}

// Основная функция
async function uploadAll() {
    console.log('📁 Загрузка фото на VK Cloud...\n');
    
    if (WEBDAV_PASS === 'ПАРОЛЬ_ПРИЛОЖЕНИЯ') {
        console.log('❌ Вставь настройки!');
        console.log('   1. https://o2.mail.ru/docs#webdav');
        console.log('   2. Включи WebDAV');
        console.log('   3. Создай пароль для приложения');
        console.log('   4. Вставь в upload-vk.js');
        return;
    }
    
    // Создаём клиент WebDAV
    const client = createClient(WEBDAV_URL, {
        username: WEBDAV_USER,
        password: WEBDAV_PASS
    });
    
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
        if (!vinMatch) continue;
        
        const vinId = vinMatch[1];
        const remoteFolder = `/${vinId}`;
        
        console.log(`\n📂 ${vinFolder} → ${vinId}`);
        
        // Создаём папку на облаке
        try {
            await client.createDirectory(remoteFolder);
        } catch (e) {
            // Папка уже существует
        }
        
        const files = fs.readdirSync(vinPath)
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .sort();
        
        photoMap[vinId] = [];
        
        for (const file of files) {
            total++;
            const filePath = path.join(vinPath, file);
            const remotePath = `${remoteFolder}/${file}`;
            
            // Пропускаем уже загруженные
            if (photoMap[vinId]?.find(p => p.includes(file))) {
                console.log(`   ⏭️ ${file}`);
                continue;
            }
            
            try {
                const fileContent = fs.readFileSync(filePath);
                await client.putFileContents(remotePath, fileContent);
                
                // Прямая ссылка на фото
                const photoUrl = `${WEBDAV_URL}${remotePath}`;
                photoMap[vinId].push(photoUrl);
                
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
    console.log(`   Сохранено в: vk-mapping.json`);
}

uploadAll().catch(console.error);
