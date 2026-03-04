import type { Request, RequestHandler, Response } from 'express';
import { candidatosService } from './candidatosService';

/**
 * Controlador para manejar peticiones HTTP de sugerencia de candidatos
 */
class CandidatosController {
  /**
   * Sugiere candidatos para un rol en actividad (indicadores crudos, sin scoring)
   */
  public sugerirRol: RequestHandler = async (req: Request, res: Response) => {
    const {
      rol_id,
      fecha,
      tipo_actividad_id,
      actividad_id,
      cuerpo_id,
      periodo_meses,
      filtro_plena_comunion,
      solo_con_experiencia,
      solo_sin_experiencia,
      prioridad,
      incluir_con_conflictos,
    } = req.body;
    const serviceResponse = await candidatosService.sugerirParaRol(rol_id, fecha, {
      tipoActividadId: tipo_actividad_id,
      actividadId: actividad_id,
      periodoMeses: periodo_meses ?? 12,
      filtroPlenaComun: filtro_plena_comunion,
      cuerpoIdBody: cuerpo_id,
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
    const { cargo_id, cuerpo_id, periodo_meses, solo_con_experiencia, criterios_prioridad } =
      req.body;
    const serviceResponse = await candidatosService.sugerirParaCargo(cargo_id, {
      periodoMeses: periodo_meses ?? 12,
      cuerpoIdBody: cuerpo_id,
      usuario: req.usuario,
      soloConExperiencia: solo_con_experiencia,
      criteriosPrioridad: criterios_prioridad,
    });
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const candidatosController = new CandidatosController();
