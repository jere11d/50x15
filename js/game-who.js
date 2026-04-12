// ============================================================
// GAME-WHO.JS — Lógica del juego "¿Quién Soy?"
// ============================================================

let whoData = [];
let currentWhoIdx = 0;
let currentClueLevel = 0; // 0 a 3
const clueValues = [100, 75, 50, 25];
let isWhoGameOver = false;

// Intentar cargar data desde LocalStorage al inicio
try {
    const data = localStorage.getItem('biblia_who_characters');
    whoData = data ? JSON.parse(data) : [];
} catch (e) {
    console.error("No se pudo cargar la data de Quién Soy");
}

function saveWhoState() {
    try {
        localStorage.setItem('biblia_who_save', JSON.stringify({
            currentWhoIdx, currentClueLevel, isWhoGameOver
        }));
    } catch(e) {}
}

function startWhoAmI() {
    if (whoData.length === 0) {
        return alert("Primero debes cargar personajes en Gestión de Preguntas > ¿Quién Soy?");
    }
    
    currentWhoIdx = Math.floor(Math.random() * whoData.length);
    currentClueLevel = 0;
    isWhoGameOver = false;

    // Reset visual
    document.querySelectorAll('.img-slot').forEach(slot => {
        slot.innerHTML = '<i class="fas fa-lock"></i>';
        slot.className = 'img-slot locked';
        slot.style.opacity = '1';
    });

    document.getElementById('clue-points-display').innerText = clueValues[0];
    document.getElementById('who-character-name').innerText = '???';
    document.getElementById('who-character-name').style.display = 'none';

    saveWhoState();
    showScreen('screen-who');
    playSFX('cambio de pantalla.mp3');
    setTimeout(() => { playBGM('tension pregunta 15.mp3'); }, 1000);
}

function resumeWhoAmI() {
    try {
        const saveStr = localStorage.getItem('biblia_who_save');
        if (!saveStr) return alert("No hay ninguna partida guardada de ¿Quién Soy?.");
        
        const state = JSON.parse(saveStr);
        currentWhoIdx = state.currentWhoIdx;
        currentClueLevel = state.currentClueLevel;
        isWhoGameOver = state.isWhoGameOver;
        
        if (whoData.length === 0 || !whoData[currentWhoIdx]) {
            return alert("Los personajes han cambiado o fue borrado. Empieza nueva partida.");
        }
        
        const character = whoData[currentWhoIdx];

        // Reconstruir visual
        document.querySelectorAll('.img-slot').forEach(slot => {
            slot.innerHTML = '<i class="fas fa-lock"></i>';
            slot.className = 'img-slot locked';
            slot.style.opacity = '1';
        });

        // Restaurar pistas reveladas
        for (let i = 0; i < currentClueLevel; i++) {
            if (character.imagenes && character.imagenes[i]) {
                const slot = document.getElementById(`slot-${i}`);
                slot.innerHTML = `<img src="${character.imagenes[i]}" class="show">`;
                slot.className = 'img-slot active-reveal';
            }
        }
        
        document.getElementById('clue-points-display').innerText = currentClueLevel < 4 ? clueValues[currentClueLevel] : 0;
        
        if (isWhoGameOver) {
            document.getElementById('who-character-name').innerText = character.nombre;
            document.getElementById('who-character-name').style.display = 'block';
            for (let i = currentClueLevel; i < 4; i++) {
                if (character.imagenes && character.imagenes[i]) {
                    const slot = document.getElementById(`slot-${i}`);
                    slot.innerHTML = `<img src="${character.imagenes[i]}" class="show">`;
                    slot.className = 'img-slot';
                    slot.style.opacity = '0.5';
                }
            }
        } else {
            document.getElementById('who-character-name').innerText = '???';
            document.getElementById('who-character-name').style.display = 'none';
        }

        showScreen('screen-who');
        
        if (!isWhoGameOver) {
            playBGM('tension pregunta 15.mp3');
        } else {
            playBGM(null);
        }
    } catch(e) {
        alert("No se pudo cargar la partida guardada.");
    }
}

function revealNextClue() {
    if (isWhoGameOver) return;
    if (currentClueLevel > 3) return;

    const character = whoData[currentWhoIdx];
    
    if (!character.imagenes || !character.imagenes[currentClueLevel]) {
        alert("Falta una imagen para esta pista.");
        return;
    }

    const slot = document.getElementById(`slot-${currentClueLevel}`);
    slot.innerHTML = `<img src="${character.imagenes[currentClueLevel]}" class="show">`;
    slot.className = 'img-slot active-reveal';

    playSFX('50 50.mp3');
    currentClueLevel++;
    
    if (currentClueLevel < 4) {
        document.getElementById('clue-points-display').innerText = clueValues[currentClueLevel];
    } else {
        document.getElementById('clue-points-display').innerText = 0;
    }
    
    saveWhoState();
}

function showWhoAnswer() {
    if (isWhoGameOver) return;
    isWhoGameOver = true;

    const character = whoData[currentWhoIdx];
    const nameDisplay = document.getElementById('who-character-name');
    
    nameDisplay.innerText = character.nombre;
    nameDisplay.style.display = 'block';

    playBGM(null);
    playSFX('correct.mp3');

    for (let i = currentClueLevel; i < 4; i++) {
        if (character.imagenes && character.imagenes[i]) {
            const slot = document.getElementById(`slot-${i}`);
            slot.innerHTML = `<img src="${character.imagenes[i]}" class="show">`;
            slot.className = 'img-slot';
            slot.style.opacity = '0.5';
        }
    }
    
    saveWhoState();
}
