import type { Request, RequestHandler, Response } from 'express';
import { eventosService } from './eventosService';

class EventosController {
  /**
   * Obtiene todos los eventos activos
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await eventosService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un evento por ID (con iglesias invitadas)
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await eventosService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea un nuevo evento (RF_08: Solicitar evento)
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await eventosService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Aprueba un evento
   */
  public aprobar: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { usuario_aprobador_id } = req.body;
    const serviceResponse = await eventosService.aprobar(id, usuario_aprobador_id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Rechaza un evento
   */
  public rechazar: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { usuario_aprobador_id, motivo } = req.body;
    const serviceResponse = await eventosService.rechazar(id, usuario_aprobador_id, motivo);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Cambia el estado de un evento
   */
  public cambiarEstado: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const { estado } = req.body;
    const serviceResponse = await eventosService.cambiarEstado(id, estado);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina un evento (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await eventosService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const eventosController = new EventosController();
