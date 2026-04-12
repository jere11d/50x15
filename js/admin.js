// ============================================================
// ADMIN.JS — Gestión de preguntas y sistema de temas
// ============================================================

// --- TABLA DE PREGUNTAS ---
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

function saveAdminData(silent) {
    try {
        localStorage.setItem('biblia_questions', JSON.stringify(gameData));
        if (!silent) alert("Preguntas guardadas.");
    } catch (e) { alert("Bloqueado por el navegador."); }
}

// --- IMPORT / EXPORT JSON ---
function importJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (Array.isArray(parsed)) {
                gameData = parsed;
                saveAdminData(true);
                renderAdminTable();
                
                const fileName = file.name.replace('.json', '');
                const themeInput = document.getElementById('theme-name');
                if (themeInput && fileName !== 'questions') {
                    themeInput.value = fileName;
                }
                
                const totalQ = parsed.length;
                const levels = [...new Set(parsed.map(q => q.nivel))].sort((a,b) => a-b);
                alert(`¡Tema cargado! ${totalQ} preguntas en niveles: ${levels.join(', ')}`);
            } else {
                alert("El archivo no tiene el formato correcto.");
            }
        } catch (err) {
            alert("Error al leer el archivo JSON.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function exportJSON() {
    if (gameData.length === 0) return alert("No hay datos para exportar.");
    const themeName = document.getElementById('theme-name').value.trim() || 'preguntas';
    const safeFileName = themeName.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '').replace(/\s+/g, '_');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(gameData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", safeFileName + ".json");
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function clearAllData() {
    if (confirm("⚠️ ¿ESTÁS SEGURO? Se borrarán TODAS las preguntas cargadas actualmente.")) {
        gameData = [];
        saveAdminData(true);
        renderAdminTable();
        document.getElementById('theme-name').value = '';
        currentThemeName = '';
        try { localStorage.removeItem('biblia_active_theme'); } catch(e) {}
        alert("Preguntas borradas.");
    }
}

// --- SISTEMA DE TEMAS ---
let currentThemeName = '';
try {
    const savedTheme = localStorage.getItem('biblia_active_theme');
    if (savedTheme) currentThemeName = savedTheme;
} catch(e) {}

function getThemes() {
    try {
        const data = localStorage.getItem('biblia_themes');
        return data ? JSON.parse(data) : {};
    } catch(e) { return {}; }
}

function saveThemesToStorage(themes) {
    try {
        localStorage.setItem('biblia_themes', JSON.stringify(themes));
    } catch(e) {
        alert("Error al guardar: almacenamiento lleno o bloqueado.");
    }
}

function saveTheme() {
    const nameInput = document.getElementById('theme-name');
    const name = nameInput.value.trim();
    if (!name) return alert("Escribe un nombre para el tema.");
    if (gameData.length === 0) return alert("No hay preguntas para guardar.");
    
    const themes = getThemes();
    if (themes[name] && !confirm(`El tema "${name}" ya existe. ¿Sobrescribir?`)) return;
    
    themes[name] = JSON.parse(JSON.stringify(gameData));
    saveThemesToStorage(themes);
    currentThemeName = name;
    try { localStorage.setItem('biblia_active_theme', name); } catch(e) {}
    renderThemesList();
    
    const totalQ = gameData.length;
    const levels = [...new Set(gameData.map(q => q.nivel))].sort((a,b) => a-b);
    alert(`✅ Tema "${name}" guardado (${totalQ} preguntas, niveles: ${levels.join(', ')})`);
}

function loadTheme(name) {
    const themes = getThemes();
    if (!themes[name]) return alert("Tema no encontrado.");
    
    gameData = JSON.parse(JSON.stringify(themes[name]));
    saveAdminData(true);
    renderAdminTable();
    currentThemeName = name;
    try { localStorage.setItem('biblia_active_theme', name); } catch(e) {}
    document.getElementById('theme-name').value = name;
    renderThemesList();
    
    alert(`✅ Tema "${name}" cargado (${gameData.length} preguntas)`);
}

function downloadTheme(name) {
    const themes = getThemes();
    if (!themes[name]) return alert("Tema no encontrado.");
    
    const safeFileName = name.replace(/[^a-zA-Z0-9áéíóúñÁÉÍÓÚÑ _-]/g, '').replace(/\s+/g, '_');
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(themes[name], null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", safeFileName + ".json");
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function deleteTheme(name) {
    if (!confirm(`¿Borrar el tema "${name}"?`)) return;
    const themes = getThemes();
    delete themes[name];
    saveThemesToStorage(themes);
    renderThemesList();
}

function renderThemesList() {
    const container = document.getElementById('themes-list');
    if (!container) return;
    
    const themes = getThemes();
    const names = Object.keys(themes);
    
    if (names.length === 0) {
        container.innerHTML = '<p style="color:#666; font-style:italic; font-size:0.85rem;">No hay temas guardados.</p>';
        return;
    }
    
    let html = '<div style="display:flex; flex-direction:column; gap:8px;">';
    names.forEach(name => {
        const qs = themes[name];
        const count = qs.length;
        const levels = [...new Set(qs.map(q => q.nivel))].sort((a,b) => a-b);
        const isActive = name === currentThemeName;
        
        html += `
        <div style="display:flex; align-items:center; gap:10px; padding:10px 15px; 
            background:${isActive ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.05)'}; 
            border:2px solid ${isActive ? 'var(--gold)' : '#333'}; border-radius:10px; flex-wrap:wrap;">
            <div style="flex:1; min-width:150px;">
                <strong style="color:${isActive ? 'var(--gold)' : 'white'}; font-size:1rem;">
                    ${isActive ? '<i class="fas fa-star" style="margin-right:5px;"></i>' : ''}${name}
                </strong>
                <div style="color:#999; font-size:0.75rem; margin-top:3px;">${count} preguntas · Niveles: ${levels.join(', ')}</div>
            </div>
            <div style="display:flex; gap:6px; flex-wrap:wrap;">
                <button onclick="loadTheme('${name.replace(/'/g, "\\'")}')" class="btn-dev" style="font-size:0.75rem; padding:5px 10px;">
                    <i class="fas fa-play"></i> USAR</button>
                <button onclick="downloadTheme('${name.replace(/'/g, "\\'")}')" class="btn-dev" style="font-size:0.75rem; padding:5px 10px;">
                    <i class="fas fa-download"></i></button>
                <button onclick="deleteTheme('${name.replace(/'/g, "\\'")}')" class="btn-dev danger" style="font-size:0.75rem; padding:5px 10px;">
                    <i class="fas fa-trash"></i></button>
            </div>
        </div>`;
    });
    html += '</div>';
    container.innerHTML = html;
}

// ============================================================
// ADMIN.JS — Lógica para "Quién Soy"
// ============================================================

// --- NAVEGACIÓN TABS ---
function switchAdminTab(tabName) {
    const adminScreen = document.getElementById('screen-admin');
    if (tabName === '50x15') {
        adminScreen.classList.remove('admin-who-theme');
        document.getElementById('admin-50x15-section').style.display = 'flex';
        document.getElementById('admin-who-section').style.display = 'none';
        document.getElementById('tab-50x15').style.opacity = '1';
        document.getElementById('tab-50x15').classList.add('pulse');
        document.getElementById('tab-who').style.opacity = '0.5';
        document.getElementById('tab-who').classList.remove('pulse');
        renderAdminTable();
    } else {
        adminScreen.classList.add('admin-who-theme');
        document.getElementById('admin-50x15-section').style.display = 'none';
        document.getElementById('admin-who-section').style.display = 'flex';
        document.getElementById('tab-who').style.opacity = '1';
        document.getElementById('tab-who').classList.add('pulse');
        document.getElementById('tab-50x15').style.opacity = '0.5';
        document.getElementById('tab-50x15').classList.remove('pulse');
        renderWhoAdminTable();
    }
}

// --- LOGICA DE TABLA QUIEN SOY ---
function renderWhoAdminTable() {
    const tbody = document.getElementById('admin-who-idbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Si no está cargado whoData desde game-who.js, aseguremos que exista
    if (typeof whoData === 'undefined') window.whoData = [];
    
    whoData.forEach((char, i) => {
        const tr = document.createElement('tr');
        if(!char.imagenes) char.imagenes = ["","","",""];
        
        let imgHtml = '';
        for(let j=0; j<4; j++){
            const hasImg = char.imagenes[j] && (char.imagenes[j].startsWith('data:image') || char.imagenes[j].startsWith('http') || char.imagenes[j].startsWith('assets'));
            const bg = hasImg ? 'background: #28a745;' : 'background: #444;';
            imgHtml += `
            <div style="display:inline-block; margin:2px; text-align:center;">
                <label style="cursor:pointer; display:inline-block; padding:5px; border-radius:5px; ${bg} color:white; font-size:0.8rem;" title="Subir Imagen ${j+1}">
                    <i class="fas fa-image"></i> ${j+1}
                    <input type="file" accept="image/*" style="display:none;" onchange="uploadWhoImage(event, ${i}, ${j})">
                </label>
                ${hasImg ? `<br><img src="${char.imagenes[j]}" style="width:30px; height:30px; object-fit:cover; margin-top:2px; border-radius:3px;">` : ''}
            </div>`;
        }
        
        tr.innerHTML = `
            <td><input type="text" value="${char.nombre || ''}" onchange="updateWhoData(${i}, 'nombre', this.value)" placeholder="Nombre del Personaje"></td>
            <td><input type="text" value="${char.info || ''}" onchange="updateWhoData(${i}, 'info', this.value)" placeholder="Dato curioso/Info"></td>
            <td>${imgHtml}</td>
            <td><button onclick="removeWhoRow(${i})" style="color:red" class="btn-dev danger">X</button></td>
        `;
        tbody.appendChild(tr);
    });
}

function updateWhoData(i, k, v) { whoData[i][k] = v; saveWhoAdminData(true); }
function addNewWhoRow() {
    whoData.push({ nombre: "", info: "", imagenes: ["", "", "", ""] });
    renderWhoAdminTable();
}
function removeWhoRow(i) {
    if(confirm("¿Borrar este personaje?")) {
        whoData.splice(i, 1);
        saveWhoAdminData(true);
        renderWhoAdminTable();
    }
}

// --- SISTEMA DE COMPRESIÓN DE IMÁGENES (CANVAS) ---
function uploadWhoImage(event, charIndex, imgIndex) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Comprimir la imagen usando un canvas
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 600;
            const MAX_HEIGHT = 600;
            let width = img.width;
            let height = img.height;
            
            if (width > height) {
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
            } else {
                if (height > MAX_HEIGHT) {
                    width *= MAX_HEIGHT / height;
                    height = MAX_HEIGHT;
                }
            }
            
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // Exportar como JPG ligero (0.7 calidad) para que ahorre peso
            const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
            
            // Guardar en el array
            whoData[charIndex].imagenes[imgIndex] = dataUrl;
            renderWhoAdminTable();
            
            // Auto-guardado
            saveWhoAdminData(true);
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);
}

// --- GUARDAR / EXPORTAR ---
function saveWhoAdminData(silent) {
    try {
        localStorage.setItem('biblia_who_characters', JSON.stringify(whoData));
        if (!silent) alert("Personajes e imágenes guardados en el navegador.");
    } catch(e) {
        alert("Error al guardar. Puede que las imágenes sean muy pesadas y llenaron la memoria. Borra algunos personajes o usa EXPORTAR JSON.");
    }
}

function exportWhoJSON() {
    if (!whoData || whoData.length === 0) return alert("No hay datos para exportar.");
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(whoData, null, 4));
    const a = document.createElement('a');
    a.setAttribute("href", dataStr);
    a.setAttribute("download", "quien_soy_personajes.json");
    document.body.appendChild(a);
    a.click();
    a.remove();
}

function importWhoJSON(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (Array.isArray(parsed)) {
                whoData = parsed;
                saveWhoAdminData(true);
                renderWhoAdminTable();
                alert(`¡Archivo cargado! ${parsed.length} personajes listos.`);
            } else {
                alert("El archivo no tiene el formato correcto.");
            }
        } catch (err) {
            alert("Error al leer el archivo JSON.");
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

function clearAllWhoData() {
    if(confirm("⚠️ ¿ESTÁS SEGURO? Se borrarán todos los personajes de Quién Soy.")) {
        whoData = [];
        saveWhoAdminData(true);
        renderWhoAdminTable();
    }
}
