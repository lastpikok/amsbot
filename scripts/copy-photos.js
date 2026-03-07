const fs = require('fs');
const path = require('path');

const SOURCE = 'C:\\Users\\vava7\\OneDrive\\Рабочий стол\\photos';  // Твоя папка с фото
const DEST = path.join(__dirname, '..', 'cars-media');      // Куда (в корень проекта)

console.log('📁 Копирование фото...');
console.log(`   Откуда: ${SOURCE}`);
console.log(`   Куда: ${DEST}`);

// Создаём папку назначения
if (!fs.existsSync(DEST)) {
    fs.mkdirSync(DEST, { recursive: true });
    console.log('✅ Создана папка cars-media');
}

// Проверяем исходную папку
if (!fs.existsSync(SOURCE)) {
    console.log('❌ Папка photos не найдена!');
    console.log('   Положи фото в: c:\\Users\\vava7\\OneDrive\\Рабочий стол\\photos');
    process.exit(1);
}

// Копируем
let copied = 0;
let skipped = 0;

const folders = fs.readdirSync(SOURCE);
for (const folder of folders) {
    const srcFolder = path.join(SOURCE, folder);
    if (!fs.statSync(srcFolder).isDirectory()) continue;
    
    // Извлекаем VIN из названия папки (поддерживаем обычные и китайские скобки)
    const vinMatch = folder.match(/([a-zA-Z0-9]{6})[）)]?\s*$/);
    if (!vinMatch) {
        console.log(`⏭️ Пропущено: ${folder} (нет VIN)`);
        skipped++;
        continue;
    }
    
    const vinId = vinMatch[1];
    const destFolder = path.join(DEST, vinId);
    
    // Создаём папку
    if (!fs.existsSync(destFolder)) {
        fs.mkdirSync(destFolder, { recursive: true });
    }
    
    // Копируем файлы
    const files = fs.readdirSync(srcFolder);
    for (const file of files) {
        if (/\.(jpg|jpeg|png|webp|mp4|mov|webm)$/i.test(file)) {
            const src = path.join(srcFolder, file);
            const dest = path.join(destFolder, file);
            fs.copyFileSync(src, dest);
            copied++;
        }
    }
    
    console.log(`✅ ${folder} → ${vinId}/ (${files.length} файлов)`);
}

console.log('\n🎉 Готово!');
console.log(`   Скопировано: ${copied} файлов`);
console.log(`   Пропущено: ${skipped} папок`);
console.log(`   Папка: ${DEST}`);
