import type { Request, RequestHandler, Response } from 'express';
import { invitadosService } from './invitadosService';

/**
 * Controlador para manejar peticiones HTTP de Invitados
 */
class InvitadosController {
  /**
   * Obtiene todos los invitados con filtros opcionales
   */
  public getAll: RequestHandler = async (req: Request, res: Response) => {
    const filters = {
      actividad_id: req.query.actividad_id ? Number(req.query.actividad_id) : undefined,
      miembro_id: req.query.miembro_id ? Number(req.query.miembro_id) : undefined,
      estado: req.query.estado as string | undefined,
    };
    const serviceResponse = await invitadosService.findAll(filters);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene un invitado por ID
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await invitadosService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea una nueva invitación
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await invitadosService.create(req.body, req.usuario);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Miembro responde a una invitación
   */
  public responder: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await invitadosService.responder(
      id,
      req.body.estado,
      req.body.motivo_rechazo,
    );
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Marca la asistencia real de un invitado
   */
  public marcarAsistencia: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await invitadosService.marcarAsistencia(id, req.body.asistio);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina una invitación
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await invitadosService.delete(id, req.usuario);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const invitadosController = new InvitadosController();
