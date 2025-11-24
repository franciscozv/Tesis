import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { IglesiasRepository } from './iglesiasRepository';
import type { Iglesia, IglesiaConPadre } from './iglesiasModel';

export class IglesiasService {
  private iglesiasRepository: IglesiasRepository;

  constructor(repository: IglesiasRepository = new IglesiasRepository()) {
    this.iglesiasRepository = repository;
  }

  /**
   * Obtiene todas las iglesias activas
   */
  async findAll(): Promise<ServiceResponse<Iglesia[] | null>> {
    try {
      const iglesias = await this.iglesiasRepository.findAllAsync();

      if (!iglesias || iglesias.length === 0) {
        return ServiceResponse.failure('No se encontraron iglesias', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Iglesia[]>('Iglesias encontradas', iglesias);
    } catch (error) {
      const errorMessage = `Error al obtener iglesias: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener iglesias',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene solo los templos centrales
   */
  async findTemplos(): Promise<ServiceResponse<Iglesia[] | null>> {
    try {
      const templos = await this.iglesiasRepository.findTemplosAsync();

      if (!templos || templos.length === 0) {
        return ServiceResponse.failure(
          'No se encontraron templos centrales',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<Iglesia[]>('Templos centrales encontrados', templos);
    } catch (error) {
      const errorMessage = `Error al obtener templos: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener templos centrales',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene los locales de un templo específico
   */
  async findLocalesByTemplo(iglesia_id: number): Promise<ServiceResponse<Iglesia[] | null>> {
    try {
      // Verificar que el templo exista
      const temploExists = await this.iglesiasRepository.existsAndActiveAsync(iglesia_id);
      if (!temploExists) {
        return ServiceResponse.failure('Templo no encontrado', null, StatusCodes.NOT_FOUND);
      }

      const locales = await this.iglesiasRepository.findLocalesByTemploAsync(iglesia_id);

      if (!locales || locales.length === 0) {
        return ServiceResponse.failure(
          'No se encontraron locales para este templo',
          null,
          StatusCodes.NOT_FOUND
        );
      }

      return ServiceResponse.success<Iglesia[]>('Locales encontrados', locales);
    } catch (error) {
      const errorMessage = `Error al obtener locales: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener locales del templo',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Obtiene una iglesia por ID (con info del templo padre si aplica)
   */
  async findById(id: number): Promise<ServiceResponse<IglesiaConPadre | null>> {
    try {
      const iglesia = await this.iglesiasRepository.findByIdAsync(id);

      if (!iglesia) {
        return ServiceResponse.failure('Iglesia no encontrada', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<IglesiaConPadre>('Iglesia encontrada', iglesia);
    } catch (error) {
      const errorMessage = `Error al obtener iglesia: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al obtener iglesia',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Crea una nueva iglesia (templo o local)
   */
  async create(
    iglesiaData: Omit<Iglesia, 'id_iglesia' | 'created_at' | 'updated_at' | 'activo'>
  ): Promise<ServiceResponse<Iglesia | null>> {
    try {
      // Si tiene iglesia_padre_id, validar que exista y esté activo
      if (iglesiaData.iglesia_padre_id) {
        const padreExists = await this.iglesiasRepository.existsAndActiveAsync(
          iglesiaData.iglesia_padre_id
        );
        if (!padreExists) {
          return ServiceResponse.failure(
            'El templo padre especificado no existe o no está activo',
            null,
            StatusCodes.BAD_REQUEST
          );
        }
      }

      const iglesia = await this.iglesiasRepository.createAsync(iglesiaData);
      return ServiceResponse.success<Iglesia>(
        'Iglesia creada exitosamente',
        iglesia,
        StatusCodes.CREATED
      );
    } catch (error) {
      const errorMessage = `Error al crear iglesia: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al crear iglesia',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Actualiza una iglesia existente
   */
  async update(id: number, iglesiaData: Partial<Iglesia>): Promise<ServiceResponse<Iglesia | null>> {
    try {
      // Si se está actualizando iglesia_padre_id
      if (iglesiaData.iglesia_padre_id !== undefined) {
        // No permitir que un templo se convierta en local de sí mismo
        if (iglesiaData.iglesia_padre_id === id) {
          return ServiceResponse.failure(
            'Una iglesia no puede ser su propio templo padre',
            null,
            StatusCodes.BAD_REQUEST
          );
        }

        // Si tiene valor (no es null), validar que exista y esté activo
        if (iglesiaData.iglesia_padre_id !== null) {
          const padreExists = await this.iglesiasRepository.existsAndActiveAsync(
            iglesiaData.iglesia_padre_id
          );
          if (!padreExists) {
            return ServiceResponse.failure(
              'El templo padre especificado no existe o no está activo',
              null,
              StatusCodes.BAD_REQUEST
            );
          }
        }
      }

      const iglesia = await this.iglesiasRepository.updateAsync(id, iglesiaData);

      if (!iglesia) {
        return ServiceResponse.failure('Iglesia no encontrada', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success<Iglesia>('Iglesia actualizada exitosamente', iglesia);
    } catch (error) {
      const errorMessage = `Error al actualizar iglesia: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al actualizar iglesia',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Elimina una iglesia (soft delete)
   * Verifica que no tenga locales activos ni eventos activos
   */
  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      // Verificar si tiene locales activos
      const hasLocales = await this.iglesiasRepository.hasActiveLocalesAsync(id);
      if (hasLocales) {
        return ServiceResponse.failure(
          'No se puede eliminar la iglesia porque tiene locales activos',
          null,
          StatusCodes.CONFLICT
        );
      }

      // Verificar si está siendo usada en eventos activos
      const hasEventos = await this.iglesiasRepository.hasActiveEventosAsync(id);
      if (hasEventos) {
        return ServiceResponse.failure(
          'No se puede eliminar la iglesia porque está siendo usada en eventos activos',
          null,
          StatusCodes.CONFLICT
        );
      }

      const deleted = await this.iglesiasRepository.deleteAsync(id);

      if (!deleted) {
        return ServiceResponse.failure('Iglesia no encontrada', null, StatusCodes.NOT_FOUND);
      }

      return ServiceResponse.success('Iglesia eliminada exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar iglesia: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure(
        'Error al eliminar iglesia',
        null,
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }
}

export const iglesiasService = new IglesiasService();
