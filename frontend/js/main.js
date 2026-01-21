/* jshint esversion: 8 */
/* jshint browser: true */
/* eslint-disable */
// Основное приложение MOC
/*class MOCApp {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.user = null;
        this.isAuthenticated = false;
        this.albums = [];
        this.photos = [];
        this.chats = [];
        this.currentAlbum = null;
        this.currentChat = null;
        this.albumsManager = null; // Добавляем менеджер альбомов
        this.init();
    }

    async createChat() {
        if (!this.isAuthenticated) return;
        
        const title = document.getElementById('chatTitle').value.trim();
        
        if (!title) {
            this.showNotification('Введите название чата', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/chats/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    type: 'private'
                    // Участники добавляются автоматически (поддержка)
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification(`✅ Чат "${title}" создан`, 'success');
                closeModal('createChatModal');
                await this.loadChats();
                
                // Автоматически открываем созданный чат
                this.viewChat(data.chat_id);
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка создания чата:', error);
            this.showNotification('❌ Ошибка создания чата', 'error');
        }
    }
    async init() {
        console.log('🚀 MOC App инициализируется...');
        this.bindEvents();
        this.loadSampleData();
        await this.checkAuth();
        this.testConnection();
        
        // Инициализируем менеджер альбомов
        this.initializeAlbumsManager();
        this.initializeAssistant();
    }

    initializeAssistant() {
        if (!window.mocAssistant) {
            window.mocAssistant = new (class {
                constructor() {
                    this.isTyping = false;
                }
                
                updateTypingStatus(chatId, isTyping) {
                    const typingElement = document.querySelector(`.typing-indicator[data-chat="${chatId}"]`);
                    if (typingElement) {
                        typingElement.style.display = isTyping ? 'block' : 'none';
                    }
                }
            })();
        }
        this.assistant = window.mocAssistant;
    }
    initializeAlbumsManager() {
        if (!window.albumsManager) {
            window.albumsManager = new (class {
                constructor(mocApp) {
                    this.mocApp = mocApp;
                }

                async viewAlbum(albumId) {
                    this.currentAlbum = albumId;
                    
                    try {
                        const response = await fetch(`${this.apiUrl}/albums/${albumId}`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success) {
                                this.showAlbumModal(data.album, data.photos);
                            }
                        } else {
                            this.showNotification('❌ Не удалось загрузить альбом', 'error');
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки альбома:', error);
                        this.showNotification('❌ Ошибка загрузки альбома', 'error');
                    }
                }
                showAlbumModal(album, photos) {
                    // Используем метод MOCApp для показа модального окна
                    this.mocApp.showAlbumModal(album, photos);
                }
            })(this);
        }
        this.albumsManager = window.albumsManager;
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
            this.showNotification('Сервер не запущен! Запустите python app.py', 'error', 10000);
        }
    }

    bindEvents() {
        console.log('🔗 Настраиваю события...');
        
        // Навигация
        this.setupNavigation();
        
        // Формы
        this.setupForms();
        
        // Загрузка файлов
        this.setupFileUpload();
        
        console.log('✅ События настроены');
    }

    setupNavigation() {
        // Навигационные ссылки
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Кнопка "Начать использовать"
        document.getElementById('getStarted').addEventListener('click', () => {
            if (!this.isAuthenticated) {
                showLoginModal();
            } else {
                this.showNotification('Вы уже вошли в систему!', 'info');
            }
        });
    }

    setupForms() {
        // Форма входа
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername').value;
            const password = document.getElementById('loginPassword').value;
            this.login(username, password);
        });
        
        // Форма регистрации
        document.getElementById('registerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername').value;
            const password = document.getElementById('regPassword').value;
            const email = document.getElementById('regEmail').value;
            this.register(username, password, email);
        });
        
        // Форма создания альбома
        document.getElementById('createAlbumForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAlbum();
        });
        
        // Форма создания чата
        document.getElementById('createChatForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createChat();
        });
        
        // Форма редактирования профиля
        document.getElementById('editProfileForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateProfile();
        });
        
        // Форма смены пароля
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.changePassword();
        });
    }

    setupFileUpload() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        
        uploadZone.addEventListener('click', () => {
            if (!this.isAuthenticated) {
                this.showNotification('Сначала войдите в систему!', 'warning');
                showLoginModal();
                return;
            }
            fileInput.click();
        });
        
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#10b981';
            uploadZone.style.background = 'rgba(16, 185, 129, 0.1)';
        });
        
        uploadZone.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '#7c3aed';
            uploadZone.style.background = 'rgba(124, 58, 237, 0.05)';
        });
        
        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#7c3aed';
            uploadZone.style.background = 'rgba(124, 58, 237, 0.05)';
            
            if (!this.isAuthenticated) {
                this.showNotification('Сначала войдите в систему!', 'warning');
                showLoginModal();
                return;
            }
            
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && this.isAuthenticated) {
                this.handleFiles(e.target.files);
            }
        });
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
            
            const data = await response.json();
            console.log('Ответ сервера:', data);
            
            if (response.ok && data.success) {
                this.user = data.user;
                this.isAuthenticated = true;
                
                // Сохраняем сессию
                localStorage.setItem('moc_current_user', JSON.stringify(data.user));
                localStorage.setItem('moc_session', 'active');
                
                this.showNotification(`✅ Добро пожаловать, ${username}!`, 'success');
                closeModal('loginModal');
                this.updateUIAfterLogin();
                
                // Загружаем данные пользователя
                await this.loadUserData();
                
            } else {
                this.showNotification(`❌ Ошибка: ${data.error || 'Неверные данные'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showNotification('❌ Сервер не отвечает', 'error');
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
            
            const data = await response.json();
            console.log('Ответ регистрации:', data);
            
            if (response.ok && data.success) {
                // Сохраняем мастер-ключ
                localStorage.setItem('moc_master_key', data.master_key);
                localStorage.setItem('moc_username', username);
                
                this.showNotification(
                    `✅ Регистрация успешна!<br><br>
                    <strong>ВАЖНО:</strong> Мастер-ключ сохранен.<br>
                    <code style="background: #333; padding: 5px; border-radius: 3px;">${data.master_key}</code><br><br>
                    Для входа используйте логин: <strong>${username}</strong>`, 
                    'success'
                );
                
                closeModal('registerModal');
                
                // Сразу входим
                setTimeout(() => {
                    this.login(username, password);
                }, 2000);
                
            } else {
                this.showNotification(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showNotification('❌ Сервер не отвечает. Запущен ли python app.py?', 'error');
        }
    }

    async checkAuth() {
        try {
            // Проверяем localStorage
            const savedUser = localStorage.getItem('moc_current_user');
            if (savedUser) {
                this.user = JSON.parse(savedUser);
                this.isAuthenticated = true;
                this.updateUIAfterLogin();
                console.log('✅ Пользователь восстановлен из localStorage:', this.user.username);
                
                // Загружаем данные
                await this.loadUserData();
                return;
            }
            
            // Проверяем серверную сессию
            const response = await fetch(`${this.apiUrl}/auth/check`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.user = { username: data.username, id: data.user_id };
                    this.isAuthenticated = true;
                    
                    localStorage.setItem('moc_current_user', JSON.stringify(this.user));
                    
                    this.updateUIAfterLogin();
                    await this.loadUserData();
                    
                    console.log('✅ Пользователь авторизован:', data.username);
                }
            }
        } catch (error) {
            console.log('Пользователь не авторизован');
        }
    }

    async loadUserData() {
        if (!this.user) return;
        
        try {
            // Загружаем альбомы
            await this.loadAlbums();
            
            // Загружаем фото
            await this.loadPhotos();
            
            // Загружаем чаты
            await this.loadChats();
            
            // Загружаем профиль
            await this.loadProfile();
            
            // Обновляем статистику
            this.updateStats();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
        }
    }

    updateUIAfterLogin() {
        if (!this.user) return;
        
        // Обновляем меню пользователя
        const userMenu = document.getElementById('userMenu');
        userMenu.innerHTML = `
            <div class="user-info">
                <div class="user-avatar">
                    ${this.user.avatar || '👤'}
                </div>
                <div class="user-details">
                    <span class="user-name">${this.user.username}</span>
                    <div class="user-actions">
                        <button class="btn btn-small btn-outline" onclick="mocApp.showProfileModal()">
                            <i class="fas fa-user"></i>
                        </button>
                        <button class="btn btn-small btn-outline" onclick="mocApp.logout()">
                            <i class="fas fa-sign-out-alt"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // Скрываем кнопку "Начать использовать"
        const getStartedBtn = document.getElementById('getStarted');
        if (getStartedBtn) {
            getStartedBtn.style.display = 'none';
        }
        
        // Обновляем текст загрузки
        const uploadText = document.getElementById('uploadText');
        if (uploadText) {
            uploadText.textContent = `Добро пожаловать, ${this.user.username}! Перетащите фото для загрузки`;
        }
        
        // Показываем статистику
        const uploadStats = document.getElementById('uploadStats');
        if (uploadStats) {
            uploadStats.style.display = 'flex';
        }
        
        // Активируем навигацию
        document.querySelectorAll('.nav-link').forEach(link => {
            link.style.pointerEvents = 'auto';
            link.style.opacity = '1';
        });
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
        
        // Очищаем данные
        this.clearUserData();
        
        // Обновляем интерфейс
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
        
        // Очищаем только сессионные данные, оставляем мастер-ключ
        const masterKey = localStorage.getItem('moc_master_key');
        const username = localStorage.getItem('moc_username');
        
        localStorage.clear();
        
        if (masterKey) localStorage.setItem('moc_master_key', masterKey);
        if (username) localStorage.setItem('moc_username', username);
    }

    updateUIAfterLogout() {
        // Восстанавливаем меню входа
        const userMenu = document.getElementById('userMenu');
        userMenu.innerHTML = `
            <button id="loginBtn" class="btn btn-outline">
                <i class="fas fa-sign-in-alt"></i> Войти
            </button>
            <button id="registerBtn" class="btn btn-primary">
                <i class="fas fa-user-plus"></i> Регистрация
            </button>
        `;
        
        // Показываем кнопку "Начать использовать"
        const getStartedBtn = document.getElementById('getStarted');
        if (getStartedBtn) {
            getStartedBtn.style.display = 'inline-flex';
        }
        
        // Обновляем текст загрузки
        const uploadText = document.getElementById('uploadText');
        if (uploadText) {
            uploadText.textContent = 'Перетащите файлы сюда или кликните для выбора';
        }
        
        // Скрываем статистику
        const uploadStats = document.getElementById('uploadStats');
        if (uploadStats) {
            uploadStats.style.display = 'none';
        }
        
        // Очищаем контент
        this.clearContent();
        
        // Перепривязываем события кнопок
        document.getElementById('loginBtn').addEventListener('click', () => showLoginModal());
        document.getElementById('registerBtn').addEventListener('click', () => showRegisterModal());
    }

    clearContent() {
        // Очищаем фото
        const photosGrid = document.getElementById('photosGrid');
        if (photosGrid) {
            photosGrid.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Загрузите первое фото</p>
                </div>
            `;
        }
        
        // Очищаем альбомы
        const albumsGrid = document.getElementById('albumsGrid');
        if (albumsGrid) {
            albumsGrid.innerHTML = `
                <div class="album-placeholder">
                    <i class="fas fa-folder-plus"></i>
                    <p>Создайте первый альбом</p>
                </div>
            `;
        }
        
        // Очищаем чаты
        const chatsList = document.getElementById('chatsList');
        if (chatsList) {
            chatsList.innerHTML = `
                <div class="chat-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>Начните новый чат</p>
                </div>
            `;
        }
        
        // Очищаем профиль
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

    async handleFiles(files) {
        console.log('📁 Загружаю файлы:', files.length);
        
        if (!this.isAuthenticated) {
            this.showNotification('Сначала войдите в систему!', 'warning');
            showLoginModal();
            return;
        }
        
        const progressContainer = document.getElementById('uploadProgress');
        progressContainer.innerHTML = '';
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            // Проверяем тип файла
            if (!file.type.startsWith('image/')) {
                this.showNotification(`❌ ${file.name} - не изображение`, 'error');
                continue;
            }
            
            const progressBar = this.createProgressBar(file.name);
            progressContainer.appendChild(progressBar.container);
            
            try {
                // Читаем файл как Data URL
                const photoData = await this.readFileAsDataURL(file);
                
                // Отправляем на сервер
                const response = await fetch(`${this.apiUrl}/photos/upload`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        photo: photoData,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    }),
                    credentials: 'include'
                });
                
                const data = await response.json();
                
                if (response.ok && data.success) {
                    progressBar.setProgress(100, 'success');
                    this.showNotification(`✅ ${file.name} загружен`, 'success');
                    
                    // Обновляем фото
                    await this.loadPhotos();
                    this.updateStats();
                    
                } else {
                    progressBar.setProgress(100, 'error');
                    this.showNotification(`❌ Ошибка загрузки ${file.name}: ${data.error}`, 'error');
                }
                
            } catch (error) {
                progressBar.setProgress(100, 'error');
                this.showNotification(`❌ Ошибка загрузки ${file.name}`, 'error');
                console.error('Ошибка загрузки:', error);
            }
        }
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Ошибка чтения файла'));
            reader.readAsDataURL(file);
        });
    }

    createProgressBar(filename) {
        const container = document.createElement('div');
        container.className = 'progress-item';
        
        const info = document.createElement('div');
        info.className = 'progress-info';
        info.innerHTML = `
            <span><i class="fas fa-file-image"></i> ${filename}</span>
            <span class="progress-percent">0%</span>
        `;
        
        const bar = document.createElement('div');
        bar.className = 'progress-bar';
        const fill = document.createElement('div');
        fill.className = 'progress-fill';
        fill.style.width = '0%';
        bar.appendChild(fill);
        
        container.appendChild(info);
        container.appendChild(bar);
        
        let currentProgress = 0;
        
        return {
            container,
            setProgress: (percent, status) => {
                currentProgress = percent;
                fill.style.width = `${percent}%`;
                container.querySelector('.progress-percent').textContent = `${percent}%`;
                
                // Обновляем цвет в зависимости от статуса
                fill.className = 'progress-fill';
                if (status === 'success') {
                    fill.style.background = 'linear-gradient(90deg, #10b981, #059669)';
                } else if (status === 'error') {
                    fill.style.background = 'linear-gradient(90deg, #ef4444, #dc2626)';
                } else {
                    fill.style.background = 'linear-gradient(90deg, #3b82f6, #1d4ed8)';
                }
            }
        };
    }

    loadSampleData() {
        // Загружаем демо-данные если не авторизованы
        if (!this.isAuthenticated) {
            this.loadSampleAlbums();
            this.loadSamplePhotos();
        }
    }

    loadSampleAlbums() {
        const albums = [
            { id: 1, title: 'Лето 2024', photo_count: 12, color: '#f59e0b', icon: 'fas fa-sun' },
            { id: 2, title: 'Путешествия', photo_count: 8, color: '#10b981', icon: 'fas fa-plane' },
            { id: 3, title: 'С друзьями', photo_count: 15, color: '#3b82f6', icon: 'fas fa-users' }
        ];
        
        const grid = document.getElementById('albumsGrid');
        if (grid) {
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

    loadSamplePhotos() {
        const photosGrid = document.getElementById('photosGrid');
        if (photosGrid && photosGrid.children.length === 1) { // Только плейсхолдер
            photosGrid.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Войдите для загрузки фото</p>
                </div>
            `;
        }
    }

    async loadAlbums() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/albums/list`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.albums = data.albums;
                    this.displayAlbums(data.albums);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки альбомов:', error);
        }
    }

    displayAlbums(albums) {
        const grid = document.getElementById('albumsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (albums.length === 0) {
            grid.innerHTML = `
                <div class="album-placeholder">
                    <i class="fas fa-folder-plus"></i>
                    <p>Создайте первый альбом</p>
                </div>
            `;
            return;
        }
        
        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = 'album-card';
            card.onclick = () => this.viewAlbum(album.id);
            
            card.innerHTML = `
                <div class="album-cover" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.4))">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-meta">
                        <i class="fas fa-images"></i> ${album.photo_count || 0} фото
                        ${album.ai_generated ? '<i class="fas fa-robot"></i> AI' : ''}
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    async loadPhotos() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/photos/list`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.photos = data.photos;
                    this.displayPhotos(data.photos);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
        }
    }

    displayPhotos(photos) {
        const grid = document.getElementById('photosGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (photos.length === 0) {
            grid.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Загрузите первое фото</p>
                </div>
            `;
            return;
        }
        
        photos.slice(0, 12).forEach(photo => { // Показываем первые 12 фото
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.onclick = () => this.viewPhoto(photo.id);
            
            card.innerHTML = `
                <img src="${photo.thumbnail || 'https://via.placeholder.com/200x180/7c3aed/ffffff?text=Photo'}" alt="${photo.original_name}">
                <div class="photo-info">
                    <div class="photo-name">${photo.original_name}</div>
                    <div class="photo-meta">
                        <span>${this.formatFileSize(photo.file_size)}</span>
                        <span>${new Date(photo.uploaded_at).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    async loadChats() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/chats/list`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.chats = data.chats;
                    this.displayChats(data.chats);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки чатов:', error);
        }
    }

    displayChats(chats) {
        const list = document.getElementById('chatsList');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (chats.length === 0) {
            list.innerHTML = `
                <div class="chat-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>Начните новый чат</p>
                </div>
            `;
            return;
        }
        
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-item';
            item.onclick = () => this.viewChat(chat.id);
            
            const lastMessageTime = chat.last_message_time ? 
                new Date(chat.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                'нет сообщений';
            
            item.innerHTML = `
                <div class="chat-avatar">
                    <i class="fas fa-users"></i>
                </div>
                <div class="chat-details">
                    <div class="chat-name">${chat.title || 'Чат'}</div>
                    <div class="chat-last-message">${chat.last_message || 'Начните общение'}</div>
                </div>
                <div class="chat-time">${lastMessageTime}</div>
            `;
            
            list.appendChild(item);
        });
    }

    async loadProfile() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/profile/stats`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayProfile(data.user, data.stats);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
        }
    }

    displayProfile(user, stats) {
        const profileCard = document.getElementById('profileCard');
        if (!profileCard) return;
        
        profileCard.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar-large">
                    ${user.avatar || '👤'}
                </div>
                <div class="profile-info">
                    <h3>${user.full_name || user.username}</h3>
                    <p><i class="fas fa-envelope"></i> ${user.email || 'Не указан'}</p>
                    <p><i class="fas fa-calendar"></i> Зарегистрирован: ${new Date(user.created_at).toLocaleDateString()}</p>
                    <p><i class="fas fa-sign-in-alt"></i> Последний вход: ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Сейчас'}</p>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="stat">
                    <div class="stat-value">${stats.photos}</div>
                    <div class="stat-label">Фото</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.albums}</div>
                    <div class="stat-label">Альбомов</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.chats}</div>
                    <div class="stat-label">Чатов</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(stats.storage_percent)}%</div>
                    <div class="stat-label">Хранилище</div>
                </div>
            </div>
            
            <div class="profile-actions">
                <button class="btn btn-primary" onclick="mocApp.showEditProfileModal()">
                    <i class="fas fa-edit"></i> Редактировать профиль
                </button>
                <button class="btn btn-outline" onclick="mocApp.showMasterKey()">
                    <i class="fas fa-key"></i> Показать мастер-ключ
                </button>
            </div>
        `;
    }

    updateStats() {
        if (!this.isAuthenticated) return;
        
        // Обновляем статистику вверху
        const totalPhotos = document.getElementById('totalPhotos');
        const totalAlbums = document.getElementById('totalAlbums');
        const storageUsed = document.getElementById('storageUsed');
        
        if (totalPhotos) totalPhotos.textContent = this.photos.length;
        if (totalAlbums) totalAlbums.textContent = this.albums.length;
        
        // Процент использования хранилища (демо)
        const storagePercent = Math.min(100, Math.round((this.photos.length * 5) + (this.albums.length * 2)));
        if (storageUsed) storageUsed.textContent = `${storagePercent}%`;
    }

    async createAlbum() {
        if (!this.isAuthenticated) return;
        
        const title = document.getElementById('albumTitle').value.trim();
        const description = document.getElementById('albumDescription').value.trim();
        const isPrivate = document.getElementById('albumPrivate').checked;
        
        if (!title) {
            this.showNotification('Введите название альбома', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/albums/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    description: description,
                    private: isPrivate
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification(`✅ Альбом "${title}" создан`, 'success');
                closeModal('createAlbumModal');
                await this.loadAlbums();
                this.updateStats();
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка создания альбома:', error);
            this.showNotification('❌ Ошибка создания альбома', 'error');
        }
    }

    async viewAlbum(albumId) {
        try {
            const response = await fetch(`${this.apiUrl}/albums/${albumId}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.currentAlbum = data.album;
                    this.showAlbumModal(data.album, data.photos);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки альбома:', error);
        }
    }

    showAlbumModal(album, photos) {
        // Очищаем предыдущее модальное окно если есть
        const existingModal = document.getElementById('viewAlbumModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Создаем новое модальное окно
        const modal = document.createElement('div');
        modal.id = 'viewAlbumModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px; max-height: 90vh;">
                <span class="close" onclick="closeModal('viewAlbumModal')">&times;</span>
                
                <div class="album-modal-header">
                    <h2 id="albumModalTitle" data-album-id="${album.id}">${album.title}</h2>
                    <p id="albumModalDescription">${album.description || 'Нет описания'}</p>
                    <div class="album-meta">
                        <span><i class="fas fa-images"></i> ${photos.length} фото</span>
                        <span><i class="fas fa-calendar"></i> ${new Date(album.updated_at || album.created_at).toLocaleDateString()}</span>
                        ${album.is_private ? '<span><i class="fas fa-lock"></i> Приватный</span>' : '<span><i class="fas fa-globe"></i> Публичный</span>'}
                    </div>
                </div>
                
                <div class="album-modal-actions">
                    <button onclick="mocApp.renameAlbum(${album.id})" class="btn btn-outline">
                        <i class="fas fa-edit"></i> Переименовать
                    </button>
                    <button onclick="mocApp.addPhotosToAlbum(${album.id})" class="btn btn-outline">
                        <i class="fas fa-plus"></i> Добавить фото
                    </button>
                    <button onclick="mocApp.shareAlbum(${album.id})" class="btn btn-outline">
                        <i class="fas fa-share-alt"></i> Поделиться
                    </button>
                    <button onclick="mocApp.downloadAlbum(${album.id})" class="btn btn-outline">
                        <i class="fas fa-download"></i> Скачать
                    </button>
                    <button onclick="mocApp.deleteAlbum(${album.id})" class="btn btn-danger">
                        <i class="fas fa-trash"></i> Удалить
                    </button>
                </div>
                
                <div id="albumPhotos" class="album-photos-grid">
                    <!-- Фото будут вставлены здесь -->
                </div>
                
                <div class="album-modal-footer">
                    <button onclick="closeModal('viewAlbumModal')" class="btn btn-secondary">
                        Закрыть
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Отображаем фото
        const photosContainer = modal.querySelector('#albumPhotos');
        this.displayAlbumPhotos(photosContainer, photos, album.id);
        
        // Показываем модальное окно
        showModal('viewAlbumModal');
    }

    displayAlbumPhotos(container, photos, albumId) {
        container.innerHTML = '';
        
        if (!photos || photos.length === 0) {
            container.innerHTML = `
                <div class="empty-album">
                    <i class="fas fa-images fa-3x"></i>
                    <h3>Альбом пуст</h3>
                    <p>Добавьте фото в этот альбом</p>
                    <button onclick="mocApp.addPhotosToAlbum(${albumId})" class="btn btn-primary">
                        <i class="fas fa-plus"></i> Добавить фото
                    </button>
                </div>
            `;
            return;
        }
        
        // Создаем сетку 4x4 для фото
        photos.forEach(photo => {
            const photoCard = document.createElement('div');
            photoCard.className = 'album-photo-card';
            photoCard.onclick = () => this.viewPhoto(photo.id);
            
            photoCard.innerHTML = `
                <div class="album-photo-thumbnail">
                    <img src="${photo.thumbnail || 'https://via.placeholder.com/150x120/7c3aed/ffffff?text=Photo'}" 
                        alt="${photo.original_name}"
                        loading="lazy">
                    <div class="album-photo-overlay">
                        <button onclick="event.stopPropagation(); mocApp.removePhotoFromAlbum(${photo.id}, ${albumId})" 
                                class="btn btn-danger btn-sm">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
                <div class="album-photo-info">
                    <span class="album-photo-name" title="${photo.original_name}">
                        ${photo.original_name.length > 15 ? photo.original_name.substring(0, 15) + '...' : photo.original_name}
                    </span>
                </div>
            `;
            
            container.appendChild(photoCard);
        });
    }
    async renameAlbum(albumId) {
        if (!this.isAuthenticated) return;
        
        // Загружаем текущие данные альбома
        try {
            const response = await fetch(`${this.apiUrl}/albums/${albumId}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.showRenameAlbumModal(data.album);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки альбома:', error);
            this.showNotification('❌ Ошибка загрузки данных альбома', 'error');
        }
    }

    showRenameAlbumModal(album) {
        const modal = document.createElement('div');
        modal.id = 'renameAlbumModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close" onclick="closeModal('renameAlbumModal')">&times;</span>
                <h2><i class="fas fa-edit"></i> Переименовать альбом</h2>
                
                <form id="renameAlbumForm">
                    <div class="form-group">
                        <label for="newAlbumTitle">Название альбома:</label>
                        <input type="text" id="newAlbumTitle" value="${album.title}" required>
                    </div>
                    <div class="form-group">
                        <label for="newAlbumDescription">Описание:</label>
                        <textarea id="newAlbumDescription" rows="3">${album.description || ''}</textarea>
                    </div>
                    
                    <div class="modal-actions">
                        <button type="button" class="btn btn-outline" onclick="closeModal('renameAlbumModal')">
                            Отмена
                        </button>
                        <button type="submit" class="btn btn-primary">
                            Сохранить
                        </button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Обработчик формы
        document.getElementById('renameAlbumForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.updateAlbum(album.id);
        });
        
        showModal('renameAlbumModal');
    }

    async updateAlbum(albumId) {
        const title = document.getElementById('newAlbumTitle')?.value.trim();
        const description = document.getElementById('newAlbumDescription')?.value.trim();
        
        if (!title) {
            this.showNotification('Введите название альбома', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/albums/${albumId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    description: description
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification('✅ Альбом обновлён', 'success');
                closeModal('renameAlbumModal');
                
                // Закрываем и переоткрываем окно просмотра альбома
                const currentAlbum = this.currentAlbum;
                if (currentAlbum && currentAlbum.id === albumId) {
                    closeModal('viewAlbumModal');
                    await this.viewAlbum(albumId);
                }
                
                // Обновляем список альбомов
                await this.loadAlbums();
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления альбома:', error);
            this.showNotification('❌ Ошибка обновления альбома', 'error');
        }
    }

    async addPhotosToAlbum(albumId) {
        if (!this.isAuthenticated) return;
        
        // Создаем модальное окно выбора фото
        const modal = document.createElement('div');
        modal.id = 'addToAlbumModal';
        modal.className = 'modal';
        
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 800px;">
                <span class="close" onclick="closeModal('addToAlbumModal')">&times;</span>
                <h2><i class="fas fa-plus"></i> Добавить фото в альбом</h2>
                
                <div class="available-photos-container" id="availablePhotosContainer">
                    <div class="loading-photos">
                        <i class="fas fa-spinner fa-spin"></i>
                        <p>Загрузка фото...</p>
                    </div>
                </div>
                
                <div class="modal-actions">
                    <button type="button" class="btn btn-outline" onclick="closeModal('addToAlbumModal')">
                        Отмена
                    </button>
                    <button type="button" class="btn btn-primary" onclick="mocApp.addSelectedPhotos(${albumId})">
                        Добавить выбранные
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        showModal('addToAlbumModal');
        
        // Загружаем доступные фото
        await this.loadAvailablePhotosForAlbum(albumId);
    }

    async loadAvailablePhotosForAlbum(albumId) {
        try {
            // Получаем все фото пользователя
            const response = await fetch(`${this.apiUrl}/photos/list`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayAvailablePhotos(data.photos, albumId);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
            const container = document.getElementById('availablePhotosContainer');
            container.innerHTML = '<div class="error-message">Ошибка загрузки фото</div>';
        }
    }

    displayAvailablePhotos(photos, albumId) {
        const container = document.getElementById('availablePhotosContainer');
        container.innerHTML = '';
        
        // Фильтруем фото, которые уже в этом альбоме
        const availablePhotos = photos.filter(photo => !photo.album_id || photo.album_id !== albumId);
        
        if (availablePhotos.length === 0) {
            container.innerHTML = `
                <div class="no-photos">
                    <i class="fas fa-images fa-2x"></i>
                    <p>Нет доступных фото для добавления</p>
                    <p>Загрузите новые фото или выберите другой альбом</p>
                </div>
            `;
            return;
        }
        
        // Создаем сетку выбора
        container.style.display = 'grid';
        container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(120px, 1fr))';
        container.style.gap = '1rem';
        container.style.maxHeight = '400px';
        container.style.overflowY = 'auto';
        container.style.padding = '1rem';
        
        availablePhotos.forEach(photo => {
            const photoCard = document.createElement('div');
            photoCard.className = 'selectable-photo-card';
            photoCard.dataset.photoId = photo.id;
            
            photoCard.innerHTML = `
                <input type="checkbox" id="photo_select_${photo.id}" 
                    class="photo-select-checkbox" 
                    data-photo-id="${photo.id}">
                <label for="photo_select_${photo.id}" class="photo-select-label">
                    <img src="${photo.thumbnail || 'https://via.placeholder.com/100x80/7c3aed/ffffff?text=Photo'}" 
                        alt="${photo.original_name}">
                    <span class="photo-select-name">${photo.original_name.length > 10 ? 
                        photo.original_name.substring(0, 10) + '...' : photo.original_name}</span>
                </label>
            `;
            
            container.appendChild(photoCard);
        });
    }

    async addSelectedPhotos(albumId) {
        const selectedCheckboxes = document.querySelectorAll('.photo-select-checkbox:checked');
        const photoIds = Array.from(selectedCheckboxes).map(cb => cb.dataset.photoId);
        
        if (photoIds.length === 0) {
            this.showNotification('Выберите хотя бы одно фото', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/albums/${albumId}/add-photos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo_ids: photoIds }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification(`✅ Добавлено ${photoIds.length} фото в альбом`, 'success');
                closeModal('addToAlbumModal');
                
                // Обновляем просмотр альбома
                const viewModal = document.getElementById('viewAlbumModal');
                if (viewModal) {
                    await this.viewAlbum(albumId);
                }
                
                // Обновляем статистику
                this.updateStats();
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка добавления фото:', error);
            this.showNotification('❌ Ошибка добавления фото', 'error');
        }
    }

    async removePhotoFromAlbum(photoId, albumId) {
        if (!confirm('Удалить фото из альбома?')) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/albums/${albumId}/remove-photo/${photoId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification('✅ Фото удалено из альбома', 'success');
                
                // Обновляем просмотр альбома
                await this.viewAlbum(albumId);
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления фото:', error);
            this.showNotification('❌ Ошибка удаления фото', 'error');
        }
    }

    async shareAlbum(albumId) {
        // Временная реализация
        this.showNotification('Функция шаринга в разработке', 'info');
    }

    async downloadAlbum(albumId) {
        try {
            this.showNotification('🔄 Подготовка архива...', 'info');
            
            const response = await fetch(`${this.apiUrl}/albums/${albumId}/download`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `альбом_${albumId}_${new Date().toISOString().split('T')[0]}.zip`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                
                this.showNotification('✅ Архив скачивается', 'success');
            } else {
                const error = await response.json();
                this.showNotification(`❌ Ошибка: ${error.error || 'Не удалось скачать архив'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка скачивания альбома:', error);
            this.showNotification('❌ Ошибка скачивания альбома', 'error');
        }
    }

    async deleteAlbum(albumId) {
        if (!confirm('Вы уверены, что хотите удалить этот альбом?\nФото останутся в "Мои фото".')) {
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/albums/${albumId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification('✅ Альбом удалён', 'success');
                closeModal('viewAlbumModal');
                
                // Обновляем список альбомов
                await this.loadAlbums();
                this.updateStats();
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления альбома:', error);
            this.showNotification('❌ Ошибка удаления альбома', 'error');
        }
    }
    async createChat() {
        if (!this.isAuthenticated) return;
        
        const title = document.getElementById('chatTitle').value.trim();
        
        if (!title) {
            this.showNotification('Введите название чата', 'warning');
            return;
        }
        
        // Получаем выбранных пользователей
        const selectedUsers = Array.from(document.querySelectorAll('.selected-user'))
            .map(el => parseInt(el.dataset.userId))
            .filter(id => id && id !== this.user.id);
        
        try {
            const response = await fetch(`${this.apiUrl}/chats/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    participants: selectedUsers
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification(`✅ Чат "${title}" создан`, 'success');
                closeModal('createChatModal');
                await this.loadChats();
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка создания чата:', error);
            this.showNotification('❌ Ошибка создания чата', 'error');
        }
    }

    async viewChat(chatId) {
        try {
            this.currentChat = chatId;
            
            // Загружаем сообщения
            const response = await fetch(`${this.apiUrl}/chats/${chatId}/messages`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.showChatModal(chatId, data.messages);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки чата:', error);
        }
    }

    showChatModal(chatId, messages) {
        // Находим чат в списке
        const chat = this.chats.find(c => c.id === chatId);
        
        if (chat) {
            document.getElementById('chatModalTitle').textContent = chat.title;
            document.getElementById('chatMembers').textContent = `${chat.participant_count || 2} участника`;
        }
        
        const messagesContainer = document.getElementById('chatMessages');
        messagesContainer.innerHTML = '';
        
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div class="chat-placeholder" style="margin: auto;">
                    <i class="fas fa-comments"></i>
                    <p>Нет сообщений</p>
                </div>
            `;
        } else {
            messages.forEach(msg => {
                const isSent = msg.sender_id === this.user.id;
                const messageDiv = document.createElement('div');
                messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
                
                const time = new Date(msg.sent_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                messageDiv.innerHTML = `
                    <div class="message-text">${msg.content}</div>
                    <div class="message-time">${time} • ${msg.sender_name || 'Пользователь'}</div>
                `;
                
                messagesContainer.appendChild(messageDiv);
            });
            
            // Прокручиваем вниз
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
        
        showModal('viewChatModal');
    }

    async sendChatMessage() {
        if (!this.currentChat || !this.isAuthenticated) return;
        
        const input = document.getElementById('chatMessageInput');
        const message = input.value.trim();
        
        if (!message) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/chats/${this.currentChat}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: message }),
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    input.value = '';
                    // Обновляем сообщения
                    await this.viewChat(this.currentChat);
                }
            }
        } catch (error) {
            console.error('Ошибка отправки сообщения:', error);
            this.showNotification('❌ Ошибка отправки сообщения', 'error');
        }
    }

    showProfileModal() {
        if (!this.isAuthenticated) return;
        
        showModal('editProfileModal');
        
        // Заполняем форму текущими данными
        if (this.user) {
            document.getElementById('editFullName').value = this.user.full_name || '';
            document.getElementById('editEmail').value = this.user.email || '';
            document.getElementById('editAvatar').value = this.user.avatar || '👤';
        }
    }

    async updateProfile() {
        if (!this.isAuthenticated) return;
        
        const fullName = document.getElementById('editFullName').value.trim();
        const email = document.getElementById('editEmail').value.trim();
        const avatar = document.getElementById('editAvatar').value;
        
        if (!email) {
            this.showNotification('Email обязателен', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/profile/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    full_name: fullName,
                    email: email,
                    avatar: avatar
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification('✅ Профиль обновлён', 'success');
                this.user = { ...this.user, ...data.user };
                localStorage.setItem('moc_current_user', JSON.stringify(this.user));
                
                closeModal('editProfileModal');
                await this.loadProfile();
                this.updateUIAfterLogin();
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка обновления профиля:', error);
            this.showNotification('❌ Ошибка обновления профиля', 'error');
        }
    }

    async changePassword() {
        if (!this.isAuthenticated) return;
        
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        
        if (!oldPassword || !newPassword) {
            this.showNotification('Заполните все поля', 'warning');
            return;
        }
        
        if (newPassword.length < 6) {
            this.showNotification('Новый пароль должен быть не менее 6 символов', 'warning');
            return;
        }
        
        try {
            const response = await fetch(`${this.apiUrl}/profile/change_password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    old_password: oldPassword,
                    new_password: newPassword
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification('✅ Пароль успешно изменён', 'success');
                document.getElementById('oldPassword').value = '';
                document.getElementById('newPassword').value = '';
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка смены пароля:', error);
            this.showNotification('❌ Ошибка смены пароля', 'error');
        }
    }

    async viewPhoto(photoId) {
        try {
            const response = await fetch(`${this.apiUrl}/photos/${photoId}`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.showPhotoModal(data.photo);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
        }
    }

    showPhotoModal(photo) {
        document.getElementById('photoModalTitle').textContent = 'Просмотр фото';
        document.getElementById('photoName').textContent = photo.original_name;
        document.getElementById('photoSize').textContent = this.formatFileSize(photo.file_size);
        document.getElementById('photoDate').textContent = new Date(photo.uploaded_at).toLocaleString();
        document.getElementById('photoDescription').value = photo.description || '';
        
        const img = document.getElementById('photoModalImage');
        img.src = photo.thumbnail || 'https://via.placeholder.com/600x400/7c3aed/ffffff?text=Photo';
        img.alt = photo.original_name;
        
        // Сохраняем ID текущего фото
        img.dataset.photoId = photo.id;
        
        showModal('viewPhotoModal');
    }

    async savePhotoDescription() {
        const photoId = document.getElementById('photoModalImage').dataset.photoId;
        const description = document.getElementById('photoDescription').value.trim();
        
        if (!photoId) return;
        
        this.showNotification('⚠️ В демо-версии описание не сохраняется', 'info');
        // В реальной версии здесь был бы запрос к API
    }

    async deletePhoto() {
        const photoId = document.getElementById('photoModalImage').dataset.photoId;
        
        if (!photoId) return;
        
        if (!confirm('Удалить это фото?')) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/photos/${photoId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (response.ok && data.success) {
                this.showNotification('✅ Фото удалено', 'success');
                closeModal('viewPhotoModal');
                await this.loadPhotos();
                this.updateStats();
            } else {
                this.showNotification(`❌ Ошибка: ${data.error}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка удаления фото:', error);
            this.showNotification('❌ Ошибка удаления фото', 'error');
        }
    }

    downloadPhoto() {
        const photoId = document.getElementById('photoModalImage').dataset.photoId;
        
        if (!photoId) return;
        
        this.showNotification('⚠️ В демо-версии скачивание не работает', 'info');
        // В реальной версии здесь был бы запрос к API для скачивания
    }

    sharePhoto() {
        this.showNotification('⚠️ В демо-версии шаринг не работает', 'info');
        // В реальной версии здесь была бы функция шаринга
    }

    showMasterKey() {
        const masterKey = localStorage.getItem('moc_master_key');
        if (masterKey) {
            alert(`🔐 Ваш мастер-ключ:\n\n${masterKey}\n\n⚠️ Сохраните его в безопасном месте!`);
        } else {
            alert('Мастер-ключ не найден. Возможно, вы вошли без регистрации.');
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    showNotification(message, type = 'info', duration = 5000) {
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
        
        // Авто-удаление
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Закрытие по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }
    // Вспомогательные функции
    function togglePassword(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        
        const type = input.type === 'password' ? 'text' : 'password';
        input.type = type;
        
        // Находим кнопку переключения (она должна быть рядом)
        const toggleBtn = input.parentElement.querySelector('.password-toggle i');
        if (toggleBtn) {
            toggleBtn.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
        }
    }

    // Экспортируем в глобальную область видимости
    window.togglePassword = togglePassword;
}
// Вспомогательные функции для модальных окон
window.showModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
};
window.closeModal = (modalId) => {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};
window.showLoginModal = function() {
    showModal('loginModal');
};

window.showRegisterModal = function() {
    showModal('registerModal');
};

// Функция переключения видимости пароля
window.togglePassword = function(inputId) {
    const input = document.getElementById(inputId);
    if (!input) return;
    
    const type = input.type === 'password' ? 'text' : 'password';
    input.type = type;
    
    // Находим кнопку переключения
    const toggleBtn = input.parentElement.querySelector('.password-toggle i');
    if (toggleBtn) {
        toggleBtn.className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    }
};

// Закрытие модального окна по клику вне его
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Привязка кнопок навигации к модальным окнам
    document.getElementById('loginBtn')?.addEventListener('click', showLoginModal);
    document.getElementById('registerBtn')?.addEventListener('click', showRegisterModal);
    
    // Плавающие кнопки
    document.getElementById('floatingBugBtn')?.addEventListener('click', function() {
        if (window.mocAssistant) {
            window.mocAssistant.reportBug();
        }
    });
    
    document.getElementById('floatingAssistantBtn')?.addEventListener('click', function() {
        if (window.mocAssistant) {
            window.mocAssistant.startBotChat();
        }
    });
});

// Инициализация приложения MOC
window.mocApp = new MOCApp();
// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM загружен, запускаю MOC...');
    window.mocApp = new MOCApp();
});*/
// Основное приложение MOC
class MOCApp {
    constructor() {
        this.apiUrl = 'http://localhost:5000';
        this.user = null;
        this.isAuthenticated = false;
        this.albums = [];
        this.photos = [];
        this.chats = [];
        this.currentAlbum = null;
        this.currentChat = null;
        this.albumsManager = null;
        this.photosManager = null;
        this.photosSystem = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 MOC App инициализируется...');
        this.bindEvents();  // ПЕРВОЕ: привязываем события
        this.loadSampleData();
        await this.checkAuth();
        this.testConnection();
        this.initializeAlbumsManager();
        this.initializeAssistant();
        this.initializePhotosManager();
        this.initializePhotosSystem();
    }



    initializePhotosSystem() {
        if (window.simplePhotos) {
            this.photosSystem = window.simplePhotos;
            // Синхронизируем состояние авторизации
            this.photosSystem.updateAuthStatus(this.isAuthenticated, this.user);
        }
    }

    initializePhotosManager() {
        if (!window.mocPhotos) {
            window.mocPhotos = new (class {
                constructor(mocApp) {
                    this.mocApp = mocApp;
                    this.photos = [];
                }
                
                async uploadFiles(files) {
                    // Используем систему из photos.js
                    if (window.mocPhotos && window.mocPhotos.uploadPhotos) {
                        return await window.mocPhotos.uploadPhotos(files);
                    }
                    return [];
                }
                
                loadPhotos() {
                    if (window.mocPhotos && window.mocPhotos.loadPhotos) {
                        return window.mocPhotos.loadPhotos();
                    }
                    return [];
                }
            })(this);
        }
        this.photosManager = window.mocPhotos;
    }

    async handleFiles(files) {
        console.log('📁 Загружаю файлы:', files.length);
        
        if (!this.isAuthenticated) {
            this.showNotification('Сначала войдите в систему!', 'warning');
            this.showModal('loginModal');
            return;
        }
        
        if (this.photosManager) {
            await this.photosManager.uploadFiles(files);
        }
    }

    initializeAssistant() {
        if (!window.mocAssistant) {
            window.mocAssistant = new (class {
                constructor() {
                    this.isTyping = false;
                }
                
                updateTypingStatus(chatId, isTyping) {
                    const typingElement = document.querySelector(`.typing-indicator[data-chat="${chatId}"]`);
                    if (typingElement) {
                        typingElement.style.display = isTyping ? 'block' : 'none';
                    }
                }
            })();
        }
        this.assistant = window.mocAssistant;
    }

    initializeAlbumsManager() {
        if (!window.albumsManager) {
            window.albumsManager = new (class {
                constructor(mocApp) {
                    this.mocApp = mocApp;
                }

                async viewAlbum(albumId) {
                    this.currentAlbum = albumId;
                    
                    try {
                        const response = await fetch(`${this.apiUrl}/albums/${albumId}`, {
                            method: 'GET',
                            credentials: 'include'
                        });
                        
                        if (response.ok) {
                            const data = await response.json();
                            if (data.success) {
                                this.showAlbumModal(data.album, data.photos);
                            }
                        } else {
                            this.showNotification('❌ Не удалось загрузить альбом', 'error');
                        }
                    } catch (error) {
                        console.error('Ошибка загрузки альбома:', error);
                        this.showNotification('❌ Ошибка загрузки альбома', 'error');
                    }
                }
                showAlbumModal(album, photos) {
                    this.mocApp.showAlbumModal(album, photos);
                }
            })(this);
        }
        this.albumsManager = window.albumsManager;
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
            this.showNotification('Сервер не запущен! Запустите python app.py', 'error', 10000);
        }
    }

    bindEvents() {
        console.log('🔗 Настраиваю события...');
        
        // ВАЖНО: Привязываем кнопки навигации к модальным окнам
        this.setupModalButtons();
        
        // Навигация
        this.setupNavigation();
        
        // Формы
        this.setupForms();
        
        // Загрузка файлов
        this.setupFileUpload();
        
        console.log('✅ События настроены');
    }

    setupModalButtons() {
        // Кнопки ассистента
        document.getElementById('chatWithBotBtn')?.addEventListener('click', () => {
            if (window.mocAssistant) {
                window.mocAssistant.startChat();
            } else {
                this.showNotification('Ассистент недоступен', 'error');
            }
        });

        document.getElementById('bugReportBtn')?.addEventListener('click', () => {
            if (window.mocAssistant) {
                window.mocAssistant.reportBug();
            } else {
                const bugReport = prompt('Опишите ошибку:');
                if (bugReport) {
                    this.showNotification('Спасибо за сообщение об ошибке!', 'success');
                }
            }
        });

        document.getElementById('aiAlbumsBtn')?.addEventListener('click', () => {
            this.showNotification('AI альбомы скоро будут доступны!', 'info');
        });

        document.getElementById('helpBtn')?.addEventListener('click', () => {
            this.showNotification('Раздел помощи в разработке', 'info');
        });
        // Привязываем кнопки входа и регистрации
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            this.showModal('loginModal');
        });
        
        document.getElementById('registerBtn')?.addEventListener('click', () => {
            this.showModal('registerModal');
        });
        
        // Привязываем кнопки закрытия модальных окон
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Закрытие по клику вне модального окна
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
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

    setupNavigation() {
        // Навигационные ссылки
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                
                const targetId = link.getAttribute('href').substring(1);
                const targetSection = document.getElementById(targetId);
                if (targetSection) {
                    window.scrollTo({
                        top: targetSection.offsetTop - 80,
                        behavior: 'smooth'
                    });
                }
            });
        });
        
        // Кнопка "Начать использовать"
        document.getElementById('getStarted')?.addEventListener('click', () => {
            if (!this.isAuthenticated) {
                this.showModal('loginModal');
            } else {
                this.showNotification('Вы уже вошли в систему!', 'info');
            }
        });
    }

    setupForms() {
        // Форма входа
        document.getElementById('loginForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('loginUsername')?.value;
            const password = document.getElementById('loginPassword')?.value;
            if (username && password) {
                this.login(username, password);
            }
        });
        
        // Форма регистрации
        document.getElementById('registerForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('regUsername')?.value;
            const password = document.getElementById('regPassword')?.value;
            const email = document.getElementById('regEmail')?.value;
            if (username && password) {
                this.register(username, password, email);
            }
        });
        
        // Форма создания альбома
        document.getElementById('createAlbumForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createAlbum();
        });
        
        // Форма создания чата
        document.getElementById('createChatForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.createChat();
        });
    }

    setupFileUpload() {
        const uploadZone = document.getElementById('uploadZone');
        const fileInput = document.getElementById('fileInput');
        
        uploadZone?.addEventListener('click', () => {
            if (!this.isAuthenticated) {
                this.showNotification('Сначала войдите в систему!', 'warning');
                this.showModal('loginModal');
                return;
            }
            fileInput?.click();
        });
        
        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#10b981';
            uploadZone.style.background = 'rgba(16, 185, 129, 0.1)';
        });
        
        uploadZone?.addEventListener('dragleave', () => {
            uploadZone.style.borderColor = '#7c3aed';
            uploadZone.style.background = 'rgba(124, 58, 237, 0.05)';
        });
        
        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.style.borderColor = '#7c3aed';
            uploadZone.style.background = 'rgba(124, 58, 237, 0.05)';
            
            if (!this.isAuthenticated) {
                this.showNotification('Сначала войдите в систему!', 'warning');
                this.showModal('loginModal');
                return;
            }
            
            this.handleFiles(e.dataTransfer.files);
        });
        
        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0 && this.isAuthenticated) {
                this.handleFiles(e.target.files);
            }
        });
    }
    async createChat() {
        if (!this.isAuthenticated) {
            this.showNotification('Сначала войдите в систему', 'warning');
            return;
        }
        
        const title = prompt('Введите название чата:');
        
        if (!title || title.trim() === '') {
            this.showNotification('Название чата не может быть пустым', 'warning');
            return;
        }
        
        try {
            this.showNotification('Создаем чат...', 'info');
            
            // Временно просто показываем уведомление
            setTimeout(() => {
                this.showNotification(`✅ Чат "${title}" создан`, 'success');
                
                // Добавляем демо-чат в список
                const newChat = {
                    id: Date.now(),
                    title: title,
                    last_message: 'Привет!',
                    last_message_time: new Date().toISOString()
                };
                
                this.chats.push(newChat);
                this.displayChats(this.chats);
                
            }, 1000);
            
        } catch (error) {
            console.error('Ошибка создания чата:', error);
            this.showNotification('❌ Ошибка создания чата', 'error');
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
            
            const data = await response.json();
            console.log('Ответ сервера:', data);
            
            if (response.ok && data.success) {
                this.user = data.user;
                this.isAuthenticated = true;
                
                // Сохраняем сессию
                localStorage.setItem('moc_current_user', JSON.stringify(data.user));
                localStorage.setItem('moc_session', 'active');
                
                this.showNotification(`✅ Добро пожаловать, ${username}!`, 'success');
                this.closeModal('loginModal');
                this.updateUIAfterLogin();
                
                // Загружаем данные пользователя
                await this.loadUserData();
                
            } else {
                this.showNotification(`❌ Ошибка: ${data.error || 'Неверные данные'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            this.showNotification('❌ Сервер не отвечает', 'error');
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
            
            const data = await response.json();
            console.log('Ответ регистрации:', data);
            
            if (response.ok && data.success) {
                // Сохраняем мастер-ключ
                localStorage.setItem('moc_master_key', data.master_key);
                localStorage.setItem('moc_username', username);
                
                this.showNotification(
                    `✅ Регистрация успешна!<br><br>
                    <strong>ВАЖНО:</strong> Мастер-ключ сохранен.<br>
                    <code style="background: #333; padding: 5px; border-radius: 3px;">${data.master_key}</code><br><br>
                    Для входа используйте логин: <strong>${username}</strong>`, 
                    'success'
                );
                
                this.closeModal('registerModal');
                
                // Сразу входим
                setTimeout(() => {
                    this.login(username, password);
                }, 2000);
                
            } else {
                this.showNotification(`❌ Ошибка: ${data.error || 'Неизвестная ошибка'}`, 'error');
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            this.showNotification('❌ Сервер не отвечает. Запущен ли python app.py?', 'error');
        }
    }

    async checkAuth() {
        try {
            // Проверяем localStorage
            const savedUser = localStorage.getItem('moc_current_user');
            if (savedUser) {
                this.user = JSON.parse(savedUser);
                this.isAuthenticated = true;
                this.updateUIAfterLogin();
                console.log('✅ Пользователь восстановлен из localStorage:', this.user?.username);
                
                // Загружаем данные
                await this.loadUserData();
                return;
            }
            
            // Проверяем серверную сессию
            const response = await fetch(`${this.apiUrl}/auth/check`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.authenticated) {
                    this.user = { username: data.username, id: data.user_id };
                    this.isAuthenticated = true;
                    
                    localStorage.setItem('moc_current_user', JSON.stringify(this.user));
                    
                    this.updateUIAfterLogin();
                    await this.loadUserData();
                    
                    console.log('✅ Пользователь авторизован:', data.username);
                }
            }
        } catch (error) {
            console.log('Пользователь не авторизован');
        }
    }

    async loadUserData() {
        if (!this.user) return;
        
        try {
            // Загружаем альбомы
            await this.loadAlbums();
            
            // Загружаем фото
            await this.loadPhotos();
            
            // Загружаем чаты
            await this.loadChats();
            
            // Загружаем профиль
            await this.loadProfile();
            
            // Обновляем статистику
            this.updateStats();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
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
         // Перепривязываем кнопки навигации
    this.bindEvents();
        // Обновляем систему фото
    if (this.photosSystem) {
        this.photosSystem.updateAuthStatus(true, this.user);
    }
    // Показываем плавающие кнопки
    const floatingButtons = document.getElementById('floatingButtons');
    if (floatingButtons) {
        floatingButtons.style.display = 'flex';
        
        // Привязываем события к плавающим кнопкам
        document.getElementById('floatingBugBtn')?.addEventListener('click', () => {
            this.showNotification('Функция сообщения об ошибке в разработке', 'info');
        });
        
        document.getElementById('floatingAssistantBtn')?.addEventListener('click', () => {
            this.showNotification('Чат с ботом скоро будет доступен', 'info');
        });
    }
    
    // Обновляем текст загрузки
    const uploadText = document.getElementById('uploadText');
    if (uploadText) {
        uploadText.textContent = `Добро пожаловать, ${this.user.username}! Перетащите фото для загрузки`;
    }
    
    // Показываем статистику
    const uploadStats = document.getElementById('uploadStats');
    if (uploadStats) {
        uploadStats.style.display = 'flex';
    }
    
    // Активируем навигацию
    document.querySelectorAll('.nav-link').forEach(link => {
        link.style.pointerEvents = 'auto';
        link.style.opacity = '1';
    });
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
        
        // Очищаем данные
        this.clearUserData();
        
        // Обновляем интерфейс
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
        
        // Очищаем только сессионные данные, оставляем мастер-ключ
        const masterKey = localStorage.getItem('moc_master_key');
        const username = localStorage.getItem('moc_username');
        
        localStorage.clear();
        
        if (masterKey) localStorage.setItem('moc_master_key', masterKey);
        if (username) localStorage.setItem('moc_username', username);
    }

    updateUIAfterLogout() {
        // Восстанавливаем меню входа
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
                // Обновляем систему фото
            if (this.photosSystem) {
                this.photosSystem.updateAuthStatus(false, null);
            }

            // Перепривязываем кнопки
            document.getElementById('loginBtn').addEventListener('click', () => {
                this.showModal('loginModal');
            });
            document.getElementById('registerBtn').addEventListener('click', () => {
                this.showModal('registerModal');
            });
        }
        
        // Скрываем плавающие кнопки
        const floatingButtons = document.getElementById('floatingButtons');
        if (floatingButtons) {
            floatingButtons.style.display = 'none';
        }
        
        // Обновляем текст загрузки
        const uploadText = document.getElementById('uploadText');
        if (uploadText) {
            uploadText.textContent = 'Перетащите файлы сюда или кликните для выбора';
        }
        
        // Скрываем статистику
        const uploadStats = document.getElementById('uploadStats');
        if (uploadStats) {
            uploadStats.style.display = 'none';
        }
        
        // Очищаем контент
        this.clearContent();
    }

    clearContent() {
        // Очищаем фото
        const photosGrid = document.getElementById('photosGrid');
        if (photosGrid) {
            photosGrid.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Загрузите первое фото</p>
                </div>
            `;
        }
        
        // Очищаем альбомы
        const albumsGrid = document.getElementById('albumsGrid');
        if (albumsGrid) {
            albumsGrid.innerHTML = `
                <div class="album-placeholder">
                    <i class="fas fa-folder-plus"></i>
                    <p>Создайте первый альбом</p>
                </div>
            `;
        }
        
        // Очищаем чаты
        const chatsList = document.getElementById('chatsList');
        if (chatsList) {
            chatsList.innerHTML = `
                <div class="chat-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>Начните новый чат</p>
                </div>
            `;
        }
        
        // Очищаем профиль
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
        // Загружаем демо-данные если не авторизованы
        if (!this.isAuthenticated) {
            this.loadSampleAlbums();
            this.loadSamplePhotos();
        }
    }

    loadSampleAlbums() {
        const albums = [
            { id: 1, title: 'Лето 2024', photo_count: 12, color: '#f59e0b', icon: 'fas fa-sun' },
            { id: 2, title: 'Путешествия', photo_count: 8, color: '#10b981', icon: 'fas fa-plane' },
            { id: 3, title: 'С друзьями', photo_count: 15, color: '#3b82f6', icon: 'fas fa-users' }
        ];
        
        const grid = document.getElementById('albumsGrid');
        if (grid) {
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

    loadSamplePhotos() {
        const photosGrid = document.getElementById('photosGrid');
        if (photosGrid && photosGrid.children.length === 1) {
            photosGrid.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Войдите для загрузки фото</p>
                </div>
            `;
        }
    }

    async loadAlbums() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/albums/list`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.albums = data.albums;
                    this.displayAlbums(data.albums);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки альбомов:', error);
        }
    }

    displayAlbums(albums) {
        const grid = document.getElementById('albumsGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (albums.length === 0) {
            grid.innerHTML = `
                <div class="album-placeholder">
                    <i class="fas fa-folder-plus"></i>
                    <p>Создайте первый альбом</p>
                </div>
            `;
            return;
        }
        
        albums.forEach(album => {
            const card = document.createElement('div');
            card.className = 'album-card';
            card.onclick = () => this.viewAlbum(album.id);
            
            albumElement.innerHTML = `
                <div class="album-cover" style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(124, 58, 237, 0.4))">
                    <i class="fas fa-folder"></i>
                </div>
                <div class="album-info">
                    <div class="album-title">${album.title}</div>
                    <div class="album-meta">
                        <i class="fas fa-images"></i> ${album.photo_count || 0} фото
                        ${album.ai_generated ? '<i class="fas fa-robot"></i> AI' : ''}
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    async loadPhotos() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/photos/list`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.photos = data.photos;
                    this.displayPhotos(data.photos);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки фото:', error);
        }
    }

    displayPhotos(photos) {
        const grid = document.getElementById('photosGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        if (photos.length === 0) {
            grid.innerHTML = `
                <div class="photo-placeholder">
                    <i class="fas fa-images"></i>
                    <p>Загрузите первое фото</p>
                </div>
            `;
            return;
        }
        
        photos.slice(0, 12).forEach(photo => {
            const card = document.createElement('div');
            card.className = 'photo-card';
            card.onclick = () => this.viewPhoto(photo.id);
            
            card.innerHTML = `
                <img src="${photo.thumbnail || 'https://via.placeholder.com/200x180/7c3aed/ffffff?text=Photo'}" alt="${photo.original_name}">
                <div class="photo-info">
                    <div class="photo-name">${photo.original_name}</div>
                    <div class="photo-meta">
                        <span>${this.formatFileSize(photo.file_size)}</span>
                        <span>${new Date(photo.uploaded_at).toLocaleDateString()}</span>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        });
    }

    async loadChats() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/chats/list`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.chats = data.chats;
                    this.displayChats(data.chats);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки чатов:', error);
        }
    }

    displayChats(chats) {
        const list = document.getElementById('chatsList');
        if (!list) return;
        
        list.innerHTML = '';
        
        if (chats.length === 0) {
            list.innerHTML = `
                <div class="chat-placeholder">
                    <i class="fas fa-comments"></i>
                    <p>Начните новый чат</p>
                </div>
            `;
            return;
        }
        
        chats.forEach(chat => {
            const item = document.createElement('div');
            item.className = 'chat-item';
            item.onclick = () => this.viewChat(chat.id);
            
            const lastMessageTime = chat.last_message_time ? 
                new Date(chat.last_message_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 
                'нет сообщений';
            
            item.innerHTML = `
                <div class="chat-avatar">
                    <i class="fas fa-users"></i>
                </div>
                <div class="chat-details">
                    <div class="chat-name">${chat.title || 'Чат'}</div>
                    <div class="chat-last-message">${chat.last_message || 'Начните общение'}</div>
                </div>
                <div class="chat-time">${lastMessageTime}</div>
            `;
            
            list.appendChild(item);
        });
    }

    async loadProfile() {
        if (!this.isAuthenticated) return;
        
        try {
            const response = await fetch(`${this.apiUrl}/profile/stats`, {
                method: 'GET',
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    this.displayProfile(data.user, data.stats);
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
        }
    }

    displayProfile(user, stats) {
        const profileCard = document.getElementById('profileCard');
        if (!profileCard) return;
        
        profileCard.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar-large">
                    ${user.avatar || '👤'}
                </div>
                <div class="profile-info">
                    <h3>${user.full_name || user.username}</h3>
                    <p><i class="fas fa-envelope"></i> ${user.email || 'Не указан'}</p>
                    <p><i class="fas fa-calendar"></i> Зарегистрирован: ${new Date(user.created_at).toLocaleDateString()}</p>
                    <p><i class="fas fa-sign-in-alt"></i> Последний вход: ${user.last_login ? new Date(user.last_login).toLocaleString() : 'Сейчас'}</p>
                </div>
            </div>
            
            <div class="profile-stats">
                <div class="stat">
                    <div class="stat-value">${stats.photos}</div>
                    <div class="stat-label">Фото</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.albums}</div>
                    <div class="stat-label">Альбомов</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${stats.chats}</div>
                    <div class="stat-label">Чатов</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${Math.round(stats.storage_percent)}%</div>
                    <div class="stat-label">Хранилище</div>
                </div>
            </div>
        `;
    }

    updateStats() {
        if (!this.isAuthenticated) return;
        
        const totalPhotos = document.getElementById('totalPhotos');
        const totalAlbums = document.getElementById('totalAlbums');
        const storageUsed = document.getElementById('storageUsed');
        
        if (totalPhotos) totalPhotos.textContent = this.photos.length;
        if (totalAlbums) totalAlbums.textContent = this.albums.length;
        
        const storagePercent = Math.min(100, Math.round((this.photos.length * 5) + (this.albums.length * 2)));
        if (storageUsed) storageUsed.textContent = `${storagePercent}%`;
    }

    showNotification(message, type = 'info', duration = 5000) {
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
        
        // Авто-удаление
        setTimeout(() => {
            notification.classList.add('notification-hide');
            setTimeout(() => notification.remove(), 300);
        }, duration);
        
        // Закрытие по клику
        notification.querySelector('.notification-close').addEventListener('click', () => {
            notification.remove();
        });
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('📱 DOM загружен, запускаю MOC...');
    window.mocApp = new MOCApp();
    
    // Дополнительная инициализация кнопок (на всякий случай)
    setTimeout(() => {
        if (window.mocApp) {
            console.log('✅ MOC App запущен');
        }
    }, 100);
});

// Интеграция системы загрузки с основным приложением
if (window.uploadSystem && window.mocApp) {
    // Переопределяем загрузку файлов
    window.mocApp.handleFiles = async function(files) {
        if (window.uploadSystem) {
            await window.uploadSystem.handleFiles(files);
        }
    };
    
    console.log('✅ Интегрировано с системой загрузки');
}
