// groupRepository.ts
import type { Group } from "@/api/group/groupModel";
import prisma from "@/lib/prisma";

export class GroupRepository {
	async findAllAsync(): Promise<Group[]> {
		const groups = await prisma.group.findMany();
		return groups.map((group) => ({
			...group,
			createdAt: group.createdAt, // Prisma ya devuelve Date
			updatedAt: group.updatedAt,
		}));
	}

	async findByIdAsync(id: number): Promise<Group | null> {
		const group = await prisma.group.findUnique({
			where: { id },
		});
		return group
			? {
					...group,
					createdAt: group.createdAt,
					updatedAt: group.updatedAt,
				}
			: null;
	}

	async createAsync(data: Omit<Group, "id" | "createdAt" | "updatedAt">): Promise<Group> {
		const newGroup = await prisma.group.create({
			data: {
				name: data.name,
				description: data.description,
			},
		});
		return {
			...newGroup,
			createdAt: newGroup.createdAt,
			updatedAt: newGroup.updatedAt,
		};
	}

	async deleteByIdAsync(id: number): Promise<boolean> {
		try {
			await prisma.group.delete({
				where: { id },
			});
			return true;
		} catch (error) {
			return false;
		}
	}

	async updateByIdAsync(id: number, data: { name: string; description?: string }): Promise<Group | null> {
		try {
			const updatedGroup = await prisma.group.update({
				where: { id },
				data: {
					name: data.name,
					description: data.description,
				},
			});
			return {
				...updatedGroup,
				createdAt: updatedGroup.createdAt,
				updatedAt: updatedGroup.updatedAt,
			};
		} catch (error) {
			return null;
		}
	}
}
