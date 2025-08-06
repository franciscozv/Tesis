import { z } from 'zod';

export const PeopleOnGroupsSchema = z.object({
  personId: z.number(),
  groupId: z.number(),
  status: z.string().optional(),
});

export type PeopleOnGroups = z.infer<typeof PeopleOnGroupsSchema>;