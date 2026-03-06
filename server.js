const express = require('express');
const XLSX = require('xlsx');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.static('public'));

// Путь к XLSX файлу
const XLSX_FILE = path.join(__dirname, 'cars.xlsx');

// Функция чтения XLSX файла
function readCarsFromXlsx() {
    try {
        if (!fs.existsSync(XLSX_FILE)) {
            console.warn('Файл cars.xlsx не найден');
            return [];
        }

        const workbook = XLSX.readFile(XLSX_FILE);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet);

        return data.map((car, index) => ({
            id: index + 1,
            brand: car['ПРОИЗВОДИТЕЛЬ'] || car['Марка'] || car['brand'] || '',
            model: car['МОДЕЛЬ'] || car['Модель'] || car['model'] || '',
            year: car['ГОД'] || car['Год'] || car['year'] || '',
            price: car['ИТОГО РУБЛИ'] || car['РУБЛИ'] || car['Цена'] || car['price'] || '',
            mileage: car['ПРОБЕГ'] || car['Пробег'] || car['mileage'] || '',
            engine: car['ДВИГАТЕЛЬ'] || car['Двигатель'] || car['engine'] || '',
            transmission: car['КПП'] || car['transmission'] || '',
            image: car['Изображение'] || car['image'] || '',
            description: car['КОМПЛЕКТАЦИЯ'] || car['Описание'] || car['description'] || '',
            city: car['ГОРОД'] || '',
            color: car['ЦВЕТ'] || '',
            vin: car['VIN'] || ''
        }));
    } catch (error) {
        console.error('Ошибка чтения XLSX:', error.message);
        return [];
    }
}

// API endpoint для получения всех автомобилей
app.get('/api/cars', (req, res) => {
    const cars = readCarsFromXlsx();
    res.json(cars);
});

// API endpoint для поиска автомобилей
app.get('/api/cars/search', (req, res) => {
    const query = req.query.q?.toLowerCase() || '';
    const cars = readCarsFromXlsx();
    
    if (!query) {
        return res.json(cars);
    }
    
    const filtered = cars.filter(car => 
        car.brand.toLowerCase().includes(query) ||
        car.model.toLowerCase().includes(query) ||
        String(car.year).includes(query) ||
        String(car.price).includes(query)
    );
    
    res.json(filtered);
});

// API endpoint для получения списка марок
app.get('/api/brands', (req, res) => {
    const cars = readCarsFromXlsx();
    const brands = [...new Set(cars.map(car => car.brand).filter(Boolean))];
    res.json(brands);
});

// API endpoint для фильтрации по марке
app.get('/api/cars/brand/:brand', (req, res) => {
    const brand = req.params.brand;
    const cars = readCarsFromXlsx();
    const filtered = cars.filter(car => 
        car.brand.toLowerCase() === brand.toLowerCase()
    );
    res.json(filtered);
});

app.listen(PORT, () => {
    console.log(`Сервер запущен: http://localhost:${PORT}`);
    console.log(`Файл с автомобилями: ${XLSX_FILE}`);
});
