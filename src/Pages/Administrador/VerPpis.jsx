/**
 * Component: VerPpis
 * 
 * Description:
 * This component manages the display, creation, and deletion of PPIs (Plantillas PPI).
 * It interacts with the Firestore database to fetch, delete, and update PPI-related information.
 * 
 * Key Features:
 * - Fetch and display a list of PPIs from the Firestore database.
 * - Confirm and delete selected PPI records.
 * - Show success and confirmation modals for user interaction feedback.
 * - Navigate back to the admin panel.
 * 
 * Component Flow:
 * 1. **Initial Data Load**: 
 *    - The `useEffect` hook triggers `cargarPpis` to fetch all PPIs from the Firestore database when the component mounts.
 * 
 * 2. **List and Display**:
 *    - PPIs are displayed in a table-like format with sorting functionality.
 *    - PPIs are sorted first by name (alphabetically) and then by version.
 * 
 * 3. **Delete PPI**:
 *    - When the delete icon/button is clicked, the `mostrarModalEliminar` function opens a confirmation modal.
 *    - Upon confirmation, `eliminarPpiConfirmado` deletes the PPI from Firestore and updates the local state.
 *    - A success message is displayed in a modal after deletion.
 * 
 * 4. **User Navigation**:
 *    - The "Go Back" button navigates the user to the admin panel.
 * 
 * State Management:
 * - `ppis`: List of all PPI records fetched from Firestore.
 * - `selectedPpi`: Holds the currently selected PPI (for deletion).
 * - `showModal`: Toggles the visibility of the delete confirmation modal.
 * - `showModalEliminar`: Toggles the visibility of the success message modal.
 * - `errorMessage`: Stores error or success messages for user feedback.
 */


import React, { useEffect, useState } from 'react'
import { db } from '../../../firebase_config';
import { getDoc, getDocs, doc, deleteDoc, collection, addDoc, runTransaction, writeBatch, setDoc, query, where } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import { GoHomeFill } from "react-icons/go";
import { FaEdit } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { IoCloseCircle } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircle } from "react-icons/io5";
import { IoAlertCircleSharp } from "react-icons/io5";

import { IoMdAddCircleOutline } from "react-icons/io";
import CopiarPpi from './CopiarPpi';

function VerPpis() {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate('/admin'); // Esto navega hacia atrás en la historia
    };
    // State to store PPIs and manage deletion
    const [ppis, setPpis] = useState([]);
    const [selectedPpi, setSelectedPpi] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [ppiIdAEliminar, setPpiIdAEliminar] = useState(null);
    const [errorMessage, setErrorMessage] = useState(""); // Nuevo estado para el mensaje de error
    const [showModalEliminar, setShowModalEliminar] = useState(false);

    const [ppisEditables, setPpisEditables] = useState(new Set());


    const cargarPpis = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "ppis"));
            const ppisList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            setPpis(ppisList);
            setPpisEditables(obtenerPpisEditables(ppisList)); // <--- nuevo estado
        } catch (error) {
            console.error("Error al cargar los PPIs:", error);
        }
    };




    // Function: Delete a PPI from Firestore
    const eliminarPpiConfirmado = async () => {
        if (ppiIdAEliminar) {
            try {
                // DELETE FIREBASE
                await deleteDoc(doc(db, "ppis", ppiIdAEliminar));
                const updatedPpis = ppis.filter(ppi => ppi.id !== ppiIdAEliminar);
                setPpis(updatedPpis);  // Update local state
                setShowModal(false); // Close modal
                setShowModalEliminar(true);
                setTimeout(() => {
                    setShowModalEliminar(false);
                }, 2500); // 5000 milisegundos = 5 segundos

                setErrorMessage("PPI eliminado exitosamente.");
            } catch (error) {
                console.error("Error al eliminar el PPI:", error);
                setErrorMessage("Hubo un problema al intentar eliminar el PPI"); // Establece el mensaje de error
            }
        }
    };
    // Function: Show confirmation modal for deletion
    const mostrarModalEliminar = (idPpi) => {
        console.log(idPpi)
        setPpiIdAEliminar(idPpi);
        setShowModal(true);
        setErrorMessage(""); // Reinicia el mensaje de error cuando se muestra el modal
    };
    // Close modal handler
    const handleCloseAlert = () => {
        setShowModal(false);
        setErrorMessage(""); // Reinicia el mensaje de error al cerrar el modal
    };


    const obtenerPpisEditables = (lista) => {
        const latestVersionsMap = new Map();

        lista.forEach(ppi => {
            const nombre = ppi.nombre.toLowerCase().trim();
            if (!latestVersionsMap.has(nombre) || ppi.version > latestVersionsMap.get(nombre).version) {
                latestVersionsMap.set(nombre, ppi);
            }
        });

        // Devuelve un Set con los IDs editables
        return new Set([...latestVersionsMap.values()].map(p => p.id));
    };

    useEffect(() => {
        const fetchData = async () => {
            await cargarPpis();
        };
        fetchData();
    }, []);

    return (
        <div className=' py-2 text-gray-500'>




            <div>
                <div className='flex gap-3 flex-col items-start justify-center mt-5 bg-white px-5 '>
                <div className='grid grid-cols-6 gap-4'>
    <p className='flex xl:flex-row flex-col text-sm gap-2 underline col-span-5'>
        <span className='flex items-center gap-2'>
            <IoAlertCircleSharp className='text-yellow-500 text-xl' />
            Atencion! Al editar el PPI, los cambios no se actualizarán en las inspecciones ya realizadas. Si se modifica un PPI con una inspección en curso,
            deberás realizar la inspección completa nuevamente.
        </span>
    </p>

    {/* Botón alineado a la derecha */}
    <div className='flex gap-2 mt-2 col-span-1 xl:justify-end hidden md:block'>
        <Link to={'/agregarPpi'}>
            <button className='bg-sky-600 flex gap-1 items-center text-white px-4 py-2 rounded-lg'>
                <IoMdAddCircleOutline /> Nuevo ppi
            </button>
        </Link>
    </div>
</div>



                    <div class="w-full rounded rounded-t-xl">
                        <div className="overflow-x-auto relative">
                            <div className="w-full text-sm text-left">
                                {/* Header */}
                                <div className="hidden sm:block rounded-t-lg bg-gray-200">
                                    <div className="grid grid-cols-12 py-3 px-4 font-medium">
                                        <div className="col-span-1">Versión</div>
                                        <div className="col-span-10">Nombre PPI</div>
                                        <div className="col-span-1 text-center">Acciones</div>
                                    </div>
                                </div>

                                {/* Body */}
                                <div>
                                    {ppis
                                        .sort((a, b) => {
                                            // Ordenar por nombre y versión
                                            if (a.nombre.toLowerCase() < b.nombre.toLowerCase()) return -1;
                                            if (a.nombre.toLowerCase() > b.nombre.toLowerCase()) return 1;
                                            return a.version - b.version;

                                        })
                                        .map((p, index) => {
                                            const esEditable = ppisEditables.has(p.id);
                                            return (
                                                <div key={index} className="border-b">
                                                    <div className="hidden sm:grid grid-cols-12 px-4 py-3 items-center">
                                                        <div className="col-span-1">V-{p.version}</div>

                                                        {/* SOLO LINK SI ES EDITABLE */}
                                                        {esEditable ? (
                                                            <Link to={`/editarPpi/${p.id}`} className="col-span-10 text-gray-800 hover:underline">
                                                                {p.nombre}
                                                            </Link>
                                                        ) : (
                                                            <div className="col-span-10 text-gray-400 italic cursor-not-allowed">{p.nombre}</div>
                                                        )}

                                                        <div className="col-span-1 text-center">
                                                            <button
                                                                className="text-xl text-amber-700"
                                                                onClick={() => mostrarModalEliminar(p.id)}
                                                            >
                                                                <MdDeleteOutline />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                </div>

                            </div>
                        </div>
                    </div>

                </div>
            </div>

            <div>

            </div>
            {/* Warning Message */}
            {showModal && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-amber-200 sm:mx-0 sm:h-10 sm:w-10">
                                        {/* Icono de advertencia o eliminación */}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Confirmación de eliminación
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                ¿Estás seguro de que deseas eliminar este PPI? Esta acción no se puede deshacer.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">

                                <button onClick={handleCloseAlert} type="button" className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                    Cancelar
                                </button>
                                <button onClick={() => eliminarPpiConfirmado()} type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-amber-600 text-base font-medium text-white hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 sm:ml-3 sm:w-auto sm:text-sm">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showModalEliminar && (
                <div className="fixed z-10 inset-0 overflow-y-auto">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                            <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                        </div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                        {/* Icono de éxito */}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg font-medium text-gray-900" id="modal-headline">
                                            Éxito
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                El PPI ha sido eliminado exitosamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="button" onClick={() => setShowModalEliminar(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cerrar
                                    </button>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            )}




        </div>
    )
}

export default VerPpis