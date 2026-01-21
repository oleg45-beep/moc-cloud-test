/* jshint esversion: 8 */
/* jshint browser: true */
/* eslint-disable */

// Основное приложение MOC
class MOCApp {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.user = null;
        this.isAuthenticated = false;
        this.albums = [];
        this.photos = [];
        this.chats = [];
        this.init();
    }

    async init() {
        console.log('🚀 MOC App инициализируется...');
        await this.checkAuth();
        this.bindEvents();
        this.loadSampleData();
        this.testConnection();
    }

    bindEvents() {
        console.log('🔗 Настраиваю события...');
        
        // Кнопки навигации
        document.getElementById('loginBtn')?.addEventListener('click', () => this.showModal('loginModal'));
        document.getElementById('registerBtn')?.addEventListener('click', () => this.showModal('registerModal'));
        document.getElementById('getStarted')?.addEventListener('click', () => {
            if (!this.isAuthenticated) {
                this.showModal('loginModal');
            } else {
                this.showNotification('Вы уже вошли в систему!', 'info');
            }
        });
        
        // Формы
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            this.login(username, password);
        });
        
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const email = document.getElementById('regEmail').value;
            this.register(username, password, email);
        });
        
        document.getElementById('createAlbumForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAlbum();
        });
        
        document.getElementById('createChatForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createChat();
        });
        
        // Загрузка файлов
        this.setupFileUpload();
        
        // Плавающие кнопки
        document.querySelectorAll('.floating-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showNotification('Функция скоро будет доступна', 'info');
            });
        });
        
        console.log('✅ События настроены');
    }

    setupFileUpload() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        
        if (!uploadZone || !fileInput) return;
        
        uploadZone.addEventListener('click', () => {
            if (!this.isAuthenticated) {
                this.showNotification('Сначала войдите в систему!', 'warning');
                this.showModal('loginModal');
                return;
            }
            fileInput.click();
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && this.isAuthenticated) {
                this.handleFiles(e.target.files);
            }
        });
    }

    async handleFiles(files) {
        this.showNotification(`Выбрано ${files.length} файлов`, 'info');
    }

    async checkAuth() {
        const savedUser = localStorage.getItem('moc_current_user');
        if (savedUser) {
            try {
                this.user = JSON.parse(savedUser);
                this.isAuthenticated = true;
                this.updateUIAfterLogin();
                console.log('✅ Пользователь восстановлен из localStorage');
            } catch (e) {
                console.log('Ошибка восстановления пользователя');
            }
        }
    }

    async login(username, password) {
        console.log('🔑 Попытка входа:', username);
        
        if (!username || !password) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/auth/login`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    username: username.trim(),
                    password: password 
                }),
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.user = data.user;
                    this.isAuthenticated = true;
                    
                    localStorage.setItem('moc_current_user', JSON.stringify(data.user));
                    localStorage.setItem('moc_session', 'active');
                    
                    this.showNotification(`✅ Добро пожаловать, ${username}!`, 'success');
                    this.closeModal('loginModal');
                    this.updateUIAfterLogin();
                } else {
                    this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
                }
            } else {
                this.showNotification('❌ Сервер не отвечает', 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showNotification('❌ Не удалось подключиться к серверу', 'error');
        }
    }

    async register(username, password, email = '') {
        console.log('📝 Регистрация:', username);
        
        if (!username || !password) {
            this.showNotification('Заполните все обязательные поля', 'warning');
            return;
        }
        
        if (password.length < 6) {
            this.showNotification('Пароль должен быть не менее 6 символов', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/auth/register`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    username: username.trim(),
                    password: password,
                    email: email.trim()
                })
            });
            
            if (response.ok) {
                const data = await response.json();
                
                if (data.success) {
                    localStorage.setItem('moc_master_key', data.master_key);
                    localStorage.setItem('moc_username', username);
                    
                    this.showNotification(
                        `✅ Регистрация успешна!<br><br>
                        Для входа используйте логин: <strong>${username}</strong>`, 
                        'success'
                    );
                    
                    this.closeModal('registerModal');
                    
                    setTimeout(() => {
                        this.login(username, password);
                    }, 2000);
                    
                } else {
                    this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
                }
            } else {
                this.showNotification('❌ Сервер не отвечает', 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showNotification('❌ Не удалось подключиться к серверу', 'error');
        }
    }

    updateUIAfterLogin() {
        if (!this.user) return;
        
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.innerHTML = `
                <div class="user-info">
                    <div class="user-avatar">
                        ${this.user.avatar || '👤'}
                    </div>
                    <div class="user-details">
                        <span class="user-name">${this.user.username}</span>
                        <div class="user-actions">
                            <button class="btn btn-small btn-outline" onclick="window.mocApp.showProfileModal()">
                                <i class="fas fa-user"></i>
                            </button>
                            <button class="btn btn-small btn-outline" onclick="window.mocApp.logout()">
                                <i class="fas fa-sign-out-alt"></i>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const getStartedBtn = document.getElementById('getStarted');
        if (getStartedBtn) {
            getStartedBtn.style.display = 'none';
        }
        
        const uploadText = document.getElementById('uploadText');
        if (uploadText) {
            uploadText.textContent = `Добро пожаловать, ${this.user.username}! Кликните для загрузки фото`;
        }
        
        const uploadStats = document.getElementById('uploadStats');
        if (uploadStats) {
            uploadStats.style.display = 'flex';
            document.getElementById('totalPhotos').textContent = '0';
            document.getElementById('totalAlbums').textContent = '0';
            document.getElementById('storageUsed').textContent = '0%';
        }
    }

    async logout() {
        try {
            await fetch(`${this.apiUrl}/auth/logout`, {
                method: 'POST',
                credentials: 'include'
            });
        } catch (error) {
            console.error('Ошибка выхода:', error);
        }
        
        this.clearUserData();
        this.updateUIAfterLogout();
        this.showNotification('Вы вышли из системы', 'info');
    }

    clearUserData() {
        this.user = null;
        this.isAuthenticated = false;
        this.albums = [];
        this.photos = [];
        this.chats = [];
        
        localStorage.removeItem('moc_current_user');
        localStorage.removeItem('moc_session');
        
        const masterKey = localStorage.getItem('moc_master_key');
        const username = localStorage.getItem('moc_username');
        
        localStorage.clear();
        
        if (masterKey) localStorage.setItem('moc_master_key', masterKey);
        if (username) localStorage.setItem('moc_username', username);
    }

    updateUIAfterLogout() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.innerHTML = `
                <button id="loginBtn" class="btn btn-outline">
                    <i class="fas fa-sign-in-alt"></i> Войти
                </button>
                <button id="registerBtn" class="btn btn-primary">
                    <i class="fas fa-user-plus"></i> Регистрация
                </button>
            `;
            
            document.getElementById('loginBtn').addEventListener('click', () => this.showModal('loginModal'));
            document.getElementById('registerBtn').addEventListener('click', () => this.showModal('registerModal'));
        }
        
        const getStartedBtn = document.getElementById('getStarted');
        if (getStartedBtn) {
            getStartedBtn.style.display = 'inline-flex';
        }
        
        const uploadText = document.getElementById('uploadText');
        if (uploadText) {
            uploadText.textContent = 'Перетащите файлы сюда или кликните для выбора';
        }
        
        const uploadStats = document.getElementById('uploadStats');
        if (uploadStats) {
            uploadStats.style.display = 'none';
        }
        
        this.clearContent();
    }

    clearContent() {
        const photosGrid = document.getElementById('photosGrid');
        if (photosGrid) {
            photosGrid.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Загрузите первое фото</p>
                </div>
            `;
        }
        
        const albumsGrid = document.getElementById('albumsGrid');
        if (albumsGrid) {
            albumsGrid.innerHTML = `
                <div class="album-placeholder">
                    <i class="fas fa-folder-plus"></i>
                    <p>Создайте первый альбом</p>
                </div>
            `;
        }
        
        const chatsList = document.getElementById('chatsList');
        if (chatsList) {
            chatsList.innerHTML = `
                <div class="chat-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>Начните новый чат</p>
                </div>
            `;
        }
        
        const profileCard = document.getElementById('profileCard');
        if (profileCard) {
            profileCard.innerHTML = `
                <div class="profile-loading">
                    <i class="fas fa-spinner fa-spin"></i>
                    <p>Войдите для просмотра профиля</p>
                </div>
            `;
        }
    }

    loadSampleData() {
        if (!this.isAuthenticated) {
            this.loadSampleAlbums();
        }
    }

    loadSampleAlbums() {
        const albums = [
            { id: 1, title: 'Лето 2024', photo_count: 12, color: '#f59e0b', icon: 'fas fa-sun' },
            { id: 2, title: 'Путешествия', photo_count: 8, color: '#10b981', icon: 'fas fa-plane' },
            { id: 3, title: 'С друзьями', photo_count: 15, color: '#3b82f6', icon: 'fas fa-users' }
        ];
        
        const grid = document.getElementById('albumsGrid');
        if (grid && grid.children.length <= 1) {
            albums.forEach(album => {
                const card = document.createElement('div');
                card.className = 'album-card';
                card.innerHTML = `
                    <div class="album-cover" style="background: linear-gradient(135deg, ${album.color}40, ${album.color})">
                        <i class="${album.icon}"></i>
                    </div>
                    <div class="album-info">
                        <div class="album-title">${album.title}</div>
                        <div class="album-meta">
                            <i class="fas fa-images"></i> ${album.photo_count} фото
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    }

    async testConnection() {
        try {
            const response = await fetch(`${this.apiUrl}/`);
            if (response.ok) {
                const data = await response.json();
                console.log('✅ Сервер доступен:', data.version);
            } else {
                console.warn('⚠️ Сервер не отвечает нормально');
            }
        } catch (error) {
            console.error('❌ Не могу подключиться к серверу:', error);
        }
    }

    async createAlbum() {
        const title = document.getElementById('albumTitle').value.trim();
        const description = document.getElementById('albumDescription').value.trim();
        const isPrivate = document.getElementById('albumPrivate').checked;
        
        if (!title) {
            this.showNotification('Введите название альбома', 'warning');
            return;
        }
        
        this.showNotification(`Альбом "${title}" создан`, 'success');
        this.closeModal('createAlbumModal');
    }

    async createChat() {
        const title = document.getElementById('chatTitle').value.trim();
        
        if (!title) {
            this.showNotification('Введите название чата', 'warning');
            return;
        }
        
        this.showNotification(`Чат "${title}" создан`, 'success');
        this.closeModal('createChatModal');
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        
        notification.innerHTML = `
            <i class="fas ${icons[type] || 'fa-info-circle'}"></i>
            <span>${message}</span>
            <button class="notification-close"><i class="fas fa-times"></i></button>
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
        
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
}

// Глобальные вспомогательные функции
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    
    const toggleBtn = input.parentElement.querySelector('.password-toggle i');
    if (toggleBtn) {
        toggleBtn.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM загружен, запускаю MOC...');
    window.mocApp = new MOCApp();
});
