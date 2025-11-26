import React, { useState, useEffect } from "react";
import { AiOutlineClose } from "react-icons/ai";
import Formulario from "../../../Components/Firma/Formulario";

const ModalFechaVisita = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [fechaVisita, setFechaVisita] = useState(localStorage.getItem("fechaVisita") || "");
  const [hora, setHora] = useState(localStorage.getItem("hora") || "");
  const [visitaNumero, setVisitaNumero] = useState(localStorage.getItem("visitaNumero") || "");

  // Guardar valores en localStorage cada vez que cambien
  useEffect(() => {
    localStorage.setItem("fechaVisita", fechaVisita);
    localStorage.setItem("hora", hora);
    localStorage.setItem("visitaNumero", visitaNumero);
  }, [fechaVisita, hora, visitaNumero]);

  const handleSave = () => {
    setModalOpen(false); // Solo cierra el modal, los datos ya están en localStorage
  };

  return (
    <div>
      {/* Botón para abrir el modal */}
      <button
        className="px-4 py-2 bg-sky-600 text-white rounded-md hover:bg-sky-700"
        onClick={() => setModalOpen(true)}
      >
        Registrar Fecha de Visita
      </button>

      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 px-4">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">Registrar Fecha de Visita</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <AiOutlineClose size={24} />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Fecha de Visita</label>
              <input
                type="date"
                value={fechaVisita}
                onChange={(e) => setFechaVisita(e.target.value)}
                className="w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Hora</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">Visita de Obra Nº</label>
              <input
                type="text"
                value={visitaNumero}
                onChange={(e) => setVisitaNumero(e.target.value)}
                className="w-full px-4 py-2 border rounded-md border-gray-300"
              />
            </div>

           

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 text-gray-700 font-semibold bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                className="px-5 py-2 bg-sky-600 text-white font-semibold rounded-md hover:bg-sky-700"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModalFechaVisita;
