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
      actividadId?: number;
      periodoMeses: number;
      filtroPlenaComun?: boolean;
      cuerpoIdBody?: number;
      usuario?: JwtPayload;
      soloConExperiencia?: boolean;
      soloSinExperiencia?: boolean;
      prioridad?: string[];
      incluirConConflictos?: boolean;
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

      // ── Resolución del filtro de grupo ─────────────────────────────────────
      // Si se recibe actividadId, obtenemos el grupo de esa actividad.
      // - 'usuario' (directiva): sugerencia solo dentro del GRUPO de la actividad (contextual).
      // - 'administrador': busca en todo el CUERPO si envía cuerpoIdBody, o busca en el
      //    GRUPO de la actividad si solo envía actividadId. Si no envía ninguno, global.
      let cuerpoIdEfectivo: number | undefined = opciones.cuerpoIdBody;
      let grupoIdEfectivo: number | undefined;

      if (opciones.actividadId) {
        const grupoIdActividad = await this.candidatosRepository.getGrupoIdDeActividadAsync(
          opciones.actividadId,
        );

        if (grupoIdActividad !== null) {
          if (opciones.usuario?.rol === 'usuario') {
            // Seguridad: directiva solo sugiere gente de SU GRUPO
            grupoIdEfectivo = grupoIdActividad;
            cuerpoIdEfectivo = undefined; // Forzamos búsqueda por grupo
          } else {
            // Admin: decide si quiere filtrar por cuerpo (cuerpoIdBody)
            // o si quiere filtrar por grupo de actividad (grupoIdActividad).
            // Prioridad al cuerpoIdBody si existe.
            if (opciones.cuerpoIdBody === undefined) {
              grupoIdEfectivo = grupoIdActividad;
            }
          }
        }
      }

      // Fecha de inicio del periodo para cálculo de asistencia
      const fechaFin = fecha;
      const fechaInicio = dayjs(fecha)
        .subtract(opciones.periodoMeses, 'month')
        .format('YYYY-MM-DD');

      // Obtener miembros con filtros efectivos (incluyendo grupoIdEfectivo)
      const miembros = await this.candidatosRepository.findMiembrosActivosFiltradosAsync({
        plenaComun: opciones.filtroPlenaComun,
        cuerpoId: cuerpoIdEfectivo,
        grupoId: grupoIdEfectivo,
      });

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.success<Candidato[]>('No se encontraron miembros activos', []);
      }

      const miembroIds = miembros.map((m) => m.id);

      // Queries batch: una sola llamada por indicador para todos los miembros
      const [expTotalMap, conflictosMap, asistenciaMap, expTipoMap, ultimoUsoMap, cargaSemanalMap] =
        await Promise.all([
          this.candidatosRepository.getExperienciaRolBatchAsync(miembroIds, rolId),
          this.candidatosRepository.getConflictosBatchAsync(
            miembroIds,
            fecha,
            opciones.actividadId,
          ),
          this.candidatosRepository.getAsistenciaBatchAsync(miembroIds, fechaInicio, fechaFin),
          opciones.tipoActividadId !== undefined
            ? this.candidatosRepository.getExperienciaRolEnTipoBatchAsync(
                miembroIds,
                rolId,
                opciones.tipoActividadId,
              )
            : Promise.resolve(new Map<number, number>()),
          this.candidatosRepository.getUltimoUsoRolBatchAsync(miembroIds, rolId),
          this.candidatosRepository.getCargaSemanalBatchAsync(miembroIds, fecha),
        ]);

      // Ensamblar candidatos con indicadores
      const candidatos: Candidato[] = miembros.map((miembro) => {
        const expTotal = expTotalMap.get(miembro.id) ?? 0;
        const conflictosDetalle = conflictosMap.get(miembro.id) ?? [];
        const conflictos = conflictosDetalle.length;
        const asistencia = asistenciaMap.get(miembro.id) ?? { confirmadas: 0, asistidas: 0 };
        const expTipo = expTipoMap.get(miembro.id) ?? 0;
        const ultimoUso = ultimoUsoMap.get(miembro.id) ?? null;
        const serviciosEstaSemana = cargaSemanalMap.get(miembro.id) ?? 0;

        const disponible = conflictos === 0;
        const asistenciaRatio =
          asistencia.confirmadas > 0
            ? Math.round((asistencia.asistidas / asistencia.confirmadas) * 100) / 100
            : 0;
        const antiguedadAnios = dayjs(fecha).diff(dayjs(miembro.fecha_ingreso), 'year');
        const plenaComun = miembro.estado_comunion === 'plena_comunion';
        const diasDesdeUltimoUso =
          ultimoUso !== null ? dayjs(fecha).diff(dayjs(ultimoUso), 'day') : null;

        const indicadores = {
          disponible_en_fecha: disponible,
          conflictos_en_fecha_count: conflictos,
          conflictos_detalle: conflictosDetalle,
          experiencia_rol_total: expTotal,
          experiencia_rol_en_tipo: expTipo,
          dias_desde_ultimo_uso: diasDesdeUltimoUso,
          servicios_esta_semana: serviciosEstaSemana,
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

      // ── Filtrado por experiencia ──────────────────────────────────────────────
      let candidatosFiltrados = candidatos as Candidato[];
      if (opciones.soloConExperiencia) {
        candidatosFiltrados = candidatosFiltrados.filter(
          (c) => c.indicadores.experiencia_rol_total > 0,
        );
      }
      if (opciones.soloSinExperiencia) {
        candidatosFiltrados = candidatosFiltrados.filter(
          (c) => c.indicadores.experiencia_rol_total === 0,
        );
      }

      // ── Filtrado por conflictos ───────────────────────────────────────────────
      if (!opciones.incluirConConflictos) {
        candidatosFiltrados = candidatosFiltrados.filter((c) => c.indicadores.disponible_en_fecha);
      }

      // ── Ordenamiento dinámico por criterios ───────────────────────────────────
      const COMPARADORES: Record<string, (a: Candidato, b: Candidato) => number> = {
        disponibilidad: (a, b) => {
          const dispA = a.indicadores.disponible_en_fecha ? 1 : 0;
          const dispB = b.indicadores.disponible_en_fecha ? 1 : 0;
          return dispB - dispA;
        },
        experiencia_tipo: (a, b) =>
          b.indicadores.experiencia_rol_en_tipo - a.indicadores.experiencia_rol_en_tipo,
        rotacion: (a, b) => {
          // DESC: el que más descansó va primero; null (nunca realizado) tiene máxima prioridad
          const dA = a.indicadores.dias_desde_ultimo_uso ?? Number.MAX_SAFE_INTEGER;
          const dB = b.indicadores.dias_desde_ultimo_uso ?? Number.MAX_SAFE_INTEGER;
          return dB - dA;
        },
        carga: (a, b) => a.indicadores.servicios_esta_semana - b.indicadores.servicios_esta_semana,
        fidelidad: (a, b) =>
          b.indicadores.asistencia_ratio_periodo - a.indicadores.asistencia_ratio_periodo,
      };

      // Si prioridad se envía explícitamente, solo esos criterios rigen el orden.
      // Si no se envía (undefined), se aplica el orden completo por defecto.
      const criterios =
        opciones.prioridad !== undefined
          ? opciones.prioridad
          : ['disponibilidad', 'experiencia_tipo', 'rotacion', 'carga', 'fidelidad'];

      candidatosFiltrados.sort((a, b) => {
        for (const criterio of criterios) {
          const comparar = COMPARADORES[criterio];
          if (!comparar) continue;
          const resultado = comparar(a, b);
          if (resultado !== 0) return resultado;
        }
        return 0;
      });

      const topCandidatos = candidatosFiltrados.slice(0, TOP_CANDIDATOS);

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
      soloConExperiencia?: boolean;
      criteriosPrioridad?: string[];
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

      // Usar cuerpo_id del body si se provee (cualquier rol puede filtrarlo)
      const cuerpoIdEfectivo: number | undefined = opciones.cuerpoIdBody;

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
        const plenaComun = miembro.estado_comunion === 'plena_comunion';

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

      // ── Filtrado por experiencia ──────────────────────────────────────────────
      const candidatosFiltrados = opciones.soloConExperiencia
        ? candidatos.filter((c) => c.indicadores.experiencia_cargo_en_cuerpo > 0)
        : candidatos;

      // ── Ordenamiento dinámico por criterios ───────────────────────────────────
      type CandidatoSinPosicion = Omit<CandidatoCargo, 'posicion'>;
      const COMPARADORES: Record<
        string,
        (a: CandidatoSinPosicion, b: CandidatoSinPosicion) => number
      > = {
        experiencia: (a, b) =>
          b.indicadores.experiencia_cargo_en_cuerpo - a.indicadores.experiencia_cargo_en_cuerpo,
        carga_trabajo: (a, b) =>
          a.indicadores.grupos_activos_count - b.indicadores.grupos_activos_count,
        fidelidad: (a, b) =>
          b.indicadores.asistencia_ratio_periodo - a.indicadores.asistencia_ratio_periodo,
        antiguedad: (a, b) => b.indicadores.antiguedad_anios - a.indicadores.antiguedad_anios,
      };

      const criterios =
        opciones.criteriosPrioridad && opciones.criteriosPrioridad.length > 0
          ? opciones.criteriosPrioridad
          : ['experiencia', 'carga_trabajo', 'fidelidad', 'antiguedad'];

      candidatosFiltrados.sort((a, b) => {
        for (const criterio of criterios) {
          const comparar = COMPARADORES[criterio];
          if (!comparar) continue;
          const resultado = comparar(a, b);
          if (resultado !== 0) return resultado;
        }
        return 0;
      });

      const topCandidatos: CandidatoCargo[] = candidatosFiltrados
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
      conflictos_detalle?: Array<{ actividad: string; rol: string }>;
      experiencia_rol_total: number;
      experiencia_rol_en_tipo: number;
      dias_desde_ultimo_uso: number | null;
      servicios_esta_semana: number;
      asistencia_ratio_periodo: number;
      antiguedad_anios: number;
      plena_comunion: boolean;
    },
    periodoMeses: number,
  ): string {
    const partes: string[] = [];

    if (ind.disponible_en_fecha) {
      partes.push('Disponible en la fecha');
    } else if (ind.conflictos_detalle && ind.conflictos_detalle.length > 0) {
      const detalles = ind.conflictos_detalle.map((c) => `${c.rol} en ${c.actividad}`).join(', ');
      partes.push(`No disponible (Ocupado en: ${detalles})`);
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

    if (ind.dias_desde_ultimo_uso === null) {
      partes.push('Nunca ha realizado este servicio');
    } else {
      partes.push(`No ha realizado este servicio en ${ind.dias_desde_ultimo_uso} días`);
    }

    if (ind.servicios_esta_semana > 0) {
      const s = ind.servicios_esta_semana;
      partes.push(`Tiene ${s} servicio${s !== 1 ? 's' : ''} esta semana`);
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
