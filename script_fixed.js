// Selección de elementos clave del DOM
const grid = document.getElementById('numberGrid');
const selectedNumbers = new Set();
const selectedNumbersDisplay = document.getElementById('selectedNumbers');
const totalDisplay = document.getElementById('totalDisplay');
const form = document.getElementById('registrationForm');
const registrosList = document.getElementById('registro-list');

// Configuración
const pricePerTicket = 4000;
const timeoutMs = 30 * 60 * 1000; // 30 minutos
const numberStatus = {}; // Estado por número

// Variables globales para búsqueda
let registroSearchBar;
let registroSearchBtn;
let registrosGlobal = [];
let numeroBuscado = '';

// Crear botón del número
function createButton(number) {
  const btn = document.createElement('button');
  btn.textContent = number.toString().padStart(4, '0');
  btn.dataset.number = number;

  const estado = numberStatus[number];

  // Asigna clase y bloqueo según estado
  if (estado === 'confirmed') {
    btn.className = 'number-btn unavailable';
    btn.disabled = true;
  } else if (estado === 'pending') {
    btn.className = 'number-btn pending';
    btn.disabled = true;
  } else {
    btn.className = 'number-btn available';
  }

  // Interacción de usuario solo si está disponible
  btn.addEventListener('click', () => {
    const estadoActual = numberStatus[number];
    if (estadoActual === 'pending' || estadoActual === 'confirmed') return;

    if (selectedNumbers.has(number)) {
      selectedNumbers.delete(number);
      btn.className = 'number-btn available';
    } else {
      selectedNumbers.add(number);
      btn.className = 'number-btn selected';
    }

    renderSelectedNumbers();
    updateTotal();
  });

  return btn;
}

// Renderizar selección
function renderSelectedNumbers() {
  selectedNumbersDisplay.innerHTML = '';
  selectedNumbers.forEach(num => {
    const span = document.createElement('span');
    span.className = 'selected-number';
    span.textContent = num.toString().padStart(4, '0');
    
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.onclick = () => removeSelected(num);
    
    span.appendChild(removeBtn);
    selectedNumbersDisplay.appendChild(span);
  });
}

// Eliminar número seleccionado
function removeSelected(num) {
  selectedNumbers.delete(num);
  const btn = document.querySelector(`button[data-number='${num}']`);
  if (btn) btn.className = 'number-btn available';
  renderSelectedNumbers();
  updateTotal();
}

// Actualizar total y cantidad seleccionada
function updateTotal() {
  totalDisplay.textContent = `Total a pagar: $${selectedNumbers.size * pricePerTicket}`;
  const countDisplay = document.getElementById('selectedCount');
  if (countDisplay) {
    countDisplay.textContent = `Has seleccionado ${selectedNumbers.size} números.`;
  }
}

// Crear temporizador visual
function crearTemporizadorVisual(timestampLimite, onExpire, contenedor) {
  const temporizador = document.createElement('span');
  temporizador.className = 'temporizador';
  contenedor.appendChild(temporizador);

  const interval = setInterval(() => {
    const ahora = Date.now();
    const restante = timestampLimite - ahora;
    
    if (restante <= 0) {
      clearInterval(interval);
      temporizador.textContent = '⏰ Expirado';
      if (typeof onExpire === 'function') onExpire();
      return;
    }
    
    const h = String(Math.floor(restante / 3600000)).padStart(2, '0');
    const m = String(Math.floor((restante % 3600000) / 60000)).padStart(2, '0');
    const s = String(Math.floor((restante % 60000) / 1000)).padStart(2, '0');
    temporizador.textContent = `⏳ ${h}:${m}:${s}`;
  }, 1000);

  return { temporizador, interval };
}

// Función para renderizar registro
function renderRegistro(registro, highlightNum = '') {
  if (!registro || !registro.name) return;

  const item = document.createElement('div');
  item.className = 'registro-item';
  
  const { name, phone, numbers, timestamp, expiraEn, estado } = registro;
  
  let numerosHTML = '';
  if (Array.isArray(numbers)) {
    numerosHTML = numbers.map(n => {
      let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : String(n).padStart(4, '0');
      if (highlightNum && numStr === highlightNum) {
        return `<span style="background:#ffc107;color:#222;padding:2px 6px;border-radius:8px;font-weight:bold;">${numStr}</span>`;
      }
      return numStr;
    }).join(', ');
  }

  item.innerHTML = `
    <strong>${name}</strong>
    <span>📞 ${phone}</span>
    <span>🎟️ Números: ${numerosHTML}</span>
    <span>💰 Total: $${numbers ? numbers.length * pricePerTicket : 0}</span>
    <span class="estado-${estado}">Estado: ${estado === 'confirmed' ? 'Confirmado' : 'Pendiente'}</span>
  `;

  // Agregar temporizador si está pendiente
  if (estado === 'pending' && expiraEn) {
    crearTemporizadorVisual(expiraEn, () => {
      // Expirar el registro
      if (registro.id) {
        eliminarRegistroFirebase(registro.id);
      }
    }, item);
  }

  registrosList.appendChild(item);
}

// Función de búsqueda
function buscarYMostrarRegistros() {
  const query = registroSearchBar.value.trim();
  registrosList.innerHTML = '';
  numeroBuscado = '';

  if (!query || query.length !== 4 || isNaN(query)) {
    // Si no hay búsqueda válida, muestra todos sin resaltar
    registrosGlobal.forEach(registro => renderRegistro(registro, ''));
    return;
  }

  numeroBuscado = query;
  
  // Buscar directamente en Firebase
  if (typeof db !== 'undefined') {
    db.ref('registros').orderByChild('estado').equalTo('confirmed').once('value', snapshot => {
      const data = snapshot.val() || {};
      const registros = Object.values(data);
      
      // Filtrar por número buscado
      const encontrado = registros.find(registro => {
        if (!Array.isArray(registro.numbers)) return false;
        return registro.numbers.some(num => {
          let numStr = String(num).replace(/\s+/g, '').padStart(4, '0');
          return numStr === query;
        });
      });

      if (!encontrado) {
        registrosList.innerHTML = `<div class='registro-item'>No se encontró registro confirmado con el número ${query}</div>`;
      } else {
        renderRegistro(encontrado, query);
      }
    });
  }
}

// Función para cargar registros y eventos
function cargarRegistrosYEventos() {
  if (typeof escucharRegistrosRealtime === 'undefined') {
    console.error('La función escucharRegistrosRealtime no está definida');
    return;
  }

  escucharRegistrosRealtime(registros => {
    registrosGlobal = registros;
    
    // Limpiar estado de botones
    Object.keys(numberStatus).forEach(num => {
      numberStatus[num] = 'available';
      const btn = document.querySelector(`button[data-number='${num}']`);
      if (btn) {
        btn.className = 'number-btn available';
        btn.disabled = false;
      }
    });

    let confirmados = 0;
    let pendientes = 0;

    registros.forEach(registro => {
      if (Array.isArray(registro.numbers)) {
        registro.numbers.forEach(num => {
          numberStatus[num] = registro.estado;
          const btn = document.querySelector(`button[data-number='${num}']`);
          if (btn) {
            if (registro.estado === 'confirmed') {
              btn.className = 'number-btn unavailable';
              btn.disabled = true;
            } else if (registro.estado === 'pending') {
              btn.className = 'number-btn pending';
              btn.disabled = true;
            }
          }
        });
      }

      if (registro.estado === 'confirmed') confirmados++;
      else if (registro.estado === 'pending') pendientes++;
    });

    // Actualizar contadores
    const confirmadosElement = document.getElementById('confirmadosCount');
    const pendientesElement = document.getElementById('pendientesCount');
    if (confirmadosElement) confirmadosElement.textContent = confirmados;
    if (pendientesElement) pendientesElement.textContent = pendientes;

    // Si hay búsqueda activa, no actualizar la lista
    if (registroSearchBar && registroSearchBar.value.trim()) {
      return;
    } else {
      registrosList.innerHTML = '';
      registros.forEach(registro => renderRegistro(registro, ''));
    }
  });

  // Registro de prueba automático para verificar despliegue
  setTimeout(() => {
    if (typeof db !== 'undefined') {
      db.ref('registros').once('value', snapshot => {
        if (!snapshot.exists()) {
          if (typeof guardarRegistroFirebase !== 'undefined') {
            guardarRegistroFirebase({
              name: 'Prueba',
              phone: '123456789',
              numbers: [1, 2, 3],
              timestamp: Date.now(),
              expiraEn: Date.now() + 3600000,
              estado: 'pending'
            });
          }
        }
      });
    }
  }, 1000);
}

// Función de inicialización
function initializeApp() {
  if (typeof firebase === 'undefined' || typeof db === 'undefined') {
    console.error('Firebase no está cargado correctamente');
    const errorDiv = document.createElement('div');
    errorDiv.style.background = '#dc3545';
    errorDiv.style.color = 'white';
    errorDiv.style.padding = '1rem';
    errorDiv.style.textAlign = 'center';
    errorDiv.style.marginBottom = '1rem';
    errorDiv.textContent = 'Error: No se pudo cargar Firebase. Revisa tu configuración y conexión a internet.';
    document.body.insertBefore(errorDiv, document.body.firstChild);
    return;
  }

  // Verificar conexión a Firebase
  db.ref('.info/connected').on('value', function(snapshot) {
    if (snapshot.val() === false) {
      const errorDiv = document.createElement('div');
      errorDiv.style.background = '#dc3545';
      errorDiv.style.color = 'white';
      errorDiv.style.padding = '1rem';
      errorDiv.style.textAlign = 'center';
      errorDiv.style.marginBottom = '1rem';
      errorDiv.textContent = 'Error: No se pudo conectar a Firebase. Revisa tu configuración y conexión a internet.';
      document.body.insertBefore(errorDiv, document.body.firstChild);
    } else {
      console.log('Conectado a Firebase correctamente');
    }
  });

  // Cargar registros y eventos
  cargarRegistrosYEventos();
}

// Registro del formulario
form.addEventListener('submit', (e) => {
  e.preventDefault();

  if (selectedNumbers.size === 0) return alert('Selecciona al menos un número');

  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const numbers = Array.from(selectedNumbers);
  const timestamp = Date.now();
  const expiraEn = timestamp + timeoutMs;

  const registro = {
    name,
    phone,
    numbers,
    timestamp,
    expiraEn,
    estado: 'pending'
  };

  if (typeof guardarRegistroFirebase !== 'undefined') {
    guardarRegistroFirebase(registro);
  } else {
    console.error('La función guardarRegistroFirebase no está definida');
  }

  // Marcar números como pendientes
  numbers.forEach(num => {
    numberStatus[num] = 'pending';
    const btn = document.querySelector(`button[data-number='${num}']`);
    if (btn) btn.className = 'number-btn selected';
  });

  selectedNumbers.clear();
  renderSelectedNumbers();
  updateTotal();
  form.reset();
});

// Crear botones del 0000 al 9999
for (let i = 0; i <= 9999; i++) {
  numberStatus[i] = 'available';
  grid.appendChild(createButton(i));
}

// Buscador de números
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

if (searchInput && clearSearchBtn) {
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase();
    const buttons = grid.querySelectorAll('.number-btn');
    
    buttons.forEach(btn => {
      const number = btn.textContent;
      if (number.includes(query)) {
        btn.style.display = 'block';
      } else {
        btn.style.display = 'none';
      }
    });
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    const buttons = grid.querySelectorAll('.number-btn');
    buttons.forEach(btn => btn.style.display = 'block');
  });
}

// Al cargar: inicializar la aplicación
window.addEventListener('DOMContentLoaded', () => {
  // Inicializar elementos de búsqueda
  registroSearchBar = document.getElementById('registroSearchBar');
  registroSearchBtn = document.getElementById('registroSearchBtn');

  if (registroSearchBar && registroSearchBtn) {
    registroSearchBtn.onclick = buscarYMostrarRegistros;
    registroSearchBar.onkeyup = function(e) {
      if (e.key === 'Enter') buscarYMostrarRegistros();
    };
  }

  // Llamar a la función de inicialización
  if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
    initializeApp();
  } else {
    // Esperar a que Firebase se cargue
    setTimeout(() => {
      if (typeof firebase !== 'undefined' && typeof db !== 'undefined') {
        initializeApp();
      } else {
        console.error('Firebase no se cargó después de esperar');
        const errorDiv = document.createElement('div');
        errorDiv.style.background = '#dc3545';
        errorDiv.style.color = 'white';
        errorDiv.style.padding = '1rem';
        errorDiv.style.textAlign = 'center';
        errorDiv.style.marginBottom = '1rem';
        errorDiv.textContent = 'Error: Firebase no se cargó. Verifica que los scripts estén incluidos correctamente.';
        document.body.insertBefore(errorDiv, document.body.firstChild);
      }
    }, 3000);
  }
});
