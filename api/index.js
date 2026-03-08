// API для Vercel
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Путь к XLSX файлу (в public папке)
const XLSX_FILE = path.join(__dirname, '..', 'public', 'cars.xlsx');

function readCarsFromXlsx() {
    try {
        console.log('Trying to load:', XLSX_FILE);
        
        if (!fs.existsSync(XLSX_FILE)) {
            console.error('cars.xlsx не найден:', XLSX_FILE);
            return [];
        }
        
        const workbook = XLSX.readFile(XLSX_FILE);
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet);
        
        console.log('Загружено автомобилей:', data.length);
        
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

// Обработчик запросов
module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    // API: автомобили
    if (req.url === '/api/cars' || req.url.startsWith('/api/cars?')) {
        const cars = readCarsFromXlsx();
        return res.end(JSON.stringify(cars));
    }
    
    // API: media-index (пустой для Vercel)
    if (req.url === '/api/media-index') {
        return res.end(JSON.stringify({}));
    }
    
    // Статика из public
    let url = req.url.replace('/api', '');
    if (url === '/' || url === '') url = '/index.html';
    
    const filePath = path.join(__dirname, '..', 'public', url);
    
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(filePath);
        const contentTypes = {
            '.html': 'text/html',
            '.css': 'text/css',
            '.js': 'application/javascript',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.svg': 'image/svg+xml'
        };
        
        res.setHeader('Content-Type', contentTypes[ext] || 'text/plain');
        return res.end(content);
    } catch (e) {
        res.statusCode = 404;
        res.setHeader('Content-Type', 'text/plain');
        return res.end('Not Found: ' + req.url);
    }
};
