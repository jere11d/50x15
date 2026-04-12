// ============================================================
// GAME-50x15.JS — Toda la lógica del juego 50 x 15
// ============================================================

let pendingAnswerIndex = -1;
let evaluating = false;

// --- VARIABLES GLOBALES ---
let gameData = [];
try {
    const data = localStorage.getItem('biblia_questions');
    gameData = data ? JSON.parse(data) : [];
} catch (e) {
    console.error("Almacenamiento bloqueado por el navegador.");
}

let currentIdx = 0;
let sessionQuestions = [];
let currentRightAnswerIndex = 0;
let timer;
let timeLeft = 30;
let bancoTiempo = 0;
let phoneTimerInterval;

// Comodines
let used50 = false;
let usedPhone = false;
let usedPeople = false;

const puntosArr = ["$100", "$200", "$300", "$500", "$1,000", "$2,000", "$4,000", "$8,000", "$16,000", "$32,000", "$64,000", "$125,000", "$250,000", "$500,000", "$1 MILLÓN"];
const seguros = [4, 9, 14];

// --- PAUSA ---
function pauseAndSave() {
    clearInterval(timer);
    document.getElementById('pause-overlay').style.display = 'flex';
}

function unpause() {
    document.getElementById('pause-overlay').style.display = 'none';
    resumeTimerAfterPause();
}

function resumeTimerAfterPause() {
    clearInterval(timer);
    const display = document.getElementById('game-timer');
    timer = setInterval(() => {
        timeLeft--;
        display.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            showGameOver("¡TIEMPO AGOTADO!", "El tiempo no perdona.");
        }
    }, 1000);
}

function saveAndExit() {
    const state = {
        currentIdx, bancoTiempo, sessionQuestions,
        used50, usedPhone, usedPeople
    };
    localStorage.setItem('biblia_save', JSON.stringify(state));
    document.getElementById('pause-overlay').style.display = 'none';
    showScreen('screen-home');
}

function resumeGame() {
    try {
        const save = localStorage.getItem('biblia_save');
        if (save) {
            const state = JSON.parse(save);
            currentIdx = state.currentIdx;
            bancoTiempo = state.bancoTiempo || 0;
            sessionQuestions = state.sessionQuestions || [];
            used50 = state.used50 || false;
            usedPhone = state.usedPhone || false;
            usedPeople = state.usedPeople || false;

            document.getElementById('cmd-50').classList.toggle('usado', used50);
            document.getElementById('cmd-phone').classList.toggle('usado', usedPhone);
            document.getElementById('cmd-people').classList.toggle('usado', usedPeople);

            if (sessionQuestions.length === 0) {
                alert("Guardado obsoleto o corrupto. Inicia una nueva partida.");
                return;
            }
            showScreen('screen-game');
            loadQuestion();
        } else {
            alert("No hay partidas guardadas.");
        }
    } catch (e) {
        alert("No se puede acceder al guardado en este navegador.");
    }
}

// --- TIMER ---
function resetTimer() {
    clearInterval(timer);
    timeLeft = (currentIdx < 5) ? 15 : (currentIdx < 10) ? 30 : 45;
    const disp = document.getElementById('game-timer');
    disp.innerText = timeLeft;
    timer = setInterval(() => {
        timeLeft--;
        disp.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(timer);
            showGameOver("FIN DEL TIEMPO", "Te quedaste sin segundos.");
        }
    }, 1000);
}

// --- JUEGO ---
function startGame() {
    if (gameData.length === 0) return alert("Carga preguntas en Gestión primero.");
    playSFX('cambio de pantalla.mp3');
    document.getElementById('result-overlay').style.display = 'none';
    currentIdx = 0;
    bancoTiempo = 0;
    
    used50 = false; usedPhone = false; usedPeople = false;
    document.getElementById('cmd-50').classList.remove('usado');
    document.getElementById('cmd-phone').classList.remove('usado');
    document.getElementById('cmd-people').classList.remove('usado');

    sessionQuestions = [];
    for (let i = 1; i <= 15; i++) {
        let pool = gameData.filter(q => parseInt(q.nivel || 1) === i);
        if (pool.length === 0) {
            pool = gameData.filter(q => !sessionQuestions.some(sq => sq.pregunta === q.pregunta));
            if (pool.length === 0) pool = gameData;
        }
        const randomQ = pool[Math.floor(Math.random() * pool.length)];
        sessionQuestions.push(JSON.parse(JSON.stringify(randomQ)));
    }

    showScreen('screen-game');
    loadQuestion();
}

function loadQuestion() {
    pendingAnswerIndex = -1;
    evaluating = false;
    document.querySelectorAll('.diamond-box.option').forEach(el => {
        el.classList.remove('selected', 'correct', 'wrong');
        el.style.visibility = 'visible';
    });

    const q = sessionQuestions[currentIdx];
    document.getElementById('display-question').innerText = q.pregunta;

    if (currentIdx === 14) {
        playBGM('tension pregunta 15.mp3');
    } else {
        playBGM('sonid de preguntas.mp3');
    }

    const opcionesConIndice = q.opciones.map((opt, i) => ({ texto: opt, idOriginal: i }));
    for (let i = opcionesConIndice.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opcionesConIndice[i], opcionesConIndice[j]] = [opcionesConIndice[j], opcionesConIndice[i]];
    }

    document.querySelectorAll('.diamond-box.option').forEach((btn, i) => {
        btn.style.visibility = 'visible';
        document.getElementById(`opt${i}`).innerText = opcionesConIndice[i].texto;
        if (opcionesConIndice[i].idOriginal === q.correcta) {
            currentRightAnswerIndex = i;
        }
    });

    const btnRetire = document.querySelector('.btn-retire');
    btnRetire.style.display = (currentIdx === 4 || currentIdx === 9) ? 'block' : 'none';

    renderLadder();
    resetTimer();
}

function checkAnswer(sel) {
    if (evaluating) return;
    if (timeLeft <= 0) return; 

    if (pendingAnswerIndex !== sel) {
        document.querySelectorAll('.diamond-box.option').forEach(el => el.classList.remove('selected'));
        pendingAnswerIndex = sel;
        document.querySelectorAll('.diamond-box.option')[sel].classList.add('selected');
        return;
    }

    evaluating = true;
    clearInterval(timer);
    playBGM(null);
    playSFX("respuesta definitiva.mp3");

    setTimeout(() => {
        if (sel === currentRightAnswerIndex) {
            playSFX("correct.mp3");
            document.querySelectorAll('.diamond-box.option')[sel].classList.add('correct');
            currentIdx++;
            if (currentIdx < sessionQuestions.length) {
                setTimeout(loadQuestion, 3000);
            } else {
                showGameOver("¡CAMPEÓN!", "¡Ganaste 1 millón de puntos!");
            }
        } else {
            playSFX("wrong.mp3");
            document.querySelectorAll('.diamond-box.option')[sel].classList.add('wrong');
            document.querySelectorAll('.diamond-box.option')[currentRightAnswerIndex].classList.add('correct');
            let s = "$0";
            if (currentIdx >= 10) s = puntosArr[9];
            else if (currentIdx >= 5) s = puntosArr[4];
            setTimeout(() => {
                showGameOver("INCORRECTA", "Te vas con " + s);
            }, 2000);
        }
    }, 4000);
}

function renderLadder() {
    const list = document.getElementById('ladder-list');
    list.innerHTML = '';
    puntosArr.forEach((p, i) => {
        const li = document.createElement('li');
        li.innerText = `${i + 1} - ${p}`;
        if (i === currentIdx) li.className = 'active';
        if (seguros.includes(i)) li.classList.add('safe');
        list.appendChild(li);
    });
}

function showGameOver(t, m) {
    document.getElementById('result-title').innerText = t;
    document.getElementById('result-msg').innerText = m;
    document.getElementById('result-overlay').style.display = 'flex';
}

// --- RETIRO ---
function retirePlayer() {
    clearInterval(timer);
    const amount = currentIdx > 0 ? puntosArr[currentIdx - 1] : "$0";
    document.getElementById('retire-amount').innerText = amount;
    document.getElementById('retire-overlay').style.display = 'flex';
}

function confirmRetire() {
    document.getElementById('retire-overlay').style.display = 'none';
    playBGM(null);
    playSFX('retirarse.mp3');
    const amount = currentIdx > 0 ? puntosArr[currentIdx - 1] : "$0";
    setTimeout(() => {
        showGameOver("TE HAS RETIRADO", "Te llevas a casa " + amount);
    }, 1000);
}

function cancelRetire() {
    document.getElementById('retire-overlay').style.display = 'none';
    resumeTimerAfterPause();
}

// --- COMODINES ---
function use50() {
    if (used50) return;
    used50 = true;
    document.getElementById('cmd-50').classList.add('usado');
    playSFX('50 50.mp3');
    
    let incorrects = [];
    for(let i=0; i<4; i++){
        if(i !== currentRightAnswerIndex) incorrects.push(i);
    }
    for(let i = incorrects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrects[i], incorrects[j]] = [incorrects[j], incorrects[i]];
    }
    document.querySelectorAll('.diamond-box.option')[incorrects[0]].style.visibility = 'hidden';
    document.querySelectorAll('.diamond-box.option')[incorrects[1]].style.visibility = 'hidden';
}

function usePhone() {
    if (usedPhone) return;
    usedPhone = true;
    document.getElementById('cmd-phone').classList.add('usado');
    clearInterval(timer);
    playBGM(null);
    playSFX('llamada.mp3');

    document.getElementById('phone-overlay').style.display = 'flex';
    let phoneTimeLeft = 15;
    const phoneTimerDisplay = document.getElementById('phone-timer');
    phoneTimerDisplay.innerText = phoneTimeLeft;
    
    phoneTimerInterval = setInterval(() => {
        phoneTimeLeft--;
        phoneTimerDisplay.innerText = phoneTimeLeft;
        if(phoneTimeLeft <= 0) hangUp();
    }, 1000);
}

function hangUp() {
    clearInterval(phoneTimerInterval);
    document.getElementById('phone-overlay').style.display = 'none';
    playBGM(currentIdx === 14 ? 'tension pregunta 15.mp3' : 'sonid de preguntas.mp3');
    resumeTimerAfterPause();
}

function usePeople() {
    if (usedPeople) return;
    usedPeople = true;
    document.getElementById('cmd-people').classList.add('usado');
    
    if(!db) {
        alert("Firebase no está configurado. Revisa tu consola.");
        return;
    }

    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    const getOptText = (idx) => {
        const box = document.querySelectorAll('.diamond-box.option')[idx];
        return box.style.visibility === 'hidden' ? '' : document.getElementById('opt'+idx).innerText;
    };

    const roomRef = db.ref('rooms/' + roomCode);
    roomRef.set({ 
        pregunta: document.getElementById('display-question').innerText,
        opciones: { A: getOptText(0), B: getOptText(1), C: getOptText(2), D: getOptText(3) },
        votes: { A:0, B:0, C:0, D:0 }, 
        active: true 
    });
    
    document.getElementById('audience-overlay').style.display = 'flex';
    document.getElementById('qrcode').innerHTML = '';
    
    let baseUrl = window.location.href.split('index.html')[0];
    if(baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const voteUrl = `${baseUrl}/votar.html?room=${roomCode}`;
    
    new QRCode(document.getElementById("qrcode"), { text: voteUrl, width: 250, height: 250 });
    
    ['A','B','C','D'].forEach(opt => {
        document.getElementById(`bar-${opt}`).style.width = '0%';
        document.getElementById(`pct-${opt}`).innerText = '0%';
    });
    
    let totalVotes = 0;
    roomRef.child('votes').on('value', (snapshot) => {
        const data = snapshot.val();
        if(!data) return;
        totalVotes = (data.A||0) + (data.B||0) + (data.C||0) + (data.D||0);
        ['A','B','C','D'].forEach(opt => {
            let val = data[opt] || 0;
            let targetPct = totalVotes === 0 ? 0 : Math.round((val / totalVotes) * 100);
            document.getElementById(`bar-${opt}`).style.width = targetPct + '%';
            document.getElementById(`pct-${opt}`).innerText = targetPct + '%';
        });
    });
    
    playBGM(null);
    playSFX('votacion.mp3');
    
    let audienceTimeLeft = 24;
    const audTimerDisplay = document.getElementById('audience-timer');
    audTimerDisplay.innerText = audienceTimeLeft;
    clearInterval(timer);
    
    const audInterval = setInterval(() => {
        audienceTimeLeft--;
        audTimerDisplay.innerText = audienceTimeLeft;
        if(audienceTimeLeft <= 0) {
            clearInterval(audInterval);
            if(db) roomRef.update({ active: false });
            setTimeout(() => {
                document.getElementById('audience-overlay').style.display = 'none';
                playBGM(currentIdx === 14 ? 'tension pregunta 15.mp3' : 'sonid de preguntas.mp3');
                resumeTimerAfterPause();
            }, 6000);
        }
    }, 1000);
}
