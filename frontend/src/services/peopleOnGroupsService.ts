import { env } from "~/env";
import { del, get, post, put } from "./api";

const PEOPLE_ON_GROUPS_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/people-on-groups`;

export const addPersonToGroup = async (data: {
  personId: number;
  groupId: number;
}) => {
  return await post(PEOPLE_ON_GROUPS_API_URL, data);
};

export const getPeopleInGroup = async (groupId: number) => {
  return await get(`${PEOPLE_ON_GROUPS_API_URL}/${groupId}`);
};

export const removePersonFromGroup = async (personId: number, groupId: number) => {
  return await del(`${PEOPLE_ON_GROUPS_API_URL}/${groupId}/${personId}`);
};

export const updatePersonInGroup = async (
  personId: number,
  groupId: number,
  data: { status?: string }
) => {
  const response = await put(
    `${PEOPLE_ON_GROUPS_API_URL}/${groupId}/${personId}`,
    data
  );
  return response.responseObject;
};
