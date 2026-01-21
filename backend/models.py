import sqlite3
import os
import json
from datetime import datetime

DATABASE_PATH = 'database/moc.db'

def init_db():
    """Инициализация базы данных"""
    os.makedirs('database', exist_ok=True)
    
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    
    # Таблица пользователей
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
    
    # Таблица файлов
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
    
    # Таблица альбомов (ИСПРАВЛЕННАЯ ВЕРСИЯ)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS albums (
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
    
    # Таблица фото (связь с альбомами)
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
    
    # Таблица для шаринга альбомов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS album_shares (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            album_id INTEGER NOT NULL,
            user_id INTEGER,  # NULL для публичных ссылок
            share_token TEXT UNIQUE NOT NULL,
            access_type TEXT DEFAULT 'view',  # 'view', 'edit'
            expires_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (album_id) REFERENCES albums (id),
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Таблица отправленных альбомов
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
    
    # Таблица пользователей профиля (дополненная)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_profiles (
            user_id INTEGER PRIMARY KEY,
            full_name TEXT,
            bio TEXT,
            avatar TEXT,
            theme TEXT DEFAULT 'dark',
            language TEXT DEFAULT 'ru',
            storage_limit INTEGER DEFAULT 1073741824,  # 1GB
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    # Таблица друзей/чатов
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
    
    # Таблица сообщений
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            chat_id INTEGER,
            sender_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            message_type TEXT DEFAULT 'text',
            is_read BOOLEAN DEFAULT 0,
            sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Получение соединения с БД"""
    return sqlite3.connect(DATABASE_PATH)

# Инициализируем БД при импорте
init_db()
