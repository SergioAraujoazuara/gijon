import React, { useState, useEffect } from 'react';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
/**
 * PdfListViewer Component
 * 
 * This component fetches and displays a list of PDF files stored in Firebase Storage.
 * It retrieves the file URLs and their metadata, such as the upload date, and presents 
 * them in a modal for the user to view. Users can click on the links to open the PDFs 
 * in a new tab. The modal can be opened and closed by the user.
 * 
 * Functionalities:
 * - Fetches PDF files from a specific folder in Firebase Storage.
 * - Displays the list of PDF files with their names and upload date.
 * - Allows users to open the PDF file in a new tab.
 * - The modal can be opened/closed by clicking a button.
 * 
 * Dependencies:
 * - Firebase: Used to interact with Firebase Storage to fetch file URLs and metadata.
 */

const PdfListViewer = () => {
    const [pdfFiles, setPdfFiles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchPdfFiles = async () => {
            const storage = getStorage();
            const folderRef = ref(storage, 'inspeccion/informes/pdf');
            try {
                const result = await listAll(folderRef);
                const files = await Promise.all(
                    result.items.map(async (itemRef) => {
                        const url = await getDownloadURL(itemRef);
                        const metadata = await getMetadata(itemRef);
                        let uploadDate = 'Fecha no disponible';

                        if (metadata.customMetadata?.uploadDate) {
                            const date = new Date(metadata.customMetadata.uploadDate);
                            const dateString = date.toLocaleDateString();
                            const timeString = date.toLocaleTimeString();
                            uploadDate = `${dateString} ${timeString}`;
                        }

                        return { name: itemRef.name, url, uploadDate };
                    })
                );
                setPdfFiles(files);
            } catch (error) {
                console.error('Error al obtener los archivos PDF:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPdfFiles();
    }, []);

    const openModal = () => setShowModal(true);
    const closeModal = () => setShowModal(false);

    return (
        <div>
            <button onClick={openModal} className="bg-red-400 text-white px-4 py-2 rounded-lg mt-2">
                Ver PDFs
            </button>
            {showModal && (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-700 bg-opacity-75 z-50">
        <div className="bg-white p-6 rounded-lg shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Lista de PDFs guardados</h2>
            {loading ? (
                <p>Cargando archivos...</p>
            ) : pdfFiles.length > 0 ? (
                // Contenedor con desplazamiento
                <ul className="max-h-90 overflow-y-auto">
                    {pdfFiles.map((file) => (
                        <li key={file.name} className="mb-2">
                            <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-sky-600 underline">
                                {file.name}
                            </a>
                            <p className="text-sm text-gray-600">Fecha de subida: {file.uploadDate}</p>
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No hay archivos PDF disponibles.</p>
            )}
            <button onClick={closeModal} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded">
                Cerrar
            </button>
        </div>
    </div>
)}

        </div>
    );
};

export default PdfListViewer;
