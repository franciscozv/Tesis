import prisma from "@/lib/prisma";
import type { PostEvent, Prisma } from "@prisma/client";

export class PostEventRepository {
  async createAsync(data: Prisma.PostEventCreateInput): Promise<PostEvent> {
    return prisma.postEvent.create({
      data,
    });
  }

  async findByEventId(eventId: number): Promise<PostEvent[] | null> {
    return prisma.postEvent.findMany({
      where: { eventId },
    });
  }
}
