// Конфигурация
// Telegram с фото (загрузить через upload-telegram.js)
// Ссылки хранятся в telegram-photos.json

// Состояние
let allCars = [];
let currentBrand = null;
let mediaIndex = {}; // VIN (6 цифр) -> {photos: [], videos: []}
let telegramPhotos = {}; // Загружается из JSON

// DOM
const searchInput = document.getElementById('searchInput');
const brandsContainer = document.getElementById('brandsContainer');
const carsContainer = document.getElementById('carsContainer');
const noResults = document.getElementById('noResults');
const modal = document.getElementById('carModal');
const modalClose = document.getElementById('modalClose');
const modalContent = document.getElementById('modalContent');

// Telegram
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Загрузка ссылок на фото из Telegram
async function loadTelegramPhotos() {
    try {
        const response = await fetch('/telegram-photos.json');
        telegramPhotos = await response.json();
        console.log(`✅ Загружено ${Object.keys(telegramPhotos).length} папок с фото`);
    } catch (e) {
        console.error('Ошибка загрузки фото:', e);
    }
}

// Загрузка автомобилей
async function loadCars() {
    showLoading();
    await loadTelegramPhotos(); // Загружаем фото из Telegram
    try {
        const response = await fetch('/api/cars');
        allCars = await response.json();
        if (allCars.length === 0) {
            showNoCars();
            return;
        }
        renderBrands();
        renderCars(allCars);
    } catch (error) {
        console.error('Ошибка:', error);
        showError();
    }
}

// Рендер кнопок марок
function renderBrands() {
    // Сортируем марки по алфавиту
    const brands = [...new Set(allCars.map(car => car.brand).filter(Boolean))].sort((a, b) => 
        a.localeCompare(b, 'ru')
    );
    
    brandsContainer.innerHTML = brands.map(brand => `
        <button class="brand-btn ${currentBrand === brand ? 'active' : ''}" data-brand="${brand}">
            ${brand}
        </button>
    `).join('');

    document.querySelectorAll('.brand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));
            if (currentBrand === btn.dataset.brand) {
                currentBrand = null;
                btn.classList.remove('active');
            } else {
                btn.classList.add('active');
                currentBrand = btn.dataset.brand;
            }
            filterCars();
        });
    });
}

// Загрузка ссылок на фото из Telegram
async function loadTelegramPhotos() {
    try {
        const response = await fetch('/telegram-photos.json');
        telegramPhotos = await response.json();
        console.log(`✅ Загружено ${Object.keys(telegramPhotos).length} папок с фото`);
    } catch (e) {
        console.error('Ошибка загрузки фото:', e);
    }
}

// Найти медиа по VIN
async function getCarMedia(vin) {
    if (!vin) return { photos: [], videos: [] };
    const vinId = vin.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    
    // Проверяем локальный кэш
    if (mediaIndex[vinId]) {
        return mediaIndex[vinId];
    }
    
    // Проверяем Telegram
    if (telegramPhotos[vinId]) {
        mediaIndex[vinId] = { 
            photos: telegramPhotos[vinId], 
            videos: [] 
        };
        return mediaIndex[vinId];
    }
    
    // Нет фото
    mediaIndex[vinId] = { photos: [], videos: [] };
    return mediaIndex[vinId];
}

// Рендер карточек
async function renderCars(cars) {
    if (cars.length === 0) {
        carsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    carsContainer.style.display = 'grid';
    noResults.style.display = 'none';

    // Сортируем: сначала авто с фото, потом без фото
    const sortedCars = [...cars].sort((a, b) => {
        const vinA = a.vin?.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
        const vinB = b.vin?.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
        // Проверяем наличие фото (предполагаем что есть если папка существует)
        const hasPhotoA = vinA && mediaIndex[vinA]?.photos.length > 0;
        const hasPhotoB = vinB && mediaIndex[vinB]?.photos.length > 0;
        if (hasPhotoA && !hasPhotoB) return -1;
        if (!hasPhotoA && hasPhotoB) return 1;
        return 0;
    });

    const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3EНет фото%3C/text%3E%3C/svg%3E';

    carsContainer.innerHTML = sortedCars.map(car => {
        const price = typeof car.price === 'number' ? car.price.toLocaleString('ru-RU') + ' ₽' : car.price;
        const year = String(car.year).split('.')[0];
        const vinId = car.vin?.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
        const firstPhoto = mediaIndex[vinId]?.photos?.[0] || placeholder;
        
        return `
        <div class="car-card" data-car='${JSON.stringify(car).replace(/'/g, "&apos;")}'>
            <img src="${firstPhoto}" alt="${car.brand} ${car.model}" class="car-image" data-vin="${car.vin || ''}" onerror="this.src='${placeholder}'">
            <div class="car-info">
                <div class="car-brand">${car.brand}</div>
                <div class="car-model">${car.model}</div>
                <div class="car-price">${price || 'По запросу'}</div>
                <div class="car-details">
                    <div class="car-detail"><strong>Год:</strong> ${year || 'н/д'}</div>
                    <div class="car-detail"><strong>Пробег:</strong> ${car.mileage || 'н/д'}</div>
                    <div class="car-detail"><strong>Двигатель:</strong> ${car.engine || 'н/д'}</div>
                    ${car.city ? `<div class="car-detail"><strong>Город:</strong> ${car.city}</div>` : ''}
                    ${car.color ? `<div class="car-detail"><strong>Цвет:</strong> ${car.color}</div>` : ''}
                </div>
                ${car.description ? `<div class="car-description">⚙️ ${car.description}</div>` : ''}
                ${car.vin ? `<div class="car-vin"><strong>VIN:</strong> ${car.vin}</div>` : ''}
            </div>
        </div>
        `;
    }).join('');

    // Клики
    document.querySelectorAll('.car-card').forEach(card => {
        card.addEventListener('click', () => {
            const car = JSON.parse(card.dataset.car.replace(/&apos;/g, "'"));
            openModal(car);
        });
    });
}

// Фильтр
function filterCars() {
    let filtered = [...allCars];
    if (currentBrand) filtered = filtered.filter(car => car.brand === currentBrand);
    const q = searchInput.value.toLowerCase().trim();
    if (q) {
        filtered = filtered.filter(car =>
            car.brand.toLowerCase().includes(q) ||
            car.model.toLowerCase().includes(q) ||
            String(car.year).includes(q) ||
            String(car.price).includes(q)
        );
    }
    renderCars(filtered);
}

// Модальное окно
async function openModal(car) {
    const price = typeof car.price === 'number' ? car.price.toLocaleString('ru-RU') + ' ₽' : car.price;
    const year = String(car.year).split('.')[0];
    const media = await getCarMedia(car.vin);

    // Создаём слайдер для фото
    const photosHtml = media.photos.length > 0
        ? `<div class="photo-slider">
            <button class="slider-btn prev" onclick="slidePhoto(-1)">&#10094;</button>
            <div class="slider-container">
                ${media.photos.map((src, i) => `<img src="${src}" class="slide ${i === 0 ? 'active' : ''}" data-index="${i}">`).join('')}
            </div>
            <button class="slider-btn next" onclick="slidePhoto(1)">&#10095;</button>
            ${media.photos.length > 1 ? `<div class="slider-dots">${media.photos.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}" onclick="goToSlide(${i})"></span>`).join('')}</div>` : ''}
        </div>`
        : '';

    const videosHtml = media.videos.length > 0
        ? `<div class="gallery-section"><h3>🎬 Видео (${media.videos.length})</h3><div class="videos-gallery">${media.videos.map(s => `<video controls><source src="${s}"></video>`).join('')}</div></div>`
        : '';

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>${car.brand} ${car.model}</h2>
            <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <div class="modal-body">
            ${!photosHtml && !videosHtml ? `<div class="no-photo-placeholder"><svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><p>Нет фото</p></div>` : ''}
            ${photosHtml}
            ${videosHtml}
            <div class="modal-price">${price || 'По запросу'}</div>
            <div class="modal-specs">
                <div class="spec-row"><span>Год:</span><strong>${year || 'н/д'}</strong></div>
                <div class="spec-row"><span>Пробег:</span><strong>${car.mileage || 'н/д'}</strong></div>
                <div class="spec-row"><span>Двигатель:</span><strong>${car.engine || 'н/д'}</strong></div>
                <div class="spec-row"><span>Комплектация:</span><strong>${car.description || 'н/д'}</strong></div>
                ${car.city ? `<div class="spec-row"><span>Город:</span><strong>${car.city}</strong></div>` : ''}
                ${car.color ? `<div class="spec-row"><span>Цвет:</span><strong>${car.color}</strong></div>` : ''}
                ${car.vin ? `<div class="spec-row"><span>VIN:</span><strong>${car.vin}</strong></div>` : ''}
            </div>
        </div>
        <div class="modal-footer">
            <a href="https://t.me/pikok_o" class="contact-btn" target="_blank">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/></svg>
                Связаться с нами
            </a>
        </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    document.getElementById('modalClose').onclick = closeModal;
    modal.onclick = e => { if (e.target === modal) closeModal(); };
    
    // Сохраняем текущий слайд для этого авто
    window.currentSlide = 0;
    window.totalSlides = media.photos.length;
}

// Переключение фото
function slidePhoto(direction) {
    if (window.totalSlides <= 1) return;
    
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    // Скрываем текущий
    slides[window.currentSlide].classList.remove('active');
    if (dots[window.currentSlide]) dots[window.currentSlide].classList.remove('active');
    
    // Вычисляем новый
    window.currentSlide = (window.currentSlide + direction + window.totalSlides) % window.totalSlides;
    
    // Показываем новый
    slides[window.currentSlide].classList.add('active');
    if (dots[window.currentSlide]) dots[window.currentSlide].classList.add('active');
}

// Переход к конкретному слайду
function goToSlide(index) {
    if (window.totalSlides <= 1) return;
    
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    
    if (slides.length === 0) return;
    
    slides[window.currentSlide].classList.remove('active');
    if (dots[window.currentSlide]) dots[window.currentSlide].classList.remove('active');
    
    window.currentSlide = index;
    
    slides[window.currentSlide].classList.add('active');
    if (dots[window.currentSlide]) dots[window.currentSlide].classList.add('active');
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

function showLoading() {
    carsContainer.innerHTML = '<div class="loading">Загрузка...</div>';
    noResults.style.display = 'none';
}

function showNoCars() {
    carsContainer.style.display = 'none';
    brandsContainer.innerHTML = '';
    noResults.style.display = 'block';
    noResults.innerHTML = '<p>📭 Пусто</p>';
}

function showError() {
    carsContainer.innerHTML = '<div class="loading">❌ Ошибка</div>';
    noResults.style.display = 'none';
}

searchInput.addEventListener('input', filterCars);
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
document.addEventListener('DOMContentLoaded', loadCars);
