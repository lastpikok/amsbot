#!/usr/bin/env python3
"""
Переименовывает фото в папках автомобилей.
"""

import os
from pathlib import Path

# Папка с фото
PHOTOS_FOLDER = Path("C:/Users/vava7/OneDrive/Рабочий стол/photos")

def rename_photos():
    print(f"🔍 Поиск папок в: {PHOTOS_FOLDER}")
    
    if not PHOTOS_FOLDER.exists():
        print(f"❌ Папка не найдена: {PHOTOS_FOLDER}")
        return
    
    # Находим все папки автомобилей
    car_folders = [f for f in PHOTOS_FOLDER.iterdir() if f.is_dir()]
    
    print(f"📁 Найдено папок: {len(car_folders)}")
    
    total_renamed = 0
    
    for folder in car_folders:
        # Ищем папку Photo внутри или используем саму папку
        photo_folder = folder / "Photo"
        if not photo_folder.exists():
            photo_folder = folder  # Если нет подпапки Photo, используем корень
        
        if not photo_folder.exists():
            continue
        
        # Находим все jpg/png файлы
        files = [f for f in photo_folder.iterdir() 
                 if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.webp']]
        
        if not files:
            continue
        
        # Сортируем по имени
        files.sort(key=lambda x: x.name)
        
        # Переименовываем
        print(f"\n📂 {folder.name}:")
        for i, file in enumerate(files, 1):
            ext = file.suffix
            new_name = f"{i}{ext}"
            new_path = photo_folder / new_name
            
            if file.name != new_name:
                print(f"  {file.name} → {new_name}")
                file.rename(new_path)
                total_renamed += 1
    
    print(f"\n✅ Переименовано {total_renamed} файлов в {PHOTOS_FOLDER}")
    print(f"\n📤 Теперь загрузите эти фото в GitHub:")
    print(f"   https://github.com/lastpikok/amsbot-cars")

if __name__ == "__main__":
    rename_photos()
