import { env } from "~/env";
import { del, get, post, put } from "./api";

const GROUP_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/groups`;

export const getGroups = async () => {
	const response = await get(GROUP_API_URL);
	return response.responseObject || [];
};

export const createGroup = async (groupData: {
	name: string;
	description: string;
}) => {
	return await post(GROUP_API_URL, groupData);
};

export const updateGroup = async (
	id: number,
	groupData: { name?: string; description?: string },
) => {
	const response = await put(`${GROUP_API_URL}/${id}`, groupData);
	return response.responseObject; // Asume que el objeto actualizado está en responseObject
};

export const deleteGroup = async (id: number) => {
	return await del(`${GROUP_API_URL}/${id}`);
};
