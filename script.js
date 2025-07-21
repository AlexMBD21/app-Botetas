// Selección de elementos clave del DOM
const grid = document.getElementById('numberGrid');
const selectedNumbers = new Set();
const selectedNumbersDisplay = document.getElementById('selectedNumbers');
const totalDisplay = document.getElementById('totalDisplay');
const form = document.getElementById('registrationForm');
const registrosList = document.getElementById('registro-list');

// Configuración
const pricePerTicket = 2000;
const timeoutMs = 60 * 60 * 1000; // 1 hora
const numberStatus = {}; // Estado por número

// Crear botón del número
function createButton(number) {
  const btn = document.createElement('button');
  btn.textContent = number.toString().padStart(4, '0');
  btn.className = 'number-btn available';
  btn.dataset.number = number;

  btn.addEventListener('click', () => {
    const estado = numberStatus[number];
    if (estado === 'confirmed') return;

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

  renderRegistro(registro);
// Al cargar: leer registros de Firebase y renderizarlos
window.addEventListener('DOMContentLoaded', () => {
  obtenerRegistrosFirebase(renderRegistro);
  // O si quieres en tiempo real:
  // escucharRegistrosRealtime(registros => {
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

  const item = document.createElement('div');
  item.className = 'registro-item';
  item.dataset.timestamp = timestamp;
  item.innerHTML = `
    <strong>${name}</strong>
    <span>📞 ${phone}</span>
    <span>🎟️ Números: ${numbers.map(n => n.toString().padStart(4, '0')).join(', ')}</span>
    <span>💰 Total: $${numbers.length * pricePerTicket}</span>
  `;

  const confirmarBtn = document.createElement('button');
  confirmarBtn.className = 'btn-verificar';
  confirmarBtn.textContent = 'Confirmar Pago';

        let temporizadorControl = null;

  confirmarBtn.addEventListener('click', () => {
    numbers.forEach(num => {
      const btn = document.querySelector(`button[data-number='${num}']`);
      if (btn) btn.className = 'number-btn unavailable';
      numberStatus[num] = 'confirmed';
    });

    // Actualiza el estado del registro en Firebase a 'confirmed'
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
      // Elimina el registro de Firebase al eliminar manualmente
      if (registro.id) {
          eliminarRegistroFirebase(registro.id);
      }
    });

    item.appendChild(eliminarBtn);
  });

  item.appendChild(confirmarBtn);

  temporizadorControl = crearTemporizadorVisual(expiraEn, () => {
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
    // Elimina el registro de Firebase si expiró
    if (registro.id) {
        eliminarRegistroFirebase(registro.id);
    }
  }, item);

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
  buttons.forEach(btn => {
    const text = btn.textContent;
    btn.style.display = text.includes(query) ? 'inline-block' : 'none';
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
  escucharRegistrosRealtime(registros => {
    registrosList.innerHTML = '';
    // Primero, liberar todos los números
    Object.keys(numberStatus).forEach(num => {
      numberStatus[num] = 'available';
      const btn = document.querySelector(`button[data-number='${num}']`);
      if (btn) btn.className = 'number-btn available';
    });

    // Marcar ocupados y renderizar registros
    registros.forEach(registro => {
      if (Array.isArray(registro.numbers)) {
        registro.numbers.forEach(num => {
          numberStatus[num] = registro.estado === 'confirmed' ? 'confirmed' : 'pending';
          const btn = document.querySelector(`button[data-number='${num}']`);
          if (btn) {
            btn.className = registro.estado === 'confirmed' ? 'number-btn unavailable' : 'number-btn selected';
          }
        });
      }
      renderRegistro(registro);
    });
  });
});