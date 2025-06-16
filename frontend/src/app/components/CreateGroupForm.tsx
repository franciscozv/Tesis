"use client";
import React, { useState } from "react";
import { env } from "~/env";

type Props = {
  onGroupCreated?: () => void; // Para notificar al padre (opcional)
};

const CreateGroupForm: React.FC<Props> = ({ onGroupCreated }) => {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`${env.NEXT_PUBLIC_CLIENTVAR}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await res.json();

      if (res.ok) {
        setName("");
        setDescription("");
        onGroupCreated?.(); // Notifica al padre si existe
      } else {
        alert(`Error al crear grupo: ${data.message}`);
        console.error("Respuesta:", data);
      }
    } catch (error) {
      console.error("Error en creación:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6">
      <h2 className="text-xl font-semibold mb-2">Crear Nuevo Grupo</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del grupo"
        required
        className="block mb-2 p-2 border border-gray-300 rounded w-full"
      />
      <input
        type="text"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Descripción"
        className="block mb-2 p-2 border border-gray-300 rounded w-full"
      />
      <button
        type="submit"
        disabled={loading}
        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
      >
        {loading ? "Creando..." : "Crear Grupo"}
      </button>
    </form>
  );
};

export default CreateGroupForm;
