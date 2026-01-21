import os
import sqlite3
import sys

def fix_database():
    """Исправление проблем с базой данных"""
    
    print("🔧 Исправление базы данных MOC...")
    
    # 1. Удаляем старую БД
    if os.path.exists('database'):
        print("🗑️ Удаляем старую базу данных...")
        import shutil
        shutil.rmtree('database', ignore_errors=True)
    
    # 2. Создаём новую
    print("🔄 Создаём новую базу данных...")
    os.makedirs('database', exist_ok=True)
    
    conn = sqlite3.connect('database/moc.db')
    cursor = conn.cursor()
    
    # Создаём таблицы
    cursor.execute('''
        CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            email TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            storage_used INTEGER DEFAULT 0,
            master_key_hash TEXT
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            cover_image TEXT,
            ai_generated BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    cursor.execute('''
        CREATE TABLE files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            encrypted_name TEXT,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Добавляем тестового пользователя
    import hashlib
    import secrets
    
    salt = secrets.token_hex(16)
    password_hash = hashlib.sha256(('123456' + salt).encode()).hexdigest()
    master_key = secrets.token_hex(32)
    
    cursor.execute('''
        INSERT INTO users (username, password_hash, salt, email, master_key_hash)
        VALUES (?, ?, ?, ?, ?)
    ''', ('testuser', password_hash, salt, 'test@test.com', hashlib.sha256(master_key.encode()).hexdigest()))
    
    user_id = cursor.lastrowid
    
    # Добавляем тестовые альбомы
    albums = [
        ("Мои фото", "Ваши личные фотографии"),
        ("С друзьями", "Фото с друзьями"),
        ("Путешествия", "Воспоминания о поездках")
    ]
    
    for title, desc in albums:
        cursor.execute('''
            INSERT INTO albums (user_id, title, description, ai_generated)
            VALUES (?, ?, ?, ?)
        ''', (user_id, title, desc, 0))
    
    conn.commit()
    conn.close()
    
    print("✅ База данных создана успешно!")
    print(f"📝 Тестовый пользователь: testuser / 123456")
    print(f"🔑 Мастер-ключ тестового пользователя: {master_key}")
    print("\n🚀 Теперь запустите: python app.py")

if __name__ == '__main__':
    fix_database()