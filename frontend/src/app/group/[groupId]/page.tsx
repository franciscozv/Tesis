"use client";

import { getGroup } from "~/services/groupService";
import { getPeopleInGroup, addPersonToGroup } from "~/services/peopleOnGroupsService";
import { getPeople } from "~/services/personService";
import { useEffect, useState } from "react";
import { useParams } from 'next/navigation';

export default function GroupDetailsPage() {
  const params = useParams();
  const groupId = parseInt(params.groupId as string, 10);
  const [group, setGroup] = useState<any>(null);
  const [peopleInGroup, setPeopleInGroup] = useState<any[]>([]);
  const [allPeople, setAllPeople] = useState<any[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<string>("");

  useEffect(() => {
    const fetchGroupData = async () => {
      const groupData = await getGroup(groupId);
      setGroup(groupData);
      const peopleInGroupData = await getPeopleInGroup(groupId);
      setPeopleInGroup(peopleInGroupData);
      const allPeopleData = await getPeople();
      setAllPeople(allPeopleData);
    };
    if (groupId) {
      fetchGroupData();
    }
  }, [groupId]);

  const handleAddPerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPerson) {
      await addPersonToGroup({ personId: parseInt(selectedPerson, 10), groupId });
      const peopleInGroupData = await getPeopleInGroup(groupId);
      setPeopleInGroup(peopleInGroupData);
      setSelectedPerson("");
    }
  };

  if (!group) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <h1>{group.name}</h1>
      <p>{group.description}</p>
      <h2>Members</h2>
      <ul>
        {peopleInGroup.map((person: any) => (
          <li key={person.person.id}>{person.person.firstname} {person.person.lastname}</li>
        ))}
      </ul>
      <form onSubmit={handleAddPerson}>
        <select value={selectedPerson} onChange={(e) => setSelectedPerson(e.target.value)}>
          <option value="">Select a person</option>
          {allPeople.map((person: any) => (
            <option key={person.id} value={person.id}>
              {person.firstname} {person.lastname}
            </option>
          ))}
        </select>
        <button type="submit">Add Person</button>
      </form>
    </div>
  );
}