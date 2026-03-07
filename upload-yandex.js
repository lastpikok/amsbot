const fs = require('fs');
const path = require('path');
const https = require('https');

// Твои данные Яндекс.Диск
const YANDEX_TOKEN = 'YOUR_OAUTH_TOKEN'; // Получи ниже
const YANDEX_FOLDER = 'amsbot-cars';

const SOURCE = path.join(__dirname, 'public', 'cars-media');
const UPLOADED_FILE = path.join(__dirname, 'yandex-uploaded.json');

// Загружаем список уже загруженных
let uploaded = {};
if (fs.existsSync(UPLOADED_FILE)) {
    uploaded = JSON.parse(fs.readFileSync(UPLOADED_FILE, 'utf8'));
}

// Получение ссылки на загрузку
function getUploadUrl(filename, folder = YANDEX_FOLDER) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'cloud-api.yandex.net',
            path: `/v1/disk/resources/upload?path=${encodeURIComponent(folder)}/${filename}&overwrite=true`,
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
            if (res.statusCode === 201) {
                resolve();
            } else {
                reject(new Error(`Status ${res.statusCode}`));
            }
        });

        req.on('error', reject);
        fileStream.pipe(req);
    });
}

// Основная функция
async function uploadAll() {
    console.log('📁 Загрузка фото на Яндекс.Диск...\n');

    if (YANDEX_TOKEN === 'YOUR_OAUTH_TOKEN') {
        console.log('❌ Вставь OAuth токен в скрипт!');
        console.log('   Как получить: https://yandex.ru/dev/oauth/doc/ru/concepts/about');
        return;
    }

    if (!fs.existsSync(SOURCE)) {
        console.log('❌ Папка cars-media не найдена!');
        return;
    }

    const folders = fs.readdirSync(SOURCE);
    let total = 0;
    let uploadedCount = 0;

    for (const vinFolder of folders) {
        const vinPath = path.join(SOURCE, vinFolder);
        if (!fs.statSync(vinPath).isDirectory()) continue;

        console.log(`📂 ${vinFolder}/`);

        const files = fs.readdirSync(vinPath);
        for (const file of files) {
            if (!/\.(jpg|jpeg|png|webp)$/i.test(file)) continue;

            total++;
            const filename = `${vinFolder}/${file}`;

            // Пропускаем уже загруженные
            if (uploaded[filename]) {
                console.log(`   ⏭️ ${file}`);
                continue;
            }

            const filePath = path.join(vinPath, file);

            try {
                const uploadUrl = await getUploadUrl(filename);
                await uploadFile(uploadUrl, filePath);
                uploaded[filename] = true;
                uploadedCount++;
                console.log(`   ✅ ${file}`);

                // Сохраняем прогресс
                fs.writeFileSync(UPLOADED_FILE, JSON.stringify(uploaded, null, 2));
            } catch (e) {
                console.log(`   ❌ ${file}: ${e.message}`);
            }
        }
    }

    console.log(`\n🎉 Готово!`);
    console.log(`   Загружено: ${uploadedCount} из ${total}`);
    console.log(`   Прогресс сохранён в yandex-uploaded.json`);
}

uploadAll().catch(console.error);
