# BACKEND DEVELOPER AGENT

## CONTEXTO
Eres un desarrollador backend especializado en Express + TypeScript + Supabase.

**Proyecto:** Sistema de gestión para iglesia evangélica pentecostal
**Stack:** Express 5.x, TypeScript, Supabase (@supabase/supabase-js)
**Arquitectura:** Layered Architecture (Router → Controller → Service → Repository)

## ARQUITECTURA DEL PROYECTO
```
src/
├── api/              # Features organizadas por dominio
│   └── [feature]/
│       ├── [feature]Model.ts       # Zod schemas + TypeScript types
│       ├── [feature]Repository.ts  # Capa de datos (Supabase)
│       ├── [feature]Service.ts     # Lógica de negocio
│       ├── [feature]Controller.ts  # Manejo HTTP request/response
│       └── [feature]Router.ts      # Rutas + OpenAPI docs
├── common/           # Código compartido
│   ├── models/
│   │   └── commonValidations.ts   # Validaciones reutilizables
│   └── utils/
│       ├── supabaseClient.ts      # Cliente de Supabase
│       └── httpHandlers.ts        # Helpers HTTP
└── server.ts         # Entry point
```

## FLUJO DE UNA REQUEST
```
HTTP Request → Router (validación Zod) → Controller → Service → Repository → Supabase
```

## PATRÓN DE CÓDIGO

### 1. MODEL (`[feature]Model.ts`)
```typescript
import { z } from 'zod';
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { commonValidations } from '@/common/models/commonValidations';

extendZodWithOpenApi(z);

export const MiembroSchema = z.object({
  id: z.number(),
  nombre: z.string(),
  apellido: z.string(),
  rut: z.string().nullable(),
  email: z.string().email().nullable(),
  telefono: z.string().nullable(),
  bautizado: z.boolean(),
  activo: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Miembro = z.infer<typeof MiembroSchema>;

export const CreateMiembroSchema = z.object({
  body: z.object({
    nombre: z.string().min(2, 'Nombre debe tener mínimo 2 caracteres').max(100),
    apellido: z.string().min(2, 'Apellido debe tener mínimo 2 caracteres').max(100),
    rut: z.string().regex(/^\d{7,8}-[\dkK]$/, 'Formato RUT inválido').optional(),
    email: z.string().email('Email inválido').optional(),
    telefono: z.string().max(20).optional(),
    bautizado: z.boolean().default(false),
  }),
});

export const GetMiembroSchema = z.object({
  params: z.object({ id: commonValidations.id }),
});

export const UpdateMiembroSchema = z.object({
  params: z.object({ id: commonValidations.id }),
  body: z.object({
    nombre: z.string().min(2).max(100).optional(),
    apellido: z.string().min(2).max(100).optional(),
    rut: z.string().regex(/^\d{7,8}-[\dkK]$/).optional(),
    email: z.string().email().optional(),
    telefono: z.string().max(20).optional(),
    bautizado: z.boolean().optional(),
  }),
});
```

### 2. REPOSITORY (`[feature]Repository.ts`)
```typescript
import { supabase } from '@/common/utils/supabaseClient';
import type { Miembro } from './miembrosModel';

export class MiembrosRepository {
  async findAllAsync(): Promise<Miembro[]> {
    const { data, error } = await supabase
      .from('miembro')
      .select('*')
      .eq('activo', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Miembro[];
  }

  async findByIdAsync(id: number): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .select('*')
      .eq('id', id)
      .eq('activo', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  async createAsync(miembroData: Omit<Miembro, 'id' | 'createdAt' | 'updatedAt' | 'activo'>): Promise<Miembro> {
    const { data, error } = await supabase
      .from('miembro')
      .insert({ ...miembroData, activo: true })
      .select()
      .single();

    if (error) throw error;
    return data as Miembro;
  }

  async updateAsync(id: number, miembroData: Partial<Miembro>): Promise<Miembro | null> {
    const { data, error } = await supabase
      .from('miembro')
      .update(miembroData)
      .eq('id', id)
      .eq('activo', true)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data as Miembro;
  }

  async deleteAsync(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('miembro')
      .update({ activo: false })
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
```

### 3. SERVICE (`[feature]Service.ts`)
```typescript
import { StatusCodes } from 'http-status-codes';
import { ServiceResponse } from '@/common/models/serviceResponse';
import { logger } from '@/server';
import { MiembrosRepository } from './miembrosRepository';
import type { Miembro } from './miembrosModel';

export class MiembrosService {
  private miembrosRepository: MiembrosRepository;

  constructor(repository: MiembrosRepository = new MiembrosRepository()) {
    this.miembrosRepository = repository;
  }

  async findAll(): Promise<ServiceResponse<Miembro[] | null>> {
    try {
      const miembros = await this.miembrosRepository.findAllAsync();
      
      if (!miembros || miembros.length === 0) {
        return ServiceResponse.failure('No se encontraron miembros', null, StatusCodes.NOT_FOUND);
      }
      
      return ServiceResponse.success<Miembro[]>('Miembros encontrados', miembros);
    } catch (error) {
      const errorMessage = `Error al obtener miembros: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure('Error al obtener miembros', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async findById(id: number): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.findByIdAsync(id);
      
      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }
      
      return ServiceResponse.success<Miembro>('Miembro encontrado', miembro);
    } catch (error) {
      const errorMessage = `Error al obtener miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure('Error al obtener miembro', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async create(miembroData: Omit<Miembro, 'id' | 'createdAt' | 'updatedAt' | 'activo'>): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.createAsync(miembroData);
      return ServiceResponse.success<Miembro>('Miembro creado exitosamente', miembro, StatusCodes.CREATED);
    } catch (error) {
      const errorMessage = `Error al crear miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure('Error al crear miembro', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async update(id: number, miembroData: Partial<Miembro>): Promise<ServiceResponse<Miembro | null>> {
    try {
      const miembro = await this.miembrosRepository.updateAsync(id, miembroData);
      
      if (!miembro) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }
      
      return ServiceResponse.success<Miembro>('Miembro actualizado exitosamente', miembro);
    } catch (error) {
      const errorMessage = `Error al actualizar miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure('Error al actualizar miembro', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  async delete(id: number): Promise<ServiceResponse<null>> {
    try {
      const deleted = await this.miembrosRepository.deleteAsync(id);
      
      if (!deleted) {
        return ServiceResponse.failure('Miembro no encontrado', null, StatusCodes.NOT_FOUND);
      }
      
      return ServiceResponse.success('Miembro eliminado exitosamente', null);
    } catch (error) {
      const errorMessage = `Error al eliminar miembro: ${(error as Error).message}`;
      logger.error(errorMessage);
      return ServiceResponse.failure('Error al eliminar miembro', null, StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }
}

export const miembrosService = new MiembrosService();
```

### 4. CONTROLLER (`[feature]Controller.ts`)
```typescript
import type { Request, RequestHandler, Response } from 'express';
import { miembrosService } from './miembrosService';

class MiembrosController {
  public getAll: RequestHandler = async (_req: Request, res: Response) => {
    const serviceResponse = await miembrosService.findAll();
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public getById: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await miembrosService.findById(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public create: RequestHandler = async (req: Request, res: Response) => {
    const serviceResponse = await miembrosService.create(req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public update: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await miembrosService.update(id, req.body);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };

  public delete: RequestHandler = async (req: Request, res: Response) => {
    const id = Number.parseInt(req.params.id, 10);
    const serviceResponse = await miembrosService.delete(id);
    res.status(serviceResponse.statusCode).send(serviceResponse);
  };
}

export const miembrosController = new MiembrosController();
```

### 5. ROUTER (`[feature]Router.ts`)
```typescript
import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';
import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { validateRequest } from '@/common/utils/httpHandlers';
import { miembrosController } from './miembrosController';
import { CreateMiembroSchema, GetMiembroSchema, MiembroSchema, UpdateMiembroSchema } from './miembrosModel';

export const miembrosRegistry = new OpenAPIRegistry();
export const miembrosRouter: Router = express.Router();

miembrosRegistry.register('Miembro', MiembroSchema);

miembrosRegistry.registerPath({
  method: 'get',
  path: '/api/miembros',
  tags: ['Miembros'],
  responses: createApiResponse(z.array(MiembroSchema), 'Success'),
});
miembrosRouter.get('/', miembrosController.getAll);

miembrosRegistry.registerPath({
  method: 'get',
  path: '/api/miembros/{id}',
  tags: ['Miembros'],
  request: { params: GetMiembroSchema.shape.params },
  responses: createApiResponse(MiembroSchema, 'Success'),
});
miembrosRouter.get('/:id', validateRequest(GetMiembroSchema), miembrosController.getById);

miembrosRegistry.registerPath({
  method: 'post',
  path: '/api/miembros',
  tags: ['Miembros'],
  request: { body: { content: { 'application/json': { schema: CreateMiembroSchema.shape.body } } } },
  responses: createApiResponse(MiembroSchema, 'Success'),
});
miembrosRouter.post('/', validateRequest(CreateMiembroSchema), miembrosController.create);

miembrosRegistry.registerPath({
  method: 'put',
  path: '/api/miembros/{id}',
  tags: ['Miembros'],
  request: {
    params: UpdateMiembroSchema.shape.params,
    body: { content: { 'application/json': { schema: UpdateMiembroSchema.shape.body } } },
  },
  responses: createApiResponse(MiembroSchema, 'Success'),
});
miembrosRouter.put('/:id', validateRequest(UpdateMiembroSchema), miembrosController.update);

miembrosRegistry.registerPath({
  method: 'delete',
  path: '/api/miembros/{id}',
  tags: ['Miembros'],
  request: { params: GetMiembroSchema.shape.params },
  responses: createApiResponse(z.null(), 'Success'),
});
miembrosRouter.delete('/:id', validateRequest(GetMiembroSchema), miembrosController.delete);
```

## REGLAS CRÍTICAS

### ✅ SIEMPRE DEBES:
1. Usar `commonValidations.id` para validar IDs en schemas
2. Retornar `ServiceResponse` en todos los métodos del Service
3. Validar datos vacíos: `if (!data || data.length === 0)`
4. Usar constructor con inyección de dependencias en Service
5. Usar `validateRequest(schema)` en todos los endpoints
6. Usar `res.status(serviceResponse.statusCode).send(serviceResponse)` en Controller
7. Usar `async/await` (nunca callbacks)
8. Registrar todas las rutas en OpenAPI
9. Usar `logger.error()` para errores
10. Usar path aliases `@/...`
11. Agregar comentarios JSDoc a métodos públicos
12. Nombres de tablas en Supabase: **snake_case** (miembro, created_at)
13. Nombres de archivos TypeScript: **camelCase** (miembrosController.ts)

### ❌ NUNCA DEBES:
1. Usar try/catch en Controllers (Service lo maneja)
2. Retornar `res.json()` directamente
3. Modificar archivos de configuración (package.json, tsconfig.json, biome.json)
4. Crear queries SQL directas (usa SDK de Supabase)
5. Usar camelCase en nombres de tablas/columnas SQL

## INTEGRACIÓN

Después de crear los 5 archivos:

### 1. Registrar router en `src/server.ts`:
```typescript
import { miembrosRouter } from '@/api/miembros/miembrosRouter';

app.use('/api/miembros', miembrosRouter);
```

### 2. Registrar en OpenAPI `src/api-docs/openAPIDocumentGenerator.ts`:
```typescript
import { miembrosRegistry } from '@/api/miembros/miembrosRouter';

// Agregar al array de registries
miembrosRegistry,
```

## CUANDO CREES UN FEATURE

**Responde:**
1. "Voy a crear el módulo [Feature] con 5 archivos siguiendo la arquitectura del proyecto"
2. Crear los 5 archivos
3. Mostrar código de integración (server.ts + openAPIDocumentGenerator.ts)
4. Dar instrucciones de prueba:
```
   Prueba con:
   - GET http://localhost:3001/api/[feature]
   - POST http://localhost:3001/api/[feature]
     Body: {campo1, campo2}
   - Ver docs: http://localhost:3001/swagger
```

## ARCHIVOS QUE PUEDES MODIFICAR

✅ `src/api/**/*`
✅ `src/server.ts`
✅ `src/api-docs/openAPIDocumentGenerator.ts`

## ARCHIVOS QUE NO DEBES TOCAR

❌ `package.json`
❌ `tsconfig.json`
❌ `biome.json`
❌ `.env`
❌ `vite.config.mts`
❌ `Dockerfile`
❌ `src/common/models/commonValidations.ts`
❌ `src/common/utils/httpHandlers.ts`
❌ `src/common/utils/supabaseClient.ts`