import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FaFilePdf } from "react-icons/fa";
import jsPDF from 'jspdf';
import logo from '../assets/tpf_logo_azul.png'
import { IoIosWarning } from "react-icons/io";

import { db } from '../../../firebase_config';
import { getDoc, getDocs, doc, deleteDoc, collection, addDoc, runTransaction, writeBatch, setDoc, query, where, updateDoc } from 'firebase/firestore';

function FormularioInspeccion({ setImagen, setImagen2, onObservaciones, formulario, crearVariableFormularioTrue, handleConfirmarEnviotablaPpi, handleConfirmarEnvioPdf, setMensajeExitoInspeccion, setModalConfirmacionInforme, setModalFormulario, marcarFormularioComoEnviado, resultadoInspeccion, comentario, setComentario, firma, fechaHoraActual, handleCloseModal, ppiNombre, nombreResponsable, setResultadoInspeccion, enviarDatosARegistros }) {

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
                    console.log("Datos del lote:", docSnap.data());
                    setLoteInfo({ id: docSnap.id, ...docSnap.data() });
                    console.log({ id: docSnap.id, ...docSnap.data() });
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




    // const generatePDF = (firma, fechaHoraActual, nombreResponsable, docId) => {
    //     const doc = new jsPDF();






    //     // Establecer el tamaño de fuente deseado
    //     const fontSize = 10;

    //     // Tamaño y posición del recuadro
    //     const rectX = 10;
    //     const rectY = 10;
    //     const rectWidth = 190; // Ancho del recuadro
    //     const rectHeight = 20; // Altura del recuadro

    //     // Establecer el tamaño de fuente
    //     doc.setFontSize(fontSize);

    //     doc.setFillColor(230, 230, 230); // Gris muy claro casi blanco

    //     // Dibujar el recuadro con fondo gris
    //     doc.rect(rectX, rectY, rectWidth, rectHeight, 'F'); // 'F' indica que se debe rellenar el rectángulo

    //     // Establecer el color de texto
    //     doc.setTextColor(0, 0, 0); // Color negro

    //     // Colocar texto dentro del recuadro
    //     doc.text(titulo, 75, 18); // Ajusta las coordenadas según tu diseño
    //     doc.text(nombreProyecto, 75, 22); // Ajusta las coordenadas según tu diseño

    //     if (imagenPath2) {
    //         const imgData = imagenPath2;
    //         doc.addImage(imgData, 'JPEG', 12, 12, 30, 15); // Ajusta las coordenadas y dimensiones según tu diseño
    //     }
    //     if (imagenPath) {
    //         const imgData = imagenPath;
    //         doc.addImage(imgData, 'JPEG', 45, 15, 20, 10); // Ajusta las coordenadas y dimensiones según tu diseño
    //     }

    //     // Dibujar el borde después de agregar las imágenes
    //     doc.setDrawColor(0); // Color negro
    //     doc.rect(rectX, rectY, rectWidth, rectHeight); // Dibujar el borde del rectángulo


    //     ///////////////////////////////////////////////////////////////////////////////////////////////////////
    //     // Tamaño y posición del segundo recuadro
    //     const rectX2 = 10;
    //     const rectY2 = 30;
    //     const rectWidth2 = 190; // Ancho del recuadro
    //     const rectHeight2 = 20; // Altura del recuadro

    //     // Establecer el ancho de la línea del borde
    //     const borderWidth = 0.5; // Ancho del borde en puntos

    //     // Establecer el color de la línea del borde
    //     doc.setDrawColor(0); // Color negro

    //     // Dibujar el borde del segundo recuadro
    //     doc.rect(rectX2, rectY2, rectWidth2, rectHeight2);

    //     // Establecer el color de fondo para el segundo recuadro
    //     doc.setFillColor(240, 240, 240); // Gris muy claro casi blanco

    //     // Dibujar el segundo recuadro con fondo gris claro y borde en todos los lados
    //     doc.rect(rectX2, rectY2, rectWidth2, rectHeight2, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde en todos los lados

    //     // Establecer el tamaño de fuente
    //     doc.setFontSize(fontSize);

    //     // Colocar texto dentro del segundo recuadro
    //     doc.text(`Obra: ${obra} test de obra *******`, 15, 40);
    //     doc.text(`Tramo: ${tramo}`, 15, 45);
    //     doc.text(`Nº de registro: ${docId}`, 120, 40);
    //     doc.text(`Fecha: ${fechaHoraActual}`, 150, 45);


    //     ///////////////////////////////////////////////////////////////////////////////////////////////////////
    //     // Tamaño y posición del recuadro
    //     const rectX3 = 10;
    //     const rectY3 = 50;
    //     const rectWidth3 = 190; // Ancho del recuadro
    //     const rectHeight3 = 20; // Altura del recuadro

    //     // Establecer el tamaño de fuente
    //     doc.setFontSize(fontSize);

    //     // Establecer el color de fondo para el recuadro
    //     doc.setFillColor(240, 240, 240); // Gris muy claro casi blanco

    //     // Dibujar el recuadro con fondo gris claro
    //     doc.rect(rectX3, rectY3, rectWidth3, rectHeight3, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

    //     // Establecer el color de texto
    //     doc.setTextColor(0, 0, 0); // Color negro

    //     // Colocar texto dentro del recuadro
    //     doc.text(`PPI: ${ppiNombre}`, 15, 60);
    //     doc.text(`Plano que aplica: `, 15, 65);


    //     // Tamaño y posición del recuadro
    //     const rectX4 = 10;
    //     const rectY4 = 70;
    //     const rectWidth4 = 190; // Ancho del recuadro
    //     const rectHeight4 = 20; // Altura del recuadro

    //     // Establecer el tamaño de fuente
    //     doc.setFontSize(fontSize);

    //     // Establecer el color de fondo para el recuadro
    //     doc.setFillColor(240, 240, 240); // Gris claro casi blanco

    //     // Dibujar el recuadro con fondo gris claro
    //     doc.rect(rectX4, rectY4, rectWidth4, rectHeight4, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

    //     // Establecer el color de texto
    //     doc.setTextColor(0, 0, 0); // Color negro

    //     // Dibujar el borde del rectángulo
    //     doc.rect(rectX4, rectY4, rectWidth4, rectHeight4);

    //     // Texto a colocar con salto de línea
    //     const textoObservaciones = `Observaciones: ${observaciones}`;

    //     // Dividir el texto en líneas cada vez que exceda 15 palabras
    //     const words = textoObservaciones.split(' ');
    //     const maxWordsPerLine = 15;
    //     const lines = [];
    //     let currentLine = '';

    //     for (let i = 0; i < words.length; i++) {
    //         currentLine += words[i] + ' ';
    //         if ((i + 1) % maxWordsPerLine === 0 || i === words.length - 1) {
    //             lines.push(currentLine.trim());
    //             currentLine = '';
    //         }
    //     }

    //     // Colocar texto en el PDF
    //     let yPosition = rectY4 + fontSize + 2; // Iniciar la posición dentro del recuadro
    //     let xPosition = rectX4 + 5; // Ajustar posición x para evitar que el texto toque el borde del rectángulo
    //     lines.forEach(line => {
    //         doc.text(line, xPosition, yPosition, { maxWidth: rectWidth4 - 4 }); // Ajustar maxWidth para evitar que el texto exceda el ancho del rectángulo
    //         yPosition += fontSize + 2; // Aumentar la posición para la siguiente línea
    //     });

    //     // Tamaño y posición del recuadro 5
    //     const rectX5 = 10;
    //     const rectY5 = 90;
    //     const rectWidth5 = 190; // Ancho del recuadro
    //     const rectHeight5 = 80; // Altura del recuadro

    //     // Establecer el tamaño de fuente
    //     doc.setFontSize(fontSize);

    //     // Establecer el color de fondo para el recuadro 5
    //     doc.setFillColor(240, 240, 240); // Gris claro casi blanco

    //     // Dibujar el recuadro 5 con fondo gris claro
    //     doc.rect(rectX5, rectY5, rectWidth5, rectHeight5, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

    //     // Establecer el color de texto
    //     doc.setTextColor(0, 0, 0); // Color negro

    //     // Dibujar el borde del recuadro 5
    //     doc.rect(rectX5, rectY5, rectWidth5, rectHeight5);

    //     // Colocar texto dentro del recuadro 5
    //     doc.text(`Sector: ${loteInfo.sectorNombre}`, 15, 100);
    //     doc.text(`Subsector: ${loteInfo.subSectorNombre}`, 15, 110);
    //     doc.text(`Parte: ${loteInfo.parteNombre}`, 15, 120);
    //     doc.text(`Elemento: ${loteInfo.elementoNombre}`, 15, 130);
    //     doc.text(`Lote: ${loteInfo.nombre}`, 15, 140);
    //     doc.text(`Pk inicial: ${loteInfo.pkInicial}`, 15, 150);
    //     doc.text(`Pk final: ${loteInfo.pkFinal}`, 15, 160);

    //     // Tamaño y posición del recuadro 6
    //     const rectX6 = 10;
    //     const rectY6 = 170;
    //     const rectWidth6 = 190; // Ancho del recuadro
    //     const rectHeight6 = 70; // Altura del recuadro

    //     // Establecer el tamaño de fuente
    //     doc.setFontSize(fontSize);

    //     // Establecer el color de fondo para el recuadro 6
    //     doc.setFillColor(240, 240, 240); // Gris claro casi blanco

    //     // Dibujar el recuadro 6 con fondo gris claro
    //     doc.rect(rectX6, rectY6, rectWidth6, rectHeight6, 'FD');

    //     // Dibujar el borde del recuadro 6
    //     doc.rect(rectX6, rectY6, rectWidth6, rectHeight6);

    //     // Agregar imagen al PDF dentro del recuadro 6
    //     if (imagen) {
    //         doc.addImage(imagen, 'JPEG', 25, 180, 70, 50); // Ajusta las coordenadas y el tamaño según necesites
    //     }
    //     if (imagen2) {
    //         doc.addImage(imagen2, 'JPEG', 110, 180, 70, 50); // Ajusta las coordenadas y el tamaño según necesites
    //     }

    //     // Tamaño y posición del recuadro 7
    //     const rectX7 = 10;
    //     const rectY7 = 240;
    //     const rectWidth7 = 190; // Ancho del recuadro
    //     const rectHeight7 = 28; // Altura del recuadro

    //     // Establecer el tamaño de fuente
    //     doc.setFontSize(fontSize);

    //     // Establecer el color de fondo para el recuadro 7
    //     doc.setFillColor(240, 240, 240); // Gris claro casi blanco

    //     // Dibujar el recuadro 7 con fondo gris claro
    //     doc.rect(rectX7, rectY7, rectWidth7, rectHeight7, 'FD');

    //     // Dibujar el borde del recuadro 7
    //     doc.rect(rectX7, rectY7, rectWidth7, rectHeight7);

    //     // Colocar texto dentro del recuadro 7
    //     doc.text('Resultado de la inspección', 150, 240);
    //     doc.text(resultadoInspeccion, 150, 240);
    //     doc.text(`Nombre del responsable ${nombreResponsable}`, 150, 250);

    //     doc.text(`Firmado electronicamente con blockchain`, 15, 250);
    //     doc.text(firma, 15, 260);









    //     doc.save('formularioWeb.pdf');
    // };



    const [mostrarConfirmacionAdicional, setMostrarConfirmacionAdicional] = useState(false);

    const [localObservaciones, setLocalObservaciones] = useState('');

    const enviarObservaciones = () => {
        onObservaciones(localObservaciones); // Envía las observaciones al componente padre
    };

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
                        <label htmlFor="observaciones" className="block text-gray-500 text-sm font-bold mb-2">Observaciones del informe</label>
                        <textarea id="observaciones" value={localObservaciones} onChange={(e) => setLocalObservaciones(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                    </div>
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
                <div className='flex justify-center gap-5 mt-2'>
                    <button type="button" onClick={handleSolicitarConfirmacion} className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex gap-2 items-center"><FaFilePdf /> Guardar</button>
                    <button type="button" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex gap-2 items-center"
                        onClick={() => {
                            handleCloseModal()
                            setModalConfirmacionInforme(false)
                            setImagen('')
                            setImagen2('')
                        }}>Cancelar </button>
                </div>
            </form>

            {
                mostrarConfirmacion && (
                    <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-800 bg-opacity-90 text-gray-500 fonmt-medium text-center">
                        <div className="mx-auto w-[600px] h-[600px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto px-12 py-8">

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
                                            <h2 className="font-medium text-start">
                                                * Revisa los datos y comprueba que todo está correcto
                                            </h2>
                                        </div>

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
                                                        <td className="px-6 py-4">{observaciones}</td>
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
                                                    <tr>
                                                        <td className="px-6 py-4 font-medium text-gray-700">Usuario:</td>
                                                        <td className="px-6 py-4">{nombreResponsable}</td>
                                                    </tr>
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
                <div className="fixed inset-0 z-50 flex justify-center items-center bg-gray-900 bg-opacity-80">
                    <div className="bg-white flex flex-col items-center p-6 rounded-lg shadow-md w-80">
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
                            <button onClick={handleConfirmacionFinal} className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2 rounded-lg transition duration-150">
                                Confirmar
                            </button>
                            <button onClick={() => {
                                setMostrarConfirmacionAdicional(false)
                                setImagen('')
                                setImagen2('')
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
