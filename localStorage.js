// ========== FUNCIONES DE LOCALSTORAGE ========== 

// Guardar un registro en localStorage
function guardarRegistroLocal(registro) {
  const registros = JSON.parse(localStorage.getItem('registros')) || [];
  registros.push(registro);
  localStorage.setItem('registros', JSON.stringify(registros));
}

// Obtener todos los registros del localStorage
function obtenerRegistrosLocal() {
  return JSON.parse(localStorage.getItem('registros')) || [];
}

// Eliminar un registro del localStorage por timestamp (ID único)
function eliminarRegistroLocal(timestamp) {
  let registros = obtenerRegistrosLocal();
  registros = registros.filter(reg => reg.timestamp !== timestamp);
  localStorage.setItem('registros', JSON.stringify(registros));
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
