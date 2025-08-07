import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";

import { commonValidations } from "@/common/utils/commonValidation";

extendZodWithOpenApi(z);

export type GroupRoleAssignment = z.infer<typeof GroupRoleAssignmentSchema>;
export const GroupRoleAssignmentSchema = z.object({
  id: z.number(),
  groupId: z.number(),
  roleId: z.number(),
  createdAt: z.date().or(z.string().datetime()),
  updatedAt: z.date().or(z.string().datetime()),
});

// Schema for assigning a role to a group
export const AssignRoleToGroupSchema = z.object({
  params: z.object({ groupId: commonValidations.id }),
  body: z.object({
    roleId: z.number(),
  }),
});

export const GetRolesForGroupSchema = z.object({
  params: z.object({ groupId: commonValidations.id }),
});

// Schema for removing a role from a group
export const RemoveRoleFromGroupSchema = z.object({
  params: z.object({
    groupId: commonValidations.id,
    roleId: commonValidations.id,
  }),
});
