import { env } from "~/env";
import { del, get, post, put } from "./api";

const RESPONSIBILITY_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/responsibilities`;

export const getResponsibilities = async () => {
    const response = await get(RESPONSIBILITY_API_URL);
    return response.responseObject || [];
};

export const createResponsibility = async (responsibilityData: { name: string; description: string }) => {
    return await post(RESPONSIBILITY_API_URL, responsibilityData);
};

export const updateResponsibility = async (id: number, responsibilityData: { name?: string; description?: string }) => {
    return await put(`${RESPONSIBILITY_API_URL}/${id}`, responsibilityData);
};

export const deleteResponsibility = async (id: number) => {
    return await del(`${RESPONSIBILITY_API_URL}/${id}`);
};
