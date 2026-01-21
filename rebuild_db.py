import os
import sqlite3

DATABASE_PATH = 'database/moc.db'

def rebuild_database():
    """Полностью пересоздает базу данных"""
    print("🔄 Пересоздаю базу данных...")
    
    # Удаляем старую БД если существует
    if os.path.exists(DATABASE_PATH):
        os.remove(DATABASE_PATH)
        print("🗑️ Удалена старая база данных")
    
    # Создаем новую БД
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Таблица пользователей
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
    
    # Таблица альбомов (исправленная)
    cursor.execute('''
        CREATE TABLE albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            cover_image TEXT,
            is_private BOOLEAN DEFAULT 1,
            ai_generated BOOLEAN DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Таблица фото
    cursor.execute('''
        CREATE TABLE photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            album_id INTEGER,
            original_name TEXT NOT NULL,
            encrypted_name TEXT,
            file_size INTEGER,
            thumbnail TEXT,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (album_id) REFERENCES albums (id) ON DELETE SET NULL
        )
    ''')
    
    conn.commit()
    conn.close()
    
    print("✅ База данных успешно пересоздана!")
    print(f"📍 Путь: {DATABASE_PATH}")

if __name__ == '__main__':
    rebuild_database()