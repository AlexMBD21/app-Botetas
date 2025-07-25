// Tipos para la aplicación de rifas

export interface RegistroRifa {
  id?: string;
  name: string;
  phone: string;
  numbers: number[];
  timestamp: number;
  timeoutEnd: number;
  status: 'pending' | 'verified' | 'expired';
}

export interface ConfiguracionSorteo {
  fechaSorteo: string;
  horaSorteo: string;
  fechaInicioEvento: string;
  horasAntesBloqueo: number;
  tiempoTemporizador: number;
  valorBoleta: number;
  registrosBloqueados?: boolean;
}

export interface EstadoNumero {
  [numero: number]: {
    status: 'available' | 'selected' | 'unavailable' | 'pending' | 'confirmed';
    registroId?: string;
  };
}

export interface ResultadoBusqueda {
  registros: RegistroRifa[];
  numeroEncontrado: boolean;
  mensaje: string;
}
