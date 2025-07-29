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

  async createAsync(data: Omit<EventType, "id" | "createdAt" | "updatedAt" | "events">): Promise<EventType> {
    const newEventType = await prisma.eventType.create({
      data: {
        name: data.name,
        description: data.description,
        color: data.color,
      },
    });
    return {
      ...newEventType,
      createdAt: newEventType.createdAt,
      updatedAt: newEventType.updatedAt,
    };
  }

  async deleteByIdAsync(id: number): Promise<boolean> {
    const eventType = await prisma.eventType.findUnique({
      where: { id },
      include: { events: true },
    });

    if (!eventType) {
      throw new Error("Event type not found");
    }

    if (eventType.events.length > 0) {
      throw new Error("Cannot delete event type because it is currently in use by one or more events.");
    }

    await prisma.eventType.delete({
      where: { id },
    });

    return true;
  }

  async updateByIdAsync(
  id: number,
  data: { name: string; description: string; color: string }
): Promise<EventType | null> {
  try {
    const updatedEventType = await prisma.eventType.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        color: data.color, // <- añadido
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