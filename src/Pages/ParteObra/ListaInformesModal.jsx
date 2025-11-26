import React, { useState, useEffect } from "react";
import { storage } from "../../../firebase_config";
import { ref, listAll, getDownloadURL, deleteObject } from "firebase/storage";
import { AiOutlineClose } from "react-icons/ai";
import { FaTrashAlt } from "react-icons/fa";
import { IoSearchCircleOutline } from "react-icons/io5";
import { FaCheckCircle } from "react-icons/fa";

/**
 * Component `ListaInformesModal`
 *
 * This component provides a modal interface that allows users to **view and manage stored PDF reports** (informes) in Firebase Storage.
 * It filters the reports by the current project name and displays them in a table with actions to **preview** or **delete** each file.
 * 
 * ---
 * 🔹 Key Features:
 * - Fetches all PDF files from the `informes/` folder in Firebase Storage.
 * - Filters the list to show only files whose names begin with the currently selected project name.
 * - Displays a modal with a searchable, scrollable list of available reports.
 * - Allows viewing each report in a new browser tab via `getDownloadURL`.
 * - Allows deletion of individual reports via `deleteObject`, with confirmation.
 * - Shows a success modal upon successful deletion.
 *
 * 🧩 UI Elements:
 * - Button: "Ver Informes" — Opens the modal.
 * - Modal: Displays a table of available reports with name, date, and action buttons.
 * - Confirmation modal: Confirms before deleting a report.
 * - Success modal: Notifies when a report is successfully deleted.
 *
 * 🗃️ Firebase Integration:
 * - Uses `ref`, `listAll`, `getDownloadURL`, and `deleteObject` from `firebase/storage`.
 *
 * 🔐 Project Context:
 * - Filters reports based on `selectedProjectName` stored in `localStorage`.
 *
 * 🧠 State Management:
 * - `modalOpen`: Controls visibility of the main modal.
 * - `pdfList`: Holds the filtered list of report files.
 * - `loading`: Displays loading state while fetching files.
 * - `confirmDelete`: Tracks which file is about to be deleted.
 * - `showSuccessModal`, `successMessage`: Handle success notifications.
 */


const ListaInformesModal = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [pdfList, setPdfList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const selectedProjectName = localStorage.getItem("selectedProjectName");


  const fetchPdfFiles = async () => {
    setLoading(true);
    try {
      const folderRef = ref(storage, "informes/");
      const fileList = await listAll(folderRef);

      const urls = await Promise.all(
        fileList.items.map(async (file) => {
          const downloadURL = await getDownloadURL(file);
          return { name: file.name, url: downloadURL, ref: file };
        })
      );

      const pdfsFiltrados = urls.filter(item => item.name.startsWith(selectedProjectName));
      setPdfList(pdfsFiltrados);
    } catch (error) {
      console.error("❌ Error al obtener los archivos:", error);
    }
    setLoading(false);
  };

 
  const handleDeleteFile = (file) => {
    setConfirmDelete(file);
  };

  const confirmDeleteFile = async () => {
    if (!confirmDelete) return;
    try {
      await deleteObject(confirmDelete.ref);
      setPdfList(prevList => prevList.filter(item => item.name !== confirmDelete.name));

   
      setSuccessMessage(`✅ Informe "${confirmDelete.name}" eliminado.`);
      setShowSuccessModal(true);

     
      setTimeout(() => setShowSuccessModal(false), 1500);
    } catch (error) {
      console.error(`❌ No se pudo eliminar ${confirmDelete.name}:`, error);
    }
    setConfirmDelete(null);
  };

 
  const handleOpenModal = () => {
    setModalOpen(true);
    fetchPdfFiles();
  };

  return (
    <div className="relative">
     
      <button
        className="px-4 py-2 h-12 text-sm bg-sky-700 text-white rounded-md hover:bg-sky-800 flex gap-2 items-center"
        onClick={handleOpenModal}
      >
        <span><IoSearchCircleOutline className="text-2xl" /></span>Ver Informes
      </button>

    
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 transition-opacity duration-300 p-4 text-xs">
          <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col animate-fadeIn">
        
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-gray-800">📂 Informes Guardados</h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <AiOutlineClose size={24} />
              </button>
            </div>

          
            <div className="border-b-2 w-full mb-4"></div>

          
            <div className="overflow-y-auto flex-grow">
              {loading ? (
                <p className="text-gray-500 text-center">Cargando archivos...</p>
              ) : pdfList.length === 0 ? (
                <p className="text-gray-500 text-center">No hay informes disponibles.</p>
              ) : (
                <table className="min-w-full border border-gray-200 shadow-md rounded-lg">
                  <thead className="bg-sky-600 text-white">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Nombre del Informe</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold">Fecha</th>
                      <th className="px-4 py-3 text-center text-sm font-semibold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pdfList.map((pdf, index) => {
                      const formattedDate = pdf.name.split("_").pop().replace(".pdf", "").replace("T", " ");
                      return (
                        <tr key={index} className="border-b">
                          <td className="px-4 py-3">{pdf.name}</td>
                          <td className="px-4 py-3">{formattedDate}</td>
                          <td className="px-4 py-3 flex flex-col justify-center gap-4">
                            <a
                              href={pdf.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-2 text-xs bg-gray-500 text-white rounded-md hover:bg-gray-600 transition flex justify-center"
                            >
                              Ver
                            </a>
                            <button
                              onClick={() => handleDeleteFile(pdf)}
                              className="px-3 py-2 text-xs bg-red-700 text-white rounded-md hover:bg-red-800 transition flex justify-center"
                            >
                              <FaTrashAlt />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

     
      {confirmDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex justify-center items-center z-50 p-4 animate-fadeIn">
          <div className="bg-white p-6 rounded-2xl shadow-xl w-96 text-center border-t-4 relative">

          
            <div className="flex justify-center">
              <span className="text-red-600 text-5xl">⚠️</span>
            </div>

           
            <h2 className="text-xl font-semibold text-gray-800 mt-4">¿Eliminar informe?</h2>
            <p className="text-gray-600 mt-2">{confirmDelete.name}</p>

        
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={confirmDeleteFile}
                className="px-5 py-2 text-sm bg-red-700 text-white rounded-lg shadow-sm hover:bg-red-800 transition"
              >
                Eliminar
              </button>
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-5 py-2 text-sm bg-gray-500 text-white rounded-lg shadow-sm hover:bg-gray-600 transition"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    
      {showSuccessModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-md z-[100]">
          <div className="bg-white p-6 rounded-lg shadow-2xl w-96 text-center border-t-4 border-green-600 relative z-[110]">

           
            <FaCheckCircle className="text-green-600 text-5xl mx-auto" />

           
            <p className="text-gray-600 mt-4 font-medium">Documento eliminado</p>

          </div>
        </div>
      )}


    </div>
  );
};

export default ListaInformesModal;
