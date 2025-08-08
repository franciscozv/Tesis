// groupRepository.ts
import type { Group } from "@prisma/client";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// This type will include the group fields and the member count
const groupWithMemberCount = Prisma.validator<Prisma.GroupDefaultArgs>()({
  include: { _count: { select: { members: true } } },
});
export type GroupWithMemberCount = Prisma.GroupGetPayload<typeof groupWithMemberCount>;


export class GroupRepository {
	async findAllAsync(): Promise<Group[]> {
		return await prisma.group.findMany();
	}

    async findAllWithMemberCountAsync(): Promise<GroupWithMemberCount[]> {
        return await prisma.group.findMany({
			include: {
				_count: {
					select: { members: true },
				},
			},
		});
    }

	async findByIdAsync(id: number): Promise<Group | null> {
		return await prisma.group.findUnique({
			where: { id },
		});
	}

	async createAsync(data: Omit<Group, "id" | "createdAt" | "updatedAt">): Promise<Group> {
		return await prisma.group.create({
			data: data,
		});
	}

	async deleteByIdAsync(id: number): Promise<void> {
		const group = await prisma.group.findUnique({
			where: { id },
			include: {
				members: true,
				groupRoles: true,
			},
		});

		if (group?.members && group.members.length > 0) {
			throw new Error("Cannot delete a group with members.");
		}

		if (group?.groupRoles && group.groupRoles.length > 0) {
			await prisma.groupRoleAssignment.deleteMany({
				where: { groupId: id },
			});
		}

		await prisma.group.delete({
			where: { id },
		});
	}

	async updateByIdAsync(id: number, data: Partial<Omit<Group, "id" | "createdAt" | "updatedAt">>): Promise<Group | null> {
		return await prisma.group.update({
			where: { id },
			data: data,
		});
	}
}