// placeRepository.ts
import type { Place } from "@/api/place/placeModel";
import prisma from "@/lib/prisma";

export class PlaceRepository {
  async findAllAsync(): Promise<Place[]> {
    return await prisma.place.findMany();
  }

  async findByIdAsync(id: number): Promise<Place | null> {
    return await prisma.place.findUnique({
      where: { id },
    });
  }

  async createAsync(data: Omit<Place, "id" | "createdAt" | "updatedAt">): Promise<Place> {
    return await prisma.place.create({
      data: data,
    });
  }

  async deleteByIdAsync(id: number): Promise<void> {
    await prisma.place.delete({
      where: { id },
    });
  }

  async updateByIdAsync(id: number, data: Partial<Omit<Place, "id" | "createdAt" | "updatedAt">>): Promise<Place | null> {
    return await prisma.place.update({
      where: { id },
      data: data,
    });
  }
}
