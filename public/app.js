// Конфигурация GitHub
const GITHUB_CONFIG = {
    username: 'pikok_o',        // ← Замените на ваш GitHub username
    repo: 'amsbot-cars',        // ← Название репозитория
    branch: 'main'              // ← Ветка (main или master)
};

// Базовый URL для фото и видео
const GITHUB_BASE_URL = `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${GITHUB_CONFIG.repo}/${GITHUB_CONFIG.branch}`;

// Инициализация Telegram WebApp (если доступно)
if (window.Telegram && window.Telegram.WebApp) {
    Telegram.WebApp.ready();
    Telegram.WebApp.expand();
}

// Состояние приложения
let allCars = [];
let currentBrand = null;

// DOM элементы
const searchInput = document.getElementById('searchInput');
const brandsContainer = document.getElementById('brandsContainer');
const carsContainer = document.getElementById('carsContainer');
const noResults = document.getElementById('noResults');

// Модальное окно
const modal = document.getElementById('carModal');
const modalClose = document.getElementById('modalClose');
const modalContent = document.getElementById('modalContent');

// Загрузка автомобилей
async function loadCars() {
    showLoading();

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
        console.error('Ошибка загрузки автомобилей:', error);
        showError();
    }
}

// Получить список фото для автомобиля
function getCarPhotos(vin) {
    if (!vin) return [];
    
    // Используем последние 6 символов VIN для имени папки
    const vinId = vin.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const photos = [];
    
    // Загружаем до 10 фото (1.jpg, 2.jpg, ...)
    for (let i = 1; i <= 10; i++) {
        photos.push(`${GITHUB_BASE_URL}/photos/${vinId}/${i}.jpg`);
    }
    
    return photos;
}

// Получить список видео для автомобиля
function getCarVideos(vin) {
    if (!vin) return [];
    
    const vinId = vin.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
    const videos = [];
    
    // Загружаем до 5 видео (1.mp4, 2.mp4, ...)
    for (let i = 1; i <= 5; i++) {
        videos.push(`${GITHUB_BASE_URL}/videos/${vinId}/${i}.mp4`);
    }
    
    return videos;
}

// Рендеринг кнопок марок
function renderBrands() {
    const brands = [...new Set(allCars.map(car => car.brand).filter(Boolean))];

    brandsContainer.innerHTML = brands.map(brand => `
        <button class="brand-btn ${currentBrand === brand ? 'active' : ''}"
                data-brand="${brand}">
            ${brand}
        </button>
    `).join('');

    // Обработчики кликов
    document.querySelectorAll('.brand-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const brand = btn.dataset.brand;

            document.querySelectorAll('.brand-btn').forEach(b => b.classList.remove('active'));

            if (currentBrand === brand) {
                currentBrand = null;
                btn.classList.remove('active');
            } else {
                btn.classList.add('active');
                currentBrand = brand;
            }

            filterCars();
        });
    });
}

// Рендеринг карточек автомобилей
async function renderCars(cars) {
    if (cars.length === 0) {
        carsContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    carsContainer.style.display = 'grid';
    noResults.style.display = 'none';

    carsContainer.innerHTML = cars.map(car => {
        const price = typeof car.price === 'number' 
            ? car.price.toLocaleString('ru-RU') + ' ₽' 
            : car.price;
        
        const year = String(car.year).split('.')[0];
        const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3EНет фото%3C/text%3E%3C/svg%3E';

        return `
        <div class="car-card" data-car='${JSON.stringify(car).replace(/'/g, "&apos;")}'>
            <img src="${placeholder}"
                 alt="${car.brand} ${car.model}"
                 class="car-image"
                 data-vin="${car.vin || ''}">
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

    // Загружаем первое фото для каждой карточки
    document.querySelectorAll('.car-image').forEach(async (img) => {
        const vin = img.dataset.vin;
        if (vin) {
            const vinId = vin.replace(/[^a-zA-Z0-9]/g, '').slice(-6);
            const firstPhoto = `${GITHUB_BASE_URL}/photos/${vinId}/1.jpg`;
            
            // Проверяем существование фото
            try {
                const response = await fetch(firstPhoto, { method: 'HEAD' });
                if (response.ok) {
                    img.src = firstPhoto;
                }
            } catch (e) {
                // Фото не найдено, остаётся заглушка
            }
        }
    });

    // Обработчики кликов на карточки
    document.querySelectorAll('.car-card').forEach(card => {
        card.addEventListener('click', () => {
            const car = JSON.parse(card.dataset.car.replace(/&apos;/g, "'"));
            openModal(car);
        });
    });
}

// Фильтрация автомобилей
function filterCars() {
    let filtered = [...allCars];

    if (currentBrand) {
        filtered = filtered.filter(car => car.brand === currentBrand);
    }

    const query = searchInput.value.toLowerCase().trim();
    if (query) {
        filtered = filtered.filter(car =>
            car.brand.toLowerCase().includes(query) ||
            car.model.toLowerCase().includes(query) ||
            String(car.year).includes(query) ||
            String(car.price).includes(query) ||
            (car.description && car.description.toLowerCase().includes(query))
        );
    }

    renderCars(filtered);
}

function showLoading() {
    carsContainer.innerHTML = '<div class="loading">Загрузка автомобилей...</div>';
    noResults.style.display = 'none';
}

function showNoCars() {
    carsContainer.style.display = 'none';
    brandsContainer.innerHTML = '';
    noResults.style.display = 'block';
    noResults.innerHTML = '<p>📭 Список автомобилей пуст</p><p>Добавьте данные в файл cars.xlsx</p>';
}

function showError() {
    carsContainer.innerHTML = '<div class="loading">❌ Ошибка загрузки данных</div>';
    noResults.style.display = 'none';
}

searchInput.addEventListener('input', () => {
    filterCars();
});

// Модальное окно
async function openModal(car) {
    const price = typeof car.price === 'number'
        ? car.price.toLocaleString('ru-RU') + ' ₽'
        : car.price;
    const year = String(car.year).split('.')[0];
    
    const vinId = car.vin ? car.vin.replace(/[^a-zA-Z0-9]/g, '').slice(-6) : null;
    const placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-size="20"%3EНет фото%3C/text%3E%3C/svg%3E';

    // Проверяем какие фото существуют
    const photos = [];
    const videos = [];
    
    if (vinId) {
        // Проверяем фото (до 10)
        for (let i = 1; i <= 10; i++) {
            const photoUrl = `${GITHUB_BASE_URL}/photos/${vinId}/${i}.jpg`;
            try {
                const response = await fetch(photoUrl, { method: 'HEAD' });
                if (response.ok) {
                    photos.push(photoUrl);
                } else {
                    break; // Дальше фото нет
                }
            } catch (e) {
                break;
            }
        }
        
        // Проверяем видео (до 5)
        for (let i = 1; i <= 5; i++) {
            const videoUrl = `${GITHUB_BASE_URL}/videos/${vinId}/${i}.mp4`;
            try {
                const response = await fetch(videoUrl, { method: 'HEAD' });
                if (response.ok) {
                    videos.push(videoUrl);
                } else {
                    break;
                }
            } catch (e) {
                break;
            }
        }
    }

    const photosHtml = photos.length > 0
        ? `<div class="gallery-section"><h3>📷 Фото (${photos.length})</h3><div class="photos-gallery">${photos.map(src => `<img src="${src}" loading="lazy" onclick="this.requestFullscreen ? this.requestFullscreen() : null">`).join('')}</div></div>`
        : '';

    const videosHtml = videos.length > 0
        ? `<div class="gallery-section"><h3>🎬 Видео (${videos.length})</h3><div class="videos-gallery">${videos.map(src => `<video controls preload="metadata"><source src="${src}"></video>`).join('')}</div></div>`
        : '';

    const defaultContent = !photosHtml && !videosHtml
        ? `<div class="no-photo-placeholder">
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>Фото и видео отсутствуют</p>
            <p class="hint">Загрузите их в репозиторий GitHub:<br><code>photos/${vinId || 'VIN'}/1.jpg</code></p>
        </div>`
        : '';

    modalContent.innerHTML = `
        <div class="modal-header">
            <h2>${car.brand} ${car.model}</h2>
            <button class="modal-close" id="modalClose">&times;</button>
        </div>
        <div class="modal-body">
            ${defaultContent}
            ${photosHtml}
            ${videosHtml}
            
            <div class="modal-price">${price || 'По запросу'}</div>
            <div class="modal-specs">
                <div class="spec-row"><span>Год выпуска:</span> <strong>${year || 'н/д'}</strong></div>
                <div class="spec-row"><span>Пробег:</span> <strong>${car.mileage || 'н/д'}</strong></div>
                <div class="spec-row"><span>Двигатель:</span> <strong>${car.engine || 'н/д'}</strong></div>
                <div class="spec-row"><span>Комплектация:</span> <strong>${car.description || 'н/д'}</strong></div>
                ${car.city ? `<div class="spec-row"><span>Город:</span> <strong>${car.city}</strong></div>` : ''}
                ${car.color ? `<div class="spec-row"><span>Цвет:</span> <strong>${car.color}</strong></div>` : ''}
                ${car.vin ? `<div class="spec-row"><span>VIN:</span> <strong>${car.vin}</strong></div>` : ''}
            </div>
        </div>
        <div class="modal-footer">
            <a href="https://t.me/pikok_o" target="_blank" class="contact-btn">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.054 5.56-5.022c.242-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
                Связаться с нами
            </a>
        </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    document.getElementById('modalClose').addEventListener('click', closeModal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
});

document.addEventListener('DOMContentLoaded', loadCars);
