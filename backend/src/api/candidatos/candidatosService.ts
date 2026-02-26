import dayjs from 'dayjs';
import { StatusCodes } from 'http-status-codes';
import type { JwtPayload } from '@/common/middleware/authMiddleware';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import type { Candidato, CandidatoCargo, SugerirCargoResponse } from './candidatosModel';
import { CandidatosRepository } from './candidatosRepository';

const TOP_CANDIDATOS = 20;

export class CandidatosService {
  private candidatosRepository: CandidatosRepository;

  constructor(repository: CandidatosRepository = new CandidatosRepository()) {
    this.candidatosRepository = repository;
  }

  /**
   * Sugiere candidatos para un rol en actividad usando indicadores crudos (sin scoring).
   * Ordenamiento: disponible > exp_tipo > exp_total > asistencia > antigüedad.
   */
  async sugerirParaRol(
    rolId: number,
    fecha: string,
    opciones: {
      tipoActividadId?: number;
      periodoMeses: number;
      filtroPlenaComun?: boolean;
      cuerpoIdBody?: number;
      usuario?: JwtPayload;
    },
  ): Promise<ServiceResponse<Candidato[] | null>> {
    try {
      const rolExiste = await this.candidatosRepository.rolActividadExistsAsync(rolId);
      if (!rolExiste) {
        return ServiceResponse.failure(
          'El rol de actividad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const nombreRol = await this.candidatosRepository.getRolActividadNombreAsync(rolId);

      // ── Lógica hermética de cuerpo_id ─────────────────────────────────────────
      // El token siempre gana: si el usuario tiene cuerpo_id en el JWT, se fuerza
      // independientemente de lo que envíe en el body.
      // El admin puede usar el cuerpo_id del body para filtrar, o dejarlo undefined (global).
      let cuerpoIdEfectivo: number | undefined;
      if (opciones.usuario?.cuerpo_id !== undefined) {
        // ENCARGADO: usa obligatoriamente el cuerpo de su token
        cuerpoIdEfectivo = opciones.usuario.cuerpo_id;
      } else if (opciones.usuario?.rol === 'administrador' && opciones.cuerpoIdBody !== undefined) {
        // ADMIN: puede filtrar por un cuerpo específico si lo desea
        cuerpoIdEfectivo = opciones.cuerpoIdBody;
      }
      // Sin cuerpo_id en token y admin sin filtro → búsqueda global

      // Fecha de inicio del periodo para cálculo de asistencia
      const fechaFin = fecha;
      const fechaInicio = dayjs(fecha)
        .subtract(opciones.periodoMeses, 'month')
        .format('YYYY-MM-DD');

      // Obtener miembros con filtros efectivos
      const miembros = await this.candidatosRepository.findMiembrosActivosFiltradosAsync({
        plenaComun: opciones.filtroPlenaComun,
        cuerpoId: cuerpoIdEfectivo,
      });

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.success<Candidato[]>('No se encontraron miembros activos', []);
      }

      const miembroIds = miembros.map((m) => m.id);

      // Queries batch: una sola llamada por indicador para todos los miembros
      const [expTotalMap, conflictosMap, asistenciaMap, expTipoMap] = await Promise.all([
        this.candidatosRepository.getExperienciaRolBatchAsync(miembroIds, rolId),
        this.candidatosRepository.getConflictosBatchAsync(miembroIds, fecha),
        this.candidatosRepository.getAsistenciaBatchAsync(miembroIds, fechaInicio, fechaFin),
        opciones.tipoActividadId !== undefined
          ? this.candidatosRepository.getExperienciaRolEnTipoBatchAsync(
              miembroIds,
              rolId,
              opciones.tipoActividadId,
            )
          : Promise.resolve(new Map<number, number>()),
      ]);

      // Ensamblar candidatos con indicadores
      const candidatos: Candidato[] = miembros.map((miembro) => {
        const expTotal = expTotalMap.get(miembro.id) ?? 0;
        const conflictos = conflictosMap.get(miembro.id) ?? 0;
        const asistencia = asistenciaMap.get(miembro.id) ?? { confirmadas: 0, asistidas: 0 };
        const expTipo = expTipoMap.get(miembro.id) ?? 0;

        const disponible = conflictos === 0;
        const asistenciaRatio =
          asistencia.confirmadas > 0
            ? Math.round((asistencia.asistidas / asistencia.confirmadas) * 100) / 100
            : 0;
        const antiguedadAnios = dayjs(fecha).diff(dayjs(miembro.fecha_ingreso), 'year');
        const plenaComun = miembro.estado_membresia === 'plena_comunion';

        const indicadores = {
          disponible_en_fecha: disponible,
          conflictos_en_fecha_count: conflictos,
          experiencia_rol_total: expTotal,
          experiencia_rol_en_tipo: expTipo,
          asistencia_ratio_periodo: asistenciaRatio,
          antiguedad_anios: antiguedadAnios,
          plena_comunion: plenaComun,
        };

        return {
          miembro_id: miembro.id,
          nombre_completo: `${miembro.nombre} ${miembro.apellido}`,
          telefono: miembro.telefono,
          email: miembro.email,
          indicadores,
          justificacion: this.generarJustificacionRol(
            nombreRol ?? 'Rol desconocido',
            indicadores,
            opciones.periodoMeses,
          ),
        };
      });

      // Ordenamiento multi-criterio (sin scoring subjetivo)
      candidatos.sort((a, b) => {
        const dispA = a.indicadores.disponible_en_fecha ? 1 : 0;
        const dispB = b.indicadores.disponible_en_fecha ? 1 : 0;
        if (dispB !== dispA) return dispB - dispA;

        if (b.indicadores.experiencia_rol_en_tipo !== a.indicadores.experiencia_rol_en_tipo)
          return b.indicadores.experiencia_rol_en_tipo - a.indicadores.experiencia_rol_en_tipo;

        if (b.indicadores.experiencia_rol_total !== a.indicadores.experiencia_rol_total)
          return b.indicadores.experiencia_rol_total - a.indicadores.experiencia_rol_total;

        if (b.indicadores.asistencia_ratio_periodo !== a.indicadores.asistencia_ratio_periodo)
          return b.indicadores.asistencia_ratio_periodo - a.indicadores.asistencia_ratio_periodo;

        return b.indicadores.antiguedad_anios - a.indicadores.antiguedad_anios;
      });

      const topCandidatos = candidatos.slice(0, TOP_CANDIDATOS);

      const mensaje =
        topCandidatos.length > 0
          ? `Se encontraron ${topCandidatos.length} candidatos`
          : 'No se encontraron candidatos';

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
   * Sugiere candidatos para un cargo en grupo usando indicadores crudos (sin scoring).
   * Filtro duro por cuerpo, batch queries, ordenamiento multi-criterio.
   */
  async sugerirParaCargo(
    cargoId: number,
    opciones: {
      periodoMeses: number;
      cuerpoIdBody?: number;
      usuario?: JwtPayload;
    },
  ): Promise<ServiceResponse<SugerirCargoResponse | null>> {
    try {
      // ── Verificar cargo y requisitos ─────────────────────────────────────────
      const {
        existe,
        requiere_plena_comunion,
        nombre: nombreCargo,
      } = await this.candidatosRepository.getCargoRequisitosAsync(cargoId);
      if (!existe) {
        return ServiceResponse.failure(
          'El cargo de grupo especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // ── Lógica hermética de cuerpo_id ────────────────────────────────────────
      let cuerpoIdEfectivo: number | undefined;
      if (opciones.usuario?.cuerpo_id !== undefined) {
        cuerpoIdEfectivo = opciones.usuario.cuerpo_id;
      } else if (opciones.usuario?.rol === 'administrador' && opciones.cuerpoIdBody !== undefined) {
        cuerpoIdEfectivo = opciones.cuerpoIdBody;
      }

      if (cuerpoIdEfectivo === undefined) {
        return ServiceResponse.failure(
          'Se requiere un cuerpo_id para sugerir candidatos a cargo. Envíalo en el body.',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      // ── Filtro duro: miembros vigentes en el cuerpo ───────────────────────────
      const fechaHoy = dayjs().format('YYYY-MM-DD');
      const fechaInicio = dayjs().subtract(opciones.periodoMeses, 'month').format('YYYY-MM-DD');

      const miembros = await this.candidatosRepository.findMiembrosVigentesEnCuerpoAsync(
        cuerpoIdEfectivo,
        requiere_plena_comunion,
      );

      const metadata = {
        cuerpo_id_usado: cuerpoIdEfectivo,
        periodo_meses_usado: opciones.periodoMeses,
        cargo_id: cargoId,
        requiere_plena_comunion,
      };

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.success<SugerirCargoResponse>(
          'No se encontraron miembros vigentes en el cuerpo',
          { metadata, candidatos: [] },
        );
      }

      const miembroIds = miembros.map((m) => m.id);

      // ── Indicadores batch ─────────────────────────────────────────────────────
      const [expCargoMap, gruposActivosMap, asistenciaMap] = await Promise.all([
        this.candidatosRepository.getExperienciaCargoEnCuerpoBatchAsync(
          miembroIds,
          cargoId,
          cuerpoIdEfectivo,
        ),
        this.candidatosRepository.getGruposActivosBatchAsync(miembroIds),
        this.candidatosRepository.getAsistenciaBatchAsync(miembroIds, fechaInicio, fechaHoy),
      ]);

      // ── Ensamblar candidatos ──────────────────────────────────────────────────
      const candidatos: Omit<CandidatoCargo, 'posicion'>[] = miembros.map((miembro) => {
        const experienciaCargo = expCargoMap.get(miembro.id) ?? 0;
        const gruposActivos = gruposActivosMap.get(miembro.id) ?? 0;
        const asistencia = asistenciaMap.get(miembro.id) ?? { confirmadas: 0, asistidas: 0 };

        const asistenciaRatio =
          asistencia.confirmadas > 0
            ? Math.round((asistencia.asistidas / asistencia.confirmadas) * 100) / 100
            : 0;
        const antiguedadAnios = dayjs(fechaHoy).diff(dayjs(miembro.fecha_ingreso), 'year');
        const plenaComun = miembro.estado_membresia === 'plena_comunion';

        const indicadores = {
          experiencia_cargo_en_cuerpo: experienciaCargo,
          grupos_activos_count: gruposActivos,
          asistencia_ratio_periodo: asistenciaRatio,
          antiguedad_anios: antiguedadAnios,
          plena_comunion: plenaComun,
        };

        return {
          miembro_id: miembro.id,
          nombre_completo: `${miembro.nombre} ${miembro.apellido}`,
          telefono: miembro.telefono,
          email: miembro.email,
          indicadores,
          justificacion: this.generarJustificacionCargo(
            nombreCargo ?? 'Cargo desconocido',
            indicadores,
            opciones.periodoMeses,
          ),
        };
      });

      // ── Ordenamiento multi-criterio ───────────────────────────────────────────
      // 1. experiencia_cargo_en_cuerpo DESC
      // 2. grupos_activos_count ASC (menos ocupado tiene prioridad)
      // 3. asistencia_ratio_periodo DESC
      // 4. antiguedad_anios DESC
      candidatos.sort((a, b) => {
        if (b.indicadores.experiencia_cargo_en_cuerpo !== a.indicadores.experiencia_cargo_en_cuerpo)
          return (
            b.indicadores.experiencia_cargo_en_cuerpo - a.indicadores.experiencia_cargo_en_cuerpo
          );

        if (a.indicadores.grupos_activos_count !== b.indicadores.grupos_activos_count)
          return a.indicadores.grupos_activos_count - b.indicadores.grupos_activos_count;

        if (b.indicadores.asistencia_ratio_periodo !== a.indicadores.asistencia_ratio_periodo)
          return b.indicadores.asistencia_ratio_periodo - a.indicadores.asistencia_ratio_periodo;

        return b.indicadores.antiguedad_anios - a.indicadores.antiguedad_anios;
      });

      const topCandidatos: CandidatoCargo[] = candidatos
        .slice(0, TOP_CANDIDATOS)
        .map((c, i) => ({ ...c, posicion: i + 1 }));

      const mensaje =
        topCandidatos.length > 0
          ? `Se encontraron ${topCandidatos.length} candidatos`
          : 'No se encontraron candidatos';

      return ServiceResponse.success<SugerirCargoResponse>(mensaje, {
        metadata,
        candidatos: topCandidatos,
      });
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

  // ─── Helpers para justificación de ROL (indicadores, sin puntos) ─────────────

  private generarJustificacionRol(
    nombreRol: string,
    ind: {
      disponible_en_fecha: boolean;
      conflictos_en_fecha_count: number;
      experiencia_rol_total: number;
      experiencia_rol_en_tipo: number;
      asistencia_ratio_periodo: number;
      antiguedad_anios: number;
      plena_comunion: boolean;
    },
    periodoMeses: number,
  ): string {
    const partes: string[] = [];

    if (ind.disponible_en_fecha) {
      partes.push('Disponible en la fecha');
    } else {
      const n = ind.conflictos_en_fecha_count;
      partes.push(`No disponible (${n} conflicto${n !== 1 ? 's' : ''})`);
    }

    if (ind.experiencia_rol_en_tipo > 0) {
      partes.push(
        `${nombreRol} realizado ${ind.experiencia_rol_total} veces (${ind.experiencia_rol_en_tipo} en este tipo)`,
      );
    } else {
      partes.push(`${nombreRol} realizado ${ind.experiencia_rol_total} veces`);
    }

    const pct = Math.round(ind.asistencia_ratio_periodo * 100);
    partes.push(`${pct}% asistencia últimos ${periodoMeses} meses`);
    partes.push(`${ind.antiguedad_anios} años de antigüedad`);
    partes.push(`plena comunión: ${ind.plena_comunion ? 'sí' : 'no'}`);

    return partes.join(', ');
  }

  // ─── Helper de justificación para CARGO (indicadores crudos) ─────────────────

  private generarJustificacionCargo(
    nombreCargo: string,
    ind: {
      experiencia_cargo_en_cuerpo: number;
      grupos_activos_count: number;
      asistencia_ratio_periodo: number;
      antiguedad_anios: number;
      plena_comunion: boolean;
    },
    periodoMeses: number,
  ): string {
    const partes: string[] = [];

    partes.push(
      `Ha ocupado ${nombreCargo} ${ind.experiencia_cargo_en_cuerpo} veces en este cuerpo`,
    );
    partes.push(
      `participa en ${ind.grupos_activos_count} grupo${ind.grupos_activos_count !== 1 ? 's' : ''}`,
    );

    const pct = Math.round(ind.asistencia_ratio_periodo * 100);
    partes.push(`${pct}% asistencia últimos ${periodoMeses} meses`);
    partes.push(`${ind.antiguedad_anios} años de antigüedad`);
    partes.push(`plena comunión: ${ind.plena_comunion ? 'sí' : 'no'}`);

    return partes.join(', ');
  }
}

export const candidatosService = new CandidatosService();
