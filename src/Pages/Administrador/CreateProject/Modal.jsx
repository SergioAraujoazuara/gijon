import React from "react";

const Modal = ({ message, type, onClose }) => {
  return (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      style={{ zIndex: 1050 }} 
    >
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
        <div className={`text-center font-bold text-lg mb-4 ${type === "success" ? "text-green-600" : "text-red-600"}`}>
          {type === "success" ? "Éxito" : "Error"}
        </div>
        <p className="text-gray-700 text-center mb-6">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default Modal;
