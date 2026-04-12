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

function playBGM(src) {
    if(!src) { bgmPlayer.pause(); return; }
    if(bgmPlayer.src.includes(encodeURI(src)) && !bgmPlayer.paused) return;
    bgmPlayer.src = `assets/${src}`;
    bgmPlayer.play().catch(e=>console.log("Autoplay bloqueado"));
}

function playSFX(src) {
    sfxPlayer.src = `assets/${src}`;
    sfxPlayer.play().catch(e=>console.log("Autoplay bloqueado"));
}

// --- NAVEGACIÓN ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(screenId);
    if (target) target.style.display = 'flex';
    if (screenId === 'screen-admin') { renderAdminTable(); renderThemesList(); }

    // Manejar el fondo del body: launcher vs juegos
    const toggle = document.querySelector('.theme-toggle');
    const backBtn = document.getElementById('btn-back-center');
    
    if (screenId === 'screen-launcher') {
        document.body.classList.add('launcher-active');
        if (toggle) toggle.style.display = 'flex';
        if (backBtn) backBtn.style.display = 'none';
        playBGM('salvapantallas.mp3');
    } else {
        document.body.classList.remove('launcher-active');
        if (toggle) toggle.style.display = 'none';
        if (backBtn) backBtn.style.display = 'flex';
        if (screenId === 'screen-home') {
            playBGM('salvapantallas.mp3');
        }
    }
}

function goToLauncher() {
    // Si hay un juego en curso, preguntar
    if (document.getElementById('screen-game').style.display === 'flex') {
        if (!confirm('¿Salir del juego? El progreso no guardado se perderá.')) return;
        clearInterval(timer);
    }
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
