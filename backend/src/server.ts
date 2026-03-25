import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { actividadesRouter } from '@/api/actividades/actividadesRouter';
import { authRouter } from '@/api/auth/authRouter';
import { calendarioRouter } from '@/api/calendario/calendarioRouter';
import { candidatosRouter } from '@/api/candidatos/candidatosRouter';
import { colaboradoresRouter } from '@/api/colaboradores/colaboradoresRouter';
import { grupoRolRouter } from '@/api/grupoRol/grupoRolRouter';
import { gruposMinisterialesRouter } from '@/api/gruposMinisteriales/grupoMinisterialRouter';
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';
import { historialEstadoRouter } from '@/api/historialEstado/historialEstadoRouter';
import { integranteGrupoRouter } from '@/api/integranteGrupo/integranteGrupoRouter';
import { invitadosRouter } from '@/api/invitados/invitadosRouter';
import { miembrosRouter } from '@/api/miembros/miembrosRouter';
import { misResponsabilidadesRouter } from '@/api/misResponsabilidades/misResponsabilidadesRouter';
import { necesidadesLogisticasRouter } from '@/api/necesidadesLogisticas/necesidadesLogisticasRouter';
import { notificacionesRouter } from '@/api/notificaciones/notificacionesRouter';
import { patronesActividadRouter } from '@/api/patronesActividad/patronesActividadRouter';
import { responsabilidadesActividadRouter } from '@/api/rolesActividad/rolesActividadRouter';
import { rolesGrupoRouter } from '@/api/rolesGrupo/rolesGrupoRouter';
import { tiposActividadRouter } from '@/api/tiposActividad/tiposActividadRouter';
import { tiposNecesidadRouter } from '@/api/tiposNecesidad/tiposNecesidadRouter';
import { openAPIRouter } from '@/api-docs/openAPIRouter';
import errorHandler from '@/common/middleware/errorHandler';
// import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from '@/common/middleware/requestLogger';
import { env } from '@/common/utils/envConfig';

const logger = pino({ name: 'server start' });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set('trust proxy', true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const allowed = env.CORS_ORIGIN;
      if (allowed.includes('*') || allowed.includes(origin) || /\.vercel\.app$/.test(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  }),
);
app.use(helmet());
// app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/api/auth', authRouter);
app.use('/health-check', healthCheckRouter);
app.use('/api/actividades', actividadesRouter);
app.use('/api/calendario', calendarioRouter);
app.use('/api/candidatos', candidatosRouter);
app.use('/api/colaboradores', colaboradoresRouter);
app.use('/api/grupo-rol', grupoRolRouter);
app.use('/api/grupos', gruposMinisterialesRouter);
app.use('/api/historial-estado', historialEstadoRouter);
app.use('/api/invitados', invitadosRouter);
app.use('/api/integrantes-grupo', integranteGrupoRouter);
app.use('/api/mis-responsabilidades', misResponsabilidadesRouter);
app.use('/api/miembros', miembrosRouter);
app.use('/api/necesidades', necesidadesLogisticasRouter);
app.use('/api/patrones', patronesActividadRouter);
app.use('/api/responsabilidades-actividad', responsabilidadesActividadRouter);
app.use('/api/roles-grupo', rolesGrupoRouter);
app.use('/api/tipos-actividad', tiposActividadRouter);
app.use('/api/tipos-necesidad', tiposNecesidadRouter);
app.use('/api/notificaciones', notificacionesRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
