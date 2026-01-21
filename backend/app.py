"""from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
from auth import auth_bp
from encryption import encryption_bp
from moc_ai import ai_bp
from models import get_db_connection  # Добавьте этот импорт

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

# Регистрация модулей
app.register_blueprint(auth_bp, url_prefix='/auth')
app.register_blueprint(encryption_bp, url_prefix='/encryption')
app.register_blueprint(ai_bp, url_prefix='/ai')

# Базовая структура пользователя в памяти (вместо БД для примера)
users = {}
files = {}
albums = {}
chats = {}

@app.route('/')
def index():
    return jsonify({"message": "MOC API", "version": "1.0"})

@app.route('/api/status')
def status():
    return jsonify({
        "status": "online",
        "users_count": len(users),
        "encryption": "XChaCha20/AES-GCM-SIV",
        "ai": "active"
    })

@app.route('/api/upload', methods=['POST'])
def upload_file():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    file = request.files.get('file')
    if not file:
        return jsonify({"error": "No file"}), 400
    
    user_id = session['user_id']
    file_id = f"file_{len(files) + 1}"
    
    # Здесь будет шифрование
    files[file_id] = {
        "user_id": user_id,
        "name": file.filename,
        "size": len(file.read()),
        "encrypted": True
    }
    
    return jsonify({
        "success": True,
        "file_id": file_id,
        "message": "File uploaded and encrypted"
    })

@app.route('/api/albums', methods=['GET'])
def get_albums():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    user_id = session['user_id']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, title, description, cover_image, ai_generated, created_at
        FROM albums WHERE user_id = ?
    ''', (user_id,))
    
    albums_data = cursor.fetchall()
    conn.close()
    
    return jsonify({
        "albums": [
            {
                "id": a[0],
                "title": a[1],
                "description": a[2],
                "cover": a[3],
                "ai_generated": bool(a[4]),
                "created_at": a[5]
            } for a in albums_data
        ]
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)"""

from flask import Flask, request, jsonify, session
from flask_cors import CORS
import os
from datetime import datetime

# Импортируем все модули
try:
    from auth import auth_bp
    from photos import photos_bp
    from albums import albums_bp
    from chats import chats_bp
    from profile import profile_bp
    from assistant import assistant_bp
    from moc_ai import ai_bp
except ImportError:
    print("⚠️ Создайте сначала вспомогательные файлы!")
    print("Запустите: python backend/full_db.py")

app = Flask(__name__)
app.secret_key = os.urandom(24)
CORS(app, supports_credentials=True)

# Регистрируем все модули
try:
    app.register_blueprint(auth_bp, url_prefix='/auth')
    app.register_blueprint(photos_bp, url_prefix='/photos')
    app.register_blueprint(albums_bp, url_prefix='/albums')
    app.register_blueprint(chats_bp, url_prefix='/chats')
    app.register_blueprint(profile_bp, url_prefix='/profile')
    app.register_blueprint(assistant_bp, url_prefix='/assistant')
    app.register_blueprint(ai_bp, url_prefix='/ai')
except:
    print("⚠️ Некоторые модули не загрузились")

@app.route('/')
def index():
    return jsonify({
        "app": "MOC - My Open Cloud",
        "version": "2.0",
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "endpoints": {
            "auth": "/auth/*",
            "photos": "/photos/*", 
            "albums": "/albums/*",
            "chats": "/chats/*",
            "profile": "/profile/*",
            "assistant": "/assistant/*",
            "ai": "/ai/*"
        }
    })

@app.route('/status', methods=['GET'])
def status():
    import sqlite3
    try:
        conn = sqlite3.connect('database/moc.db')
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        users = cursor.fetchone()[0]
        conn.close()
        
        return jsonify({
            "status": "healthy",
            "users": users,
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

if __name__ == '__main__':
    print("=" * 50)
    print("🚀 MOC Full Version 2.0")
    print("📡 API: http://localhost:5000")
    print("👤 Техподдержка: 'Поддержка MOC' / 'support123'")
    print("💜 Готов к работе!")
    print("=" * 50)

    app.run(debug=True, port=5000, host='127.0.0.1')
