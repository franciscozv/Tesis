import { env } from "~/env";
import { del, get, patch, post, put } from "./api";

const EVENT_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/events`;

export const getEvents = async () => {
    const response = await get(EVENT_API_URL);
    return response.responseObject || [];
};

export const createEvent = async (eventData: any) => {
    return await post(EVENT_API_URL, eventData);
};

export const updateEvent = async (id: number, eventData: any) => {
    return await put(`${EVENT_API_URL}/${id}`, eventData);
};

export const updateEventStatus = async (id: number, status: string) => {
    return await patch(`${EVENT_API_URL}/${id}/status`, { state: status });
};

export const deleteEvent = async (id: number) => {
    return await del(`${EVENT_API_URL}/${id}`);
};