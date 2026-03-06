const XLSX = require('xlsx');
const path = require('path');

// Пути к файлам
const SOURCE_FILE = path.join(__dirname, 'Сток по авто.xlsx');
const DEST_FILE = path.join(__dirname, 'cars.xlsx');

try {
    // Читаем исходный файл
    const workbook = XLSX.readFile(SOURCE_FILE);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Читаем все данные как массив массивов (без заголовков)
    const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    
    // Заголовки в 4-й строке (индекс 3)
    const headers = rawData[3];
    
    // Данные начинаются с 5-й строки (индекс 4)
    const dataRows = rawData.slice(4);
    
    console.log('Заголовки:', headers);
    console.log('Строк данных:', dataRows.length);
    
    // Фильтруем только автомобили в продаже (статус "В ПРОДАЖЕ" или "ЗАЛОГ")
    const statusIndex = 1; // Колонка СТАТУС
    
    const carsData = dataRows
        .filter(row => {
            const status = (row[statusIndex] || '').toString().trim();
            return status === 'В ПРОДАЖЕ' || status === 'ЗАЛОГ';
        })
        .map((row, index) => ({
            'ПРОИЗВОДИТЕЛЬ': row[3] || '',
            'МОДЕЛЬ': row[4] || '',
            'ГОД': row[8] || '',
            'ИТОГО РУБЛИ': row[15] || '',
            'ПРОБЕГ': row[7] || '',
            'ДВИГАТЕЛЬ': row[6] || '',
            'КПП': '',
            'ГОРОД': row[9] || '',
            'ЦВЕТ': row[10] || '',
            'VIN': row[11] || '',
            'КОМПЛЕКТАЦИЯ': row[5] || '',
            'СТАТУС': row[1] || ''
        }));

    // Создаем новый файл
    const newWorksheet = XLSX.utils.json_to_sheet(carsData);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newWorksheet, 'Автомобили');
    XLSX.writeFile(newWorkbook, DEST_FILE);

    console.log(`✅ Файл ${DEST_FILE} успешно создан!`);
    console.log(`📊 Всего автомобилей в продаже: ${carsData.length}`);
    
    // Показываем пример
    if (carsData.length > 0) {
        console.log('\n📋 Пример записи:');
        console.log(JSON.stringify(carsData[0], null, 2));
    }
} catch (error) {
    console.error('❌ Ошибка конвертации:', error.message);
}
