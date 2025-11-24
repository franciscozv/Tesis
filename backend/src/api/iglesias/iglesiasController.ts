import type { Request, RequestHandler, Response } from 'express';
import { iglesiasService } from './iglesiasService';

class IglesiasController {
  /**
   * Obtiene todas las iglesias activas
   */
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await iglesiasService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene solo los templos centrales (iglesia_padre_id IS NULL)
   */
  public getTemplos: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await iglesiasService.findTemplos();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene los locales de un templo específico
   */
  public getLocalesByTemplo: RequestHandler = async (req: Request, res: Response) => {
    const iglesia_id = Number.parseInt(req.params.iglesia_id, 10);
    const serviceResponse = await iglesiasService.findLocalesByTemplo(iglesia_id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Obtiene una iglesia por ID (con info del templo padre si aplica)
   */
  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await iglesiasService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Crea una nueva iglesia (templo o local)
   */
  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await iglesiasService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Actualiza una iglesia existente
   */
  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await iglesiasService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  /**
   * Elimina una iglesia (soft delete)
   */
  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await iglesiasService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const iglesiasController = new IglesiasController();
