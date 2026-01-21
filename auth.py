from flask import Blueprint, request, session, jsonify
import hashlib
import secrets
import sqlite3
import os
from datetime import datetime

auth_bp = Blueprint('auth', __name__)

# Путь к базе данных
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
    
    # Таблица альбомов
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS albums (
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
    
    conn.commit()
    conn.close()

def get_db_connection():
    """Получение соединения с БД"""
    return sqlite3.connect(DATABASE_PATH, timeout=10)

def normalize_username(username):
    """Приводит username к нижнему регистру для сравнения"""
    return username.strip().lower() if username else ""

# Инициализируем БД при импорте
init_db()

@auth_bp.route('/register', methods=['POST'])
def register():
    conn = None
    try:
        # Получаем JSON данные
        data = request.get_json()
        if not data:
            return jsonify({"error": "No JSON data provided"}), 400
            
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        email = data.get('email', '').strip()
        
        print(f"📝 Регистрация: username='{username}'")
        
        if not username or not password:
            return jsonify({"error": "Имя пользователя и пароль обязательны"}), 400
        
        if len(username) < 3:
            return jsonify({"error": "Имя пользователя должно быть не менее 3 символов"}), 400
        
        if len(password) < 6:
            return jsonify({"error": "Пароль должен быть не менее 6 символов"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем существование пользователя (без учёта регистра)
        normalized = normalize_username(username)
        cursor.execute('SELECT id FROM users WHERE LOWER(username) = ?', (normalized,))
        if cursor.fetchone():
            return jsonify({"error": "Имя пользователя уже занято"}), 409
        
        # Генерация соли и хеширование пароля
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((password + salt).encode()).hexdigest()
        
        # Мастер-ключ (в реальности хранится только у клиента)
        master_key = secrets.token_hex(32)
        master_key_hash = hashlib.sha256(master_key.encode()).hexdigest()
        
        # Сохраняем пользователя
        cursor.execute('''
            INSERT INTO users (username, password_hash, salt, email, master_key_hash)
            VALUES (?, ?, ?, ?, ?)
        ''', (username, password_hash, salt, email, master_key_hash))
        
        user_id = cursor.lastrowid
        
        # Создаем начальные альбомы для пользователя
        initial_albums = [
            ("Мои фото", "Ваши личные фотографии"),
            ("С друзьями", "Фото с друзьями"),
            ("Путешествия", "Воспоминания о поездках"),
            ("Семья", "Семейные фото"),
            ("Природа", "Пейзажи и животные")
        ]
        
        for title, desc in initial_albums:
            cursor.execute('''
                INSERT INTO albums (user_id, title, description, ai_generated)
                VALUES (?, ?, ?, ?)
            ''', (user_id, title, desc, 0))
        
        conn.commit()
        
        # Возвращаем данные
        return jsonify({
            "success": True,
            "message": "Пользователь успешно зарегистрирован!",
            "user_id": user_id,
            "username": username,
            "master_key": master_key,  # ВНИМАНИЕ: в реальном приложении НЕ отправляем!
            "warning": "⚠️ СОХРАНИТЕ ЭТОТ МАСТЕР-КЛЮЧ! Больше вы его не увидите."
        })
        
    except sqlite3.Error as e:
        print(f"❌ Ошибка SQLite: {e}")
        return jsonify({"error": f"Ошибка базы данных: {str(e)}"}), 500
    except Exception as e:
        print(f"❌ Общая ошибка: {e}")
        return jsonify({"error": f"Ошибка сервера: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/login', methods=['POST'])
def login():
    conn = None
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "Нет данных"}), 400
            
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        print(f"🔑 Логин: '{username}'")
        
        if not username or not password:
            return jsonify({"error": "Введите имя пользователя и пароль"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Получаем пользователя
        normalized = normalize_username(username)
        cursor.execute('''
            SELECT id, username, password_hash, salt, email, storage_used 
            FROM users WHERE LOWER(username) = ?
        ''', (normalized,))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "Неверное имя пользователя или пароль"}), 401
        
        # Распаковываем данные пользователя
        user_data = {
            "id": user[0],
            "username": user[1],
            "password_hash": user[2],
            "salt": user[3],
            "email": user[4],
            "storage_used": user[5]
        }
        
        # Проверяем пароль
        password_hash = hashlib.sha256((password + user_data["salt"]).encode()).hexdigest()
        
        if password_hash != user_data["password_hash"]:
            return jsonify({"error": "Неверное имя пользователя или пароль"}), 401
        
        # Устанавливаем сессию
        session['user_id'] = user_data["id"]
        session['username'] = user_data["username"]
        
        # Получаем альбомы пользователя
        cursor.execute('''
            SELECT id, title, description, ai_generated 
            FROM albums WHERE user_id = ?
        ''', (user_data["id"],))
        
        albums_data = cursor.fetchall()
        
        albums = []
        for album in albums_data:
            albums.append({
                "id": album[0],
                "title": album[1],
                "description": album[2],
                "ai_generated": bool(album[3])
            })
        
        return jsonify({
            "success": True,
            "message": "Вход выполнен успешно!",
            "user": {
                "id": user_data["id"],
                "username": user_data["username"],
                "email": user_data["email"],
                "storage_used": user_data["storage_used"]
            },
            "albums": albums,
            "session_id": secrets.token_hex(16)
        })
        
    except Exception as e:
        print(f"❌ Ошибка логина: {e}")
        return jsonify({"error": f"Ошибка входа: {str(e)}"}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True, "message": "Вы вышли из системы"})

@auth_bp.route('/check', methods=['GET'])
def check_auth():
    """Проверка авторизации"""
    if 'user_id' in session:
        return jsonify({
            "authenticated": True,
            "user_id": session['user_id'],
            "username": session.get('username')
        })
    return jsonify({"authenticated": False})

@auth_bp.route('/profile', methods=['GET'])
def get_profile():
    """Получение профиля пользователя"""
    conn = None
    try:
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = session['user_id']
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT id, username, email, storage_used, created_at 
            FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "id": user[0],
            "username": user[1],
            "email": user[2],
            "storage_used": user[3],
            "created_at": user[4]
        })
        
    except Exception as e:
        print(f"❌ Ошибка получения профиля: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/update_profile', methods=['POST'])
def update_profile():
    """Обновление профиля пользователя"""
    conn = None
    try:
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = session['user_id']
        data = request.get_json()
        email = data.get('email', '').strip()
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE users SET email = ? WHERE id = ?
        ''', (email, user_id))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully"
        })
        
    except Exception as e:
        print(f"❌ Ошибка обновления профиля: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/delete_account', methods=['POST'])
def delete_account():
    """Удаление аккаунта пользователя"""
    conn = None
    try:
        if 'user_id' not in session:
            return jsonify({"error": "Unauthorized"}), 401
        
        user_id = session['user_id']
        
        # Подтверждение пароля
        data = request.get_json()
        password = data.get('password', '')
        
        if not password:
            return jsonify({"error": "Password is required for account deletion"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем пароль
        cursor.execute('SELECT password_hash, salt FROM users WHERE id = ?', (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({"error": "User not found"}), 404
        
        password_hash_db, salt_db = user_data
        password_hash = hashlib.sha256((password + salt_db).encode()).hexdigest()
        
        if password_hash != password_hash_db:
            return jsonify({"error": "Invalid password"}), 401
        
        # Удаляем пользователя и все связанные данные
        cursor.execute('DELETE FROM albums WHERE user_id = ?', (user_id,))
        cursor.execute('DELETE FROM files WHERE user_id = ?', (user_id,))
        cursor.execute('DELETE FROM users WHERE id = ?', (user_id,))
        
        conn.commit()
        session.clear()
        
        return jsonify({
            "success": True,
            "message": "Account deleted successfully"
        })
        
    except Exception as e:
        print(f"❌ Ошибка удаления аккаунта: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/reset_password', methods=['POST'])
def reset_password():
    """Сброс пароля пользователя"""
    conn = None
    try:
        data = request.get_json()
        username = data.get('username', '').strip()
        new_password = data.get('new_password', '').strip()
        
        if not username or not new_password:
            return jsonify({"error": "Username and new password are required"}), 400
        
        if len(new_password) < 6:
            return jsonify({"error": "New password must be at least 6 characters"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Находим пользователя
        normalized = normalize_username(username)
        cursor.execute('SELECT id FROM users WHERE LOWER(username) = ?', (normalized,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        user_id = user[0]
        
        # Генерируем новую соль и хеш пароля
        salt = secrets.token_hex(16)
        password_hash = hashlib.sha256((new_password + salt).encode()).hexdigest()
        
        # Обновляем пароль
        cursor.execute('''
            UPDATE users SET password_hash = ?, salt = ? WHERE id = ?
        ''', (password_hash, salt, user_id))
        
        conn.commit()
        
        return jsonify({
            "success": True,
            "message": "Password reset successfully"
        })
        
    except Exception as e:
        print(f"❌ Ошибка сброса пароля: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/stats', methods=['GET'])
def get_stats():
    """Получение статистики"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute('SELECT COUNT(*) FROM users')
        users_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM albums')
        albums_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM files')
        files_count = cursor.fetchone()[0]
        
        return jsonify({
            "users": users_count,
            "albums": albums_count,
            "files": files_count,
            "timestamp": datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Ошибка получения статистики: {e}")
        return jsonify({"error": str(e)}), 500
    finally:
        if conn:
            conn.close()

@auth_bp.route('/test_db', methods=['GET'])
def test_db():
    """Тест соединения с БД"""
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Проверяем таблицы
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        # Проверяем пользователей
        cursor.execute("SELECT COUNT(*) FROM users")
        users_count = cursor.fetchone()[0]
        
        return jsonify({
            "success": True,
            "tables": [table[0] for table in tables],
            "users_count": users_count,
            "database": DATABASE_PATH,
            "status": "connected"
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "status": "disconnected"
        }), 500
    finally:
        if conn:
            conn.close()