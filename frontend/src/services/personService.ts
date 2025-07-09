import { env } from "~/env";
import { del, get, post, put } from "./api";

const PERSON_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/people`;

export const getPeople = async () => {
    const response = await get(PERSON_API_URL);
    return response.responseObject || [];
};

export const createPerson = async (personData: any) => {
    return await post(PERSON_API_URL, personData);
};

export const updatePerson = async (id: number, personData: any) => {
    return await put(`${PERSON_API_URL}/${id}`, personData);
};

export const deletePerson = async (id: number) => {
    return await del(`${PERSON_API_URL}/${id}`);
};
