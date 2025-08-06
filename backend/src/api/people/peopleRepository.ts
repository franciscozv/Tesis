import { z } from "zod";
import { PeopleSchema, type People, type CreatePeopleInput, type UpdatePeopleInput } from "@/api/people/peopleModel";
import prisma from "@/lib/prisma";

export class PeopleRepository {
	async createAsync(data: CreatePeopleInput): Promise<People> {
		const person = await prisma.people.create({ data });
		return PeopleSchema.parse(person);
	}

	async findAllAsync(): Promise<People[]> {
		const people = await prisma.people.findMany();
		return z.array(PeopleSchema).parse(people);
	}

	async findByIdAsync(id: number): Promise<People | null> {
		const person = await prisma.people.findUnique({
			where: { id },
		});
		if (person) {
			return PeopleSchema.parse(person);
		}
		return null;
	}

	async updateByIdAsync(id: number, data: UpdatePeopleInput): Promise<People | null> {
		const person = await prisma.people.update({
			where: { id },
			data,
		});
		if (person) {
			return PeopleSchema.parse(person);
		}
		return null;
	}

	async deleteByIdAsync(id: number): Promise<People | null> {
		const person = await prisma.people.delete({
			where: { id },
		});
		if (person) {
			return PeopleSchema.parse(person);
		}
		return null;
	}
}
