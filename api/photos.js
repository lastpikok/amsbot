// API: получить список фото из Telegram
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');
    
    try {
        const filePath = path.join(__dirname, '..', 'public', 'telegram-photos.json');
        const data = fs.readFileSync(filePath, 'utf8');
        res.end(data);
    } catch (e) {
        res.status(404).end(JSON.stringify({ error: 'File not found' }));
    }
};
