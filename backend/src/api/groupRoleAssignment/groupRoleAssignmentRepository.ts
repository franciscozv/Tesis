import type { GroupRoleAssignment } from "@/api/groupRoleAssignment/groupRoleAssignmentModel";
import prisma from "@/lib/prisma";

export class GroupRoleAssignmentRepository {
  async assignRoleToGroupAsync(groupId: number, roleId: number): Promise<GroupRoleAssignment> {
    return await prisma.groupRoleAssignment.create({
      data: {
        groupId,
        roleId,
      },
    });
  }

  async removeRoleFromGroupAsync(groupId: number, roleId: number): Promise<void> {
    await prisma.groupRoleAssignment.deleteMany({
      where: {
        groupId,
        roleId,
      },
    });
  }

  async getRolesForGroupAsync(groupId: number): Promise<any[]> {
    return await prisma.groupRoleAssignment.findMany({
      where: { groupId },
      include: { role: true },
    });
  }
}
