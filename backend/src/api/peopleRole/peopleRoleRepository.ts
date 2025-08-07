import type { PeopleRole } from '@/api/peopleRole/peopleRoleModel';
import  prisma  from '@/lib/prisma';

export class PeopleRoleRepository {
  async findAllAsync(): Promise<any[]> {
    return await prisma.peopleRole.findMany();
  }

  async findByIdAsync(id: number): Promise<PeopleRole | null> {
    return await prisma.peopleRole.findUnique({
      where: { id },
    });
  }

  async createAsync(data: Omit<PeopleRole, 'id' | 'createdAt' | 'updatedAt'>): Promise<PeopleRole> {
    return await prisma.peopleRole.create({
      data: data,
    });
  }

  async deleteByIdAsync(id: number): Promise<void> {
    await prisma.peopleRole.delete({
      where: { id },
    });
  }

  async updateByIdAsync(
    id: number,
    data: Partial<Omit<PeopleRole, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<PeopleRole | null> {
    return await prisma.peopleRole.update({
      where: { id },
      data: data,
    });
  }
}
