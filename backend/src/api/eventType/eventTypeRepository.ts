import type { EventType } from "@/api/eventType/eventTypeModel";
import prisma from "@/lib/prisma";


export class EventTypeRepository {
  async findAllAsync(): Promise<EventType[]> {
    const eventTypes = await prisma.eventType.findMany();
    return eventTypes.map((eventType) => ({
      ...eventType,
      createdAt: eventType.createdAt, // Prisma ya devuelve Date
      updatedAt: eventType.updatedAt,
    }));
  }

  async findByIdAsync(id: number): Promise<EventType | null> {
    const eventType = await prisma.eventType.findUnique({
      where: { id },
    });
    return eventType
      ? {
          ...eventType,
          createdAt: eventType.createdAt,
          updatedAt: eventType.updatedAt,
        }
      : null;
  }

  async createAsync(data: Omit<EventType, "id" | "createdAt" | "updatedAt">): Promise<EventType> {
    const newEventType = await prisma.eventType.create({
      data: {
        name: data.name,
        description: data.description,
      },
    });
    return {
      ...newEventType,
      createdAt: newEventType.createdAt,
      updatedAt: newEventType.updatedAt,
    };
  }

  async deleteByIdAsync(id: number): Promise<boolean> {
    try {
      await prisma.eventType.delete({
        where: { id },
      });
      return true;
    } catch (error) {
      return false;
    }
  }

  async updateByIdAsync(id: number, data: { name: string; description: string }): Promise<EventType | null> {
    try {
      const updatedEventType = await prisma.eventType.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
        },
      });
      return {
        ...updatedEventType,
        createdAt: updatedEventType.createdAt,
        updatedAt: updatedEventType.updatedAt,
      };
    } catch (error) {
      return null;
    }
  }
}