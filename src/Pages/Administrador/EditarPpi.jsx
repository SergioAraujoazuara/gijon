import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../../firebase_config';
import { getDoc, doc, addDoc, collection,  query, where, updateDoc, getDocs } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";

/**
 * EditarPpi Component
 * 
 * This component allows administrators to edit and version inspection point templates (PPI).
 * Key Functionalities:
 * - Fetches existing PPI data from Firestore using an ID from URL parameters.
 * - Allows editing of activities and subactivities dynamically.
 * - Supports versioning by saving the updated PPI as a new document in Firestore.
 * - Displays a success modal on successful updates.
 */

/**
 * Functional Component: EditarPpi
 * 
 * Allows the user to:
 * - Retrieve an existing PPI template.
 * - Modify activities and subactivities.
 * - Create a new version of the updated PPI template.
 */
function EditarPpi() {
    const navigate = useNavigate();
    const { id } = useParams();
    // State to store the fetched PPI data
    const [ppi, setPpi] = useState(null);
    // State to store editable PPI data
    const [editPpi, setEditPpi] = useState({ actividades: [] });
    // State for success modal visibility
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    // State for total number of subactivities
    const [totalSubactividades, setTotalSubactividades] = useState(0);
    /**
         * useEffect: Fetch PPI data on component mount or when the PPI ID changes.
         */
    useEffect(() => {
        const obtenerPpi = async () => {
            try {
                const ppiDoc = doc(db, 'ppis', id);
                const ppiData = await getDoc(ppiDoc);

                if (ppiData.exists()) {
                    const ppiDataValue = ppiData.data();
                    setPpi(ppiDataValue);
                    setEditPpi(ppiDataValue);
                    setTotalSubactividades(ppiDataValue.totalSubactividades || 0);
                } else {
                    console.log('No se encontró el PPI con el ID proporcionado.');
                }
            } catch (error) {
                console.error('Error al obtener el PPI:', error);
            }
        };

        obtenerPpi();
    }, [id]);
    /**
         * handleChange
         * Handles changes in activity or subactivity input fields.
         * 
         * @param {Event} e - Input change event.
         * @param {Number} actividadIndex - Index of the activity being edited.
         * @param {Number} subactividadIndex - Index of the subactivity being edited (optional).
         * @param {String} campo - The specific field name being modified.
         */
    const handleChange = (e, actividadIndex = null, subactividadIndex = null, campo) => {
        const { value } = e.target;

        setEditPpi(prevState => {
            const newState = JSON.parse(JSON.stringify(prevState)); // Deep copy

            if (actividadIndex !== null) {
                if (subactividadIndex !== null) {
                    // Cambio en una subactividad
                    newState.actividades[actividadIndex].subactividades[subactividadIndex][campo] = value;
                } else {
                    // Cambio en una actividad
                    newState.actividades[actividadIndex][campo] = value;
                }
            } else {
                // Cambio en propiedades de nivel superior del PPI
                newState[campo] = value;
            }

            return newState;
        });
    };
    /**
        * handleSubmit
        * Submits the updated PPI data:
        * - Increments the version.
        * - Adds a new document to the 'ppis' collection in Firestore.
        */
    

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Incrementar la versión
            const updatedData = {
                ...editPpi,
                totalSubactividades: totalSubactividades,
                version: (editPpi.version || 0) + 1
            };
            console.log('Datos PPI actualizados antes de guardar:', updatedData);
    
            // Crear nueva versión del PPI
            const newPpiRef = await addDoc(collection(db, 'ppis'), updatedData);
    
            // Buscar todos los lotes con el ppiId anterior
            const lotesRef = collection(db, 'lotes');
            const q = query(lotesRef, where('ppiId', '==', id));
            const querySnapshot = await getDocs(q);
    
            // Actualizar el campo ppiId con el nuevo ID
            const updatePromises = querySnapshot.docs.map(async (docSnap) => {
                const loteRef = doc(db, 'lotes', docSnap.id);
                await updateDoc(loteRef, {
                    ppiId: newPpiRef.id
                });
            });
    
            await Promise.all(updatePromises);
    
            console.log('Nueva versión del PPI creada y lotes actualizados exitosamente.');
            setShowSuccessModal(true); // Mostrar modal de éxito
        } catch (error) {
            console.error('Error al crear la nueva versión del PPI o al actualizar lotes:', error);
        }
    };
    
    /**
         * addActividad
         * Adds a new activity to the editable PPI state.
         */
    const updateTotalSubactividades = (increment) => {
        setTotalSubactividades(prevTotal => prevTotal + increment);
        setEditPpi(prevState => ({
            ...prevState,
            totalSubactividades: prevState.totalSubactividades + increment
        }));
    };
    /**
        * addSubactividad
        * Adds a new subactivity to a specific activity.
        * 
        * @param {Number} actividadIndex - Index of the activity to which the subactivity is added.
        */
    const addActividad = () => {
        const newActividad = {
            numero: '',
            actividad: '',
            subactividades: [
                {
                    version: 0,
                    numero: '',
                    nombre: '',
                    criterio_aceptacion: '',
                    documentacion_referencia: '',
                    tipo_inspeccion: '',
                    punto: '',
                    responsable: ''
                }
            ]
        };
        setEditPpi(prevState => ({
            ...prevState,
            actividades: [...prevState.actividades, newActividad]
        }));
        updateTotalSubactividades(1);
    };
    /**
         * addSubactividad
         * Adds a new subactivity to a specific activity.
         * 
         * @param {Number} actividadIndex - Index of the activity to which the subactivity is added.
         */
    const addSubactividad = (actividadIndex) => {
        setEditPpi(prevState => {
            const newState = JSON.parse(JSON.stringify(prevState)); // Deep copy
            newState.actividades[actividadIndex].subactividades.push({
                version: 0,
                numero: '',
                nombre: '',
                criterio_aceptacion: '',
                documentacion_referencia: '',
                tipo_inspeccion: '',
                punto: '',
                responsable: '',
                active: true,
                motivoVersion: "original"
            });
            return newState;
        });
        updateTotalSubactividades(1);
    };

    if (!ppi) {
        return <div>Cargando...</div>;
    }
    /**
         * handleGoBack
         * Navigates the user back to the admin panel.
         */
    const handleGoBack = () => {
        navigate('/admin'); // Esto navega hacia atrás en la historia
    };

    const eliminarActividad = (actividadIndex) => {
        const actividadesActualizadas = [...editPpi.actividades];
        const subactividadesEliminadas = actividadesActualizadas[actividadIndex].subactividades.length;
    
        actividadesActualizadas.splice(actividadIndex, 1);
    
        setEditPpi(prev => ({
            ...prev,
            actividades: actividadesActualizadas
        }));
    
        setTotalSubactividades(prev => prev - subactividadesEliminadas);
    };
    
    const eliminarSubactividad = (actividadIndex, subactividadIndex) => {
        const actividadesActualizadas = [...editPpi.actividades];
    
        actividadesActualizadas[actividadIndex].subactividades.splice(subactividadIndex, 1);
    
        setEditPpi(prev => ({
            ...prev,
            actividades: actividadesActualizadas
        }));
    
        setTotalSubactividades(prev => prev - 1);
    };
    
    return (
        <div className='container mx-auto min-h-screen xl:px-14 py-2 text-gray-500 text-sm'>
            {/* Navigation section */}
            <div className='flex gap-2 items-center justify-between bg-white px-5 py-3  text-base'>
                <div className='flex gap-2 items-center'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'/admin'}>
                        <h1 className='text-gray-500'>Administración</h1>
                    </Link>

                    <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                    <Link to={'#'}>
                        <h1 className='font-medium text-amber-600'>Editar PPI</h1>
                    </Link>
                </div>
                <div className='flex items-center'>
                    <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>
                </div>
            </div>
            {/* Form for Editing PPI */}
            <div className='w-full border-b-2 border-gray-200 rounded-lg'></div>
            <div className='flex gap-3 flex-col mt-5 bg-white px-4'>
                <h2 className='flex items-center gap-1 text-base'><strong className='text-amber-500 text-2xl font-medium'>*</strong>Selecciona la celda en la tabla y edita los valores</h2>
                <form onSubmit={handleSubmit}>
                    <div className='col-span-12 mb-4 mt-4'>
                        <label className='font-medium'>Nombre Punto inspección (Ppi) : </label>
                        <input
                            className='p-2 border border-gray-300 rounded'
                            type="text"
                            value={editPpi.nombre || ''}
                            onChange={(e) => handleChange(e, null, null, 'nombre')}
                        />
                    </div>

                    <div className='mb-5'>
                        <button type="button" onClick={addActividad} className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                            Añadir Actividad
                        </button>
                    </div>
                    <div className='w-full bg-gray-300 grid grid-cols-12 text-sm items-center font-medium rounded-t-lg'>
                        <div className="py-3 px-2 text-left col-span-1 ">Nº</div>
                        <div className="py-3 px-2 text-left whitespace-normal col-span-3 ">Actividad</div>
                        <div className="py-3 px-2 text-left whitespace-normal xl:col-span-3 col-span-8">Criterio de aceptación</div>
                        <div className="py-3 px-2 text-left whitespace-normal col-span-1 xl:block hidden">Documentación de referencia</div>
                        <div className="py-3 px-2 text-left col-span-2 xl:block hidden">Tipo de inspección</div>
                        <div className="py-3 px-2 text-left col-span-1 xl:block hidden">Punto</div>
                        <div className="py-3 px-2 text-left col-span-1 xl:block hidden">Responsable</div>
                    </div>
                    {/* Iterar sobre actividades para generar inputs */}
                    {editPpi.actividades.map((actividad, actividadIndex) => (
  <div key={`actividad-${actividadIndex}`} className="mb-6 border border-gray-300 rounded-lg overflow-hidden shadow-sm">

    {/* Actividad */}
    <div className="grid grid-cols-12 bg-gray-100 border-b border-gray-300 p-2 items-center">
      <div className="col-span-1">
        <input
          className="w-full p-2 border border-gray-300 text-sm rounded"
          type="text"
          value={actividad.numero || ''}
          onChange={(e) => handleChange(e, actividadIndex, null, 'numero')}
          placeholder="Nº"
        />
      </div>
      <div className="col-span-10">
        <input
          className="w-full p-2 border border-gray-300 text-sm rounded"
          type="text"
          value={actividad.actividad || ''}
          onChange={(e) => handleChange(e, actividadIndex, null, 'actividad')}
          placeholder="Nombre de la actividad"
        />
      </div>
      <div className="col-span-1 text-end">
        <button
          type="button"
          onClick={() => eliminarActividad(actividadIndex)}
          className="text-red-600 text-xs underline hover:text-red-800"
        >
          ✖
        </button>
      </div>
    </div>

    {/* Subactividades */}
    {actividad.subactividades && actividad.subactividades.map((subactividad, subactividadIndex) => (
      <div key={`subactividad-${subactividadIndex}`} className="grid grid-cols-12 gap-2 p-2 items-center text-sm border-b border-gray-200">
        <input
          className="col-span-1 p-2 border border-gray-300 rounded"
          type="text"
          value={subactividad.numero || ''}
          onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'numero')}
          placeholder="Nº"
        />
        <input
          className="col-span-3 p-2 border border-gray-300 rounded"
          type="text"
          value={subactividad.nombre || ''}
          onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'nombre')}
          placeholder="Descripción"
        />
        <input
          className="col-span-3 p-2 border border-gray-300 rounded"
          type="text"
          value={subactividad.criterio_aceptacion || ''}
          onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'criterio_aceptacion')}
          placeholder="Criterio de aceptación"
        />
        <input
          className="col-span-1 p-2 border border-gray-300 rounded hidden xl:block"
          type="text"
          value={subactividad.documentacion_referencia || ''}
          onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'documentacion_referencia')}
          placeholder="Doc. referencia"
        />
        <input
          className="col-span-2 p-2 border border-gray-300 rounded hidden xl:block"
          type="text"
          value={subactividad.tipo_inspeccion || ''}
          onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'tipo_inspeccion')}
          placeholder="Tipo inspección"
        />
        <input
          className="col-span-1 p-2 border border-gray-300 rounded hidden xl:block"
          type="text"
          value={subactividad.punto || ''}
          onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'punto')}
          placeholder="Punto"
        />
        <input
          className="col-span-1 p-2 border border-gray-300 rounded hidden xl:block"
          type="text"
          value={subactividad.responsable || ''}
          onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'responsable')}
          placeholder="Responsable"
        />

        {/* Botón eliminar subactividad */}
        <div className="col-span-12 text-end pr-2">
          <button
            type="button"
            onClick={() => eliminarSubactividad(actividadIndex, subactividadIndex)}
            className="text-xs text-red-500 hover:underline"
          >
            Eliminar subactividad ✖
          </button>
        </div>
      </div>
    ))}

    {/* Botón añadir subactividad */}
    <div className="text-start p-3">
      <button
        type="button"
        onClick={() => addSubactividad(actividadIndex)}
        className="text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-md text-sm font-medium"
      >
        Añadir Subactividad
      </button>
    </div>
  </div>
))}


                    <div className='mt-5'>
                        <button type="submit" className='bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg '>Guardar cambios</button>
                    </div>
                </form>
            </div>
            {/* Success Modal */}
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
                                        {/* Success icon */}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Éxito
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                La nueva versión del PPI ha sido creada exitosamente.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setShowSuccessModal(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default EditarPpi;
