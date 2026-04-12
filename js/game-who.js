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

function startWhoAmI() {
    if (whoData.length === 0) {
        return alert("Primero debes cargar personajes en Gestión de Preguntas > ¿Quién Soy?");
    }
    
    // Elegir un personaje al azar que preferiblemente no haya salido (podemos hacer un sistema igual a 50x15 después)
    currentWhoIdx = Math.floor(Math.random() * whoData.length);
    currentClueLevel = 0;
    isWhoGameOver = false;

    // Reset visual
    document.querySelectorAll('.img-slot').forEach(slot => {
        slot.innerHTML = '<i class="fas fa-lock"></i>';
        slot.className = 'img-slot locked';
    });

    document.getElementById('clue-points-display').innerText = clueValues[0];
    document.getElementById('who-character-name').innerText = '???';
    document.getElementById('who-character-name').style.display = 'none';

    // Mostrar menú
    showScreen('screen-who');
    
    // Reproducir música (usaremos la del nivel 15 por ahora)
    playSFX('cambio de pantalla.mp3');
    setTimeout(() => {
        playBGM('tension pregunta 15.mp3');
    }, 1000);
}

function revealNextClue() {
    if (isWhoGameOver) return;
    if (currentClueLevel > 3) return;

    const character = whoData[currentWhoIdx];
    
    // Validar que tenga imagen para este nivel
    if (!character.imagenes || !character.imagenes[currentClueLevel]) {
        alert("Falta una imagen para esta pista.");
        return;
    }

    const slot = document.getElementById(`slot-${currentClueLevel}`);
    
    // Cambiar a la imagen
    slot.innerHTML = `<img src="${character.imagenes[currentClueLevel]}" class="show">`;
    slot.className = 'img-slot active-reveal';

    // Reproducir SFX
    playSFX('50 50.mp3'); // Reciclando sonido

    // Actualizar nivel
    currentClueLevel++;
    
    // Actualizar puntaje si aún no terminan las pistas
    if (currentClueLevel < 4) {
        document.getElementById('clue-points-display').innerText = clueValues[currentClueLevel];
    }
}

function showWhoAnswer() {
    if (isWhoGameOver) return;
    isWhoGameOver = true;

    const character = whoData[currentWhoIdx];
    const nameDisplay = document.getElementById('who-character-name');
    
    nameDisplay.innerText = character.nombre;
    nameDisplay.style.display = 'block';

    // Parar tensión, reproducir correct
    playBGM(null);
    playSFX('correct.mp3');

    // Desbloquear pistas restantes para que se vean todas
    for (let i = currentClueLevel; i < 4; i++) {
        if (character.imagenes && character.imagenes[i]) {
            const slot = document.getElementById(`slot-${i}`);
            slot.innerHTML = `<img src="${character.imagenes[i]}" class="show">`;
            slot.className = 'img-slot';
            slot.style.opacity = '0.5'; // Para diferenciar las que no se usaron
        }
    }
}
