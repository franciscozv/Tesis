import { OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import express, { type Router } from 'express';
import { z } from 'zod';

import { createApiResponse } from '@/api-docs/openAPIResponseBuilders';
import { GetPeopleRoleSchema, PeopleRoleSchema, UpdatePeopleRoleSchema, CreatePeopleRoleSchema } from '@/api/peopleRole/peopleRoleModel';
import { validateRequest } from '@/common/utils/httpHandlers';
import { peopleRoleController } from './peopleRoleController';

export const peopleRoleRegistry = new OpenAPIRegistry();
export const peopleRoleRouter: Router = express.Router();

peopleRoleRegistry.register('PeopleRole', PeopleRoleSchema);

peopleRoleRegistry.registerPath({
  method: 'get',
  path: '/people-roles',
  tags: ['PeopleRole'],
  responses: createApiResponse(z.array(PeopleRoleSchema), 'Success'),
});

peopleRoleRouter.get('/', peopleRoleController.getPeopleRoles);

peopleRoleRegistry.registerPath({
  method: 'get',
  path: '/people-roles/{id}',
  tags: ['PeopleRole'],
  request: { params: GetPeopleRoleSchema.shape.params },
  responses: createApiResponse(PeopleRoleSchema, 'Success'),
});

peopleRoleRouter.get('/:id', validateRequest(GetPeopleRoleSchema), peopleRoleController.getPeopleRole);

// OpenAPI registry
peopleRoleRegistry.registerPath({
  method: 'post',
  path: '/people-roles',
  tags: ['PeopleRole'],
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePeopleRoleSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PeopleRoleSchema, 'Created'),
});

// Express route
peopleRoleRouter.post('/', validateRequest(CreatePeopleRoleSchema), peopleRoleController.createPeopleRole);

peopleRoleRegistry.registerPath({
  method: 'delete',
  path: '/people-roles/{id}',
  tags: ['PeopleRole'],
  request: { params: GetPeopleRoleSchema.shape.params },
  responses: {
    204: {
      description: 'People role deleted successfully',
    },
    404: {
      description: 'People role not found',
    },
  },
});

peopleRoleRouter.delete('/:id', validateRequest(GetPeopleRoleSchema), peopleRoleController.deletePeopleRole);

peopleRoleRegistry.registerPath({
  method: 'put',
  path: '/people-roles/{id}',
  tags: ['PeopleRole'],
  request: {
    params: GetPeopleRoleSchema.shape.params,
    body: {
      content: {
        'application/json': {
          schema: UpdatePeopleRoleSchema.shape.body,
        },
      },
    },
  },
  responses: createApiResponse(PeopleRoleSchema, 'Updated'),
});

peopleRoleRouter.put('/:id', validateRequest(UpdatePeopleRoleSchema), peopleRoleController.updatePeopleRole);
