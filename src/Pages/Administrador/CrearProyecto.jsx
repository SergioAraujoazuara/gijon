import React, { useEffect, useState } from 'react';
import { db, storage } from '../../../firebase_config';
import { addDoc, collection, doc, setDoc, getDocs, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'; // Asegúrate de tener esta línea
import { GoHomeFill } from "react-icons/go";
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import AlertaContrato from './AlertaContrato';

/**
 * CrearProyecto Component
 * 
 * This component allows administrators to create new projects.
 * It includes:
 * - Form fields for project details such as code, short name, and section.
 * - Logo upload functionality to Firebase Storage.
 * - Saving project data to Firestore, including a Base64-encoded logo string.
 * 
 * Key Features:
 * - Form management using controlled inputs.
 * - File upload with Firebase Storage and Base64 conversion.
 * - Alert notification on successful or failed project creation.
 */
function CrearProyecto() {
    /**
 * Functional Component: CrearProyecto
 * Handles the creation of new projects with the ability to upload a logo
 * and save project data to Firestore.
 */
    // Get the project name from local storage (predefined value)
    const proyectoNombre = localStorage.getItem('proyectoNombre')
    /**
         * State: formValues
         * Stores form inputs such as project details and the logo.
         */
    const [formValues, setFormValues] = useState({
        codigoTpf: '',
        nombre_corto: '',
        obra: '',
        tramo: '',
        logoURL: '',
    });
    // State for alert management
    // Crear alerta
    const [alertMessage, setAlertMessage] = useState('');
    const [isAlertOpen, setIsAlertOpen] = useState(false);

    const closeAlert = () => {
        setIsAlertOpen(false);
    };
    /**
         * handleChange
         * Updates the form state when a text input changes.
         * @param {Event} e - The input change event.
         */
    const handleChange = (e) => {
        const { name, value } = e.target;

        // Asignar el valor directamente al campo correspondiente en formValues
        setFormValues({ ...formValues, [name]: value });
    };

    /**
        * handleLogoChange
        * Handles the upload of a project logo:
        * - Uploads the file to Firebase Storage.
        * - Generates a Base64-encoded string of the image.
        * - Updates the form state with the logo URL and Base64 string.
        * @param {Event} e - The file input change event.
        */
    const handleLogoChange = async (e) => {
        if (e.target.files[0]) {
            const logoFile = e.target.files[0];

            // Upload the file to Firebase Storage
            const logoRef = ref(storage, `logos/${formValues.nombre_corto}_${logoFile.name}`);
            await uploadBytes(logoRef, logoFile);

            // Upload the file to Firebase Storage
            const logoURL = await getDownloadURL(logoRef);

            // Convert the file to Base64
            const reader = new FileReader();
            reader.onload = (event) => {
                const base64String = event.target.result;

                // Update form values with logo URL and Base64
                const projectData = {
                    uid: formValues.nombre_corto,  // Asignar el ID automático como el valor del campo 'uid'
                    codigoTpf: formValues.codigoTpf,
                    nombre_corto: formValues.nombre_corto.toLowerCase(),
                    obra: formValues.obra,
                    tramo: formValues.tramo,
                    logoURL: logoURL,
                    logoBase64: base64String, // Agregar la cadena base64 al objeto
                };

                // Actualizar el estado con el nuevo objeto de datos del proyecto
                setFormValues({
                    ...formValues,
                    ...projectData,
                });
            };

            reader.readAsDataURL(logoFile);
        }
    };


    /**
         * handleSubmit
         * Handles the form submission:
         * - Saves the project data to Firestore.
         * - Triggers an alert message for success or failure.
         * @param {Event} e - The form submit event.
         */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Construct the project data object
            const projectData = {
                codigoTpf: formValues.codigoTpf,
                nombre_corto: formValues.nombre_corto.toLowerCase(),
                obra: formValues.obra,
                tramo: formValues.tramo,
                logo: formValues.logoURL,
                logoBase64: formValues.logoBase64,
            };

            // Add the project data to the 'proyectos' collection in Firestore
            const projectRef = await addDoc(collection(db, 'proyectos'), projectData);

            // Update the UID with the generated document ID
            const projectId = projectRef.id;

            // Agregar el campo 'uid' al objeto de datos del proyecto con el valor del ID generado
            projectData.uid = projectId;

            // Update form state with the new project data
            setFormValues({
                ...formValues,
                ...projectData,
            });
            // Show success alert
            setAlertMessage('Proyecto agregado correctamente!');
            setIsAlertOpen(true);
        } catch (error) {
            setAlertMessage('Error al crear el proyecto.');
            setIsAlertOpen(true);
        }
    };




    return (
        <div className='min-h-screen px-14 py-5 text-gray-500'>

            {/* Navigation section */}
            <div className='flex gap-2 items-center justify start bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />

                <Link to={'/Admin'}>
                    <h1 className='font-base text-gray-500 text-amber-600'>Administración</h1>
                </Link>
                <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                <Link to={'/crearProyecto'}>
                    <h1 className='font-medium text-amber-600'>Crear proyecto</h1>
                </Link>
                <button className='bg-sky-600 text-white text-base font-medium px-5 py-2 rounded-md shadow-md' style={{ marginLeft: 'auto' }}>{proyectoNombre}</button>
            </div>


            {/* Form Section */}
            <div className='flex gap-3 flex-col  mt-5 bg-white p-8 rounded rounded-xl shadow-md'>

                <div className='flex gap-2 items-center'>

                    <h1 className='font-bold text-xl text-gray-500  px-5 '>Crear proyecto</h1>
                </div>

                <div className='border-t-2 w-full p-0 m-0'></div>

                <div class="w-full  mt-5">
                    {/* Project Creation Form */}
                    <form className="px-8 pt-6 pb-8 mb-4" onSubmit={handleSubmit}>

                        <div className='grid sm:grid-cols-4 grid-cols-1 gap-4'>

                            {/* Logo Upload Field */}

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600">Logo <span className='text-amber-500'>*</span></label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    className="mt-1 p-2 w-full border rounded-md"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600">Código TPF <span className='text-amber-500'>*</span></label>
                                <input
                                    type="text"
                                    name="codigoTpf"
                                    value={formValues.codigoTpf}
                                    onChange={handleChange}
                                    className="mt-1 p-2 w-full border rounded-md"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600">Nombre Corto <span className='text-amber-500'>*</span></label>
                                <input
                                    type="text"
                                    name="nombre_corto"
                                    value={formValues.nombre_corto}
                                    onChange={handleChange}
                                    className="mt-1 p-2 w-full border rounded-md"
                                    required
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600">Obra </label>
                                <input
                                    type="text"
                                    name="obra"
                                    value={formValues.obra}
                                    onChange={handleChange}
                                    className="mt-1 p-2 w-full border rounded-md"

                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-600">Tramo </label>
                                <input
                                    type="text"
                                    name="tramo"
                                    value={formValues.tramo}
                                    onChange={handleChange}
                                    className="mt-1 p-2 w-full border rounded-md"

                                />
                            </div>





                            <div className="flex items-center justify-between">
                                <button type="submit" className=" bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">Guardar</button>
                            </div>

                        </div>
                    </form>

                </div>




                {/* Alert Modal */}
                {isAlertOpen && (
                    <AlertaContrato
                        message={alertMessage}
                        closeModal={closeAlert}
                    />
                )}






            </div>







        </div>
    )
}

export default CrearProyecto