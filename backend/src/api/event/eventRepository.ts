import prisma from "@/lib/prisma";
import type { Event } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export class EventRepository {
	async findAllAsync(): Promise<Event[]> {
		const events = await prisma.event.findMany({
			include: {
				eventType: true,
				place: true,
			},
		});
		return events;
	}
	async findByIdAsync(id: number): Promise<Event | null> {
		return prisma.event.findUnique({
			where: { id },
			include: {
				eventType: true,
				place: true,
			},
		});
	}
	async createAsync(data: Prisma.EventCreateInput): Promise<Event> {
		return prisma.event.create({
			data,
		});
	}
	async updateAsync(id: number, data: Prisma.EventUpdateInput): Promise<Event> {
		return prisma.event.update({
			where: { id },
			data,
			include: {
				eventType: true,
				place: true,
			},
		});
	}
	async deleteByIdAsync(id: number): Promise<Event | null> {
		return prisma.event.delete({
			where: { id },
		});
	}
	async findAllPendingAsync(): Promise<Event[]> {
		return prisma.event.findMany({
			where: { state: "PENDING" },
			include: {
				eventType: true,
				place: true,
			},
		});
	}
}
