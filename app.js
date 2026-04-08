// --- CONFIGURACIÓN FIREBASE PARA PÚBLICO EN VIVO ---
const firebaseConfig = {
    // REEMPLAZAR CON TUS CREDENCIALES DE FIREBASE (Proyecto de Configuración)
    apiKey: "TU_API_KEY",
    authDomain: "tu-proyecto.firebaseapp.com",
    databaseURL: "https://tu-proyecto.firebaseio.com",
    projectId: "tu-proyecto",
    storageBucket: "tu-proyecto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:1234:web:xyz"
};
if (typeof firebase !== 'undefined' && !firebase.apps.length) {
    try {
        firebase.initializeApp(firebaseConfig);
    } catch(e){ console.log("Firebase no cargado o mal configurado");}
}
const db = typeof firebase !== 'undefined' ? firebase.database() : null;

// --- VARIABLES GLOBALES CON FAIL-SAFE ---
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

// --- CAMBIAR FUENTE ---
function changeFontSize(val) {
    document.documentElement.style.setProperty('--game-font-size', val + 'rem');
    document.getElementById('font-value').innerText = val + 'rem';
}

// --- NAVEGACIÓN ---
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.style.display = 'none');
    const target = document.getElementById(screenId);
    if (target) target.style.display = 'flex';
    if (screenId === 'screen-admin') renderAdminTable();
}

// --- LÓGICA DE PAUSA PROFESIONAL ---

function pauseAndSave() {
    // 1. Detenemos el cronómetro principal inmediatamente
    clearInterval(timer);

    // 2. Mostramos el overlay personalizado
    document.getElementById('pause-overlay').style.display = 'flex';
}

function unpause() {
    // 1. Quitamos el overlay
    document.getElementById('pause-overlay').style.display = 'none';

    // 2. Reanudamos el tiempo donde se quedó (resetTimer usa timeLeft actual)
    // Para que no se resetee el tiempo total, modificamos resetTimer para que no limpie timeLeft si viene de pausa
    resumeTimerAfterPause();
}

function resumeTimerAfterPause() {
    // Esta función es similar a resetTimer pero sin calcular tiempo por nivel
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
    // Guardamos el estado actual en el storage
    const state = {
        currentIdx: currentIdx,
        bancoTiempo: bancoTiempo,
        sessionQuestions: sessionQuestions,
        used50: used50,
        usedPhone: usedPhone,
        usedPeople: usedPeople
    };

    localStorage.setItem('biblia_save', JSON.stringify(state));

    // Ocultamos todo y volvemos al inicio
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

// --- RESTO DE FUNCIONES (ESTRUCTURA LIMPIA) ---

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

function startGame() {
    if (gameData.length === 0) return alert("Carga preguntas en Gestión primero.");
    document.getElementById('result-overlay').style.display = 'none';
    currentIdx = 0;
    bancoTiempo = 0;
    
    used50 = false;
    usedPhone = false;
    usedPeople = false;
    document.getElementById('cmd-50').classList.remove('usado');
    document.getElementById('cmd-phone').classList.remove('usado');
    document.getElementById('cmd-people').classList.remove('usado');

    // Seleccionar 15 preguntas al azar, una por cada nivel del 1 al 15
    sessionQuestions = [];
    for (let i = 1; i <= 15; i++) {
        let pool = gameData.filter(q => parseInt(q.nivel || 1) === i);
        if (pool.length === 0) {
            // Failsafe por si no hay preguntas de ese nivel
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
    const q = sessionQuestions[currentIdx];
    document.getElementById('display-question').innerText = q.pregunta;

    // Aleatorizar opciones
    const opcionesConIndice = q.opciones.map((opt, i) => ({ texto: opt, idOriginal: i }));
    // Barajar
    for (let i = opcionesConIndice.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opcionesConIndice[i], opcionesConIndice[j]] = [opcionesConIndice[j], opcionesConIndice[i]];
    }

    document.querySelectorAll('.diamond-box.option').forEach((btn, i) => {
        btn.style.visibility = 'visible';
        document.getElementById(`opt${i}`).innerText = opcionesConIndice[i].texto;
        // Identificar el botón que tiene la correcta
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
    if (sel === currentRightAnswerIndex) {
        clearInterval(timer);
        currentIdx++;
        if (currentIdx < sessionQuestions.length) {
            setTimeout(loadQuestion, 500);
        } else {
            showGameOver("¡CAMPEÓN!", "¡Ganaste 1 millón de puntos!");
        }
    } else {
        clearInterval(timer);
        let s = "$0";
        if (currentIdx >= 10) s = puntosArr[9];
        else if (currentIdx >= 5) s = puntosArr[4];
        showGameOver("INCORRECTA", "Te vas con " + s);
    }
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

// --- LÓGICA DE RETIRO ---
function retirePlayer() {
    clearInterval(timer); // Pausar el reloj temporalmente
    const amount = currentIdx > 0 ? puntosArr[currentIdx - 1] : "$0";
    document.getElementById('retire-amount').innerText = amount;
    document.getElementById('retire-overlay').style.display = 'flex';
}

function confirmRetire() {
    document.getElementById('retire-overlay').style.display = 'none';
    const amount = currentIdx > 0 ? puntosArr[currentIdx - 1] : "$0";
    showGameOver("TE HAS RETIRADO", "Te llevas a casa " + amount);
}

function cancelRetire() {
    document.getElementById('retire-overlay').style.display = 'none';
    // Reanudar el reloj
    resumeTimerAfterPause();
}

// --- GESTIÓN TABLA ---
function renderAdminTable() {
    const tbody = document.getElementById('admin-table-body');
    if (!tbody) return;
    tbody.innerHTML = '';
    gameData.forEach((q, i) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="number" style="width:60px" value="${q.nivel || 1}" onchange="updateData(${i},'nivel',parseInt(this.value)||1)"></td>
            <td><input type="text" value="${q.pregunta}" onchange="updateData(${i},'pregunta',this.value)"></td>
            <td><input type="text" value="${q.opciones[0]}" onchange="updateOpt(${i},0,this.value)"></td>
            <td><input type="text" value="${q.opciones[1]}" onchange="updateOpt(${i},1,this.value)"></td>
            <td><input type="text" value="${q.opciones[2]}" onchange="updateOpt(${i},2,this.value)"></td>
            <td><input type="text" value="${q.opciones[3]}" onchange="updateOpt(${i},3,this.value)"></td>
            <td><input type="number" value="${q.correcta}" onchange="updateData(${i},'correcta',parseInt(this.value))"></td>
            <td><button onclick="removeRow(${i})" style="color:red">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}
function updateData(i, k, v) { gameData[i][k] = v; }
function updateOpt(i, oi, v) { gameData[i].opciones[oi] = v; }
function addNewRow() { gameData.push({ nivel: 1, pregunta: "", opciones: ["", "", "", ""], correcta: 0 }); renderAdminTable(); }
function removeRow(i) { gameData.splice(i, 1); renderAdminTable(); }
function saveAdminData() {
    try {
        localStorage.setItem('biblia_questions', JSON.stringify(gameData));
        alert("Preguntas guardadas.");
    } catch (e) { alert("Bloqueado por el navegador."); }
}

// --- COMODINES ---
function use50() {
    if (used50) return;
    used50 = true;
    document.getElementById('cmd-50').classList.add('usado');
    
    // Buscar 2 opciones incorrectas aleatorias
    let incorrects = [];
    for(let i=0; i<4; i++){
        if(i !== currentRightAnswerIndex) incorrects.push(i);
    }
    
    // Mezclar las 3 incorrectas y elegir las 2 primeras
    for(let i = incorrects.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [incorrects[i], incorrects[j]] = [incorrects[j], incorrects[i]];
    }
    
    // Ocultar 2
    document.querySelectorAll('.diamond-box.option')[incorrects[0]].style.visibility = 'hidden';
    document.querySelectorAll('.diamond-box.option')[incorrects[1]].style.visibility = 'hidden';
}

function usePhone() {
    if (usedPhone) return;
    usedPhone = true;
    document.getElementById('cmd-phone').classList.add('usado');
    
    // Pausar el reloj principal
    clearInterval(timer);
    
    document.getElementById('phone-overlay').style.display = 'flex';
    let phoneTimeLeft = 30;
    const phoneTimerDisplay = document.getElementById('phone-timer');
    phoneTimerDisplay.innerText = phoneTimeLeft;
    
    phoneTimerInterval = setInterval(() => {
        phoneTimeLeft--;
        phoneTimerDisplay.innerText = phoneTimeLeft;
        if(phoneTimeLeft <= 0) {
            hangUp();
        }
    }, 1000);
}

function hangUp() {
    clearInterval(phoneTimerInterval);
    document.getElementById('phone-overlay').style.display = 'none';
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

    // Generar un código de sala aleatorio
    const roomCode = Math.random().toString(36).substring(2, 6).toUpperCase();
    
    // Crear el registro en Firebase
    const roomRef = db.ref('rooms/' + roomCode);
    roomRef.set({ votes: { A:0, B:0, C:0, D:0 }, active: true });
    
    // Preparar UI
    document.getElementById('audience-overlay').style.display = 'flex';
    document.getElementById('qrcode').innerHTML = '';
    
    let baseUrl = window.location.href.split('index.html')[0];
    if(baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);
    const voteUrl = `${baseUrl}/votar.html?room=${roomCode}`;
    
    new QRCode(document.getElementById("qrcode"), {
        text: voteUrl,
        width: 250,
        height: 250
    });
    
    // Resetear barras
    ['A','B','C','D'].forEach(opt => {
        document.getElementById(`bar-${opt}`).style.width = '0%';
        document.getElementById(`pct-${opt}`).innerText = '0%';
    });
    
    // Escuchar votos en tiempo real
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
    
    let audienceTimeLeft = 40;
    const audTimerDisplay = document.getElementById('audience-timer');
    audTimerDisplay.innerText = audienceTimeLeft;
    
    // Pausar timer principal
    clearInterval(timer);
    
    const audInterval = setInterval(() => {
        audienceTimeLeft--;
        audTimerDisplay.innerText = audienceTimeLeft;
        if(audienceTimeLeft <= 0) {
            clearInterval(audInterval);
            roomRef.update({ active: false }); // Cerrar votación
            roomRef.child('votes').off(); // Dejar de escuchar
            setTimeout(() => {
                document.getElementById('audience-overlay').style.display = 'none';
                resumeTimerAfterPause();
            }, 6000); // 6 segundos adicionales para asimilar resultados
        }
    }, 1000);
}