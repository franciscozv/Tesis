import type { Prisma, Responsibility } from "@prisma/client";
import prisma from "@/lib/prisma";

export class ResponsibilityRepository {
  async createAsync(
    data: Prisma.ResponsibilityCreateInput
  ): Promise<Responsibility> {
    return prisma.responsibility.create({ data });
  }

  async findAllAsync(): Promise<Responsibility[]> {
    return prisma.responsibility.findMany();
  }

  async findByIdAsync(id: number): Promise<Responsibility | null> {
    return prisma.responsibility.findUnique({
      where: { id },
    });
  }

  async deleteByIdAsync(id: number): Promise<Responsibility | null> {
    return prisma.responsibility.delete({
      where: { id },
    });
  }

  async updateByIdAsync(
    id: number,
    data: Prisma.ResponsibilityUpdateInput
  ): Promise<Responsibility | null> {
    return prisma.responsibility.update({
      where: { id },
      data,
    });
  }
}
