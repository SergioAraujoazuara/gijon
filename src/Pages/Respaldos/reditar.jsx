import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { db } from '../../../firebase_config';
import { getDoc, doc, updateDoc } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import { BsClipboardCheck } from "react-icons/bs";
import { GrDocumentTest } from "react-icons/gr";
import { IoArrowBackCircle } from "react-icons/io5";

function EditarPpi() {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate(-1); // Esto navega hacia atrás en la historia
    };
    const { id } = useParams();
    const [ppi, setPpi] = useState(null);
    const [editPpi, setEditPpi] = useState({ actividades: [] });
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [totalSubactividades, seTotalSubactividades] = useState(null);

    useEffect(() => {
        const obtenerPpi = async () => {
            try {
                const ppiDoc = doc(db, 'ppis', id);
                const ppiData = await getDoc(ppiDoc);

                if (ppiData.exists()) {
                    setPpi(ppiData.data());
                    console.log(ppiData.data());
                    setEditPpi(ppiData.data());
                    seTotalSubactividades(ppiData.data().totalSubactividades);
                } else {
                    console.log('No se encontró el PPI con el ID proporcionado.');
                }
            } catch (error) {
                console.error('Error al obtener el PPI:', error);
            }
        };

        obtenerPpi();
    }, [id]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const updatedData = {
                ...editPpi,
                totalSubactividades: totalSubactividades
            };
            await updateDoc(doc(db, 'ppis', id), updatedData);
            console.log('PPI actualizado exitosamente.');
            setShowSuccessModal(true); // Mostrar modal de éxito
        } catch (error) {
            console.error('Error al actualizar el PPI:', error);
        }
    };

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
    };

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
                responsable: ''
            });
            newState.totalSubactividades += 1; // Increment total subactivities count
            seTotalSubactividades(newState.totalSubactividades); // Update the state
            return newState;
        });
    };

    if (!ppi) {
        return <div>Cargando...</div>;
    }

    return (
        <div className='container mx-auto min-h-screen px-14 py-5 text-gray-500 text-sm'>
            {/* Navigation section */}
            <div className='flex gap-2 items-center justify-between bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                <div className='flex gap-2 items-center'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'/admin'}>
                        <h1 className='text-gray-500 text-gray-500'>Administración</h1>
                    </Link>
                    <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                    <Link to={'/verPpis'}>
                        <h1 className='text-gray-500 text-gray-500'>Plantillas PPI</h1>
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
            <div className='flex gap-3 flex-col mt-5 bg-white p-8 rounded rounded-xl shadow-md'>
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
                    <div className='w-full bg-gray-300 grid grid-cols-12 text-sm items-center font-medium'>
                        <div className="py-3 px-2 text-left col-span-1 ">Nº</div>
                        <div className="py-3 px-2 text-left whitespace-normal col-span-3 ">Actividad</div>
                        <div className="py-3 px-2 text-left whitespace-normal col-span-3">Criterio de aceptación</div>
                        <div className="py-3 px-2 text-left whitespace-normal col-span-1">Documentación de referencia</div>
                        <div className="py-3 px-2 text-left col-span-2">Tipo de inspección</div>
                        <div className="py-3 px-2 text-left col-span-1">Punto</div>
                        <div className="py-3 px-2 text-left col-span-1">Responsable</div>
                    </div>
                    {/* Iterar sobre actividades para generar inputs */}
                    {editPpi.actividades.map((actividad, actividadIndex) => (
                        <div key={`actividad-${actividadIndex}`}>
                            <div className='w-full grid grid-cols-12 font-medium'>
                                <div className='col-span-1'>
                                    <input
                                        className='w-full p-2 border border-gray-300 bg-gray-200'
                                        type="text"
                                        value={actividad.numero || ''}
                                        onChange={(e) => handleChange(e, actividadIndex, null, 'numero')}
                                    />
                                </div>
                                <div className='col-span-11'>
                                    <input
                                        className='w-full p-2 border border-gray-300 bg-gray-200 font-medium'
                                        type="text"
                                        value={actividad.actividad || ''}
                                        onChange={(e) => handleChange(e, actividadIndex, null, 'nombre')}
                                    />
                                </div>
                            </div>
                            {/* Iterar sobre subactividades para generar inputs */}
                            {actividad.subactividades && actividad.subactividades.map((subactividad, subactividadIndex) => (
                                <div key={`subactividad-${subactividadIndex}`}>
                                    <div className='w-full bg-gray-100 grid grid-cols-12 text-sm'>
                                        <div className='col-span-1'>
                                            <input
                                                className='w-full p-2 border bg-gray-50'
                                                type="text"
                                                value={subactividad.numero || ''}
                                                onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'numero')}
                                            />
                                        </div>
                                        <div className='col-span-3'>
                                            <input
                                                className='w-full p-2 border'
                                                type="text"
                                                value={subactividad.nombre || ''}
                                                onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'nombre')}
                                            />
                                        </div>
                                        <div className='col-span-3'>
                                            <input
                                                className='w-full p-2 border'
                                                type="text"
                                                value={subactividad.criterio_aceptacion || ''}
                                                onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'criterio_aceptacion')}
                                            />
                                        </div>
                                        <div className='col-span-1'>
                                            <input
                                                className='w-full p-2 border'
                                                type="text"
                                                value={subactividad.documentacion_referencia || ''}
                                                onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'documentacion_referencia')}
                                            />
                                        </div>
                                        <div className='col-span-2'>
                                            <input
                                                className='w-full p-2 border'
                                                type="text"
                                                value={subactividad.tipo_inspeccion || ''}
                                                onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'tipo_inspeccion')}
                                            />
                                        </div>
                                        <div className='col-span-1'>
                                            <input
                                                className='w-full p-2 border'
                                                type="text"
                                                value={subactividad.punto || ''}
                                                onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'punto')}
                                            />
                                        </div>
                                        <div className='col-span-1'>
                                            <input
                                                className='w-full p-2 border'
                                                type="text"
                                                value={subactividad.responsable || ''}
                                                onChange={(e) => handleChange(e, actividadIndex, subactividadIndex, 'responsable')}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                            <button type="button" onClick={() => addSubactividad(actividadIndex)} className="mt-2 mb-5 mbinline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-gray-500 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                Añadir Subactividad
                            </button>
                        </div>
                    ))}

                    <div className='mt-5'>
                        
                        <button type="submit" className='bg-sky-600 hover:bg-sky-700 text-white font-medium px-4 py-2 rounded-lg '>Guardar cambios</button>
                    </div>
                </form>
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
                                        {/* Success icon */}
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Éxito
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                El PPI ha sido actualizado exitosamente.
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
