/**
 * Component: EditProject
 * 
 * Description:
 * This component allows users to edit project details and propagate updates 
 * to related records in the database.
 * 
 * Flow:
 * 1. Route Parameter: Retrieve project ID from URL using `useParams`.
 * 2. Fetching Project Data: Load project data from Firestore into state.
 * 3. Editing Fields: User modifies form fields; changes are stored in state.
 * 4. Updating the Project:
 *    - Updates project fields in Firestore.
 *    - Updates related records in the `registros` collection.
 * 5. User Feedback: Show success or error messages.
 * 6. Navigation: Allows returning to the administration panel.
 * 
 * Props:
 * - None
 * 
 * Dependencies:
 * - Firebase Firestore for data handling.
 * - React Router for navigation.
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from '../../../firebase_config';
import { collection, getDocs, setDoc, doc, writeBatch, query, where } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { FaArrowRight } from "react-icons/fa";
import AlertaEditarProyecto from './AlertaEditarProyecto';


/**
 * Functional Component: EditProject
 * 
 * Handles:
 * - Fetching project details based on the project ID from Firestore.
 * - Editing and saving project details.
 * - Updating dependent records in the "registros" collection.
 */

function EditProject() {
    const { id } = useParams(); // Retrieve project ID from the route parameters.
    const navigate = useNavigate()
    // State to hold project data fetched from Firestore
    const [proyecto, setProyecto] = useState(null);
    // State for alert messages
    const [alertMessage, setAlertMessage] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    /**
        * closeAlert
        * Closes the alert modal.
        */
    const closeAlert = () => {
        setIsAlertOpen(false);
    };
    /**
         * useEffect
         * Fetches project details on component mount or when the project ID changes.
         */

    useEffect(() => {
        const obtenerProyectos = async () => {
            try {
                // Fetch all projects from Firestore
                const proyectosCollection = collection(db, 'proyectos');
                const proyectosSnapshot = await getDocs(proyectosCollection);
                // Map projects and find the one matching the given ID
                const proyectosData = proyectosSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));

                setProyecto(proyectosData.find((p) => p.id === id));

            } catch (error) {
                console.error('Error al obtener la lista de proyectos:', error);
            }
        };

        obtenerProyectos();
    }, [id]);
    /**
         * handleInputChange
         * Updates the local state when an input field is modified.
         * 
         * @param {Event} e - Input change event.
         */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProyecto({
            ...proyecto,
            [name]: value,
        });
    };
    /**
         * actualizarProyecto
         * Updates the project document and propagates changes to related records in Firestore.
         */
    const actualizarProyecto = async () => {
        try {
            const proyectoRef = doc(db, 'proyectos', id);
            const batch = writeBatch(db);

            // Update the project document: update 'nombre_corto' field first
            batch.update(proyectoRef, { nombre_corto: proyecto.nombre_corto });

            // Update other project fields excluding 'nombre_corto'
            const camposAActualizar = { ...proyecto };
            delete camposAActualizar.nombre_corto; // Eliminar el campo nombre_corto
            for (const campo in camposAActualizar) {
                batch.update(proyectoRef, { [campo]: camposAActualizar[campo] });
            }

            // Update dependent records in 'registros' collection where idProyecto matches
            const registrosQuery = query(collection(db, 'registros'), where('idProyecto', '==', proyecto.id));
            const registrosSnapshot = await getDocs(registrosQuery);

            // Actualizar el campo proyecto en los registros encontrados
            registrosSnapshot.forEach((registroDoc) => {
                const registroRef = doc(db, 'registros', registroDoc.id);
                batch.update(registroRef, { proyecto: proyecto.nombre_corto });
            });

            // Commit all updates in a single batch
            await batch.commit();

            setAlertMessage('Actualizado correctamente');
            setIsAlertOpen(true);
        } catch (error) {
            console.error('Error al actualizar el proyecto:', error);
            setAlertMessage('Error al actualizar el proyecto');
            setIsAlertOpen(true);
        }
    };



    return (
        <div className='min-h-screen px-14 py-5 text-gray-500'>
            {/* Navigation Header */}
            <div className='flex gap-2 items-center justify start bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />

                <Link to={'/admin'}>
                    <h1 className='text-gray-600'>Administración</h1>
                </Link>
                <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                <Link to={'/viewProject'}>
                    <h1 className=' text-gray-600'>Ver proyectos</h1>

                </Link>
                <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                <Link to={'#'}>
                    <h1 className='font-medium text-amber-600'>Editar </h1>

                </Link>

            </div>


            {/* Project Edit Form */}
            <div className="bg-white mx-auto mt-5 grid sm:grid-cols-3 grid-cols-1 gap-8 bg-gray-100 p-8 shadow-xl rounded-lg text-base">
                {proyecto && (
                    <>

                        {/* Imagen */}
                        <div className='flex justify-start'>
                            <img className='rounded-md w-40' src={proyecto.logo} alt="logo" />
                        </div>

                        {/* Nombre corto y Código TPF */}
                        <div>


                            <label className='font-bold'>Nombre corto:
                                <input
                                    type="text"
                                    name="nombre_corto"
                                    value={proyecto.nombre_corto}
                                    onChange={handleInputChange}
                                    className='border font-normal p-2 rounded-md w-full focus:outline-none focus:border-amber-800 mt-2'
                                />
                            </label>
                        </div>

                        <div>


                            <label className='font-bold'>Código TPF:
                                <input
                                    type="text"
                                    name="codigoTpf"
                                    value={proyecto.codigoTpf}
                                    onChange={handleInputChange}
                                    className='border font-normal p-2 rounded-md w-full focus:outline-none focus:border-amber-800 mt-2'
                                />
                            </label>
                        </div>



                        <div >
                            <label className='font-bold'>Nombre completo:
                                <input
                                    type="text"
                                    name="nombre_completo"
                                    value={proyecto.nombre_completo}
                                    onChange={handleInputChange}
                                    className='border font-normal p-2 rounded-md w-full focus:outline-none focus:border-amber-800 mt-2'
                                />
                            </label>
                        </div>

                        {/* Resto de los inputs en dos columnas */}
                        <div>



                            <label className='font-bold'>Importe de obra:
                                <input
                                    type="text"
                                    name="importe_obra"
                                    value={proyecto.importe_obra}
                                    onChange={handleInputChange}
                                    className='border font-normal p-2 rounded-md w-full focus:outline-none focus:border-amber-800 mt-2'
                                />
                            </label>

                        </div>

                        <div>


                            <label className='font-bold'>Importe TPF:
                                <input
                                    type="text"
                                    name="importe_tpf"
                                    value={proyecto.importe_tpf}
                                    onChange={handleInputChange}
                                    className='border font-normal p-2 rounded-md w-full focus:outline-none focus:border-amber-800'
                                />
                            </label>

                        </div>

                        <div>


                            <label className='font-bold'>Cliente:
                                <input
                                    type="text"
                                    name="cliente"
                                    value={proyecto.cliente}
                                    onChange={handleInputChange}
                                    className='border font-normal p-2 rounded-md w-full focus:outline-none focus:border-amber-800 mt-2'
                                />
                            </label>

                        </div>

                        <div>
                            <label className='font-bold'>Contratista:
                                <input
                                    type="text"
                                    name="contratista"
                                    value={proyecto.contratista}
                                    onChange={handleInputChange}
                                    className='border font-normal p-2 rounded-md w-full focus:outline-none focus:border-amber-800'
                                />
                            </label>


                        </div>

                        <div className='col-span-2'>
                            {/* Botón de actualización */}
                            <button
                                type="button"
                                onClick={actualizarProyecto}
                                className='mt-8 bg-sky-600 text-white font-bold py-2 px-4 rounded-md hover:bg-sky-700 focus:outline-none focus:ring focus:border-sky-800'
                            >
                                Actualizar Proyecto
                            </button>
                        </div>



                        {isAlertOpen && (
                            <AlertaEditarProyecto
                                message={alertMessage}
                                closeModal={closeAlert}
                            />
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

export default EditProject