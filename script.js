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
    const div = document.createElement('div');
    div.className = 'selected-number';
    div.innerHTML = `${num.toString().padStart(4, '0')} <button onclick="removeSelected(${num})">x</button>`;
    selectedNumbersDisplay.appendChild(div);
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
    countDisplay.textContent = `Has seleccionado ${selectedNumbers.size} número${selectedNumbers.size !== 1 ? 's' : ''}.`;
  }
}

// Crear temporizador visual
function crearTemporizadorVisual(timestampLimite, onExpire, contenedor) {
  const temporizador = document.createElement('span');
  temporizador.className = 'temporizador';
  contenedor.appendChild(temporizador);

  const interval = setInterval(() => {
    const restante = timestampLimite - Date.now();
    if (restante <= 0) {
      clearInterval(interval);
      temporizador.textContent = '⏳ Expirado';
      onExpire();
    } else {
      const h = String(Math.floor(restante / 3600000)).padStart(2, '0');
      const m = String(Math.floor((restante % 3600000) / 60000)).padStart(2, '0');
      const s = String(Math.floor((restante % 60000) / 1000)).padStart(2, '0');
      temporizador.textContent = `⏳ ${h}:${m}:${s}`;
    }
  }, 1000);

  return { temporizador, interval };
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
 
  guardarRegistroFirebase(registro);
// Al cargar: leer registros de Firebase y renderizarlos
window.addEventListener('DOMContentLoaded', () => {
  // Verificar conexión a Firebase y mostrar mensaje si falla
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
    }
  });
  // Usar barra de búsqueda fija en el HTML
  let registroSearchBar = document.getElementById('registroSearchBar');
  let registroSearchBtn = document.getElementById('registroSearchBtn');
  let registrosGlobal = [];
let numeroBuscado = '';
  function buscarYMostrarRegistros() {
    const query = registroSearchBar.value.trim();
    registrosList.innerHTML = '';
    numeroBuscado = '';
    // Modal elementos
    const registroModal = document.getElementById('registroModal');
    const modalRegistro = document.getElementById('modalRegistro');
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (!query || query.length !== 4 || isNaN(query)) {
      // Si no hay búsqueda válida, muestra todos sin resaltar
      if (registroModal) registroModal.style.display = 'none';
      registrosGlobal.forEach(registro => renderRegistro(registro, ''));
      return;
    }
    numeroBuscado = query;
    // Buscar directamente en Firebase
    db.ref('registros').orderByChild('estado').equalTo('confirmed').once('value', snapshot => {
      const data = snapshot.val() || {};
      const registros = Object.values(data);
      // Filtrar por número buscado y mostrar solo el primero
      const encontrado = registros.find(registro => {
        if (!Array.isArray(registro.numbers)) return false;
        return registro.numbers.some(num => {
          let numStr = String(num).replace(/\s+/g, '').padStart(4, '0');
          return numStr === query;
        });
      });
      // Mostrar en modal
      if (registroModal && modalRegistro) {
        modalRegistro.innerHTML = '';
        if (!encontrado) {
          modalRegistro.innerHTML = `<div class='registro-item'>No se encontró registro confirmado con el número ${query}</div>`;
        } else {
          // Renderizar registro usando la función original pero en el modal
          const item = document.createElement('div');
          // Copia la lógica de renderRegistro pero no lo agrega a registrosList
          const { name, phone, numbers, timestamp, expiraEn } = encontrado;
          let highlightNum = numeroBuscado;
          const numerosHTML = numbers.map(n => {
            let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : n;
            numStr = numStr.padStart(4, '0');
            if (highlightNum && numStr === highlightNum) {
              return `<span style=\"background:#ffc107;color:#222;padding:2px 6px;border-radius:8px;font-weight:bold;\">${numStr}</span>`;
            }
            return numStr;
          }).join(', ');
          item.innerHTML = `
            <strong>${name}</strong>
            <span>📞 ${phone}</span>
            <span>🎟️ Números: ${numerosHTML}</span>
            <span>💰 Total: $${numbers.length * pricePerTicket}</span>
          `;
          modalRegistro.appendChild(item);
        }
        setTimeout(() => {
          registroModal.style.display = 'flex';
        }, 10);
        if (closeModalBtn) {
          closeModalBtn.onclick = () => {
            registroModal.style.display = 'none';
          };
        }
      }
    });
  }
  if (registroSearchBar && registroSearchBtn) {
    registroSearchBtn.onclick = buscarYMostrarRegistros;
    registroSearchBar.onkeyup = function(e) {
      if (e.key === 'Enter') buscarYMostrarRegistros();
    };
  }

  // Renderizado en tiempo real y búsqueda funcional
  escucharRegistrosRealtime(registros => {
    registrosGlobal = registros;
    // Si hay búsqueda activa, NO actualizar la lista ni llamar buscarYMostrarRegistros
    if (registroSearchBar && registroSearchBar.value.trim()) {
      // Solo actualiza la memoria, no toca el DOM
      return;
    } else {
      registrosList.innerHTML = '';
      registros.forEach(registro => renderRegistro(registro, ''));
    }
  });
  // Registro de prueba automático para verificar despliegue
  setTimeout(() => {
    db.ref('registros').once('value', snapshot => {
      if (!snapshot.exists()) {
        guardarRegistroFirebase({
          name: 'Prueba',
          phone: '123456789',
          numbers: [1, 2, 3],
          timestamp: Date.now(),
          expiraEn: Date.now() + 3600000,
          estado: 'pending'
        });
      }
    });
  }, 1000);
  //   registrosList.innerHTML = '';
  //   registros.forEach(renderRegistro);
  // });
});


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

function renderRegistro(registro) {
  const { name, phone, numbers, timestamp, expiraEn } = registro;
  let highlightNum = '';
  if (arguments.length > 1 && typeof arguments[1] === 'string') {
    highlightNum = arguments[1];
  }
  const item = document.createElement('div');
  item.className = 'registro-item';
  item.dataset.timestamp = timestamp;
  item.style.position = 'relative';
  const numerosHTML = numbers.map(n => {
    let numStr = typeof n === 'number' ? n.toString().padStart(4, '0') : n;
    numStr = numStr.padStart(4, '0');
    if (highlightNum && numStr === highlightNum) {
      return `<span style=\"background:#ffc107;color:#222;padding:2px 6px;border-radius:8px;font-weight:bold;\">${numStr}</span>`;
    }
    return numStr;
  }).join(', ');
  item.innerHTML = `
    <strong>${name}</strong>
    <span>📞 ${phone}</span>
    <span>🎟️ Números: ${numerosHTML}</span>
    <span>💰 Total: $${numbers.length * pricePerTicket}</span>
  `;

  // Botón eliminar en la esquina superior derecha (icono 'X' en rojo)
  const eliminarBtnTop = document.createElement('button');
  eliminarBtnTop.textContent = '✖';
  eliminarBtnTop.title = 'Eliminar registro';
  eliminarBtnTop.style.position = 'absolute';
  eliminarBtnTop.style.top = '8px';
  eliminarBtnTop.style.right = '8px';
  eliminarBtnTop.style.background = '#dc3545';
  eliminarBtnTop.style.color = 'white';
  eliminarBtnTop.style.border = 'none';
  eliminarBtnTop.style.borderRadius = '50%';
  eliminarBtnTop.style.width = '32px';
  eliminarBtnTop.style.height = '32px';
  eliminarBtnTop.style.cursor = 'pointer';
  eliminarBtnTop.style.fontSize = '1.2em';
  eliminarBtnTop.style.zIndex = '2';
  eliminarBtnTop.addEventListener('click', function(e) {
    e.stopPropagation();
    const confirmar = confirm('¿Seguro que deseas eliminar este registro?');
    if (!confirmar) return;
    if (registro.id) {
      eliminarRegistroFirebase(registro.id);
    }
    if (item.parentNode) item.parentNode.removeChild(item);
  });
  item.appendChild(eliminarBtnTop);

  // Botón confirmar pago y temporizador
  if (registro.estado !== 'confirmed') {
    const confirmarBtn = document.createElement('button');
    confirmarBtn.textContent = 'Confirmar Pago';
    confirmarBtn.className = 'btn-verificar';
    confirmarBtn.style.backgroundColor = '#ffc107';
    confirmarBtn.style.color = 'black';
    confirmarBtn.addEventListener('click', () => {
      numbers.forEach(num => {
        const btn = document.querySelector(`button[data-number='${num}']`);
        if (btn) btn.className = 'number-btn unavailable';
        numberStatus[num] = 'confirmed';
      });
      if (registro.id) {
        db.ref('registros/' + registro.id).update({ estado: 'confirmed' });
      }
      confirmarBtn.remove();
      if (temporizadorControl) {
        clearInterval(temporizadorControl.interval);
        temporizadorControl.temporizador.textContent = '✅ Pago confirmado';
      }
      const eliminarBtn = document.createElement('button');
      eliminarBtn.textContent = '🗑️ Eliminar Registro';
      eliminarBtn.className = 'btn-verificar';
      eliminarBtn.style.backgroundColor = '#dc3545';
      eliminarBtn.style.color = 'white';
      eliminarBtn.addEventListener('click', () => {
        const confirmar = confirm("¿Estás seguro de eliminar este registro? Esta acción liberará los números.");
        if (!confirmar) return;
        numbers.forEach(num => {
          numberStatus[num] = 'available';
          const btn = document.querySelector(`button[data-number='${num}']`);
          if (btn) btn.className = 'number-btn available';
        });
        registrosList.removeChild(item);
        if (registro.id) {
          eliminarRegistroFirebase(registro.id);
        }
      });
      item.appendChild(eliminarBtn);
    });
    item.appendChild(confirmarBtn);
    var temporizadorControl = crearTemporizadorVisual(expiraEn, () => {
      let expirado = false;
      numbers.forEach(num => {
        if (numberStatus[num] === 'pending') {
          numberStatus[num] = 'available';
          const btn = document.querySelector(`button[data-number='${num}']`);
          if (btn) btn.className = 'number-btn available';
          expirado = true;
        }
      });
      if (expirado) registrosList.removeChild(item);
      if (registro.id) {
        eliminarRegistroFirebase(registro.id);
      }
    }, item);
  }
  registrosList.appendChild(item);
}


// Crear botones del 0000 al 9999
for (let i = 0; i <= 9999; i++) {
  numberStatus[i] = 'available';
  grid.appendChild(createButton(i));
}

// Buscador de números
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');

searchInput.addEventListener('input', () => {
  const query = searchInput.value.trim();
  const buttons = document.querySelectorAll('.number-btn');
  if (!query) {
    buttons.forEach(btn => {
      btn.style.display = 'inline-block';
    });
    return;
  }
  buttons.forEach(btn => {
    // Buscar por coincidencia exacta o parcial en el número
    const num = btn.textContent.replace(/^0+/, ''); // Elimina ceros a la izquierda
    btn.style.display = (btn.textContent.includes(query) || num.includes(query)) ? 'inline-block' : 'none';
  });
});

clearSearchBtn.addEventListener('click', () => {
  searchInput.value = '';
  document.querySelectorAll('.number-btn').forEach(btn => {
    btn.style.display = 'inline-block';
  });
});

// Al cargar: leer registros de localStorage y renderizarlos
window.addEventListener('DOMContentLoaded', () => {
  const loadingSpinner = document.getElementById('loadingSpinner');
  if (loadingSpinner) loadingSpinner.style.display = 'block';

  
escucharRegistrosRealtime(registros => {
  registrosList.innerHTML = '';
  // Primero, liberar todos los números
  Object.keys(numberStatus).forEach(num => {
    numberStatus[num] = 'available';
    const btn = document.querySelector(`button[data-number='${num}']`);
    if (btn) btn.className = 'number-btn available';
  });

  // Aquí es donde debes reemplazar la lógica de marcado de números con el código que te pasé:
  if (Array.isArray(registros)) {
     let confirmados = 0;
  let pendientes = 0;

  if (Array.isArray(registros)) {
    registros.forEach(registro => {
      if (Array.isArray(registro.numbers)) {
        registro.numbers.forEach(num => {
          numberStatus[num] = registro.estado === 'confirmed' ? 'confirmed' : 'pending';
          const btn = document.querySelector(`button[data-number='${num}']`);
          if (btn) {
            if (registro.estado === 'confirmed') {
              btn.className = 'number-btn unavailable';
              btn.disabled = true;
            } else {
              btn.className = 'number-btn pending';
              btn.disabled = true;
            }
          }
        });
      }

      if (registro.estado === 'confirmed') confirmados++;
      else if (registro.estado === 'pending') pendientes++;

      renderRegistro(registro);
    });
  }

  // Actualizar el conteo visual
  document.getElementById('confirmadosCount').textContent = confirmados;
  document.getElementById('pendientesCount').textContent = pendientes;

  }

  if (loadingSpinner) loadingSpinner.style.display = 'none';
});



});

