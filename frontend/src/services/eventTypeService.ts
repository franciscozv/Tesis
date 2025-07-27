import { env } from "~/env";
import { del, get, post, put } from "./api";

const EVENT_TYPE_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/event-type`;

export const getEventTypes = async () => {
    const response = await get(EVENT_TYPE_API_URL);
    return response.responseObject || [];
};

export const createEventType = async (eventTypeData: { name: string; description: string, color: string }) => {
    return await post(EVENT_TYPE_API_URL, eventTypeData);
};

export const updateEventType = async (id: number, eventTypeData: { name?: string; description?: string }) => {
    return await put(`${EVENT_TYPE_API_URL}/${id}`, eventTypeData);
};

export const deleteEventType = async (id: number) => {
    return await del(`${EVENT_TYPE_API_URL}/${id}`);
};