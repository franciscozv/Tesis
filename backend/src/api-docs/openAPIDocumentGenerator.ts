import { OpenAPIRegistry, OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { actividadesRegistry } from '@/api/actividades/actividadesRouter';
import { authRegistry } from '@/api/auth/authRouter';
import { calendarioRegistry } from '@/api/calendario/calendarioRouter';
import { candidatosRegistry } from '@/api/candidatos/candidatosRouter';
import { colaboradoresRegistry } from '@/api/colaboradores/colaboradoresRouter';
import { gruposMinisterialesRegistry } from '@/api/gruposMinisteriales/grupoMinisterialRouter';
import { healthCheckRegistry } from '@/api/healthCheck/healthCheckRouter';
import { historialEstadoRegistry } from '@/api/historialEstado/historialEstadoRouter';
import { historialRolGrupoRegistry } from '@/api/historialRolGrupo/historialRolGrupoRouter';
import { invitadosRegistry } from '@/api/invitados/invitadosRouter';
import { membresiaGrupoRegistry } from '@/api/membresiaGrupo/membresiaGrupoRouter';
import { miembrosRegistry } from '@/api/miembros/miembrosRouter';
import { misResponsabilidadesRegistry } from '@/api/misResponsabilidades/misResponsabilidadesRouter';
import { necesidadesLogisticasRegistry } from '@/api/necesidadesLogisticas/necesidadesLogisticasRouter';
import { patronesActividadRegistry } from '@/api/patronesActividad/patronesActividadRouter';
import { rolesActividadRegistry } from '@/api/rolesActividad/rolesActividadRouter';
import { rolesGrupoRegistry } from '@/api/rolesGrupo/rolesGrupoRouter';
import { tiposActividadRegistry } from '@/api/tiposActividad/tiposActividadRouter';
import { tiposNecesidadRegistry } from '@/api/tiposNecesidad/tiposNecesidadRouter';
import { usuariosRegistry } from '@/api/usuarios/usuariosRouter';

export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3['generateDocument']>;

export function generateOpenAPIDocument(): OpenAPIDocument {
  const registry = new OpenAPIRegistry([
    authRegistry,
    healthCheckRegistry,
    actividadesRegistry,
    calendarioRegistry,
    candidatosRegistry,
    colaboradoresRegistry,
    gruposMinisterialesRegistry,
    historialEstadoRegistry,
    historialRolGrupoRegistry,
    invitadosRegistry,
    membresiaGrupoRegistry,
    misResponsabilidadesRegistry,
    miembrosRegistry,
    necesidadesLogisticasRegistry,
    patronesActividadRegistry,
    rolesActividadRegistry,
    rolesGrupoRegistry,
    tiposActividadRegistry,
    tiposNecesidadRegistry,
    usuariosRegistry,
  ]);

  // Registrar el esquema de seguridad en el registry
  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
    description: 'Ingresa tu token JWT (obtenerlo desde /api/auth/login)',
  });

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
    security: [{ bearerAuth: [] }],
  });
}
