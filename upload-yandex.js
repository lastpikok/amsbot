// Загрузка фото на Яндекс.Диск
// Получи OAuth токен: https://oauth.yandex.ru/client/new

const fs = require('fs');
const path = require('path');
const https = require('https');

// ===== НАСТРОЙКИ =====
const YANDEX_TOKEN = 'ВСТАВЬ_СЮДА_ОAUTH_ТОКЕН';
const YANDEX_FOLDER = 'disk:/amsbot-cars';
// =====================

const SOURCE = path.join(__dirname, 'public', 'cars-media');
const MAPPING_FILE = path.join(__dirname, 'yandex-mapping.json');

// Загружаем уже загруженные
let photoMap = {};
if (fs.existsSync(MAPPING_FILE)) {
    photoMap = JSON.parse(fs.readFileSync(MAPPING_FILE, 'utf8'));
}

// Создание папки на Яндекс.Диске
function createFolder(folderPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cloud-api.yandex.net',
            path: `/v1/disk/resources?path=${encodeURIComponent(folderPath)}`,
            method: 'PUT',
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });

        req.on('error', reject);
        req.end();
    });
}

// Получение ссылки на загрузку
function getUploadUrl(filePath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cloud-api.yandex.net',
            path: `/v1/disk/resources/upload?path=${encodeURIComponent(filePath)}&overwrite=true`,
            method: 'GET',
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.href);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Загрузка файла
function uploadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const fileStream = fs.createReadStream(filePath);
        const req = https.request(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/octet-stream'
            }
        }, (res) => {
            if (res.statusCode === 201 || res.statusCode === 200) {
                resolve();
            } else {
                reject(new Error(`Status ${res.statusCode}`));
            }
        });

        req.on('error', reject);
        fileStream.pipe(req);
    });
}

// Получение публичной ссылки на папку
function getPublicKey(folderPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cloud-api.yandex.net',
            path: `/v1/disk/resources/publish?path=${encodeURIComponent(folderPath)}`,
            method: 'PUT',
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json.public_url);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.end();
    });
}

// Основная функция
async function uploadAll() {
    console.log('📁 Загрузка фото на Яндекс.Диск...\n');
    
    if (YANDEX_TOKEN === 'ВСТАВЬ_СЮДА_ОAUTH_ТОКЕН') {
        console.log('❌ Вставь OAuth токен!');
        console.log('   1. https://oauth.yandex.ru/client/new');
        console.log('   2. Выбери права: disk:Чтение и disk:Запись');
        console.log('   3. Скопируй токен');
        return;
    }
    
    if (!fs.existsSync(SOURCE)) {
        console.log('❌ Папка cars-media не найдена!');
        return;
    }
    
    // Создаём корневую папку
    console.log('📂 Создание папки на Яндекс.Диске...');
    await createFolder(YANDEX_FOLDER);
    
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
        const diskPath = `${YANDEX_FOLDER}/${vinId}`;
        
        console.log(`\n📂 ${vinFolder} → ${vinId}`);
        
        // Создаём папку на Диске
        await createFolder(diskPath);
        
        const files = fs.readdirSync(vinPath)
            .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
            .sort();
        
        photoMap[vinId] = [];
        
        for (const file of files) {
            total++;
            const filePath = path.join(vinPath, file);
            const diskFilePath = `${diskPath}/${file}`;
            
            // Пропускаем уже загруженные
            if (photoMap[vinId] && photoMap[vinId].find(p => p.includes(file))) {
                console.log(`   ⏭️ ${file}`);
                continue;
            }
            
            try {
                const uploadUrl = await getUploadUrl(diskFilePath);
                await uploadFile(uploadUrl, filePath);
                
                // Прямая ссылка на фото
                const photoUrl = `https://disk.yandex.ru/download?path=${encodeURIComponent(diskFilePath)}`;
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
    console.log(`   Сохранено в: yandex-mapping.json`);
}

uploadAll().catch(console.error);
