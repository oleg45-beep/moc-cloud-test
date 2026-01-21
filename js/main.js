// js/main.js
console.log("MOC Cloud loaded!");

// Простые функции
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded");
    
    // Кнопки входа/регистрации
    document.getElementById('loginBtn')?.addEventListener('click', function() {
        alert('Окно входа скоро будет доступно');
    });
    
    document.getElementById('registerBtn')?.addEventListener('click', function() {
        alert('Окно регистрации скоро будет доступно');
    });
    
    document.getElementById('getStarted')?.addEventListener('click', function() {
        alert('Начинаем использовать MOC Cloud!');
    });
});
