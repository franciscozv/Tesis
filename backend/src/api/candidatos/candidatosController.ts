import type { Request, RequestHandler, Response } from 'express';
import { candidatosService } from './candidatosService';

/**
 * Controlador para manejar peticiones HTTP de sugerencia de candidatos
 */
class CandidatosController {
  /**
   * Sugiere candidatos para un rol en actividad (indicadores crudos, sin scoring)
   */
  public sugerirResponsabilidad: RequestHandler = async (req: Request, res: Response) => {
    const {
      responsabilidad_id,
      fecha,
      tipo_actividad_id,
      actividad_id,
      grupo_id,
      periodo_meses,
      filtro_plena_comunion,
      solo_con_experiencia,
      solo_sin_experiencia,
      prioridad,
      incluir_con_conflictos,
    } = req.body;
    const serviceResponse = await candidatosService.sugerirParaResponsabilidad(responsabilidad_id, fecha, {
      tipoActividadId: tipo_actividad_id,
      actividadId: actividad_id,
      periodoMeses: periodo_meses ?? 12,
      filtroPlenaComun: filtro_plena_comunion,
      grupoIdBody: grupo_id,
      usuario: req.usuario,
      soloConExperiencia: solo_con_experiencia,
      soloSinExperiencia: solo_sin_experiencia,
      prioridad,
      incluirConConflictos: incluir_con_conflictos,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Sugiere candidatos para un cargo en grupo (indicadores crudos, sin scoring)
   */
  public sugerirCargo: RequestHandler = async (req: Request, res: Response) => {
    const {
      cargo_id,
      grupo_id,
      periodo_meses,
      solo_con_experiencia,
      solo_con_plena_comunion,
      criterios_prioridad,
    } = req.body;
    const serviceResponse = await candidatosService.sugerirParaCargo(cargo_id, {
      periodoMeses: periodo_meses,
      grupoIdBody: grupo_id,
      usuario: req.usuario,
      soloConExperiencia: solo_con_experiencia,
      soloConPlenaComunion: solo_con_plena_comunion,
      criteriosPrioridad: criterios_prioridad,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const candidatosController = new CandidatosController();

