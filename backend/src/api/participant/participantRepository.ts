import prisma from "@/lib/prisma";
import type { Participant } from "@prisma/client";
import type { Prisma } from "@prisma/client";

export class ParticipantRepository {
  async findAllAsync(): Promise<Participant[]> {
    const participants = await prisma.participant.findMany({
      include: {
        event: true,
        person: true,
        responsibility: true,
      },
    });
    return participants;
  }

  async findByIdAsync(id: number): Promise<Participant | null> {
    return prisma.participant.findUnique({
      where: { id },
      include: {
        event: true,
        person: true,
        responsibility: true,
      },
    });
  }

  async createAsync(data: Prisma.ParticipantUncheckedCreateInput): Promise<Participant> {
    return prisma.participant.create({
      data,
    });
  }

  async updateAsync(id: number, data: Prisma.ParticipantUpdateInput): Promise<Participant> {
    return prisma.participant.update({
      where: { id },
      data,
      include: {
        event: true,
        person: true,
        responsibility: true,
      },
    });
  }

  async deleteByIdAsync(id: number): Promise<Participant | null> {
    return prisma.participant.delete({
      where: { id },
    });
  }
}
