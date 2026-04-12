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

function saveAdminData() {
    try {
        localStorage.setItem('biblia_questions', JSON.stringify(gameData));
        alert("Preguntas guardadas.");
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
                saveAdminData();
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
        saveAdminData();
        renderAdminTable();
        document.getElementById('theme-name').value = '';
        alert("Preguntas borradas.");
    }
}

// --- SISTEMA DE TEMAS ---
let currentThemeName = '';

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
    renderThemesList();
    
    const totalQ = gameData.length;
    const levels = [...new Set(gameData.map(q => q.nivel))].sort((a,b) => a-b);
    alert(`✅ Tema "${name}" guardado (${totalQ} preguntas, niveles: ${levels.join(', ')})`);
}

function loadTheme(name) {
    const themes = getThemes();
    if (!themes[name]) return alert("Tema no encontrado.");
    
    gameData = JSON.parse(JSON.stringify(themes[name]));
    saveAdminData();
    renderAdminTable();
    currentThemeName = name;
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
