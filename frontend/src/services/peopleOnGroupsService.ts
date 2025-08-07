import { env } from "~/env";
import { del, get, post, put } from "./api";

const GROUP_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/groups`;

export const addPersonToGroup = async (data: {
  personId: number;
  groupId: number;
  personRoleId: number;
}) => {
  return await post(`${GROUP_API_URL}/${data.groupId}/people`, { personId: data.personId, personRoleId: data.personRoleId });
};

export const getPeopleInGroup = async (groupId: number) => {
  const result = await get(`${GROUP_API_URL}/${groupId}/people`);
  return result.responseObject;
};

export const removePersonFromGroup = async (personId: number, groupId: number) => {
  return await del(`${GROUP_API_URL}/${groupId}/people/${personId}`);
};

export const updatePersonInGroup = async (
  personId: number,
  groupId: number,
  data: { status?: string }
) => {
  const response = await put(
    `${GROUP_API_URL}/${groupId}/people/${personId}`,
    data
  );
  return response.responseObject;
};
