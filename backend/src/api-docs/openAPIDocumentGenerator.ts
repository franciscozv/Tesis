import { OpenAPIRegistry, OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";

import { healthCheckRegistry } from "@/api/healthCheck/healthCheckRouter";
import { userRegistry } from "@/api/user/userRouter";
import { groupRegistry } from "@/api/group/groupRouter";
import { eventRegistry } from "@/api/event/eventRouter";
import { responsibilityRegistry } from "@/api/responsibility/responsibilityRouter";
import { peopleRegistry } from "@/api/people/peopleRouter";
import { eventTypeRegistry } from "@/api/eventType/eventTypeRouter";
export type OpenAPIDocument = ReturnType<OpenApiGeneratorV3["generateDocument"]>;

export function generateOpenAPIDocument(): OpenAPIDocument {
	const registry = new OpenAPIRegistry([
		healthCheckRegistry,
		userRegistry,
		groupRegistry,
		eventRegistry,
		responsibilityRegistry,
		peopleRegistry,
		eventTypeRegistry
	]);
	const generator = new OpenApiGeneratorV3(registry.definitions);

	return generator.generateDocument({
		openapi: "3.0.0",
		info: {
			version: "1.0.0",
			title: "Swagger API",
		},
		externalDocs: {
			description: "View the raw OpenAPI Specification in JSON format",
			url: "/swagger.json",
		},
	});
}
