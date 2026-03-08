// API для получения фото с Яндекс.Диска
const https = require('https');

// ===== НАСТРОЙКИ =====
const YANDEX_TOKEN = 'ВСТАВЬ_СЮДА_ОAUTH_ТОКЕН';
const YANDEX_FOLDER = 'amsbot-cars';
// =====================

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // API: получить список фото для VIN
    if (req.url.startsWith('/api/yandex-photos')) {
        const urlParts = req.url.split('/');
        const vinId = urlParts[urlParts.length - 1];
        
        if (!vinId || vinId.length !== 6) {
            return res.end(JSON.stringify({ error: 'Invalid VIN' }));
        }
        
        const folderPath = `${YANDEX_FOLDER}/${vinId}`;
        
        // Получаем список файлов в папке
        const options = {
            hostname: 'cloud-api.yandex.net',
            path: `/v1/disk/resources?path=${encodeURIComponent(folderPath)}&limit=50`,
            method: 'GET',
            headers: {
                'Authorization': `OAuth ${YANDEX_TOKEN}`
            }
        };
        
        const yandexReq = https.request(options, (yandexRes) => {
            let data = '';
            yandexRes.on('data', chunk => data += chunk);
            yandexRes.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    
                    if (!json._embedded || !json._embedded.items) {
                        return res.end(JSON.stringify({ photos: [], videos: [] }));
                    }
                    
                    const photos = [];
                    const videos = [];
                    
                    for (const item of json._embedded.items) {
                        if (item.type !== 'file') continue;
                        
                        // Получаем прямую ссылку на скачивание
                        const fileOptions = {
                            hostname: 'cloud-api.yandex.net',
                            path: `/v1/disk/resources/download?path=${encodeURIComponent(item.path)}`,
                            method: 'GET',
                            headers: {
                                'Authorization': `OAuth ${YANDEX_TOKEN}`
                            }
                        };
                        
                        const fileReq = https.request(fileOptions, (fileRes) => {
                            let fileData = '';
                            fileRes.on('data', chunk => fileData += chunk);
                            fileRes.on('end', () => {
                                try {
                                    const fileJson = JSON.parse(fileData);
                                    const url = fileJson.href;
                                    
                                    if (item.name.match(/\.(jpg|jpeg|png|webp)$/i)) {
                                        photos.push(url);
                                    } else if (item.name.match(/\.(mp4|mov|webm)$/i)) {
                                        videos.push(url);
                                    }
                                    
                                    // Когда все файлы обработаны
                                    if (photos.length + videos.length >= json._embedded.items.length) {
                                        res.end(JSON.stringify({ photos, videos }));
                                    }
                                } catch (e) {
                                    res.end(JSON.stringify({ error: e.message }));
                                }
                            });
                        });
                        
                        fileReq.on('error', () => {
                            res.end(JSON.stringify({ error: 'Yandex API error' }));
                        });
                        fileReq.end();
                    }
                    
                    if (json._embedded.items.length === 0) {
                        res.end(JSON.stringify({ photos: [], videos: [] }));
                    }
                } catch (e) {
                    res.end(JSON.stringify({ error: e.message }));
                }
            });
        });
        
        yandexReq.on('error', () => {
            res.end(JSON.stringify({ error: 'Yandex API error' }));
        });
        yandexReq.end();
        
        return;
    }
    
    res.end(JSON.stringify({ error: 'Not found' }));
};
