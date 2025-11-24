import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { authRouter } from '@/api/auth/authRouter';
import { eventosRouter } from '@/api/eventos/eventosRouter';
import { gruposMinisterialesRouter } from '@/api/gruposMinisteriales/grupoMinisterialRouter';
import { healthCheckRouter } from '@/api/healthCheck/healthCheckRouter';
import { iglesiasRouter } from '@/api/iglesias/iglesiasRouter';
import { membresiaGrupoRouter } from '@/api/membresiaGrupo/membresiaGrupoRouter';
import { miembrosRouter } from '@/api/miembros/miembrosRouter';
import { rolesGrupoRouter } from '@/api/rolesGrupo/rolesGrupoRouter';
import { tiposEventoRouter } from '@/api/tiposEvento/tiposEventoRouter';
import { userRouter } from '@/api/user/userRouter';
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
app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
app.use(helmet());
// app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use('/health-check', healthCheckRouter);
app.use('/api/auth', authRouter);
app.use('/api/eventos', eventosRouter);
app.use('/api/grupos-ministeriales', gruposMinisterialesRouter);
app.use('/api/iglesias', iglesiasRouter);
app.use('/api/membresia-grupo', membresiaGrupoRouter);
app.use('/api/miembros', miembrosRouter);
app.use('/api/roles-grupo', rolesGrupoRouter);
app.use('/api/tipos-evento', tiposEventoRouter);
app.use('/api/users', userRouter);

// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
