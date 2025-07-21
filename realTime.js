
// ========== FUNCIONES DE FIREBASE ==========

// Guardar un registro en Firebase
function guardarRegistroFirebase(registro) {
  const newRef = db.ref('registros').push();
  registro.id = newRef.key;
  newRef.set(registro);
}

// Obtener todos los registros de Firebase
function obtenerRegistrosFirebase(callback) {
  db.ref('registros').once('value', snapshot => {
    const data = snapshot.val() || {};
    const registros = Object.values(data);
    if (typeof callback === 'function') {
      registros.forEach(callback);
    }
  });
}

// Eliminar un registro de Firebase por id
function eliminarRegistroFirebase(id) {
  db.ref('registros/' + id).remove();
}


function escucharRegistrosRealtime(callback) {
  db.ref('registros').on('value', snapshot => {
    const data = snapshot.val() || {};
    const registros = Object.values(data);
    if (typeof callback === 'function') {
      callback(registros);
    }
  });
}


// Cargar registros guardados en el DOM al iniciar (llamado desde script.js)
function cargarRegistrosAlIniciar(callback) {
  const registros = obtenerRegistrosLocal();
  if (typeof callback === 'function') {
    registros.forEach(callback);
  }
}

// Asegurarse de restaurar el estado de los botones y lista de registros al recargar
function restaurarEstado(grid, registrosList, crearElementoCallback) {
  const registros = obtenerRegistrosLocal();
  registros.forEach(registro => {
    if (Array.isArray(registro.numbers)) {
      registro.numbers.forEach(num => {
        const btn = grid.querySelector(`button[data-number='${num}']`);
        if (btn) {
          btn.className = 'number-btn selected';
        }
      });
    }
    if (typeof crearElementoCallback === 'function') {
      crearElementoCallback(registro);
    } else if (registrosList) {
      const item = document.createElement('li');
      item.textContent = `${registro.name} - ${registro.phone} - ${registro.numbers.map(n => n.toString().padStart(4, '0')).join(', ')}`;
      registrosList.appendChild(item);
    }
  });
}

// Esta función debe llamarse desde script.js después de cargar el DOM:
// restaurarEstado(document.getElementById('numberGrid'), document.getElementById('registro-list'));
