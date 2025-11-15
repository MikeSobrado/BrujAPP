// Sistema de perfiles basado en Versión_0.5
const PROFILES_STORAGE_KEY = 'strategyProfiles';
const DEFAULT_PROFILE_NAME = 'Perfil por Defecto';
let currentProfileName = DEFAULT_PROFILE_NAME;
let currentProfileData = {};

// Función para migrar datos viejos a nuevos IDs
function migrateRiskCalculatorData(state) {
    if (!state) return state;
    
    const migrationMap = {
        'take-profit': 'precio-entrada',
        'risk-reward-ratio': 'precio-sl',
        'perdida-maxima': 'precio-salida',
        'porcentaje-cuenta': 'riesgo-maximo'
    };
    
    const migratedState = {};
    Object.keys(state).forEach(inputId => {
        const newId = migrationMap[inputId] || inputId;
        migratedState[newId] = state[inputId];
    });
    
    return migratedState;
}

function createDefaultProfile() {
    // Definir los indicadores por defecto directamente aquí
    const defaultIndicators = {
        "RSI (Sobreventa/Sobrecompra)": { state: null, weight: 10 },
        "RSI (Divergencia)": { state: null, weight: 10 },
        "MACD (Cruces)": { state: null, weight: 10 },
        "MACD (Divergencia)": { state: null, weight: 10 },
        "Soporte/Resistencia": { state: null, weight: 10 },
        "Tendencia (Mayor temporalidad)": { state: null, weight: 10 },
        "Patrones": { state: null, weight: 10 },
        "Media Móvil": { state: null, weight: 10 }
    };
    
    // Valores por defecto de la calculadora
    const defaultRiskCalculator = {
        'capital-total': '1000',
        'apalancamiento': '20',
        'riesgo-maximo': '3',
        'precio-entrada': '100',
        'precio-sl': '95',
        'precio-salida': '110',
        'riesgo-beneficio': '2',
        'comision': '0.06',
        'financiacion': '0',
        'spread': '0'
    };
    
    return {
        panels: [],
        riskCalculator: { ...defaultRiskCalculator },
        indicators: { ...defaultIndicators }
    };
}

function initializeProfiles() {
    let profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    
    // Migrar datos viejos si existen
    let hasChanges = false;
    Object.keys(profiles).forEach(profileName => {
        if (profiles[profileName].riskCalculator) {
            const oldState = profiles[profileName].riskCalculator;
            const newState = migrateRiskCalculatorData(oldState);
            if (JSON.stringify(oldState) !== JSON.stringify(newState)) {
                profiles[profileName].riskCalculator = newState;
                hasChanges = true;
                console.log(`🔄 Migrados datos de calculadora en perfil: ${profileName}`);
            }
        }
    });
    
    if (hasChanges) {
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    }
    
    if (!profiles[DEFAULT_PROFILE_NAME]) {
        profiles[DEFAULT_PROFILE_NAME] = createDefaultProfile();
        localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    }
    
    updateProfileSelector();
    loadProfile(DEFAULT_PROFILE_NAME);
    
    // Asegurarse de que los indicadores por defecto se cargan al inicializar
    setTimeout(() => {
        if (typeof setIndicatorsData === 'function' && window.defaultIndicators) {
            setIndicatorsData(window.defaultIndicators);
        }
    }, 100);
}

function updateProfileSelector() {
    const profileSelect = document.getElementById('profile-select');
    if (!profileSelect) return;
    
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
    
    // Migrar datos de calculadora si es necesario
    if (currentProfileData.riskCalculator) {
        currentProfileData.riskCalculator = migrateRiskCalculatorData(currentProfileData.riskCalculator);
    }
    
    console.log(`📂 Cargando perfil: "${profileName}"`, currentProfileData);
    
    // Cargar configuración del perfil
    if (typeof loadPanelsState === 'function' && currentProfileData.panels) {
        console.log('📊 Cargando panels...');
        loadPanelsState(currentProfileData.panels);
    }
    
    if (typeof loadRiskCalculatorState === 'function' && currentProfileData.riskCalculator) {
        console.log('📈 Cargando calculadora de riesgo...', currentProfileData.riskCalculator);
        loadRiskCalculatorState(currentProfileData.riskCalculator);
    } else if (typeof loadRiskCalculatorState === 'function') {
        console.warn('⚠️ No hay datos de calculadora, usando valores por defecto');
        const defaults = {
            'capital-total': '1000',
            'apalancamiento': '20',
            'riesgo-maximo': '3',
            'precio-entrada': '100',
            'precio-sl': '95',
            'precio-salida': '110',
            'riesgo-beneficio': '2',
            'comision': '0.06',
            'financiacion': '0',
            'spread': '0'
        };
        loadRiskCalculatorState(defaults);
    }
    
    if (typeof setIndicatorsData === 'function' && currentProfileData.indicators) {
        console.log('🎯 Cargando indicadores...');
        setIndicatorsData(currentProfileData.indicators);
    }
    
    console.log(`✅ Perfil "${profileName}" cargado correctamente.`);
}

function saveProfile() {
    if (!currentProfileData) return;
    
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    
    // Obtener estado actual
    currentProfileData.panels = typeof getPanelsState === 'function' ? getPanelsState() : [];
    currentProfileData.riskCalculator = typeof getRiskCalculatorState === 'function' ? getRiskCalculatorState() : {};
    currentProfileData.indicators = typeof getIndicatorsData === 'function' ? getIndicatorsData() : {};
    
    // Asegurar que riskCalculator no esté vacío (usar valores por defecto si es necesario)
    if (!currentProfileData.riskCalculator || Object.keys(currentProfileData.riskCalculator).length === 0) {
        currentProfileData.riskCalculator = {
            'capital-total': '1000',
            'apalancamiento': '20',
            'riesgo-maximo': '3',
            'precio-entrada': '100',
            'precio-sl': '95',
            'precio-salida': '110',
            'riesgo-beneficio': '2',
            'comision': '0.06',
            'financiacion': '0',
            'spread': '0'
        };
    }

    profiles[currentProfileName] = currentProfileData;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    console.log(`✅ Perfil "${currentProfileName}" guardado correctamente.`, currentProfileData);
}

function createNewProfile() {
    console.log('🆕 Creando nuevo perfil...');
    const profileName = prompt('Introduce un nombre para el nuevo perfil:');
    if (!profileName || !profileName.trim()) return;
    
    const trimmedName = profileName.trim();
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    if (profiles[trimmedName]) {
        alert('Ya existe un perfil con ese nombre.');
        return;
    }
    
    console.log(`🔄 Creando perfil: "${trimmedName}"`);
    
    // Guardar perfil actual antes de crear uno nuevo
    saveProfile();
    
    // Resetear todo para el nuevo perfil
    if (typeof resetAllPanels === 'function') {
        console.log('🔄 Reseteando panels...');
        resetAllPanels();
    }
    if (typeof resetIndicators === 'function') {
        console.log('🔄 Reseteando indicadores...');
        resetIndicators();
    }
    if (typeof resetRiskCalculator === 'function') {
        console.log('🔄 Reseteando calculadora de riesgo...');
        resetRiskCalculator();
    }
    
    // Crear nuevo perfil con estado limpio
    profiles[trimmedName] = createDefaultProfile();
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    
    updateProfileSelector();
    loadProfile(trimmedName);
    
    // Asegurarse de que los indicadores por defecto se cargan
    setTimeout(() => {
        if (typeof setIndicatorsData === 'function' && window.defaultIndicators) {
            setIndicatorsData(window.defaultIndicators);
        }
    }, 200);
    
    alert(`✅ Perfil "${trimmedName}" creado correctamente.`);
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
    
    alert('Perfil eliminado correctamente.');
}

function renameCurrentProfile() {
    const newName = prompt('Introduce un nuevo nombre para el perfil:', currentProfileName);
    if (!newName || !newName.trim() || newName === currentProfileName) return;
    
    const trimmedName = newName.trim();
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    if (profiles[trimmedName]) {
        alert('Ya existe un perfil con ese nombre.');
        return;
    }
    
    // Guardar perfil actual
    saveProfile();
    
    profiles[trimmedName] = profiles[currentProfileName];
    delete profiles[currentProfileName];
    currentProfileName = trimmedName;
    localStorage.setItem(PROFILES_STORAGE_KEY, JSON.stringify(profiles));
    
    updateProfileSelector();
    loadProfile(currentProfileName);
    
    alert(`Perfil renombrado a "${trimmedName}".`);
}

function downloadProfiles() {
    const profiles = JSON.parse(localStorage.getItem(PROFILES_STORAGE_KEY) || '{}');
    const dataStr = JSON.stringify(profiles, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'profiles.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Perfiles descargados correctamente.');
}

function uploadProfiles() {
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
}

function setupProfileEvents() {
    console.log('🔧 Configurando eventos de perfiles...');
    const profileSelect = document.getElementById('profile-select');
    const addBtn = document.getElementById('add-profile-btn');
    const renameBtn = document.getElementById('rename-profile-btn');
    const deleteBtn = document.getElementById('delete-profile-btn');
    const saveBtn = document.getElementById('save-profile-btn');
    const loadBtn = document.getElementById('load-profile-btn');
    
    console.log('📍 Elementos encontrados:', {
        profileSelect: !!profileSelect,
        addBtn: !!addBtn,
        renameBtn: !!renameBtn,
        deleteBtn: !!deleteBtn,
        saveBtn: !!saveBtn,
        loadBtn: !!loadBtn
    });
    
    if (profileSelect) {
        profileSelect.addEventListener('change', (event) => {
            saveProfile(); // Guardar perfil actual antes de cambiar
            loadProfile(event.target.value);
        });
    }
    
    if (addBtn) {
        console.log('✅ Configurando evento click para botón Agregar');
        addBtn.addEventListener('click', createNewProfile);
    } else {
        console.error('❌ No se encontró el botón add-profile-btn');
    }
    
    if (renameBtn) {
        renameBtn.addEventListener('click', renameCurrentProfile);
    }
    
    if (deleteBtn) {
        deleteBtn.addEventListener('click', deleteCurrentProfile);
    }
    
    if (saveBtn) {
        saveBtn.addEventListener('click', downloadProfiles);
    }
    
    if (loadBtn) {
        loadBtn.addEventListener('click', uploadProfiles);
    }
}

// Auto-guardar perfil cada 30 segundos
setInterval(() => {
    if (currentProfileName) {
        saveProfile();
    }
}, 30000);

// Exportar funciones para uso global
window.initializeProfiles = initializeProfiles;
window.saveProfile = saveProfile;
window.loadProfile = loadProfile;
window.createNewProfile = createNewProfile;
window.deleteCurrentProfile = deleteCurrentProfile;
window.renameCurrentProfile = renameCurrentProfile;
window.downloadProfiles = downloadProfiles;
window.uploadProfiles = uploadProfiles;
window.setupProfileEvents = setupProfileEvents;