// ============================================================
// SHARED.JS — Firebase, Audio, Navegación, Launcher Theme
// ============================================================

// --- CONFIGURACIÓN FIREBASE ---
const firebaseConfig = {
    apiKey: "AIzaSyDmuQ3rv-bBudtvDT_ypYithXGLmgfXuZ0",
    authDomain: "juego-50x15.firebaseapp.com",
    databaseURL: "https://juego-50x15-default-rtdb.firebaseio.com",
    projectId: "juego-50x15",
    storageBucket: "juego-50x15.firebasestorage.app",
    messagingSenderId: "588319700681",
    appId: "1:588319700681:web:3efa9ba278e07c46f43f18"
};
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch(e){ console.log("Firebase no cargado o mal configurado");}
}
const db = typeof firebase !== 'undefined' ? firebase.database() : null;

// --- AUDIO MANAGER ---
const bgmPlayer = new Audio();
bgmPlayer.loop = true;
const sfxPlayer = new Audio();

function stopAllAudio() {
    bgmPlayer.pause();
    bgmPlayer.currentTime = 0;
    sfxPlayer.pause();
    sfxPlayer.currentTime = 0;
}

function playBGM(src) {
    if (!src) { 
        bgmPlayer.pause(); 
        bgmPlayer.currentTime = 0;
        return; 
    }
    // Si ya está sonando la misma canción, no reiniciar
    if (bgmPlayer.src.includes(encodeURI(src)) && !bgmPlayer.paused) return;
    // Si es la misma pero está pausada, solo reanudar
    if (bgmPlayer.src.includes(encodeURI(src)) && bgmPlayer.paused) {
        bgmPlayer.currentTime = 0;
        bgmPlayer.play().catch(e => console.log("Autoplay bloqueado"));
        return;
    }
    // Canción nueva: cambiar src
    bgmPlayer.src = `assets/${src}`;
    bgmPlayer.play().catch(e => console.log("Autoplay bloqueado"));
}

function playSFX(src) {
    sfxPlayer.src = `assets/${src}`;
    sfxPlayer.play().catch(e => console.log("Autoplay bloqueado"));
}

// --- NAVEGACIÓN ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(screenId);
    if (target) target.style.display = 'flex';
    if (screenId === 'screen-admin') { 
        renderAdminTable(); 
        renderThemesList(); 
        if (typeof renderWhoAdminTable === 'function') renderWhoAdminTable();
    }

    // Cerrar overlays del juego al salir
    if (screenId !== 'screen-game') {
        ['phone-overlay','pause-overlay','result-overlay','retire-overlay','audience-overlay'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });
    }

    // Manejar el fondo del body: launcher vs juegos
    const toggle = document.querySelector('.theme-toggle');
    const backBtn = document.getElementById('btn-back-center');
    
    if (screenId === 'screen-launcher') {
        document.body.classList.add('launcher-active');
        if (toggle) toggle.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'none';
        stopAllAudio();
        playBGM('salvapantallas.mp3');
    } else {
        document.body.classList.remove('launcher-active');
        if (toggle) toggle.style.display = 'none';
        if (backBtn) backBtn.style.display = 'flex';
        if (screenId === 'screen-home' || screenId === 'screen-who-home') {
            stopAllAudio();
            playBGM('salvapantallas.mp3');
        }
    }
}

function goToLauncher() {
    // Si hay un juego activo (no en overlay de resultado), preguntar
    const game50Visible = document.getElementById('screen-game').style.display === 'flex';
    const resultVisible = document.getElementById('result-overlay').style.display === 'flex';
    const whoVisible = document.getElementById('screen-who').style.display === 'flex';
    
    if (game50Visible && !resultVisible) {
        if (!confirm('¿Salir de 50x15? El progreso no guardado se perderá.')) return;
        if(typeof timer !== 'undefined') clearInterval(timer);
    } else if (whoVisible && (typeof isWhoGameOver !== 'undefined' && !isWhoGameOver)) {
        if (!confirm('¿Salir de ¿Quién Soy?? El juego actual se perderá.')) return;
    }
    
    playBGM(null); // Detener cualquier música de juego
    showScreen('screen-launcher');
}

function showComingSoon(gameName) {
    alert(`🔒 ${gameName}\n\n¡Este juego estará disponible próximamente!\nEstamos trabajando en traerte nuevas experiencias bíblicas.`);
}

// --- LAUNCHER THEME TOGGLE ---
function toggleLauncherTheme() {
    const body = document.body;
    const current = body.getAttribute('data-theme');
    const next = current === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', next);
    
    const icon = document.getElementById('theme-icon');
    if (icon) {
        icon.className = next === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
    
    try { localStorage.setItem('launcher_theme', next); } catch(e) {}
}

// Restaurar tema guardado al cargar
try {
    const saved = localStorage.getItem('launcher_theme');
    if (saved) {
        document.body.setAttribute('data-theme', saved);
        const icon = document.getElementById('theme-icon');
        if (icon) icon.className = saved === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
    }
} catch(e) {}

// --- CAMBIAR FUENTE ---
function changeFontSize(val) {
    document.documentElement.style.setProperty('--game-font-size', val + 'rem');
    document.getElementById('font-value').innerText = val + 'rem';
}
