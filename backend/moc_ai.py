from flask import Blueprint, request, jsonify
import base64
import json
import hashlib
import secrets
from datetime import datetime

ai_bp = Blueprint('ai', __name__)

# База данных для демо
albums_db = {}
friends_db = {}
ai_suggestions_db = {}

@ai_bp.route('/get_assistant_info', methods=['GET'])
def get_assistant_info():
    """Информация об ассистенте"""
    return jsonify({
        "success": True,
        "assistant": {
            "name": "Олег",
            "role": "Ваш персональный помощник MOC",
            "avatar": "🤖",
            "status": "online",
            "description": "Помогает организовать фото, создавать альбомы и находить друзей на фото",
            "features": [
                "Автоматическая сортировка фото",
                "Распознавание лиц и эмоций",
                "Создание тематических альбомов",
                "Напоминания о событиях",
                "Безопасный шаринг фото",
                "Геймификация воспоминаний"
            ],
            "quote": "Ваши воспоминания в безопасности со мной! 💜",
            "encryption_level": "XChaCha20/AES-GCM-SIV",
            "privacy": "Все вычисления локально, без отправки данных"
        }
    })

@ai_bp.route('/detect_faces', methods=['POST'])
def detect_faces():
    """Обнаружение лиц на фото (демо версия)"""
    try:
        # В реальности это делается на клиенте с TensorFlow.js
        image_data = request.files.get('image')
        
        if not image_data:
            return jsonify({
                "success": True,
                "faces_detected": 3,
                "faces": [
                    {"id": "face_1", "confidence": 0.95, "emotion": "happy"},
                    {"id": "face_2", "confidence": 0.87, "emotion": "neutral"},
                    {"id": "face_3", "confidence": 0.92, "emotion": "smiling"}
                ],
                "message": "Демо: обнаружено 3 лица",
                "processed_locally": True
            })
        
        return jsonify({
            "success": True,
            "faces_detected": 2,
            "faces": [
                {"id": "face_1", "confidence": 0.89, "emotion": "happy"},
                {"id": "face_2", "confidence": 0.91, "emotion": "surprised"}
            ],
            "processed_locally": True
        })
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e),
            "demo_fallback": True,
            "faces_detected": 2
        })

@ai_bp.route('/create_album', methods=['POST'])
def create_album():
    """Создание AI-альбома"""
    try:
        data = request.json
        user_id = data.get('user_id')
        photos = data.get('photos', [])
        theme = data.get('theme', 'general')
        
        if not user_id:
            return jsonify({"success": False, "error": "User ID required"}), 400
        
        album_id = f"album_{secrets.token_hex(8)}"
        
        # AI определяет название и описание по теме
        themes = {
            'summer': {
                'title': 'Лето 2024',
                'description': 'Тёплые летние воспоминания',
                'emoji': '🌞',
                'color': '#f59e0b'
            },
            'friends': {
                'title': 'С друзьями',
                'description': 'Моменты с близкими людьми',
                'emoji': '👫',
                'color': '#3b82f6'
            },
            'travel': {
                'title': 'Путешествия',
                'description': 'Приключения и новые места',
                'emoji': '✈️',
                'color': '#10b981'
            },
            'family': {
                'title': 'Семья',
                'description': 'Семейные моменты',
                'emoji': '👨‍👩‍👧‍👦',
                'color': '#8b5cf6'
            },
            'nature': {
                'title': 'Природа',
                'description': 'Красота окружающего мира',
                'emoji': '🌿',
                'color': '#22c55e'
            }
        }
        
        theme_info = themes.get(theme, {
            'title': 'Мои воспоминания',
            'description': 'Ваши специальные моменты',
            'emoji': '📸',
            'color': '#7c3aed'
        })
        
        album = {
            "id": album_id,
            "user_id": user_id,
            "title": theme_info['title'],
            "description": theme_info['description'],
            "emoji": theme_info['emoji'],
            "color": theme_info['color'],
            "theme": theme,
            "photos_count": len(photos),
            "cover": photos[0] if photos else None,
            "ai_generated": True,
            "created_at": datetime.now().isoformat(),
            "friends_included": data.get('friends', []),
            "emotion": "happy"
        }
        
        albums_db[album_id] = album
        
        # Генерируем AI-совет
        advice = generate_album_advice(theme, len(photos))
        
        return jsonify({
            "success": True,
            "album": album,
            "advice": advice,
            "message": f"AI создал альбом '{theme_info['title']}'"
        })
        
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

def generate_album_advice(theme, photo_count):
    """Генерация AI-совета для альбома"""
    advice_templates = {
        'summer': [
            "Добавьте больше фото с пляжа! 🏖️",
            "Создайте коллаж из самых ярких летних моментов",
            "Поделитесь этим альбомом с друзьями с отдыха"
        ],
        'friends': [
            "Отметьте друзей на фото для быстрого поиска",
            "Создайте общий альбом для этой компании",
            "AI нашёл общие черты в ваших улыбках! 😊"
        ],
        'travel': [
            "Добавьте геометки к фото для карты путешествий",
            "Создайте историю по дням путешествия",
            "Эти места стоит посетить снова!"
        ],
        'family': [
            "Отличные семейные воспоминания! 👨‍👩‍👧‍👦",
            "Создайте копию альбома для родственников",
            "AI заметил, как все стали старше за эти годы"
        ]
    }
    
    default_advice = [
        "Отличные фото! Продолжайте пополнять коллекцию",
        "AI предлагает создать ещё один альбом с похожей тематикой",
        "Поделитесь лучшими фото с близкими"
    ]
    
    template = advice_templates.get(theme, default_advice)
    import random
    return random.choice(template)

@ai_bp.route('/analyze_photo', methods=['POST'])
def analyze_photo():
    """Анализ фото (демо)"""
    data = request.json
    photo_data = data.get('photo', {})
    
    # Демо-анализ
    analysis = {
        "objects": ["человек", "небо", "дерево", "вода"],
        "colors": ["синий", "зелёный", "коричневый"],
        "estimated_location": "парк или природа",
        "time_of_day": "день",
        "season": "лето",
        "quality_score": 0.85,
        "suggested_tags": ["природа", "отдых", "лето", "друзья"],
        "faces_found": 2,
        "dominant_emotion": "счастье",
        "privacy_level": "публичное",
        "ai_comment": "Прекрасный летний день на природе с друзьями! 🌞"
    }
    
    return jsonify({
        "success": True,
        "analysis": analysis,
        "processed_locally": True,
        "encrypted": True
    })

@ai_bp.route('/get_suggestions', methods=['GET'])
def get_suggestions():
    """Получение AI-предложений для пользователя"""
    user_id = request.args.get('user_id')
    
    if not user_id:
        return jsonify({"success": False, "error": "User ID required"}), 400
    
    suggestions = [
        {
            "id": "suggest_1",
            "type": "album",
            "title": "Создать альбом 'Зима 2024'",
            "description": "AI нашёл 15 зимних фото",
            "priority": "high",
            "action": "create_album",
            "params": {"theme": "winter"}
        },
        {
            "id": "suggest_2",
            "type": "share",
            "title": "Поделиться фото с Марией",
            "description": "У вас 3 общих фото",
            "priority": "medium",
            "action": "share_with_friend",
            "params": {"friend": "Мария", "photos": ["photo_1", "photo_2", "photo_3"]}
        },
        {
            "id": "suggest_3",
            "type": "organize",
            "title": "Упорядочить старые фото",
            "description": "Найдено 47 неподписанных фото за 2023 год",
            "priority": "low",
            "action": "organize_photos",
            "params": {"year": 2023}
        },
        {
            "id": "suggest_4", 
            "type": "backup",
            "title": "Создать резервную копию",
            "description": "Прошло 30 дней с последнего бэкапа",
            "priority": "medium",
            "action": "create_backup",
            "params": {}
        }
    ]
    
    return jsonify({
        "success": True,
        "suggestions": suggestions,
        "assistant": "Олег",
        "timestamp": datetime.now().isoformat()
    })

@ai_bp.route('/simulate_ai_chat', methods=['POST'])
def simulate_ai_chat():
    """Симуляция чата с AI-ассистентом"""
    data = request.json
    message = data.get('message', '').lower()
    user_id = data.get('user_id')
    
    responses = {
        'привет': "Привет! Я Олег, ваш помощник в MOC. Чем могу помочь?",
        'как дела': "Отлично! Готов помочь с вашими фото и воспоминаниями. 💜",
        'создать альбом': "Конечно! Какой альбом создать: 'Лето', 'Друзья', 'Путешествия' или 'Семья'?",
        'зашифровать': "Все ваши фото уже шифруются на устройстве перед загрузкой! 🔐",
        'поделиться': "Используйте безопасный шаринг. Выберите фото и друзей для отправки.",
        'помощь': "Я могу: создать альбомы, найти друзей на фото, зашифровать файлы, организовать коллекцию.",
        'спасибо': "Всегда рад помочь! Ваши воспоминания в безопасности со мной. 🤖💜",
        'пока': "До свидания! Не забывайте сохранить мастер-ключ в надёжном месте! 🔑"
    }
    
    response = responses.get(message, 
        "Я ваш AI-помощник Олег. Могу помочь с фото, альбомами и шифрованием. Спросите 'помощь' для списка команд.")
    
    return jsonify({
        "success": True,
        "response": response,
        "assistant": "Олег",
        "timestamp": datetime.now().isoformat(),
        "suggestions": ["создать альбом", "найти друзей", "зашифровать фото", "поделиться"]
    })

@ai_bp.route('/generate_cover', methods=['POST'])
def generate_cover():
    """Генерация обложки для альбома (демо)"""
    data = request.json
    album_theme = data.get('theme', 'general')
    
    covers = {
        'summer': {"color": "#fbbf24", "icon": "☀️", "pattern": "waves"},
        'friends': {"color": "#3b82f6", "icon": "👫", "pattern": "circles"},
        'travel': {"color": "#10b981", "icon": "✈️", "pattern": "mountains"},
        'family': {"color": "#8b5cf6", "icon": "❤️", "pattern": "hearts"},
        'nature': {"color": "#22c55e", "icon": "🌿", "pattern": "leaves"}
    }
    
    cover = covers.get(album_theme, {
        "color": "#7c3aed", 
        "icon": "📷", 
        "pattern": "grid"
    })
    
    return jsonify({
        "success": True,
        "cover": {
            **cover,
            "gradient": f"linear-gradient(135deg, {cover['color']}40, {cover['color']})",
            "text_color": "#ffffff",
            "ai_generated": True
        }
    })

@ai_bp.route('/memory_garden_data', methods=['GET'])
def memory_garden_data():
    """Данные для Memory Garden"""
    user_id = request.args.get('user_id')
    
    garden_data = {
        "plants": [
            {"id": "plant_1", "type": "flower", "growth": 0.8, "color": "#7c3aed", "memories": 15},
            {"id": "plant_2", "type": "tree", "growth": 0.6, "color": "#10b981", "memories": 8},
            {"id": "plant_3", "type": "flower", "growth": 0.9, "color": "#3b82f6", "memories": 22},
            {"id": "plant_4", "type": "bush", "growth": 0.4, "color": "#f59e0b", "memories": 5}
        ],
        "friends": [
            {"id": "friend_1", "name": "Алексей", "connection": 0.9, "photos_together": 12},
            {"id": "friend_2", "name": "Мария", "connection": 0.7, "photos_together": 8},
            {"id": "friend_3", "name": "Дмитрий", "connection": 0.5, "photos_together": 5}
        ],
        "achievements": [
            {"id": "ach_1", "name": "Первое фото", "unlocked": True},
            {"id": "ach_2", "name": "10 воспоминаний", "unlocked": True},
            {"id": "ach_3", "name": "Поделился с другом", "unlocked": False},
            {"id": "ach_4", "name": "AI-альбом", "unlocked": True}
        ],
        "stats": {
            "total_memories": 50,
            "total_friends": 8,
            "total_albums": 6,
            "encryption_strength": "100%",
            "privacy_score": 95
        }
    }
    
    return jsonify({
        "success": True,
        "garden": garden_data,
        "updated": datetime.now().isoformat()
    })

@ai_bp.route('/encryption_status', methods=['GET'])
def encryption_status():
    """Статус шифрования для демонстрации"""
    return jsonify({
        "success": True,
        "encryption": {
            "algorithm": "XChaCha20-Poly1305",
            "key_size": "256-bit",
            "client_side": True,
            "master_key": "Только у пользователя",
            "file_keys": "Уникальные для каждого файла",
            "proxy_re_encryption": True,
            "social_recovery": True,
            "shamir_shards": 3
        },
        "security_score": 98,
        "message": "Все файлы шифруются до покидания вашего устройства"
    })

# Инициализация демо-данных
def init_demo_data():
    """Инициализация демо-данных для AI"""
    albums_db['demo_album_1'] = {
        "id": "demo_album_1",
        "title": "Лето 2024",
        "description": "AI создал этот альбом из ваших летних фото",
        "photos_count": 12,
        "ai_generated": True,
        "theme": "summer"
    }
    
    friends_db['demo_friend_1'] = {
        "id": "demo_friend_1",
        "name": "Алексей",
        "photos_together": 8,
        "last_seen": "2 дня назад"
    }

# Вызываем инициализацию при импорте
init_demo_data()
