import { env } from "~/env";
import { del, get, post, put } from "./api";

const PLACE_API_URL = `${env.NEXT_PUBLIC_CLIENTVAR}/places`;

export const getPlaces = async () => {
	const response = await get(PLACE_API_URL);
	return response.responseObject || [];
};

export const createPlace = async (placeData: {
	name: string;
	description: string;
	address: string;
	phones: string;
	email: string;
	photoUrl: string;
	rooms: string;
}) => {
	return await post(PLACE_API_URL, placeData);
};

export const updatePlace = async (
	id: number,
	placeData: { 
		name?: string; 
		description?: string; 
		address?: string; 
		phones?: string; 
		email?: string; 
		photoUrl?: string; 
		rooms?: string; 
	},
) => {
	return await put(`${PLACE_API_URL}/${id}`, placeData);
};

export const deletePlace = async (id: number) => {
	return await del(`${PLACE_API_URL}/${id}`);
};
