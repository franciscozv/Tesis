import { env } from "~/env";
import { del, get, patch, post, put } from "./api";

const EVENT_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/events`;

export type Event = {
	id: number;
	title: string;
	description: string;
	startDateTime: string;
	endDateTime: string;
	placeId: number;
	state: string;
	reviewComment?: string;
	eventTypeId: number;
	eventType?: {
		id: number;
		name: string;
		description: string;
		color: string;
	};
	place?: {
		id: number;
		name: string;
		description: string;
	};
};

export const getEvents = async (): Promise<Event[]> => {
	const response = await get(EVENT_API_URL);
	return response.responseObject || [];
};

export const getEventById = async (id: number): Promise<Event> => {
	const response = await get(`${EVENT_API_URL}/${id}`);
	return response.responseObject;
};

export const createEvent = async (
	eventData: Omit<Event, "id" | "state" | "reviewComment">,
) => {
	return await post(EVENT_API_URL, eventData);
};

export const updateEvent = async (
	id: number,
	eventData: Partial<Omit<Event, "id" | "state" | "reviewComment">>,
) => {
	return await put(`${EVENT_API_URL}/${id}`, eventData);
};

export const updateEventStatus = async (
	id: number,
	status: string,
	reviewComment?: string,
) => {
	return await patch(`${EVENT_API_URL}/${id}/status`, {
		state: status,
		reviewComment,
	});
};

export const deleteEvent = async (id: number) => {
	return await del(`${EVENT_API_URL}/${id}`);
};

export const countApprovedEventsByMonth = async () => {
	return await get(`${EVENT_API_URL}/count-by-month`);
};
