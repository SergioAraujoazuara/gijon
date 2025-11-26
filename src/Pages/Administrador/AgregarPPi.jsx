import React, { useEffect, useState } from 'react';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase_config';
import { GoHomeFill } from "react-icons/go";
import { Link, useParams, useNavigate } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
/**
 * PlantillaPpi Component
 * 
 * This component allows administrators to create and configure PPI templates (inspection point templates).
 * Users can dynamically add activities and subactivities, input relevant details, and save the templates
 * to Firestore.
 * 
 * Key Features:
 * - Fetch PPI data from Firestore based on the PPI name provided in the URL parameters.
 * - Dynamically manage activities and subactivities with controlled form inputs.
 * - Save PPI data to Firestore with validation and show success feedback.
 */

function PlantillaPpi() {
    /**
 * Functional Component: PlantillaPpi
 * Manages the creation and configuration of a PPI template.
 */

    // Navigation hook to programmatically navigate between pages
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate('/admin'); // Esto navega hacia atrás en la historia
    };
    const { ppiNombre } = useParams();
    const [ppi, setPpi] = useState(null); // Estado para almacenar los datos del PPI
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    /**
         * useEffect Hook
         * Fetches PPI data from Firestore when the component loads or when ppiNombre changes.
         */
    useEffect(() => {
        const obtenerPpi = async () => {
            try {
                // Query Firestore for the PPI with the specified name
                const q = query(collection(db, "ppis"), where("nombre", "==", ppiNombre));
                const querySnapshot = await getDocs(q);
                const ppiData = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                if (ppiData.length > 0) {
                    console.log(ppiData[0]); // Asume que solo hay un PPI con ese nombre y toma el primero
                    setPpi(ppiData[0]); // Asume que solo hay un PPI con ese nombre y toma el primero
                } else {
                    console.log('No se encontró el PPI con el nombre:', ppiNombre);
                    setPpi(null);
                }
            } catch (error) {
                console.error('Error al obtener el PPI:', error);
            }
        };

        if (ppiNombre) {
            obtenerPpi();
        }
    }, [ppiNombre]); // Este efecto se ejecutará cada vez que ppiNombre cambie
    // State to hold the template name
    const [nombre, setNombre] = useState('');
    // State to manage activities and their nested subactivities
    const [actividades, setActividades] = useState([
        {
            numero: '',
            actividad: '',
            subactividades: [
                {
                    numero: '',
                    version: 0,
                    nombre: '',
                    criterio_aceptacion: '',
                    documentacion_referencia: '',
                    tipo_inspeccion: '',
                    punto: '',
                    responsable: '',
                    fecha: '',
                    firma: '',
                    comentario: '',
                    formularioEnviado: false,
                    idRegistroFormulario: '',
                    resultadoInspeccion: '',
                    active: true,
                    motivoVersion: 'original',
                    terminada: false // Añade el campo terminada
                }
            ]
        }
    ]);

    // State for loading indicator and error messages
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    /**
        * Updates an activity's field based on the index.
        * @param {number} index - The activity index.
        * @param {Event} e - The input change event.
        */
    const handleActividadChange = (index, e) => {
        const newActividades = [...actividades];
        newActividades[index][e.target.name] = e.target.value;
        setActividades(newActividades);
    };

    /**
     * Updates a subactivity's field based on the activity and subactivity indices.
     * @param {number} actividadIndex - Index of the parent activity.
     * @param {number} subactividadIndex - Index of the subactivity.
     * @param {Event} e - The input change event.
     */
    const handleSubactividadChange = (actividadIndex, subactividadIndex, e) => {
        const newActividades = [...actividades];
        newActividades[actividadIndex].subactividades[subactividadIndex][e.target.name] = e.target.value;
        setActividades(newActividades);
    };
    /**
         * Adds a new empty subactivity to the specified activity.
         * @param {number} actividadIndex - Index of the parent activity.
         */
    const addSubactividad = (actividadIndex) => {
        const newActividades = [...actividades];
        newActividades[actividadIndex].subactividades.push({
            numero: '',
            version: 0,
            nombre: '',
            criterio_aceptacion: '',
            documentacion_referencia: '',
            tipo_inspeccion: '',
            punto: '',
            responsable: '',
            fecha: '',
            firma: '',
            comentario: '',
            formularioEnviado: false,
            idRegistroFormulario: '',
            resultadoInspeccion: '',
            active: true,
            motivoVersion: 'original',
            terminada: false // Añade el campo terminada
        });
        setActividades(newActividades);
    };
    /**
         * Handles the submission of the PPI template to Firestore.
         * @param {Event} e - The form submission event.
         */
    const handleAgregarPPi = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Calcular el total de subactividades
        const totalSubactividades = actividades.reduce((acc, actividad) => acc + actividad.subactividades.length, 0);

        try {
            await addDoc(collection(db, 'ppis'), {
                nombre,
                actividades,
                totalSubactividades,
                version: 0
            });

            // Restablecer el estado al estado inicial después de agregar el documento
            setNombre('');
            setActividades([
                {
                    numero: '',
                    actividad: '',
                    subactividades: [
                        {
                            numero: '',
                            version: 0,
                            nombre: '',
                            criterio_aceptacion: '',
                            documentacion_referencia: '',
                            tipo_inspeccion: '',
                            punto: '',
                            responsable: '',
                            fecha: '',
                            firma: '',
                            comentario: '',
                            formularioEnviado: false,
                            idRegistroFormulario: '',
                            resultadoInspeccion: '',
                            active: true,
                            motivoVersion: 'original',
                            terminada: false // Resetea el campo `terminada`
                        }
                    ]
                }
            ]);
            setShowSuccessModal(true); // Muestra el modal de éxito
            // setTimeout(() => setShowSuccessModal(false), 2500);
        } catch (err) {
            console.error('Error al agregar el PPI:', err);
            setError('Hubo un error al agregar el PPI. Por favor, inténtalo de nuevo más tarde.');
        } finally {
            setLoading(false);
        }
    };

    const addActividad = () => {
        const newActividad = {
            numero: '',
            actividad: '',
            subactividades: [
                {
                    numero: '',
                    version: 0,
                    nombre: '',
                    criterio_aceptacion: '',
                    documentacion_referencia: '',
                    tipo_inspeccion: '',
                    punto: '',
                    responsable: '',
                    fecha: '',
                    firma: '',
                    comentario: '',
                    formularioEnviado: false,
                    idRegistroFormulario: '',
                    resultadoInspeccion: '',
                    active: true,
                    motivoVersion: "original",
                    terminada: false // Resetea el campo `terminada`
                }
            ]
        };
        setActividades([...actividades, newActividad]);
    };


    const eliminarActividad = (index) => {
        const nuevasActividades = [...actividades];
        nuevasActividades.splice(index, 1);
        setActividades(nuevasActividades);
      };
      
      const eliminarSubactividad = (actividadIndex, subactividadIndex) => {
        const nuevasActividades = [...actividades];
        if (nuevasActividades[actividadIndex].subactividades.length > 1) {
          nuevasActividades[actividadIndex].subactividades.splice(subactividadIndex, 1);
          setActividades(nuevasActividades);
        }
      };
      
    return (
        <>
            <div className='container mx-auto min-h-screen xl:px-14 py-2 text-gray-500 text-sm'>
                <div className='flex gap-2 items-center justify-between bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                    <div className='flex gap-2 items-center'>
                        <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                        <Link to={'/admin'}>
                            <h1 className='text-gray-500'>Administración</h1>
                        </Link>
                        <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                        <Link to={'/verPpis'}>
                            <h1 className='text-gray-500'>Plantillas PPI</h1>
                        </Link>
                        <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                        <Link to={'#'}>
                            <h1 className='font-medium text-amber-600'>Crear PPI</h1>
                        </Link>
                    </div>
                    <div className='flex items-center'>
                        <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>
                    </div>
                </div>

                <div className='flex gap-3 flex-col mt-5 bg-white p-8 rounded rounded-xl shadow-md'>
                    <form onSubmit={handleAgregarPPi}>
                        <div className="mb-4">
                            <label htmlFor="nombre" className="block text-sm font-medium text-gray-700">Nombre punto inspección (PPI):</label>
                            <input
                                type="text"
                                id="nombre"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                required
                                className="p-2 block w-full border rounded-md focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />

                            <div className='flex gap-6 mt-4 mb-4'>
                                <button type="button" onClick={addActividad} className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                    Añadir Actividad
                                </button>
                            </div>
                        </div>

                        <div className='w-full bg-gray-200 grid grid-cols-7 text-sm'>
                            <div className="py-3 px-2 text-left">Nº</div>
                            <div className="py-3 px-2 text-left whitespace-normal">Actividad</div>
                            <div className="py-3 px-2 text-left whitespace-normal">Criterio de aceptación</div>
                            <div className="py-3 px-2 text-left whitespace-normal">Documentación de referencia</div>
                            <div className="py-3 px-2 text-left">Tipo de inspección</div>
                            <div className="py-3 px-2 text-left">Área</div>
                            <div className="py-3 px-2 text-left">Responsable</div>
                        </div>

                        <div>
                        <div>
  {actividades.map((actividad, i) => (
    <div key={i} className="border rounded-md mb-4">
      <div className='bg-gray-100 grid grid-cols-7'>
        <input
          name="numero"
          placeholder="Número"
          value={actividad.numero}
          onChange={e => handleActividadChange(i, e)}
          className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100"
        />
        <input
          name="actividad"
          placeholder="Nombre"
          value={actividad.actividad}
          onChange={e => handleActividadChange(i, e)}
          className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-100 col-span-6"
        />
      </div>

      {actividad.subactividades.map((sub, j) => (
        <div key={j} className="w-full grid grid-cols-7 gap-[1px]">
          <input
            name="numero"
            placeholder="Número de subactividad"
            value={sub.numero}
            onChange={e => handleSubactividadChange(i, j, e)}
            className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            name="nombre"
            placeholder="Descripción"
            value={sub.nombre}
            onChange={e => handleSubactividadChange(i, j, e)}
            className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            name="criterio_aceptacion"
            placeholder="Criterio de aceptación"
            value={sub.criterio_aceptacion}
            onChange={e => handleSubactividadChange(i, j, e)}
            className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            name="documentacion_referencia"
            placeholder="Documentación de referencia"
            value={sub.documentacion_referencia}
            onChange={e => handleSubactividadChange(i, j, e)}
            className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            name="tipo_inspeccion"
            placeholder="Tipo de inspección"
            value={sub.tipo_inspeccion}
            onChange={e => handleSubactividadChange(i, j, e)}
            className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <input
            name="punto"
            placeholder="Área"
            value={sub.punto}
            onChange={e => handleSubactividadChange(i, j, e)}
            className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
          <div className="flex items-center gap-1">
            <input
              name="responsable"
              placeholder="Responsable"
              value={sub.responsable}
              onChange={e => handleSubactividadChange(i, j, e)}
              className="p-2 block w-full border focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
            {actividad.subactividades.length > 1 && (
              <button
                type="button"
                onClick={() => eliminarSubactividad(i, j)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                ✖
              </button>
            )}
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between px-2 py-2">
        <button
          type="button"
          onClick={() => addSubactividad(i)}
          className="text-sm text-gray-700 hover:text-gray-900"
        >
          ➕ Añadir Subactividad
        </button>
        <button
          type="button"
          onClick={() => eliminarActividad(i)}
          className="text-sm text-red-600 hover:text-red-800"
        >
          🗑️ Eliminar Actividad
        </button>
      </div>
    </div>
  ))}
</div>

                        </div>

                        <div className='flex gap-5 mt-5'>
                            <button type="submit" disabled={loading} className=" mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                {loading ? 'Cargando...' : 'Guardar'}
                            </button>
                        </div>

                        {error && <p className="mt-4 text-red-500">{error}</p>}
                    </form>
                </div>
            </div>

            {showSuccessModal && (
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
                                                El PPI ha sido agregado exitosamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button type="button" onClick={() => setShowSuccessModal(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm">
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default PlantillaPpi;
