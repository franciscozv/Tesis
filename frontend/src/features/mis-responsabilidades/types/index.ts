export interface Responsabilidad {
  id: number;
  tipo: 'invitacion' | 'colaboracion';
  actividad: {
    id: number;
    nombre: string;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: string;
  };
  grupo: { id: number; nombre: string } | null;
  tipo_actividad: { id: number; nombre: string };
  rol?: { id: number; nombre: string };
  estado_invitacion?: 'pendiente' | 'confirmado';
  necesidad?: { id: number; descripcion: string };
  tipo_necesidad?: { id: number; nombre: string };
  cantidad_ofrecida?: number;
  invitado_id?: number;
}

