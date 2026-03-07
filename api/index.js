// Сервер для Vercel (без локальных файлов)
const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Чтение XLSX из public
const XLSX_FILE = path.join(__dirname, '..', 'public', 'cars.xlsx');

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

module.exports = async (req, res) => {
    // API: автомобили
    if (req.url.startsWith('/api/cars')) {
        const cars = readCarsFromXlsx();
        return res.json(cars);
    }
    
    // Статика из public
    let url = req.url;
    if (url === '/') url = '/index.html';
    
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
        return res.send(content);
    } catch (e) {
        res.statusCode = 404;
        return res.send('Not Found');
    }
};
