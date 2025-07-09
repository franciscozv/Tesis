import type { Prisma, People } from "@prisma/client";
import prisma from "@/lib/prisma";

export class PeopleRepository {
	async createAsync(data: Prisma.PeopleCreateInput): Promise<People> {
		return prisma.people.create({ data });
	}

	async findAllAsync(): Promise<People[]> {
		return prisma.people.findMany();
	}

	async findByIdAsync(id: number): Promise<People | null> {
		return prisma.people.findUnique({
			where: { id },
		});
	}

	async updateByIdAsync(id: number, data: Prisma.PeopleUpdateInput): Promise<People | null> {
		return prisma.people.update({
			where: { id },
			data,
		});
	}

	async deleteByIdAsync(id: number): Promise<People | null> {
		return prisma.people.delete({
			where: { id },
		});
	}
}
