import type { Group } from "@/api/group/groupModel";

export const groups: Group[] = [
  {
    id: 1,
    name: "group1",
    description: "description for group1",
    createdAt: new Date(),
    updatedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
  },
  {
    id: 2,
    name: "group2",
    description: "description for group2",
    createdAt: new Date(),
    updatedAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days later
  },
];

export class GroupRepository {
  async findAllAsync(): Promise<Group[]> {
    return groups;
  }

  async findByIdAsync(id: number): Promise<Group | null> {
    return groups.find((group) => group.id === id) || null;
  }
  async createAsync(
    data: Omit<Group, "id" | "createdAt" | "updatedAt">
  ): Promise<Group> {
    const newGroup: Group = {
      id: groups.length + 1,
      name: data.name,
      description: data.description,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    groups.push(newGroup);
    return newGroup;
  }

  async deleteByIdAsync(id: number): Promise<boolean> {
    const index = groups.findIndex((group) => group.id === id);

    if (index === -1) {
      return false;
    }

    groups.splice(index, 1);
    return true;
  }

  async updateByIdAsync(
    id: number,
    data: { name: string; description?: string }
  ): Promise<Group | null> {
    const group = groups.find((g) => g.id === id);
    if (!group) return null;

    group.name = data.name;
    group.description = data.description ?? group.description;
    group.updatedAt = new Date();

    return group;
  }
}
