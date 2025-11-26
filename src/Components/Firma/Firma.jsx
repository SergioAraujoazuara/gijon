import React, { useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { AiOutlineClose, AiFillSave } from "react-icons/ai"; 
import { FaEraser, FaFileSignature, FaCheckCircle } from "react-icons/fa"; 
/**
 * Firma Digital Component
 * 
 * This component allows the user to sign digitally using a signature pad. 
 * It provides functionality for saving the signature as an image, clearing the signature pad, 
 * and displaying success or error messages. The component supports the following actions:
 * 
 * - Draw a signature using the canvas.
 * - Save the signature as a PNG image.
 * - Clear the signature and reset the canvas.
 * 
 * The component receives the following props:
 * 
 * @param {function} onSave - Function to handle the saved signature (passed to the parent component).
 * @param {function} onClose - Function to close the signature modal (passed to the parent component).
 */

const Firma = ({ onSave, onClose }) => {
  const sigCanvas = useRef(null);
  const [isSigned, setIsSigned] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const saveSignature = () => {
    if (sigCanvas.current.isEmpty()) {
      setSuccessMessage("⚠️ Firma vacía. ¡Dibuja algo antes de guardar!");
      return;
    }

    setIsSaving(true);
    const url = sigCanvas.current.toDataURL("image/png");
    setIsSigned(true);
    setSuccessMessage("✅ ¡Firma guardada exitosamente!");
    onSave(url); // ✅ Enviar la firma sin cerrar el modal
  };

  const clearSignature = () => {
    sigCanvas.current.clear();
    setIsSigned(false);
    setSuccessMessage("");
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 p-4 backdrop-blur-md">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
        <button 
          onClick={onClose} 
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition"
        >
          <AiOutlineClose size={22} />
        </button>

        <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
          <FaFileSignature className="text-blue-500" /> Firma Digital
        </h2>

        <div className={`border-2 rounded-lg mt-4 overflow-hidden shadow-sm ${isSigned ? "border-green-500" : "border-gray-300"}`}>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: 350,
              height: 150,
              className: "bg-gray-50",
            }}
          />
        </div>

        {successMessage && (
          <div className={`mt-3 px-4 py-2 text-sm font-semibold text-center rounded-lg 
            ${isSigned ? "bg-green-100 text-green-700 border border-green-500" : "bg-yellow-100 text-yellow-700 border border-yellow-500"}`}>
            {isSigned ? <FaCheckCircle className="inline-block mr-2" /> : null}
            {successMessage}
          </div>
        )}

        <div className="flex justify-between items-center mt-6">
          <button 
            onClick={clearSignature} 
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 transition flex items-center gap-2"
          >
            <FaEraser /> Borrar
          </button>
          <button 
            onClick={saveSignature} 
            disabled={isSaving}
            className={`px-4 py-2 font-semibold rounded-lg flex items-center gap-2 transition ${
              isSaving 
                ? "bg-gray-400 text-gray-700 cursor-not-allowed" 
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            <AiFillSave /> {isSaving ? "Guardado" : "Guardar Firma"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default Firma;
