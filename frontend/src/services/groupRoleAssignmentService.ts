
import { env } from "~/env";
import { del, get, post } from "./api";

const GROUP_ROLE_ASSIGNMENT_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/groups`;

export const getRolesForGroup = async (groupId: number) => {
  const response = await get(`${GROUP_ROLE_ASSIGNMENT_API_URL}/${groupId}/roles`);
  return response.responseObject || [];
};

export const assignRoleToGroup = async (groupId: number, roleId: number) => {
  return await post(`${GROUP_ROLE_ASSIGNMENT_API_URL}/${groupId}/roles`, { roleId });
};

export const removeRoleFromGroup = async (groupId: number, roleId: number) => {
  return await del(`${GROUP_ROLE_ASSIGNMENT_API_URL}/${groupId}/roles/${roleId}`);
};
