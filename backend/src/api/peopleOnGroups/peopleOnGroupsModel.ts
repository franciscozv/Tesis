import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type PeopleOnGroups = z.infer<typeof PeopleOnGroupsSchema>;
export const PeopleOnGroupsSchema = z.object({
  personId: z.number(),
  groupId: z.number(),
  personRoleId: z.number(),
  assignedAt: z.date().or(z.string().datetime()),
  status: z.string(),
});

export const GetPeopleInGroupSchema = z.object({
  params: z.object({ groupId: commonValidations.id }),
});

// Input Validation for 'POST /groups/:groupId/people' endpoint
export const AddPersonToGroupSchema = z.object({
  params: z.object({ groupId: commonValidations.id }),
  body: z.object({
    personId: z.number(),
    personRoleId: z.number(),
  }),
});

// Input Validation for 'DELETE /groups/:groupId/people/:personId' endpoint
export const RemovePersonFromGroupSchema = z.object({
  params: z.object({
    groupId: commonValidations.id,
    personId: commonValidations.id,
  }),
});

// Input Validation for 'PUT /groups/:groupId/people/:personId' endpoint
export const UpdatePersonInGroupSchema = z.object({
  params: z.object({
    groupId: commonValidations.id,
    personId: commonValidations.id,
  }),
  body: z.object({
    personRoleId: z.number().optional(),
    status: z.string().optional(),
  }),
});
