import express, { type Request, type Response, type Router } from "express";
import swaggerUi from "swagger-ui-express";

import { generateOpenAPIDocument } from "@/api-docs/openAPIDocumentGenerator";
import { env } from "@/common/utils/envConfig";
export const openAPIRouter: Router = express.Router();
const openAPIDocument = generateOpenAPIDocument();

openAPIRouter.get("/swagger.json", (_req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openAPIDocument);
});

openAPIRouter.use(
  "/",
  swaggerUi.serve,
  swaggerUi.setup(openAPIDocument, {
    swaggerOptions: {
      // Esto fuerza a Swagger UI a usar tu URL base específica
      url: `${env.SERVIDOR}/swagger.json`,
      validatorUrl: null,
    },
  })
);
