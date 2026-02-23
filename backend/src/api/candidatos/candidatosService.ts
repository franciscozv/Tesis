import dayjs from 'dayjs';
import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { Candidato } from './candidatosModel';
import { CandidatosRepository } from './candidatosRepository';

const TOP_CANDIDATOS = 20;

/**
 * Servicio con lógica de negocio para sugerencia de candidatos
 */
export class CandidatosService {
  private candidatosRepository: CandidatosRepository;

  constructor(repository: CandidatosRepository = new CandidatosRepository()) {
    this.candidatosRepository = repository;
  }

  /**
   * Sugiere candidatos idóneos para un rol en actividad
   */
  async sugerirParaRol(rolId: number, fecha: string): Promise<ServiceResponse<Candidato[] | null>> {
    try {
      // Validar que el rol exista
      const rolExiste = await this.candidatosRepository.rolActividadExistsAsync(rolId);
      if (!rolExiste) {
        return ServiceResponse.failure(
          'El rol de actividad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const nombreRol = await this.candidatosRepository.getRolActividadNombreAsync(rolId);
      const miembros = await this.candidatosRepository.findMiembrosActivosAsync();

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.success<Candidato[]>('No se encontraron miembros activos', []);
      }

      const scoredMembers = await Promise.all(
        miembros.map(async (miembro) => {
          const [vecesExperiencia, asistencia, tieneConflicto] = await Promise.all([
            this.candidatosRepository.countExperienciaRolAsync(miembro.id, rolId),
            this.candidatosRepository.getAsistenciaUltimoAnioAsync(miembro.id, fecha),
            this.candidatosRepository.tieneConflictoHorarioAsync(miembro.id, fecha),
          ]);

          const puntosExperiencia = this.calcularPuntosExperiencia(vecesExperiencia);
          const { puntos: puntosAntiguedad, anios: aniosAntiguedad } =
            this.calcularPuntosAntiguedad(miembro.estado_membresia, miembro.fecha_ingreso, fecha);
          const { puntos: puntosAsistencia, porcentaje: porcentajeAsistencia } =
            this.calcularPuntosAsistencia(asistencia.totalConfirmadas, asistencia.asistioReal);
          const puntosDisponibilidad = tieneConflicto ? 0 : 20;

          const puntuacionTotal =
            puntosExperiencia + puntosAntiguedad + puntosAsistencia + puntosDisponibilidad;

          if (puntuacionTotal <= 0) return null;

          return {
            miembro_id: miembro.id,
            nombre_completo: `${miembro.nombre} ${miembro.apellido}`,
            puntuacion_total: puntuacionTotal,
            desglose: {
              experiencia: puntosExperiencia,
              antiguedad: puntosAntiguedad,
              asistencia: puntosAsistencia,
              disponibilidad: puntosDisponibilidad,
            },
            justificacion: this.generarJustificacion(
              nombreRol ?? 'Rol desconocido',
              vecesExperiencia,
              aniosAntiguedad,
              miembro.estado_membresia,
              porcentajeAsistencia,
              tieneConflicto,
            ),
            telefono: miembro.telefono,
            email: miembro.email,
          } as Candidato;
        }),
      );

      const candidatos = scoredMembers.filter((c): c is Candidato => c !== null);

      // Ordenar por puntuación descendente y tomar top 20
      candidatos.sort((a, b) => b.puntuacion_total - a.puntuacion_total);
      const topCandidatos = candidatos.slice(0, TOP_CANDIDATOS);

      const mensaje =
        topCandidatos.length > 0
          ? `Se encontraron ${topCandidatos.length} candidatos idóneos`
          : 'No se encontraron candidatos con puntuación mayor a 0';

      return ServiceResponse.success<Candidato[]>(mensaje, topCandidatos);
    } catch (error) {
      const errorMessage = `Error al sugerir candidatos para rol: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al buscar candidatos idóneos',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Sugiere candidatos idóneos para un cargo en grupo
   */
  async sugerirParaCargo(cargoId: number): Promise<ServiceResponse<Candidato[] | null>> {
    try {
      // Validar que el cargo exista
      const cargoExiste = await this.candidatosRepository.rolGrupoExistsAsync(cargoId);
      if (!cargoExiste) {
        return ServiceResponse.failure(
          'El cargo de grupo especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const nombreCargo = await this.candidatosRepository.getRolGrupoNombreAsync(cargoId);
      const fecha = dayjs().format('YYYY-MM-DD');
      const miembros = await this.candidatosRepository.findMiembrosActivosAsync();

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.success<Candidato[]>('No se encontraron miembros activos', []);
      }

      const scoredMembers = await Promise.all(
        miembros.map(async (miembro) => {
          const [vecesExperiencia, asistencia, gruposActivos] = await Promise.all([
            this.candidatosRepository.countExperienciaCargoAsync(miembro.id, cargoId),
            this.candidatosRepository.getAsistenciaUltimoAnioAsync(miembro.id, fecha),
            this.candidatosRepository.countGruposActivosAsync(miembro.id),
          ]);

          const puntosExperiencia = this.calcularPuntosExperiencia(vecesExperiencia);
          const { puntos: puntosAntiguedad, anios: aniosAntiguedad } =
            this.calcularPuntosAntiguedad(miembro.estado_membresia, miembro.fecha_ingreso, fecha);
          const { puntos: puntosAsistencia, porcentaje: porcentajeAsistencia } =
            this.calcularPuntosAsistencia(asistencia.totalConfirmadas, asistencia.asistioReal);
          const puntosDisponibilidad = this.calcularDisponibilidadCargo(gruposActivos);

          const puntuacionTotal =
            puntosExperiencia + puntosAntiguedad + puntosAsistencia + puntosDisponibilidad;

          if (puntuacionTotal <= 0) return null;

          return {
            miembro_id: miembro.id,
            nombre_completo: `${miembro.nombre} ${miembro.apellido}`,
            puntuacion_total: puntuacionTotal,
            desglose: {
              experiencia: puntosExperiencia,
              antiguedad: puntosAntiguedad,
              asistencia: puntosAsistencia,
              disponibilidad: puntosDisponibilidad,
            },
            justificacion: this.generarJustificacionCargo(
              nombreCargo ?? 'Cargo desconocido',
              vecesExperiencia,
              aniosAntiguedad,
              miembro.estado_membresia,
              porcentajeAsistencia,
              gruposActivos,
            ),
            telefono: miembro.telefono,
            email: miembro.email,
          } as Candidato;
        }),
      );

      const candidatos = scoredMembers.filter((c): c is Candidato => c !== null);

      // Ordenar por puntuación descendente y tomar top 20
      candidatos.sort((a, b) => b.puntuacion_total - a.puntuacion_total);
      const topCandidatos = candidatos.slice(0, TOP_CANDIDATOS);

      const mensaje =
        topCandidatos.length > 0
          ? `Se encontraron ${topCandidatos.length} candidatos idóneos`
          : 'No se encontraron candidatos con puntuación mayor a 0';

      return ServiceResponse.success<Candidato[]>(mensaje, topCandidatos);
    } catch (error) {
      const errorMessage = `Error al sugerir candidatos para cargo: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al buscar candidatos idóneos',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Calcula puntos de experiencia previa (0-30 pts)
   */
  private calcularPuntosExperiencia(veces: number): number {
    if (veces >= 10) return 30;
    if (veces >= 5) return 20;
    if (veces >= 1) return 10;
    return 0;
  }

  /**
   * Calcula puntos de antigüedad en membresía (0-20 pts)
   */
  private calcularPuntosAntiguedad(
    estadoMembresia: string,
    fechaIngreso: string,
    fechaReferencia: string,
  ): { puntos: number; anios: number } {
    if (estadoMembresia !== 'plena_comunion') {
      return { puntos: 0, anios: 0 };
    }

    const anios = dayjs(fechaReferencia).diff(dayjs(fechaIngreso), 'year');

    let puntos = 0;
    if (anios >= 10) puntos = 20;
    else if (anios >= 5) puntos = 15;
    else if (anios >= 3) puntos = 10;
    else if (anios >= 1) puntos = 5;

    return { puntos, anios };
  }

  /**
   * Calcula puntos de asistencia efectiva (0-30 pts)
   */
  private calcularPuntosAsistencia(
    totalConfirmadas: number,
    asistioReal: number,
  ): { puntos: number; porcentaje: number } {
    if (totalConfirmadas === 0) {
      return { puntos: 0, porcentaje: 0 };
    }

    const porcentaje = Math.round((asistioReal / totalConfirmadas) * 100);

    let puntos = 0;
    if (porcentaje >= 90) puntos = 30;
    else if (porcentaje >= 75) puntos = 20;
    else if (porcentaje >= 50) puntos = 10;

    return { puntos, porcentaje };
  }

  /**
   * Calcula puntos de disponibilidad para cargos en grupo (0-20 pts)
   * Basado en carga de grupos activos del miembro
   */
  private calcularDisponibilidadCargo(gruposActivos: number): number {
    if (gruposActivos <= 1) return 20;
    if (gruposActivos === 2) return 10;
    return 0;
  }

  /**
   * Genera justificación textual para cargos en grupo
   */
  private generarJustificacionCargo(
    nombreCargo: string,
    vecesExperiencia: number,
    aniosAntiguedad: number,
    estadoMembresia: string,
    porcentajeAsistencia: number,
    gruposActivos: number,
  ): string {
    const partes: string[] = [];

    partes.push(`Ha asumido ${nombreCargo} ${vecesExperiencia} veces`);

    if (estadoMembresia === 'plena_comunion') {
      partes.push(`${aniosAntiguedad} años en plena comunión`);
    } else {
      partes.push(`estado: ${estadoMembresia.replace('_', ' ')}`);
    }

    partes.push(`${porcentajeAsistencia}% asistencia`);

    if (gruposActivos >= 3) {
      partes.push(`participa en ${gruposActivos} grupos (sobrecargado)`);
    } else if (gruposActivos === 2) {
      partes.push(`participa en 2 grupos`);
    } else {
      partes.push(`participa en ${gruposActivos} grupo${gruposActivos === 1 ? '' : 's'}`);
    }

    return partes.join(', ');
  }

  /**
   * Genera justificación textual del puntaje
   */
  private generarJustificacion(
    nombreRolOCargo: string,
    vecesExperiencia: number,
    aniosAntiguedad: number,
    estadoMembresia: string,
    porcentajeAsistencia: number,
    tieneConflicto: boolean,
  ): string {
    const partes: string[] = [];

    partes.push(`Ha asumido ${nombreRolOCargo} ${vecesExperiencia} veces`);

    if (estadoMembresia === 'plena_comunion') {
      partes.push(`${aniosAntiguedad} años en plena comunión`);
    } else {
      partes.push(`estado: ${estadoMembresia.replace('_', ' ')}`);
    }

    partes.push(`${porcentajeAsistencia}% asistencia`);

    if (tieneConflicto) {
      partes.push('conflicto de horario');
    }

    return partes.join(', ');
  }
}

export const candidatosService = new CandidatosService();
