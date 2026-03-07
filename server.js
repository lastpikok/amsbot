const express = require('express');
const XLSX = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

// Папка с фото
const MEDIA_FOLDER = path.join(__dirname, 'cars-media');

// Раздаём фото статически
app.use('/media', express.static(MEDIA_FOLDER));

const XLSX_FILE = path.join(__dirname, 'cars.xlsx');

// Чтение XLSX
function readCarsFromXlsx() {
    try {
        if (!fs.existsSync(XLSX_FILE)) {
            console.warn('cars.xlsx не найден');
            return [];
        }
        const workbook = XLSX.readFile(XLSX_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        return data.map((car, index) => ({
            id: index + 1,
            brand: car['ПРОИЗВОДИТЕЛЬ'] || '',
            model: car['МОДЕЛЬ'] || '',
            year: car['ГОД'] || '',
            price: car['ИТОГО РУБЛИ'] || '',
            mileage: car['ПРОБЕГ'] || '',
            engine: car['ДВИГАТЕЛЬ'] || '',
            description: car['КОМПЛЕКТАЦИЯ'] || '',
            city: car['ГОРОД'] || '',
            color: car['ЦВЕТ'] || '',
            vin: car['VIN'] || ''
        }));
    } catch (error) {
        console.error('Ошибка чтения XLSX:', error.message);
        return [];
    }
}

// API: список VIN для которых есть фото
app.get('/api/media-index', (req, res) => {
    const index = {};
    if (fs.existsSync(MEDIA_FOLDER)) {
        const folders = fs.readdirSync(MEDIA_FOLDER);
        folders.forEach(folder => {
            const photosPath = path.join(MEDIA_FOLDER, folder);
            if (fs.statSync(photosPath).isDirectory()) {
                const photos = fs.readdirSync(photosPath)
                    .filter(f => /\.(jpg|jpeg|png|webp)$/i.test(f))
                    .sort()
                    .map(f => `/media/${folder}/${f}`);
                const videos = fs.readdirSync(photosPath)
                    .filter(f => /\.(mp4|mov|webm)$/i.test(f))
                    .sort()
                    .map(f => `/media/${folder}/${f}`);
                index[folder] = { photos, videos };
            }
        });
    }
    res.json(index);
});

// API: автомобили
app.get('/api/cars', (req, res) => {
    const cars = readCarsFromXlsx();
    res.json(cars);
});

// Запуск
const os = require('os');

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚗 Сервер запущен: http://localhost:${PORT}`);
    console.log(`📁 Фото: ${MEDIA_FOLDER}`);
    
    // Показываем IP для доступа с телефона
    const interfaces = os.networkInterfaces();
    console.log('\n📱 Доступ с телефона:');
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                console.log(`   http://${iface.address}:${PORT}`);
            }
        }
    }
});
