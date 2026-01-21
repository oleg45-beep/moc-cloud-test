from flask import Blueprint, request, jsonify, session
import sqlite3
import hashlib
import secrets

profile_bp = Blueprint('profile', __name__)

def get_db():
    conn = sqlite3.connect('database/moc.db')
    conn.row_factory = sqlite3.Row
    return conn

@profile_bp.route('/update', methods=['POST'])
def update_profile():
    """Обновление профиля пользователя"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    try:
        data = request.json
        email = data.get('email', '').strip()
        full_name = data.get('full_name', '').strip()
        avatar = data.get('avatar', 'default')
        
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            UPDATE users 
            SET email = ?, full_name = ?, avatar = ?
            WHERE id = ?
        ''', (email, full_name, avatar, user_id))
        
        conn.commit()
        
        # Получаем обновлённые данные
        cursor.execute('SELECT username, email, full_name, avatar FROM users WHERE id = ?', (user_id,))
        user = cursor.fetchone()
        
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Профиль обновлён",
            "user": dict(user)
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@profile_bp.route('/change_password', methods=['POST'])
def change_password():
    """Смена пароля"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    try:
        data = request.json
        old_password = data.get('old_password', '').strip()
        new_password = data.get('new_password', '').strip()
        
        if len(new_password) < 6:
            return jsonify({"error": "Новый пароль должен быть не менее 6 символов"}), 400
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Проверяем старый пароль
        cursor.execute('SELECT password_hash, salt FROM users WHERE id = ?', (user_id,))
        user_data = cursor.fetchone()
        
        if not user_data:
            return jsonify({"error": "User not found"}), 404
        
        old_hash = hashlib.sha256((old_password + user_data['salt']).encode()).hexdigest()
        
        if old_hash != user_data['password_hash']:
            return jsonify({"error": "Неверный текущий пароль"}), 401
        
        # Генерируем новую соль и хеш
        new_salt = secrets.token_hex(16)
        new_hash = hashlib.sha256((new_password + new_salt).encode()).hexdigest()
        
        # Обновляем пароль
        cursor.execute('''
            UPDATE users 
            SET password_hash = ?, salt = ?
            WHERE id = ?
        ''', (new_hash, new_salt, user_id))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Пароль успешно изменён"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@profile_bp.route('/stats', methods=['GET'])
def get_stats():
    """Получение статистики пользователя"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Основная информация
        cursor.execute('''
            SELECT username, email, full_name, avatar, storage_used, storage_limit,
                   created_at, last_login
            FROM users WHERE id = ?
        ''', (user_id,))
        
        user = cursor.fetchone()
        
        # Статистика
        cursor.execute('SELECT COUNT(*) FROM photos WHERE user_id = ?', (user_id,))
        photos_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(*) FROM albums WHERE user_id = ?', (user_id,))
        albums_count = cursor.fetchone()[0]
        
        cursor.execute('SELECT COUNT(DISTINCT chat_id) FROM chat_participants WHERE user_id = ?', (user_id,))
        chats_count = cursor.fetchone()[0]
        
        conn.close()
        
        return jsonify({
            "success": True,
            "user": dict(user),
            "stats": {
                "photos": photos_count,
                "albums": albums_count,
                "chats": chats_count,
                "storage_percent": (user['storage_used'] / user['storage_limit']) * 100
            }
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
