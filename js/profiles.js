// --- FUNCIONES GLOBALES DE GESTIÓN DE PERFILES Y ESTRATEGIAS ---

// Declaramos las variables en el ámbito global para que las funciones puedan acceder a ellas.
let buySignal, waitSignal, sellSignal, greenThresholdInput, redThresholdInput, indicatorList;
let profileSelect, newProfileBtn, deleteProfileBtn, renameProfileBtn, addIndicatorBtn;
let downloadProfilesBtn, uploadProfilesBtn;

const PROFILES_STORAGE_KEY = 'strategyProfiles';
const DEFAULT_PROFILE_NAME = 'Perfil por Defecto';
let currentProfileName = DEFAULT_PROFILE_NAME;
let currentProfileData = {};

const defaultIndicators = {
    "RSI (Sobreventa/Sobrecompra)": { state: null, weight: 10 },
    "RSI (Divergencia)": { state: null, weight: 10 },
    "MACD (Cruces)": { state: null, weight: 10 },
    "MACD (Divergencia)": { state: null, weight: 10 },
    "Soporte/Resistencia": { state: null, weight: 10 },
    "Tendencia (Mayor temporalidad)": { state: null, weight: 10 },
    "Patrones": { state: null, weight: 10 }
};

function initializeProfiles() {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    
    if (!profiles[DEFAULT_PROFILE_NAME]) {
        profiles[DEFAULT_PROFILE_NAME] = createDefaultProfile();
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    }
    
    updateProfileSelector();
    loadProfile(DEFAULT_PROFILE_NAME);
}

function createDefaultProfile() {
    return {
        indicators: { ...defaultIndicators },
        thresholds: { green: 40, red: 40 },
    };
}

function updateProfileSelector() {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    profileSelect.innerHTML = '';
    
    Object.keys(profiles).forEach(profileName => {
        const option = document.createElement('option');
        option.value = profileName;
        option.textContent = profileName;
        if (profileName === currentProfileName) {
            option.selected = true;
        }
        profileSelect.appendChild(option);
    });
}

function loadProfile(profileName) {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    
    if (!profiles[profileName]) {
        console.error(`El perfil "${profileName}" no existe.`);
        return;
    }
    
    currentProfileName = profileName;
    currentProfileData = JSON.parse(JSON.stringify(profiles[profileName]));
    
    greenThresholdInput.value = currentProfileData.thresholds.green;
    redThresholdInput.value = currentProfileData.thresholds.red;
    
    renderIndicators();
    updateDecision();
    
    console.log(`Perfil "${profileName}" cargado correctamente.`);
}

function saveProfile() {
    if (!currentProfileData || !currentProfileData.indicators) return;
    
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    
    currentProfileData.thresholds = {
        green: parseInt(greenThresholdInput.value) || 40,
        red: parseInt(redThresholdInput.value) || 40
    };

    const indicatorItems = document.querySelectorAll('.indicator-item');
    indicatorItems.forEach(item => {
        const indicatorName = item.dataset.indicatorName;
        const greenButton = item.querySelector('.btn-green');
        const redButton = item.querySelector('.btn-red');
        const weightInput = item.querySelector('.weight-input');

        if (currentProfileData.indicators[indicatorName]) {
            if (greenButton.classList.contains('active')) {
                currentProfileData.indicators[indicatorName].state = 'green';
            } else if (redButton.classList.contains('active')) {
                currentProfileData.indicators[indicatorName].state = 'red';
            } else {
                currentProfileData.indicators[indicatorName].state = null;
            }
            currentProfileData.indicators[indicatorName].weight = parseInt(weightInput.value) || 10;
        }
    });

    profiles[currentProfileName] = currentProfileData;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    console.log(`Perfil "${currentProfileName}" guardado correctamente.`);
}

function renderIndicators() {
    indicatorList.innerHTML = '';

    if (!currentProfileData || !currentProfileData.indicators) {
        indicatorList.innerHTML = '<p style="text-align:center; color:var(--text-dim);">No hay indicadores en este perfil.</p>';
        return;
    }

    Object.keys(currentProfileData.indicators).forEach(name => {
        const indicator = currentProfileData.indicators[name];
        const li = document.createElement('li');
        li.className = 'indicator-item';
        li.dataset.indicatorName = name;

        li.innerHTML = `
            <button class="indicator-button btn-green" data-state="green"></button>
            <input type="number" class="weight-input" value="${indicator.weight}" min="0" max="99">
            <svg class="trash-icon-btn" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" title="Eliminar indicador">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
            </svg>
            <span class="label-text">${name}</span>
            <button class="indicator-button btn-red" data-state="red"></button>
        `;

        if (indicator.state === 'green') {
            li.querySelector('.btn-green').classList.add('active');
        } else if (indicator.state === 'red') {
            li.querySelector('.btn-red').classList.add('active');
        }
        
        indicatorList.appendChild(li);
    });
}

function addNewIndicator() {
    const name = prompt('Introduce el nombre del nuevo indicador:');
    if (!name || !name.trim()) return;

    const trimmedName = name.trim();
    if (currentProfileData.indicators.hasOwnProperty(trimmedName)) {
        alert('Ya existe un indicador con ese nombre.');
        return;
    }

    currentProfileData.indicators[trimmedName] = { state: null, weight: 10 };
    saveProfile();
    renderIndicators();
    updateDecision();
    console.log(`Indicador "${trimmedName}" añadido.`);
}

function deleteIndicator(indicatorName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar el indicador "${indicatorName}"?`)) {
        return;
    }
    delete currentProfileData.indicators[indicatorName];
    saveProfile();
    renderIndicators();
    updateDecision();
    console.log(`Indicador "${indicatorName}" eliminado.`);
}

function createNewProfile() {
    const profileName = prompt('Introduce un nombre para el nuevo perfil:');
    if (!profileName || !profileName.trim()) return;
    
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    if (profiles[profileName]) {
        alert('Ya existe un perfil con ese nombre.');
        return;
    }
    
    saveProfile();
    profiles[profileName] = createDefaultProfile();
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    
    updateProfileSelector();
    loadProfile(profileName);
}

function deleteCurrentProfile() {
    if (currentProfileName === DEFAULT_PROFILE_NAME) {
        alert('No se puede eliminar el perfil por defecto.');
        return;
    }
    if (!confirm(`¿Estás seguro de que quieres eliminar el perfil "${currentProfileName}"?`)) return;
    
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    delete profiles[currentProfileName];
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    
    currentProfileName = DEFAULT_PROFILE_NAME;
    updateProfileSelector();
    loadProfile(currentProfileName);
}

function renameCurrentProfile() {
    const newName = prompt('Introduce un nuevo nombre para el perfil:', currentProfileName);
    if (!newName || !newName.trim() || newName === currentProfileName) return;
    
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    if (profiles[newName]) {
        alert('Ya existe un perfil con ese nombre.');
        return;
    }
    
    profiles[newName] = profiles[currentProfileName];
    delete profiles[currentProfileName];
    currentProfileName = newName;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    
    updateProfileSelector();
    loadProfile(currentProfileName);
}

function updateDecision() {
    if (!currentProfileData || !currentProfileData.indicators) {
        buySignal.classList.remove('active');
        sellSignal.classList.remove('active');
        waitSignal.classList.add('active');
        return;
    }

    let greenScore = 0;
    let redScore = 0;

    Object.keys(currentProfileData.indicators).forEach(name => {
        const indicator = currentProfileData.indicators[name];
        if (indicator.state === 'green') {
            greenScore += indicator.weight;
        } else if (indicator.state === 'red') {
            redScore += indicator.weight;
        }
    });

    const greenThreshold = parseInt(greenThresholdInput.value) || 40;
    const redThreshold = parseInt(redThresholdInput.value) || 40;

    buySignal.classList.remove('active');
    sellSignal.classList.remove('active');
    waitSignal.classList.remove('active');

    if (greenScore >= greenThreshold && greenScore > redScore) {
        buySignal.classList.add('active');
    } else if (redScore >= redThreshold && redScore > greenScore) {
        sellSignal.classList.add('active');
    } else {
        waitSignal.classList.add('active');
    }
}


// --- INICIALIZACIÓN DEL MÓDULO DE PERFILES ---
// Este bloque se ejecuta solo cuando el DOM está listo.
document.addEventListener('DOMContentLoaded', () => {
    // Ahora que el DOM está listo, podemos obtener los elementos de forma segura.
    buySignal = document.getElementById('buy-signal');
    waitSignal = document.getElementById('wait-signal');
    sellSignal = document.getElementById('sell-signal');
    greenThresholdInput = document.getElementById('green-threshold');
    redThresholdInput = document.getElementById('red-threshold');
    indicatorList = document.getElementById('indicator-list');

    profileSelect = document.getElementById('profile-select');
    newProfileBtn = document.getElementById('new-profile-btn');
    deleteProfileBtn = document.getElementById('delete-profile-btn');
    renameProfileBtn = document.getElementById('rename-profile-btn');
    addIndicatorBtn = document.getElementById('add-indicator-btn');
    downloadProfilesBtn = document.getElementById('download-profiles-btn');
    uploadProfilesBtn = document.getElementById('upload-profiles-btn');

    // --- EVENT LISTENERS ---
    indicatorList.addEventListener('click', (event) => {
        const target = event.target;
        
        if (target.classList.contains('indicator-button')) {
            const indicatorItem = target.closest('.indicator-item');
            const indicatorName = indicatorItem.dataset.indicatorName;
            const state = target.dataset.state;
            const otherButton = indicatorItem.querySelector(`.btn-${state === 'green' ? 'red' : 'green'}`);
            
            if (target.classList.contains('active')) {
                target.classList.remove('active');
                currentProfileData.indicators[indicatorName].state = null;
            } else {
                target.classList.add('active');
                otherButton.classList.remove('active');
                currentProfileData.indicators[indicatorName].state = state;
            }
            
            saveProfile();
            updateDecision();
        } else if (target.classList.contains('trash-icon-btn')) {
            const indicatorItem = target.closest('.indicator-item');
            const indicatorName = indicatorItem.dataset.indicatorName;
            deleteIndicator(indicatorName);
        }
    });

    indicatorList.addEventListener('input', (event) => {
        if (event.target.classList.contains('weight-input')) {
            const indicatorItem = event.target.closest('.indicator-item');
            const indicatorName = indicatorItem.dataset.indicatorName;
            const weight = parseInt(event.target.value) || 10;
            
            currentProfileData.indicators[indicatorName].weight = weight;
            saveProfile();
            updateDecision();
        }
    });

    greenThresholdInput.addEventListener('input', () => {
        saveProfile();
        updateDecision();
    });

    redThresholdInput.addEventListener('input', () => {
        saveProfile();
        updateDecision();
    });

    profileSelect.addEventListener('change', (event) => {
        saveProfile();
        loadProfile(event.target.value);
    });

    newProfileBtn.addEventListener('click', createNewProfile);
    deleteProfileBtn.addEventListener('click', deleteCurrentProfile);
    renameProfileBtn.addEventListener('click', renameCurrentProfile);
    addIndicatorBtn.addEventListener('click', addNewIndicator);

    // --- LÓGICA DE DESCARGA Y CARGA DE PERFILES ---
    downloadProfilesBtn.addEventListener('click', () => {
        const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
        const dataStr = JSON.stringify(profiles, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = 'brujapp-profiles.json';
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    });

    uploadProfilesBtn.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const profiles = JSON.parse(e.target.result);
                    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
                    updateProfileSelector();
                    loadProfile(currentProfileName);
                    alert('Perfiles cargados correctamente.');
                } catch (error) {
                    alert('Error al cargar los perfiles. Asegúrate de que el archivo es válido.');
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    });
});
