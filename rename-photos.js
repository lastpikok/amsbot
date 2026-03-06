const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Пути
const PHOTOS_FOLDER = path.join(__dirname, 'photos'); // Папка с фото
const XLSX_FILE = path.join(__dirname, 'cars.xlsx');

try {
    // Читаем данные автомобилей
    const workbook = XLSX.readFile(XLSX_FILE);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const cars = XLSX.utils.sheet_to_json(sheet);

    // Проверяем папку с фото
    if (!fs.existsSync(PHOTOS_FOLDER)) {
        console.log('❌ Папка photos не найдена. Создайте её и положите туда фото.');
        console.log('Пример структуры:');
        console.log('  photos/');
        console.log('    IMG_001.jpg');
        console.log('    IMG_002.jpg');
        return;
    }

    // Получаем список файлов
    const files = fs.readdirSync(PHOTOS_FOLDER);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    const images = files.filter(f => imageExtensions.includes(path.extname(f).toLowerCase()));

    console.log(`📁 Найдено фото: ${images.length}`);
    console.log(`🚗 Найдено автомобилей: ${cars.length}`);

    // Создаём папку для переименованных фото
    const OUTPUT_FOLDER = path.join(__dirname, 'photos-renamed');
    if (!fs.existsSync(OUTPUT_FOLDER)) {
        fs.mkdirSync(OUTPUT_FOLDER);
    }

    // Копируем и переименовываем по VIN
    let copied = 0;
    cars.forEach(car => {
        if (car.VIN) {
            // Ищем подходящее фото (по номеру строки или совпадению)
            const vin = car.VIN.replace(/[^a-zA-Z0-9]/g, '');
            
            // Пробуем найти фото по VIN в имени файла
            const match = images.find(img => 
                img.toLowerCase().includes(vin.toLowerCase()) ||
                img.toLowerCase().includes(vin.slice(-6).toLowerCase())
            );

            if (match) {
                const ext = path.extname(match);
                const newName = `${vin}${ext}`;
                fs.copyFileSync(
                    path.join(PHOTOS_FOLDER, match),
                    path.join(OUTPUT_FOLDER, newName)
                );
                console.log(`✅ ${match} → ${newName}`);
                copied++;
            }
        }
    });

    console.log(`\n✅ Готово! Переименовано ${copied} фото`);
    console.log(`📂 Папка с фото: ${OUTPUT_FOLDER}`);
    console.log('\n📤 Теперь загрузите эти фото на GitHub!');

} catch (error) {
    console.error('❌ Ошибка:', error.message);
}
