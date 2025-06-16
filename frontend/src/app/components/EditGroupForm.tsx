"use client";
import React, { useState } from "react";
import { env } from "~/env";

type Props = {
  group: {
    id: number;
    name: string;
    description?: string;
  };
  onUpdate: () => void; // Función que recarga los datos en el padre
  onCancel: () => void; // Función para cancelar la edición
};

const EditGroupForm: React.FC<Props> = ({ group, onUpdate, onCancel }) => {
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description || "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(
        `${env.NEXT_PUBLIC_CLIENTVAR}/groups/${group.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, description }),
        }
      );

      const data = await res.json();

      if (res.ok) {
        onUpdate(); // Notificar que se actualizó exitosamente
      } else {
        alert("Error al actualizar grupo: " + data.message);
      }
    } catch (error) {
      console.error("Error en edición:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4">
      <h2 className="text-xl font-semibold mb-2">Editar Grupo</h2>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del grupo"
        className="block mb-2 p-2 border border-gray-300 rounded w-full"
        required
      />

      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        className="block mb-2 p-2 border border-gray-300 rounded w-full"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {loading ? "Guardando..." : "Guardar Cambios"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
};

export default EditGroupForm;
