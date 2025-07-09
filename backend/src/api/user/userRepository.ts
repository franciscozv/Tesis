import type { Prisma, User } from "@prisma/client";
import prisma from "@/lib/prisma";
export class UserRepository {
	async createAsync(data: Prisma.UserCreateInput): Promise<User> {
		return prisma.user.create({ data });
	}
	async findAllAsync(): Promise<User[]> {
		return prisma.user.findMany();
	}
	async findByIdAsync(id: number): Promise<User | null> {
		return prisma.user.findUnique({
			where: { id },
		});
	}
	async deleteByIdAsync(id: number): Promise<User | null> {
		return prisma.user.delete({
			where: { id },
		});
	}
}
