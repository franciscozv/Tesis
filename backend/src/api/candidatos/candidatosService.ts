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
  async sugerirParaResponsabilidad(
    rolId: number,
    fecha: string,
    opciones: {
      tipoActividadId?: number;
      actividadId?: number;
      periodoMeses: number;
      filtroPlenaComun?: boolean;
      grupoIdBody?: number;
      usuario?: JwtPayload;
      soloConExperiencia?: boolean;
      soloSinExperiencia?: boolean;
      prioridad?: string[];
      incluirConConflictos?: boolean;
    },
  ): Promise<ServiceResponse<Candidato[] | null>> {
    try {
      const rolExiste = await this.candidatosRepository.responsabilidadActividadExistsAsync(rolId);
      if (!rolExiste) {
        return ServiceResponse.failure(
          'El responsabilidad de actividad especificado no existe o no está activo',
          null,
          StatusCodes.BAD_REQUEST,
        );
      }

      const nombreRol = await this.candidatosRepository.getResponsabilidadActividadNombreAsync(rolId);

      // ── Resolución del filtro de grupo ─────────────────────────────────────
      let grupoIdEfectivo: number | undefined = opciones.grupoIdBody;

      if (opciones.actividadId) {
        const grupoIdActividad = await this.candidatosRepository.getGrupoIdDeActividadAsync(
          opciones.actividadId,
        );

        if (grupoIdActividad !== null) {
          if (opciones.usuario?.rol === 'usuario') {
            grupoIdEfectivo = grupoIdActividad;
          } else {
            if (opciones.grupoIdBody === undefined) {
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
        grupoId: grupoIdEfectivo,
      });

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.success<Candidato[]>('No se encontraron miembros activos', []);
      }

      const miembroIds = miembros.map((m) => m.id);

      // Queries batch: una sola llamada por indicador para todos los miembros
      const [
        expTotalMap,
        conflictosMap,
        asistenciaMap,
        expTipoMap,
        ultimoUsoMap,
        cargaSemanalMap,
        resumenServiciosMap,
      ] = await Promise.all([
        this.candidatosRepository.getExperienciaRolBatchAsync(miembroIds, rolId),
        this.candidatosRepository.getConflictosBatchAsync(miembroIds, fecha, opciones.actividadId),
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
        this.candidatosRepository.getResumenServiciosBatchAsync(miembroIds, fechaInicio, fechaFin),
      ]);

      // Ensamblar candidatos con indicadores
      const candidatos: Candidato[] = miembros.map((miembro) => {
        const expTotal = expTotalMap.get(miembro.id) ?? 0;
        const conflictosDetalle = conflictosMap.get(miembro.id) ?? [];
        const conflictos = conflictosDetalle.length;
        const asistencia = asistenciaMap.get(miembro.id) ?? { confirmadas: 0, asistidas: 0 };
        const expTipo = expTipoMap.get(miembro.id) ?? 0;
        const ultimoUsoData = ultimoUsoMap.get(miembro.id) ?? null;
        const ultimoUso = ultimoUsoData?.fecha ?? null;
        const ultimoUsoNombre = ultimoUsoData?.nombre_actividad ?? null;
        const ultimoUsoTipo = ultimoUsoData?.tipo_actividad ?? null;
        const serviciosDetalle = cargaSemanalMap.get(miembro.id) ?? [];
        const serviciosEstaSemana = serviciosDetalle.length;
        const resumenServicios = resumenServiciosMap.get(miembro.id) ?? [];

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
          ultimo_uso_nombre: ultimoUsoNombre,
          ultimo_uso_tipo_actividad: ultimoUsoTipo,
          servicios_esta_semana: serviciosEstaSemana,
          servicios_esta_semana_detalle: serviciosDetalle,
          asistencia_ratio_periodo: asistenciaRatio,
          asistencias_count: asistencia.asistidas,
          confirmadas_count: asistencia.confirmadas,
          antiguedad_anios: antiguedadAnios,
          resumen_servicios: resumenServicios,
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
          b.indicadores.asistencias_count - a.indicadores.asistencias_count,
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
   * Filtro duro por grupo (opcional), batch queries, ordenamiento multi-criterio.
   */
  async sugerirParaCargo(
    cargoId: number,
    opciones: {
      periodoMeses: number;
      grupoIdBody?: number;
      usuario?: JwtPayload;
      soloConExperiencia?: boolean;
      soloConPlenaComunion?: boolean;
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

      // El grupo_id es opcional para búsqueda global
      const grupoIdEfectivo: number | undefined = opciones.grupoIdBody;

      // ── Filtro duro: miembros vigentes ───────────────────────────
      const fechaHoy = dayjs().format('YYYY-MM-DD');
      const fechaInicio = dayjs().subtract(opciones.periodoMeses, 'month').format('YYYY-MM-DD');

      const miembros = await this.candidatosRepository.findMiembrosVigentesEnGrupoAsync(
        requiere_plena_comunion,
        grupoIdEfectivo,
      );

      const metadata = {
        grupo_id_usado: grupoIdEfectivo,
        periodo_meses_usado: opciones.periodoMeses,
        cargo_id: cargoId,
        requiere_plena_comunion,
      };

      if (!miembros || miembros.length === 0) {
        return ServiceResponse.success<SugerirCargoResponse>(
          'No se encontraron miembros vigentes',
          { metadata, candidatos: [] },
        );
      }

      const miembroIds = miembros.map((m) => m.id);

      // ── Indicadores batch ─────────────────────────────────────────────────────
      const [
        expCargoMap,
        gruposActivosMap,
        asistenciaMap,
        historialCompletoMap,
        resumenServiciosMap,
      ] = await Promise.all([
        grupoIdEfectivo !== undefined
          ? this.candidatosRepository.getExperienciaCargoEnGrupoBatchAsync(
              miembroIds,
              cargoId,
              grupoIdEfectivo,
            )
          : this.candidatosRepository.getExperienciaCargoGlobalBatchAsync(miembroIds, cargoId),
        this.candidatosRepository.getGruposActivosBatchAsync(miembroIds),
        this.candidatosRepository.getAsistenciaBatchAsync(miembroIds, fechaInicio, fechaHoy),
        this.candidatosRepository.getHistorialGruposCompletoBatchAsync(miembroIds),
        this.candidatosRepository.getResumenServiciosBatchAsync(
          miembroIds,
          fechaInicio,
          fechaHoy,
        ),
      ]);

      // ── Ensamblar candidatos ──────────────────────────────────────────────────
      const candidatos: Omit<CandidatoCargo, 'posicion'>[] = miembros.map((miembro) => {
        const historialExp = expCargoMap.get(miembro.id) ?? [];
        const experienciaCargo = historialExp.length;

        // Historial Completo: Todo el historial de membresías (pasadas y presentes)
        const historialCompleto = historialCompletoMap.get(miembro.id) ?? [];
        const historialUnificado = historialCompleto.map((h) => ({
          cargo_nombre: h.cargo,
          grupo_nombre: h.grupo,
          fecha_inicio: h.inicio,
          fecha_fin: h.fin,
          es_directiva: h.es_directiva,
        }));

        const gruposActivosDetalle = gruposActivosMap.get(miembro.id) ?? [];
        const gruposActivosCount = gruposActivosDetalle.length;

        const asistencia = asistenciaMap.get(miembro.id) || { confirmadas: 0, asistidas: 0 };
        const resumenServicios = resumenServiciosMap.get(miembro.id) || [];

        const asistenciaRatio =
          asistencia.confirmadas > 0
            ? Math.round((asistencia.asistidas / asistencia.confirmadas) * 100) / 100
            : 0;
        
        // Calcular antigüedades con fallback a 0 si la fecha es inválida
        const antiguedadAnios = miembro.fecha_ingreso 
          ? dayjs(fechaHoy).diff(dayjs(miembro.fecha_ingreso), 'year') 
          : 0;
        
        const antiguedadGrupoAnios = miembro.fecha_vinculacion_grupo
          ? dayjs(fechaHoy).diff(dayjs(miembro.fecha_vinculacion_grupo), 'year')
          : 0;

        const plenaComun = miembro.estado_comunion === 'plena_comunion';

        const indicadores = {
          experiencia_cargo_en_grupo: experienciaCargo || 0,
          historial_experiencia: historialExp || [],
          historial_otros_cargos: historialUnificado || [],
          grupos_activos_count: gruposActivosCount || 0,
          grupos_activos_detalle: gruposActivosDetalle || [],
          asistencia_ratio_periodo: asistenciaRatio,
          asistencias_count: asistencia.asistidas || 0,
          confirmadas_count: asistencia.confirmadas || 0,
          resumen_servicios: resumenServicios,
          antiguedad_anios: isNaN(antiguedadAnios) ? 0 : antiguedadAnios,
          antiguedad_grupo_anios: isNaN(antiguedadGrupoAnios) ? 0 : antiguedadGrupoAnios,
          fecha_ingreso: miembro.fecha_ingreso || fechaHoy,
          fecha_vinculacion_grupo: miembro.fecha_vinculacion_grupo || null,
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
            grupoIdEfectivo !== undefined,
          ),
        };
      });

      // ── Filtrado post-indicadores ──────────────────────────────────────────
      let candidatosFiltrados = opciones.soloConExperiencia
        ? candidatos.filter((c) => c.indicadores.experiencia_cargo_en_grupo > 0)
        : candidatos;

      if (opciones.soloConPlenaComunion) {
        candidatosFiltrados = candidatosFiltrados.filter((c) => c.indicadores.plena_comunion);
      }

      // ── Ordenamiento dinámico por criterios ───────────────────────────────────
      type CandidatoSinPosicion = Omit<CandidatoCargo, 'posicion'>;
      const COMPARADORES: Record<
        string,
        (a: CandidatoSinPosicion, b: CandidatoSinPosicion) => number
      > = {
        experiencia: (a, b) =>
          b.indicadores.experiencia_cargo_en_grupo - a.indicadores.experiencia_cargo_en_grupo,
        carga_trabajo: (a, b) =>
          a.indicadores.grupos_activos_count - b.indicadores.grupos_activos_count,
        fidelidad: (a, b) =>
          b.indicadores.asistencias_count - a.indicadores.asistencias_count,
        antiguedad: (a, b) => {
          // Priorizar antigüedad en el grupo
          if (a.indicadores.antiguedad_grupo_anios !== b.indicadores.antiguedad_grupo_anios) {
            return b.indicadores.antiguedad_grupo_anios - a.indicadores.antiguedad_grupo_anios;
          }
          // Desempate por antigüedad institucional
          return b.indicadores.antiguedad_anios - a.indicadores.antiguedad_anios;
        },
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
      ultimo_uso_nombre?: string | null;
      ultimo_uso_tipo_actividad?: string | null;
      servicios_esta_semana: number;
      servicios_esta_semana_detalle?: Array<{ actividad: string; rol: string; fecha: string }>;
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
    } else if (ind.ultimo_uso_nombre) {
      const contexto = ind.ultimo_uso_tipo_actividad
        ? `${ind.ultimo_uso_tipo_actividad} "${ind.ultimo_uso_nombre}"`
        : `"${ind.ultimo_uso_nombre}"`;
      partes.push(`Última vez: hace ${ind.dias_desde_ultimo_uso} días en ${contexto}`);
    } else {
      partes.push(`No ha realizado este servicio en ${ind.dias_desde_ultimo_uso} días`);
    }

    if (ind.servicios_esta_semana > 0) {
      const s = ind.servicios_esta_semana;
      if (ind.servicios_esta_semana_detalle && ind.servicios_esta_semana_detalle.length > 0) {
        const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
        const nombres = ind.servicios_esta_semana_detalle
          .map((d) => {
            const dia = d.fecha ? DIAS[dayjs(d.fecha).day()] : null;
            return dia ? `${d.rol} en ${d.actividad} (${dia})` : `${d.rol} en ${d.actividad}`;
          })
          .join(', ');
        partes.push(`Tiene ${s} servicio${s !== 1 ? 's' : ''} esta semana: ${nombres}`);
      } else {
        partes.push(`Tiene ${s} servicio${s !== 1 ? 's' : ''} esta semana`);
      }
    }

    partes.push(`${ind.antiguedad_anios} años de antigüedad`);
    partes.push(`plena comunión: ${ind.plena_comunion ? 'sí' : 'no'}`);

    return partes.join(', ');
  }

  // ─── Helper de justificación para CARGO (indicadores crudos) ─────────────────

  private generarJustificacionCargo(
    nombreCargo: string,
    ind: {
      experiencia_cargo_en_grupo: number;
      historial_experiencia: Array<{ cargo_nombre?: string; grupo_nombre: string; fecha_inicio: string; fecha_fin: string | null }>;
      grupos_activos_count: number;
      grupos_activos_detalle: Array<{ grupo: string; rol: string }>;
      asistencia_ratio_periodo: number;
      antiguedad_anios: number;
      plena_comunion: boolean;
    },
    periodoMeses: number,
    esContextual: boolean,
  ): string {
    const partes: string[] = [];

    if (ind.experiencia_cargo_en_grupo > 0) {
      const historialStr = ind.historial_experiencia
        .map((h) => {
          const inicio = dayjs(h.fecha_inicio).year();
          const fin = h.fecha_fin ? dayjs(h.fecha_fin).year() : 'Actualidad';
          return `${h.grupo_nombre} (${inicio}-${fin})`;
        })
        .join(', ');

      if (esContextual) {
        partes.push(
          `Ha sido ${nombreCargo} ${ind.experiencia_cargo_en_grupo} veces en este grupo: ${historialStr}`,
        );
      } else {
        partes.push(
          `Ha sido ${nombreCargo} ${ind.experiencia_cargo_en_grupo} veces históricamente: ${historialStr}`,
        );
      }
    } else {
      partes.push(`Sin experiencia previa como ${nombreCargo}`);
    }

    if (ind.grupos_activos_count > 0) {
      const gruposStr = ind.grupos_activos_detalle
        .map((g) => `${g.grupo} (${g.rol})`)
        .join(', ');
      partes.push(
        `participa en ${ind.grupos_activos_count} grupo${ind.grupos_activos_count !== 1 ? 's' : ''}: ${gruposStr}`,
      );
    } else {
      partes.push('No participa en otros grupos actualmente');
    }

    partes.push(`${ind.antiguedad_anios} años de antigüedad`);
    partes.push(`plena comunión: ${ind.plena_comunion ? 'sí' : 'no'}`);

    return partes.join(', ');
  }
}

export const candidatosService = new CandidatosService();
