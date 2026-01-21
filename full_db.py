import sqlite3
import os

def init_full_database():
    """Инициализация полной базы данных со всеми таблицами"""
    
    os.makedirs('database', exist_ok=True)
    conn = sqlite3.connect('database/moc.db')
    cursor = conn.cursor()
    
    # ===== ОСНОВНЫЕ ТАБЛИЦЫ =====
    
    # Пользователи
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
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
    
    # Файлы
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            file_name TEXT NOT NULL,
            file_size INTEGER,
            encrypted_name TEXT,
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Альбомы
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            is_private BOOLEAN DEFAULT 1,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Фото
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS photos (
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
    
    # Профили пользователей
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id INTEGER PRIMARY KEY,
            full_name TEXT,
            bio TEXT,
            avatar TEXT,
            theme TEXT DEFAULT 'dark',
            language TEXT DEFAULT 'ru',
            storage_limit INTEGER DEFAULT 1073741824,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Друзья
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS friends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user1_id INTEGER NOT NULL,
            user2_id INTEGER NOT NULL,
            status TEXT DEFAULT 'accepted',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user1_id) REFERENCES users (id),
            FOREIGN KEY (user2_id) REFERENCES users (id)
        )
    ''')
    
    # Сообщения
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            is_read BOOLEAN DEFAULT 0,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id)
        )
    ''')
    
    # Шаринг альбомов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS album_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            album_id INTEGER NOT NULL,
            share_token TEXT UNIQUE NOT NULL,
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (album_id) REFERENCES albums (id)
        )
    ''')
    
    # Отправленные альбомы
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS album_sends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            album_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (album_id) REFERENCES albums (id),
            FOREIGN KEY (sender_id) REFERENCES users (id),
            FOREIGN KEY (receiver_id) REFERENCES users (id)
        )
    ''')
    
    # AI альбомы (сгенерированные)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_albums (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            album_id INTEGER NOT NULL,
            ai_model TEXT,
            prompt TEXT,
            generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (album_id) REFERENCES albums (id)
        )
    ''')
    # Чаты
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            type TEXT DEFAULT 'private',
            title TEXT,
            created_by INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_message_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (created_by) REFERENCES users (id)
        )
    ''')

    # Участники чатов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS chat_participants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')

    # Сообщения (исправленная версия)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER NOT NULL,
            sender_id INTEGER NOT NULL,
            message_type TEXT DEFAULT 'text',
            content TEXT NOT NULL,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            read_at TIMESTAMP,
            FOREIGN KEY (chat_id) REFERENCES chats (id),
            FOREIGN KEY (sender_id) REFERENCES users (id)
        )
    ''')

    # Обновляем таблицу users (добавляем недостающие поля)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users_new (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            salt TEXT NOT NULL,
            email TEXT,
            full_name TEXT,
            avatar TEXT DEFAULT '👤',
            storage_used INTEGER DEFAULT 0,
            storage_limit INTEGER DEFAULT 1073741824,
            master_key_hash TEXT,
            last_login TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    # Копируем данные из старой таблицы
    cursor.execute('''
        INSERT OR IGNORE INTO users_new (id, username, password_hash, salt, email, created_at)
        SELECT id, username, password_hash, salt, email, created_at 
        FROM users
    ''')

    # Удаляем старую таблицу и переименовываем новую
    cursor.execute('DROP TABLE IF EXISTS users')
    cursor.execute('ALTER TABLE users_new RENAME TO users')
    
    # ===== ТЕСТОВЫЕ ДАННЫЕ =====
    
    # Техподдержка (специальный аккаунт)
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, password_hash, salt, email)
        VALUES ('Поддержка MOC', 'predefined_hash', 'predefined_salt', 'support@moc.local')
    ''')
    
    # Тестовый пользователь
    cursor.execute('''
        INSERT OR IGNORE INTO users (username, password_hash, salt, email)
        VALUES ('test_user', 'predefined_hash', 'predefined_salt', 'test@moc.local')
    ''')
    
    conn.commit()
    conn.close()
    
    print("✅ База данных успешно инициализирована!")
    print("📊 Созданы таблицы: users, files, albums, photos, user_profiles, friends, messages")
    print("👤 Тестовые пользователи: 'test_user' и 'Поддержка MOC'")

if __name__ == '__main__':
    init_full_database()