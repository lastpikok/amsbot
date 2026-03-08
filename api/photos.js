// API: получить список фото из Telegram
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        // Путь к файлу в public папке
        const filePath = path.join(__dirname, '..', 'public', 'telegram-photos.json');
        console.log('Trying to load:', filePath);
        
        if (!fs.existsSync(filePath)) {
            console.error('File not found:', filePath);
            return res.status(404).end(JSON.stringify({ error: 'File not found' }));
        }
        
        const data = fs.readFileSync(filePath, 'utf8');
        res.end(data);
    } catch (e) {
        console.error('Error:', e.message);
        res.status(500).end(JSON.stringify({ error: e.message }));
    }
};
