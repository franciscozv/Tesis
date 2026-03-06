import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { MisResponsabilidadesRepository } from './misResponsabilidadesRepository';

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
  estado_invitacion?: string;
  necesidad?: { id: number; descripcion: string };
  tipo_necesidad?: { id: number; nombre: string };
  cantidad_ofrecida?: number;
  invitado_id?: number;
}

export class MisResponsabilidadesService {
  private repository: MisResponsabilidadesRepository;

  constructor(repository: MisResponsabilidadesRepository = new MisResponsabilidadesRepository()) {
    this.repository = repository;
  }

  async findAll(miembroId: number | null): Promise<ServiceResponse<Responsabilidad[] | null>> {
    try {
      if (!miembroId) {
        return ServiceResponse.failure(
          'Tu usuario no tiene un miembro asociado',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const [invitaciones, colaboraciones] = await Promise.all([
        this.repository.findInvitacionesByMiembroAsync(miembroId),
        this.repository.findColaboracionesByMiembroAsync(miembroId),
      ]);

      const responsabilidades: Responsabilidad[] = [];

      // Mapear invitaciones
      for (const inv of invitaciones ?? []) {
        const act = inv.actividad as any;
        responsabilidades.push({
          id: inv.id,
          tipo: 'invitacion',
          actividad: {
            id: act.id,
            nombre: act.nombre,
            fecha: act.fecha,
            hora_inicio: act.hora_inicio,
            hora_fin: act.hora_fin,
            estado: act.estado,
          },
          grupo: act.grupo
            ? { id: act.grupo.id_grupo, nombre: act.grupo.nombre }
            : null,
          tipo_actividad: {
            id: act.tipo_actividad.id_tipo,
            nombre: act.tipo_actividad.nombre,
          },
          rol: inv.responsabilidad_actividad
            ? { id: (inv.responsabilidad_actividad as any).id_responsabilidad, nombre: (inv.responsabilidad_actividad as any).nombre }
            : undefined,
          estado_invitacion: inv.estado,
          invitado_id: inv.id,
        });
      }

      // Mapear colaboraciones
      for (const col of colaboraciones ?? []) {
        const nec = col.necesidad_logistica as any;
        const act = nec.actividad;
        responsabilidades.push({
          id: col.id,
          tipo: 'colaboracion',
          actividad: {
            id: act.id,
            nombre: act.nombre,
            fecha: act.fecha,
            hora_inicio: act.hora_inicio,
            hora_fin: act.hora_fin,
            estado: act.estado,
          },
          grupo: act.grupo
            ? { id: act.grupo.id_grupo, nombre: act.grupo.nombre }
            : null,
          tipo_actividad: {
            id: act.tipo_actividad.id_tipo,
            nombre: act.tipo_actividad.nombre,
          },
          necesidad: { id: nec.id, descripcion: nec.descripcion },
          tipo_necesidad: nec.tipo_necesidad_logistica
            ? {
                id: nec.tipo_necesidad_logistica.id_tipo,
                nombre: nec.tipo_necesidad_logistica.nombre,
              }
            : undefined,
          cantidad_ofrecida: col.cantidad_ofrecida,
        });
      }

      // Ordenar cronologicamente por fecha de actividad
      responsabilidades.sort((a, b) => a.actividad.fecha.localeCompare(b.actividad.fecha));

      return ServiceResponse.success<Responsabilidad[]>(
        'Responsabilidades encontradas',
        responsabilidades,
      );
    } catch (error) {
      const errorMessage = `Error al obtener responsabilidades: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener responsabilidades',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

export const misResponsabilidadesService = new MisResponsabilidadesService();

