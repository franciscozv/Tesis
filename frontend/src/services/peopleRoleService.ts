import { env } from "~/env";
import { del, get, post, put } from "./api";
import type { PeopleRole } from "~/types/peopleRole";

const PEOPLE_ROLE_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/people-roles`;

export const getPeopleRoles = async (): Promise<PeopleRole[]> => {
  const response = await get(PEOPLE_ROLE_API_URL);
  return response.responseObject || [];
};

export const getPeopleRole = async (id: number): Promise<PeopleRole> => {
  const response = await get(`${PEOPLE_ROLE_API_URL}/${id}`);
  return response.responseObject;
};

export const createPeopleRole = async (data: Omit<PeopleRole, "id" | "createdAt" | "updatedAt">): Promise<PeopleRole> => {
  return await post(PEOPLE_ROLE_API_URL, data);
};

export const updatePeopleRole = async (id: number, data: Partial<Omit<PeopleRole, "id" | "createdAt" | "updatedAt">>): Promise<PeopleRole> => {
  return await put(`${PEOPLE_ROLE_API_URL}/${id}`, data);
};

export const deletePeopleRole = async (id: number): Promise<void> => {
  return await del(`${PEOPLE_ROLE_API_URL}/${id}`);
};