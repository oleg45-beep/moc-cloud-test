from flask import Blueprint, request, jsonify, session
import sqlite3
from datetime import datetime
import secrets

chats_bp = Blueprint('chats', __name__)

def get_db():
    conn = sqlite3.connect('database/moc.db')
    conn.row_factory = sqlite3.Row
    return conn

@chats_bp.route('/create', methods=['POST'])
def create_chat():
    """Создание нового чата"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    try:
        data = request.json
        chat_type = data.get('type', 'private')
        title = data.get('title', '').strip()
        participant_ids = data.get('participants', [])
        
        # Всегда добавляем поддержку
        participant_ids.append(1)  # ID поддержки
        
        conn = get_db()
        cursor = conn.cursor()
        
        # Создаём чат
        cursor.execute('''
            INSERT INTO chats (type, title, created_by, created_at, last_message_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            chat_type,
            title or f"Чат {datetime.now().strftime('%d.%m')}",
            user_id,
            datetime.now().isoformat(),
            datetime.now().isoformat()
        ))
        
        chat_id = cursor.lastrowid
        
        # Добавляем участников
        all_participants = list(set([user_id] + participant_ids))
        
        for participant_id in all_participants:
            cursor.execute('''
                INSERT INTO chat_participants (chat_id, user_id, joined_at)
                VALUES (?, ?, ?)
            ''', (chat_id, participant_id, datetime.now().isoformat()))
        
        # Первое сообщение от поддержки
        cursor.execute('''
            INSERT INTO messages (chat_id, sender_id, message_type, content, sent_at)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            chat_id,
            1,  # Поддержка
            'text',
            'Привет! Я команда поддержки MOC. Чем могу помочь?',
            datetime.now().isoformat()
        ))
        
        conn.commit()
        conn.close()
        
        return jsonify({
            "success": True,
            "chat_id": chat_id,
            "message": "Чат создан"
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chats_bp.route('/list', methods=['GET'])
def list_chats():
    """Список чатов пользователя"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT c.*, 
                   u.username as last_sender_name,
                   m.content as last_message,
                   m.sent_at as last_message_time,
                   (SELECT COUNT(*) FROM messages m2 
                    WHERE m2.chat_id = c.id AND m2.read_at IS NULL 
                    AND m2.sender_id != ?) as unread_count
            FROM chats c
            JOIN chat_participants cp ON c.id = cp.chat_id
            LEFT JOIN messages m ON c.id = m.chat_id
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE cp.user_id = ?
            AND m.sent_at = (
                SELECT MAX(sent_at) FROM messages WHERE chat_id = c.id
            )
            ORDER BY c.last_message_at DESC
        ''', (user_id, user_id))
        
        chats = cursor.fetchall()
        conn.close()
        
        return jsonify({
            "success": True,
            "chats": [dict(chat) for chat in chats]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chats_bp.route('/<int:chat_id>/messages', methods=['GET', 'POST'])
def chat_messages(chat_id):
    """Получение и отправка сообщений"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        # Проверяем участие в чате
        cursor.execute('SELECT 1 FROM chat_participants WHERE chat_id = ? AND user_id = ?', 
                      (chat_id, user_id))
        if not cursor.fetchone():
            return jsonify({"error": "Access denied"}), 403
        
        if request.method == 'GET':
            # Получаем сообщения
            cursor.execute('''
                SELECT m.*, u.username as sender_name, u.avatar as sender_avatar
                FROM messages m
                JOIN users u ON m.sender_id = u.id
                WHERE m.chat_id = ?
                ORDER BY m.sent_at ASC
            ''', (chat_id,))
            
            messages = cursor.fetchall()
            
            # Помечаем как прочитанные
            cursor.execute('''
                UPDATE messages 
                SET read_at = ? 
                WHERE chat_id = ? AND sender_id != ? AND read_at IS NULL
            ''', (datetime.now().isoformat(), chat_id, user_id))
            
            cursor.execute('UPDATE chats SET last_message_at = ? WHERE id = ?', 
                          (datetime.now().isoformat(), chat_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                "success": True,
                "messages": [dict(msg) for msg in messages]
            })
        
        elif request.method == 'POST':
            # Отправляем сообщение
            data = request.json
            content = data.get('content', '').strip()
            message_type = data.get('type', 'text')
            
            if not content:
                return jsonify({"error": "Message cannot be empty"}), 400
            
            cursor.execute('''
                INSERT INTO messages (chat_id, sender_id, message_type, content, sent_at)
                VALUES (?, ?, ?, ?, ?)
            ''', (chat_id, user_id, message_type, content, datetime.now().isoformat()))
            
            cursor.execute('UPDATE chats SET last_message_at = ? WHERE id = ?', 
                          (datetime.now().isoformat(), chat_id))
            
            conn.commit()
            conn.close()
            
            return jsonify({
                "success": True,
                "message": "Сообщение отправлено"
            })
            
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@chats_bp.route('/users/search', methods=['GET'])
def search_users():
    """Поиск пользователей для чата"""
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    search = request.args.get('q', '').strip()
    
    if len(search) < 2:
        return jsonify({"success": True, "users": []})
    
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT id, username, email, avatar
            FROM users 
            WHERE (username LIKE ? OR email LIKE ?)
            AND id != ?
            AND id != 1  -- Не показываем поддержку в поиске
            LIMIT 10
        ''', (f'%{search}%', f'%{search}%', session['user_id']))
        
        users = cursor.fetchall()
        conn.close()
        
        return jsonify({
            "success": True,
            "users": [dict(user) for user in users]
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
