import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaFilePdf } from "react-icons/fa";
import { jsPDF } from 'jspdf';
import logo from '../assets/tpf_logo_azul.png'
import { IoIosWarning } from "react-icons/io";
import { BsStars } from "react-icons/bs";

import { db } from '../../firebase_config';
import { getDoc, getDocs, doc, deleteDoc, collection, addDoc, runTransaction, writeBatch, setDoc, query, where, updateDoc } from 'firebase/firestore';
import GrocIA from './GrocIA';

function FormularioInspeccion({ username, setImagen, setImagen2, onObservaciones, formulario, crearVariableFormularioTrue, handleConfirmarEnviotablaPpi, 
    handleConfirmarEnvioPdf, setMensajeExitoInspeccion, setModalConfirmacionInforme, setModalFormulario, marcarFormularioComoEnviado, resultadoInspeccion, 
    comentario, setComentario, firma, fechaHoraActual, handleCloseModal, ppiNombre, nombreResponsable, setResultadoInspeccion, enviarDatosARegistros,
    setIsAuto, setIsManual, setImagenDataCoordinates }) {

    const { id } = useParams()
    const idLote = localStorage.getItem('loteId');
    const [nombreProyecto, setNombreProyecto] = useState(localStorage.getItem('nombre_proyecto') || '');
    const [numeroRegistro, setNumeroRegistro] = useState('');
    const [fecha, setFecha] = useState('');
    const [ppi, setPpi] = useState('');
    const [plano, setPlano] = useState('');
    // const [observaciones, setObservaciones] = useState('');
    const [sector, setSector] = useState('');
    const [subSector, setSubSector] = useState('');
    const [parte, setParte] = useState('');
    const [elemento, setElemento] = useState('');
    const [lote, setLote] = useState('');
    const [pkInicial, setPkInicial] = useState('');
    const [pkFinal, setPkFinal] = useState('');
    const titulo = "REGISTRO DE INSPECCIÓN DE OBRA REV-1"

    const imagenPath = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Adif_wordmark.svg/1200px-Adif_wordmark.svg.png"
    const imagenPath2 = logo
    const [obra, setObra] = useState(localStorage.getItem('obra'));
    const [tramo, setTramo] = useState(localStorage.getItem('tramo'));
    const [observaciones, setObservaciones] = useState('');


    useEffect(() => {
        const obtenerLotesPorPpiId = async () => {
            try {
                // Asegúrate de que `id` sea el ID de PPI por el cual quieres filtrar
                const q = query(collection(db, "lotes"), where("ppiId", "==", id));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const lotesData = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));


                    setPpi(lotesData);
                } else {

                    setPpi(null);
                }
            } catch (error) {

                setPpi(null);
            }
        };

        if (id) {
            obtenerLotesPorPpiId();
        }
    }, [id]); // Asegúrate de que `id` sea una dependencia del efecto



    const [loteInfo, setLoteInfo] = useState(null); // Estado para almacenar los datos del PPI
    const [sectorInfoLote, setSectorInfoLote] = useState(null); // Estado para almacenar los datos del PPI
    const [idRegistro, setIdRegistro] = useState(''); // Estado para almacenar los datos del PPI


    useEffect(() => {
        const obtenerLotePorId = async () => {
            console.log('**********', idLote)
            if (!idLote) return; // Verifica si idLote está presente

            try {
                const docRef = doc(db, "lotes", idLote); // Crea una referencia al documento usando el id
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setLoteInfo({ id: docSnap.id, ...docSnap.data() });
                } else {
                    console.log("No se encontró el lote con el ID:", idLote);

                }
            } catch (error) {
                console.error("Error al obtener el lote:", error);

            }
        };

        obtenerLotePorId();
    }, [idLote]);








    const handleConfirmarEnvio = () => {
        setMostrarConfirmacion(false); // Cierra el primer modal
        setMostrarConfirmacionAdicional(true); // Abre el segundo modal para confirmación adicional
    };

    // Nueva función: Manejar la confirmación final y envío de datos
    const handleConfirmacionFinal = async () => {
        const idRegistroFormulario = await enviarDatosARegistros();
        if (idRegistroFormulario) {
            await marcarFormularioComoEnviado(idRegistroFormulario, resultadoInspeccion);
            handleConfirmarEnvioPdf(); // Si es necesario
            setMostrarConfirmacionAdicional(false); // Cierra el segundo modal tras la confirmación
            // Aquí puedes también limpiar el formulario o realizar cualquier otra acción necesaria tras el envío
            setMensajeExitoInspeccion('Inspección completada con éxito');

            setObservaciones('')
            // Si es necesario, cierra el formulario o limpia los estados
        } else {
            // Manejo en caso de que el envío falle o no se complete
        }
    };

    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);


    const handelEnviarFormulario = async () => {
        const idRegistroFormulario = await enviarDatosARegistros();
        if (idRegistroFormulario) {
            // La función enviarDatosARegistros ya se encarga de generar el PDF,
            // así que aquí puedes continuar con cualquier lógica posterior necesaria.

            await marcarFormularioComoEnviado(idRegistroFormulario, resultadoInspeccion);

            // Notifica que el proceso ha concluido satisfactoriamente, si es necesario.
            handleConfirmarEnvioPdf(); // Este paso puede ser opcional dependiendo de lo que haga esta función.
        }
    };



    const handleSolicitarConfirmacion = () => {
        setMostrarConfirmacion(true);
        enviarObservaciones()
    };

    const [mostrarConfirmacionAdicional, setMostrarConfirmacionAdicional] = useState(false);

    const [localObservaciones, setLocalObservaciones] = useState('');

    const enviarObservaciones = () => {
        onObservaciones(localObservaciones); // Envía las observaciones al componente padre
    };


    const [inputGroc, setInputGroc] = useState(false)
    const handleInputGroc = () => {
        setInputGroc(true)
    }
    return (
        <div className='text-gray-500'>



            <form className="bg-white text-gray-500  mb-4">
                <div className='grid sm:grid-cols-1 grid-cols-1 gap-4'>

                    {/* Campos de entrada */}
                    <div className="mb-4 hidden">
                        <label htmlFor="Proyecto" className="block text-gray-500 text-sm font-bold mb-2">Proyecto</label>
                        <input type="text" id="Proyecto" value={nombreProyecto} onChange={(e) => setNombreProyecto(e.target.value)}
                            className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="numeroRegistro" className="block text-gray-500 text-sm font-bold mb-2">Nº de registro</label>
                        <input type="text" id="numeroRegistro" value={numeroRegistro} onChange={(e) => setNumeroRegistro(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    {/* <div className="mb-4">
                        <label htmlFor="fecha" className="block text-gray-500 text-sm font-bold mb-2">Fecha</label>
                        <input type="date" id="fecha" value={fecha} onChange={(e) => setFecha(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div> */}
                    <div className="mb-4 hidden">
                        <label htmlFor="obra" className="block text-gray-500 text-sm font-bold mb-2">Obra</label>
                        <input type="text" id="obra" value={obra} onChange={(e) => setObra(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="tramo" className="block text-gray-500 text-sm font-bold mb-2">Tramo</label>
                        <input type="text" id="tramo" value={tramo} onChange={(e) => setTramo(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="ppi" className="block text-gray-500 text-sm font-bold mb-2">PPI</label>
                        <input type="text" id="ppi" value={localStorage.getItem('ppi' || '')} onChange={(e) => setPpi(e.target.value)}
                            className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>
                    <div className="mb-4 hidden">
                        <label htmlFor="plano" className="block text-gray-500 text-sm font-bold mb-2">Plano que aplica</label>
                        <input type="text" id="plano" value={plano} onChange={(e) => setPlano(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                    </div>


                    <div className="mb-4">
                        <div className='flex gap-5 justify-between items-center mb-2'>

                            <label htmlFor="observaciones" className="block text-gray-500 text-sm font-medium">Observaciones del informe</label>
                            <button className='bg-gray-200 px-4 py-1 font-medium text-sm text-gray-500 flex gap-2 items-center rounded-lg' type="button" onClick={handleInputGroc}><BsStars />IA assistant</button>
                        </div>

                        <textarea id="observaciones" value={localObservaciones} onChange={(e) => setLocalObservaciones(e.target.value)} className="shadow appearance-none border rounded w-full h-36 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
                    {inputGroc && (
                        <GrocIA loteInfo={loteInfo} localObservaciones={localObservaciones} setLocalObservaciones={setLocalObservaciones} setInputGroc={setInputGroc} />
                    )}


                </div>
                {/* Campos de trazabilidad */}
                <div className="mb-4 hidden">
                    <label className="block text-gray-700 text-sm font-bold mb-5">Trazabilidad</label>
                    <div className="grid sm:grid-cols-2 grid-cols-1 gap-4">
                        <div>
                            <label htmlFor="sector" className="block text-gray-700 text-sm font-bold mb-2">Sector</label>
                            <input
                                type="text" id="sector" value={loteInfo?.sectorNombre || ''} onChange={(e) => setSector(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="subSector" className="block text-gray-700 text-sm font-bold mb-2">Sub sector</label>
                            <input type="text" id="subSector" value={loteInfo?.subSectorNombre || ''} onChange={(e) => setSubSector(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="parte" className="block text-gray-700 text-sm font-bold mb-2">Parte</label>
                            <input type="text" id="parte" value={loteInfo?.parteNombre || ''} onChange={(e) => setParte(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="elemento" className="block text-gray-700 text-sm font-bold mb-2">Elemento</label>
                            <input type="text" id="elemento" value={loteInfo?.elementoNombre || ''} onChange={(e) => setElemento(e.target.value)} className="bg-gray-200  shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="lote" className="block text-gray-700 text-sm font-bold mb-2">Lote</label>
                            <input type="text" id="lote" value={loteInfo?.nombre || ''} onChange={(e) => setLote(e.target.value)} className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="pkInicial" className="block text-gray-700 text-sm font-bold mb-2">Pk inicial</label>
                            <input type="text" id="pkInicial" value={loteInfo?.pkInicial || ''} onChange={(e) => setPkInicial(e.target.value)} className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                        <div>
                            <label htmlFor="pkFinal" className="block text-gray-700 text-sm font-bold mb-2">Pk final</label>
                            <input type="text" id="pkFinal" value={loteInfo?.pkFinal || ''} onChange={(e) => setPkFinal(e.target.value)} className="bg-gray-200 shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                        </div>
                    </div>
                </div>
                {/* Botones */}
                <div className='flex justify-center gap-5 mt-5'>
                    <button type="button" onClick={handleSolicitarConfirmacion} className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex gap-2 items-center"><FaFilePdf /> Guardar</button>
                    <button type="button" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex gap-2 items-center"
                        onClick={() => {
                            handleCloseModal()
                            setModalConfirmacionInforme(false)
                            setImagen('')
                            setImagen2('')
                            setImagenDataCoordinates([])
                            setIsAuto(true)
                            setIsManual(false)
                        }}>Cancelar </button>
                </div>
            </form>

            {
                mostrarConfirmacion && (
                    <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-800 bg-opacity-90 text-gray-500 fonmt-medium text-center p-4">
                        <div className="relative bg-white rounded-lg shadow-lg z-50 w-full max-w-lg lg:max-w-2xl xl:max-w-3xl h-auto max-h-[90vh] p-8 overflow-y-auto">

                            <div>
                                {resultadoInspeccion && (
                                    <>
                                        <div className="text-center flex flex-col items-center">
                                            <p className="text-xl font-medium flex items-center gap-2 text-yellow-700">
                                                <span className="text-yellow-600 text-3xl"><IoIosWarning /></span>¡Atención! <span className="text-yellow-600 text-3xl"><IoIosWarning /></span>
                                            </p>
                                            <p className="text-lg font-medium mt-2">
                                                Se guardará la inspección y no podrás modificarla
                                            </p>
                                            <h2 className="font-medium text-center text-yellow-600 mt-2">
                                                * Revisa los datos y comprueba que todo está correcto
                                            </h2>
                                        </div>

                                        <div className='w-full border-b mt-5'></div>

                                        <div className='overflow-x-auto mt-4'>
                                            <table className="min-w-full bg-white shadow-md rounded-lg overflow-hidden">
                                                <tbody className="divide-y divide-gray-200">
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Resultado:</td>
                                                        <td className="px-6 py-4">
                                                            <span className={`font-bold ${resultadoInspeccion === 'Apto' ? 'text-green-500' : 'text-red-500'}`}>
                                                                {resultadoInspeccion}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Fecha:</td>
                                                        <td className="px-6 py-4">{fechaHoraActual}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Proyecto:</td>
                                                        <td className="px-6 py-4">{nombreProyecto}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Obra:</td>
                                                        <td className="px-6 py-4">{obra}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Tramo:</td>
                                                        <td className="px-6 py-4">{tramo}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Ppi:</td>
                                                        <td className="px-6 py-4">{loteInfo.ppiNombre}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Observaciones Informe:</td>
                                                        <td className="px-6 py-4">{localObservaciones}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Sector:</td>
                                                        <td className="px-6 py-4">{loteInfo.sectorNombre}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Sub sector:</td>
                                                        <td className="px-6 py-4">{loteInfo.subSectorNombre}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Parte:</td>
                                                        <td className="px-6 py-4">{loteInfo.parteNombre}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Elemento:</td>
                                                        <td className="px-6 py-4">{loteInfo.elementoNombre}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Lote:</td>
                                                        <td className="px-6 py-4">{loteInfo.nombre}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Pk inicial:</td>
                                                        <td className="px-6 py-4">{loteInfo.pkInicial}</td>
                                                    </tr>
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Pk final:</td>
                                                        <td className="px-6 py-4">{loteInfo.pkFinal}</td>
                                                    </tr>
                                                    {/* <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Usuario:</td>
                                                        <td className="px-6 py-4">{username}</td>
                                                       
                                                    </tr> */}
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Comentarios inspección:</td>
                                                        <td className="px-6 py-4">{comentario}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>





                            <div className="flex justify-center gap-4 mt-3">
                                <button
                                    onClick={() => {

                                        handleConfirmarEnvio()
                                        setMostrarConfirmacion(false);
                                        
                                    }}
                                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Confirmar
                                </button>

                                <button
                                    onClick={() => {
                                        setMostrarConfirmacion(false)
                                        setImagen('')
                                        setImagen2('')
                                        setImagenDataCoordinates([])
                                        setIsAuto(true)
                                        setIsManual(false)
                                    }}
                                    className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {mostrarConfirmacionAdicional && (
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-90 p-4">
                    <div className="bg-white w-[600px] flex flex-col items-center p-6 rounded-lg shadow-md w-80">
                        <div className="text-center">
                            <p className="text-2xl font-semibold mb-4">
                                Resultado:{' '}
                                <span className={resultadoInspeccion === 'Apto' ? 'text-green-500' : 'text-red-500'}>
                                    {resultadoInspeccion}
                                </span>
                            </p>
                            <h2 className="font-semibold text-lg mb-2">¿Guardar datos?</h2>
                            <p className="text-sm text-gray-600 mb-6">
                                No podrás modificarlos después y se guardará el informe.
                            </p>
                        </div>
                        <div className="flex gap-4 w-full">
                            <button onClick={handleConfirmacionFinal} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 rounded-lg transition duration-150">
                                Confirmar
                            </button>
                            <button onClick={() => {
                                setMostrarConfirmacionAdicional(false)
                                setImagen('')
                                setImagen2('')
                                setImagenDataCoordinates([])
                                setIsAuto(true)
                                setIsManual(false)
                            }}
                                className="w-full bg-gray-400 hover:bg-gray-500 text-white py-2 rounded-lg transition duration-150">
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}




        </div>
    )
}

export default FormularioInspeccion;
