import type { Request, RequestHandler, Response } from 'express';
import { candidatosService } from './candidatosService';

/**
 * Controlador para manejar peticiones HTTP de sugerencia de candidatos
 */
class CandidatosController {
  /**
   * Sugiere candidatos idóneos para un rol en actividad
   */
  public sugerirRol: RequestHandler = async (req: Request, res: Response) => {
    const { rol_id, fecha } = req.body;
    const serviceResponse = await candidatosService.sugerirParaRol(rol_id, fecha);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Sugiere candidatos idóneos para un cargo en grupo
   */
  public sugerirCargo: RequestHandler = async (req: Request, res: Response) => {
    const { cargo_id } = req.body;
    const serviceResponse = await candidatosService.sugerirParaCargo(cargo_id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const candidatosController = new CandidatosController();
