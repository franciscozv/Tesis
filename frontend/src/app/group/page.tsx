"use client";
import React, { useEffect, useState } from "react";
import { env } from "~/env";
import CreateGroupForm from "../../components/CreateGroupForm";
import EditGroupForm from "../../components/EditGroupForm";

const Page = () => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editGroup, setEditGroup] = useState(null); // Grupo a editar

  const fetchData = async () => {
    try {
      const response = await fetch(`${env.NEXT_PUBLIC_CLIENTVAR}/groups`);
      const data = await response.json();
      setGroups(data.responseObject || []);
      setLoading(false);
    } catch (error) {
      console.error("Error al obtener grupos:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: number) => {
    const confirmDelete = confirm(
      "¿Estás seguro de que deseas eliminar este grupo?"
    );
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_CLIENTVAR}/groups/${id}`, {
        method: "DELETE",
      });

      const data = await res.json(); // ✅ esto no fallará si el backend envía JSON

      if (res.ok) {
        fetchData();
      } else {
        alert(`Error al eliminar grupo: ${data.message}`);
      }
    } catch (error) {
      console.error("Error al eliminar:", error);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestión de Grupos</h1>

      {/* Formulario para editar */}
      {editGroup && (
        <EditGroupForm
          group={editGroup}
          onUpdate={() => {
            fetchData();
            setEditGroup(null);
          }}
          onCancel={() => setEditGroup(null)}
        />
      )}

      {/* Formulario para crear */}
      <CreateGroupForm onGroupCreated={fetchData} />

      {/* Lista de grupos */}
      <ul className="mt-6 space-y-4">
        {loading && <li>Cargando grupos...</li>}
        {!loading && groups.length === 0 && <li>No se encontraron grupos.</li>}
        {groups.map((group: any) => (
          <li key={group.id} className="p-4 border rounded shadow-sm bg-white">
            <div>
              <strong>Nombre:</strong> {group.name}
            </div>
            <div>
              <strong>Descripción:</strong> {group.description}
            </div>

            <div className="mt-2 flex gap-2">
              <button
                onClick={() => setEditGroup(group)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(group.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Eliminar
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Page;
