#!/usr/bin/env python3
"""
Переименовывает папки в верхний регистр для соответствия с Excel
"""

import os
from pathlib import Path

REPO_FOLDER = Path.home() / "amsbot-cars"

def rename_folders():
    print(f"🔍 Переименование папок в: {REPO_FOLDER}")
    
    renamed = 0
    for folder in REPO_FOLDER.iterdir():
        if folder.is_dir() and '(' in folder.name:
            # Преобразуем в верхний регистр
            new_name = folder.name.upper()
            if folder.name != new_name:
                new_path = folder.parent / new_name
                print(f"  {folder.name} → {new_name}")
                folder.rename(new_path)
                renamed += 1
    
    print(f"\n✅ Переименовано {renamed} папок")
    print(f"\n📤 Теперь отправьте на GitHub:")
    print(f"   cd ~/amsbot-cars")
    print(f"   git add .")
    print(f"   git commit -m 'Rename folders to uppercase'")
    print(f"   git push origin master")

if __name__ == "__main__":
    rename_folders()
