import cors from "cors";
import express, { type Express } from "express";
import helmet from "helmet";
import { pino } from "pino";

import { openAPIRouter } from "@/api-docs/openAPIRouter";
import { healthCheckRouter } from "@/api/healthCheck/healthCheckRouter";
import { userRouter } from "@/api/user/userRouter";
import { groupRouter } from "@/api/group/groupRouter";
import { eventRouter } from "./api/event/eventRouter";
import { responsibilityRouter } from "./api/responsibility/responsibilityRouter";
import { peopleRouter } from "./api/people/peopleRouter";
import { eventTypeRouter } from "./api/eventType/eventTypeRouter";
import peopleOnGroupsRouter from "./api/peopleOnGroups/peopleOnGroupsRouter";
import errorHandler from "@/common/middleware/errorHandler";
import rateLimiter from "@/common/middleware/rateLimiter";
import requestLogger from "@/common/middleware/requestLogger";
import { env } from "@/common/utils/envConfig";

const logger = pino({ name: "server start", level: env.LOG_LEVEL });
const app: Express = express();

// Set the application to trust the reverse proxy
app.set("trust proxy", true);

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: "*", credentials: true }));
app.use(helmet());
// app.use(rateLimiter);

// Request logging
app.use(requestLogger);

// Routes
app.use("/health-check", healthCheckRouter);
app.use("/users", userRouter);
app.use("/groups", groupRouter);
app.use("/events", eventRouter);
app.use("/responsibilities", responsibilityRouter);
app.use("/people", peopleRouter);
app.use("/event-type", eventTypeRouter);
app.use("/people-on-groups", peopleOnGroupsRouter);
// Swagger UI
app.use(openAPIRouter);

// Error handlers
app.use(errorHandler());

export { app, logger };
