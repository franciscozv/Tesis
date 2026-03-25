export interface CalendarioEvento {
  id: number;
  nombre: string;
  tipo_actividad: {
    id: number;
    nombre: string;
  };
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  lugar: string | null;
  estado: 'programada' | 'cancelada';
  grupo_organizador: {
    id: number;
    nombre: string;
  } | null;
}
