import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { authRegistry } from '@/api/auth/authRouter';
import { eventosRegistry } from '@/api/eventos/eventosRouter';
import { gruposMinisterialesRegistry } from '@/api/gruposMinisteriales/grupoMinisterialRouter';
import { healthCheckRegistry } from '@/api/healthCheck/healthCheckRouter';
import { iglesiasRegistry } from '@/api/iglesias/iglesiasRouter';
import { membresiaGrupoRegistry } from '@/api/membresiaGrupo/membresiaGrupoRouter';
import { miembrosRegistry } from '@/api/miembros/miembrosRouter';
import { rolesGrupoRegistry } from '@/api/rolesGrupo/rolesGrupoRouter';
import { tiposEventoRegistry } from '@/api/tiposEvento/tiposEventoRouter';
import { userRegistry } from '@/api/user/userRouter';

export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3['generateDocument']>;

export function generateOpenAPIDocument(): OpenAPIDocument {
  const registry = new OpenAPIRegistry([
    healthCheckRegistry,
    authRegistry,
    eventosRegistry,
    gruposMinisterialesRegistry,
    iglesiasRegistry,
    membresiaGrupoRegistry,
    miembrosRegistry,
    rolesGrupoRegistry,
    tiposEventoRegistry,
    userRegistry,
  ]);
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      version: '1.0.0',
      title: 'Swagger API',
    },
    externalDocs: {
      description: 'View the raw OpenAPI Specification in JSON format',
      url: '/swagger.json',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  });
}
