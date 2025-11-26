import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase_config';
import { getDoc, getDocs, query, collection, where, doc, updateDoc, increment, addDoc, or, setDoc } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { FaArrowRight } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { IoMdAddCircle } from "react-icons/io";
import { FaFilePdf } from "react-icons/fa6";
import { FaQuestionCircle } from "react-icons/fa";
import { FiRefreshCcw } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { FcInspection } from "react-icons/fc";
import { FaRegEdit } from "react-icons/fa";
import { IoMdEye } from "react-icons/io";
import { IoIosEyeOff } from "react-icons/io";
import FormularioInspeccion from '../../Components/FormularioInspeccion'
import logo from '../assets/tpf_logo_azul.png'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Pdf_final from '../Pdf_final';
import imageCompression from 'browser-image-compression';

import { IoArrowBackCircle } from "react-icons/io5";
import { useAuth } from '../../context/authContext';
import { TiLockClosedOutline } from "react-icons/ti";


function TablaPpi() {

    const handleGoBack = () => {
        navigate(`/elementos/${id}`); // Esto navega hacia atrás en la historia
    };
    const { user } = useAuth();
    let emailUser = user.email
    const titulo = "REGISTRO DE INSPECCIÓN DE OBRA REV-1"

    const imagenPath = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Adif_wordmark.svg/1200px-Adif_wordmark.svg.png"
    const imagenPath2 = logo
    const [nombreProyecto, setNombreProyecto] = useState(localStorage.getItem('nombre_proyecto') || '');
    const [obra, setObra] = useState(localStorage.getItem('obra'));
    const [tramo, setTramo] = useState(localStorage.getItem('tramo'));
    const [observaciones, setObservaciones] = useState('');
    const { idLote } = useParams();
    const navigate = useNavigate();
    const [ppi, setPpi] = useState(null);
    const lote = localStorage.getItem('lote')



    const handleObservaciones = (nuevasObservaciones) => {
        setObservaciones(nuevasObservaciones);
    };

    const [userName, setUserName] = useState('')
    const [userSignature, setUserSignature] = useState('')
    useEffect(() => {
        if (user) {
            const userDocRef = doc(db, 'usuarios', user.uid);
            getDoc(userDocRef).then(docSnap => {
                if (docSnap.exists()) {
                    const userData = docSnap.data();
                    setUserName(userData.nombre);
                    setUserSignature(userData.signature);
                }
            });
        } else {
            setUserNombre('');
        }
    }, [user]);


    useEffect(() => {
        const obtenerInspecciones = async () => {
            try {
                const inspeccionesRef = collection(db, "lotes", idLote, "inspecciones");
                const querySnapshot = await getDocs(inspeccionesRef);

                const inspeccionesData = querySnapshot.docs.map(doc => ({
                    docId: doc.id, // Almacena el ID del documento generado automáticamente por Firestore
                    ...doc.data()
                }));

                // Asegúrate de que este paso esté ajustado a cómo manejas los datos en tu aplicación
                if (inspeccionesData.length > 0) {
                    setPpi(inspeccionesData[0]);
                    setPpiNombre(inspeccionesData[0].nombre) // O maneja múltiples inspecciones según sea necesario
                } else {

                    setPpi(null);
                }
            } catch (error) {
                console.error('Error al obtener las inspecciones:', error);
            }
        };



        obtenerInspecciones();

    }, [idLote]); // Dependencia del efecto basada en idLote

    useEffect(() => {


    }, []);




    const regresar = () => {
        navigate(-1); // Regresa a la página anterior
    };





    const [seleccionApto, setSeleccionApto] = useState({});
    const [tempSeleccion, setTempSeleccion] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [modal, setModal] = useState(false);
    const [modalFormulario, setModalFormulario] = useState(false);
    const [currentSubactividadId, setCurrentSubactividadId] = useState(null);

    const [ppiNombre, setPpiNombre] = useState('');








    const handleOpenModalFormulario = (subactividadId) => {
        setCurrentSubactividadId(subactividadId);

        // Inicializar la selección temporal con el valor actual si existe
        const valorActual = seleccionApto[subactividadId]?.resultadoInspeccion;
        setTempSeleccion(valorActual);
        // Añadir aquí el reseteo de los estados necesarios
        setComentario(''); // Resetear el comentario a un string vacío
        setObservaciones(''); // Si también necesitas resetear observaciones o cualquier otro estado, hazlo aquí
        setModalFormulario(true);
    };




    const handleCloseModal = () => {
        setModal(false)
        setModalFormulario(false)
        setComentario('')
        setResultadoInspeccion('Apto')


    };


    // agregar cometarios
    const [comentario, setComentario] = useState("");

    const [resultadoInspeccion, setResultadoInspeccion] = useState("Apto");

    // Define la fecha, el responsable y genera la firma aquí
    const fechaHoraActual = new Date().toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    // Asumiendo que tienes una forma de obtener el nombre del usuario

    const firma = 'zO9c82%&45e6e0b74cfccg97e/&/8714u32342&%&/28fb4xcd2'



    useEffect(() => {
        if (ppi) {
            const total = ppi.actividades.reduce((sum, actividad) =>
                sum + actividad.subactividades.filter(subactividad => subactividad.version === 0).length, 0);
            const aptas = ppi.actividades.reduce((sum, actividad) =>
                sum + actividad.subactividades.filter(subactividad => subactividad.resultadoInspeccion === 'Apto' && subactividad.version === 0).length, 0);

            setTotalSubActividades(total);
            setActividadesAptas(aptas);
            setDifActividades(total - aptas);

            if (total > 1 && total === aptas) {
                setCierreInspeccion(true);
            } else {
                setCierreInspeccion(false);
            }
        }
    }, [ppi]);



    const marcarFormularioComoEnviado = async (idRegistroFormulario, resultadoInspeccion) => {
        if (!ppi || !currentSubactividadId) {
            return;
        }

        const [actividadIndex, subactividadIndex] = currentSubactividadId.split('-').slice(1).map(Number);
        let nuevoPpi = { ...ppi };
        let subactividadSeleccionada = nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex];

        let motivoVersionActual = subactividadSeleccionada.motivoVersion || 'original';

        subactividadSeleccionada.formularioEnviado = formulario;
        subactividadSeleccionada.idRegistroFormulario = idRegistroFormulario;
        subactividadSeleccionada.resultadoInspeccion = resultadoInspeccion;
        subactividadSeleccionada.fecha = fechaHoraActual;
        subactividadSeleccionada.nombre_usuario = userName;
        subactividadSeleccionada.signature = userSignature;
        subactividadSeleccionada.firma = firma;
        subactividadSeleccionada.comentario = comentario;
        subactividadSeleccionada.active = true;

        if (resultadoInspeccion === "Apto") {
            const loteRef = doc(db, "lotes", idLote);
            await updateDoc(loteRef, {
                actividadesAptas: increment(1)
            });
        }

        if (resultadoInspeccion === "No apto") {
            let nuevaSubactividad = {
                ...subactividadSeleccionada,
                active: false,
                motivoVersion: motivoVersionActual
            };
            nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] = nuevaSubactividad;

            let nuevaVersion = nuevoPpi.actividades[actividadIndex].subactividades.reduce((maxVersion, subactividad) => {
                return Math.max(maxVersion, parseInt(subactividad.version));
            }, 0) + 1;

            let nuevaSubactividadRepetida = {
                ...nuevaSubactividad,
                version: nuevaVersion,
                active: true,
                comentario: '',
                resultadoInspeccion: '',
                nombre_usuario: '',
                signature: '',
                firma: '',
                fecha: '',
                formularioEnviado: false,
                motivoVersion: 'rechazada'
            };

            nuevoPpi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividadRepetida);
        }

        // Lógica adicional para manejar la edición de versiones relacionadas
        if (motivoVersionActual !== 'original' && resultadoInspeccion === "Apto") {
            nuevoPpi.actividades[actividadIndex].subactividades.forEach((subactividad, index) => {
                if (index > subactividadIndex && subactividad.motivoVersion === 'rechazada') {
                    subactividad.version = nuevaVersion;
                    subactividad.active = false;
                    subactividad.motivoVersion = 'editada';
                }
            });
        }

        await actualizarFormularioEnFirestore(nuevoPpi);
        setPpi(nuevoPpi);
    };











    const [modalInforme, setModalInforme] = useState(false)
    const [modalConfirmacionInforme, setModalConfirmacionInforme] = useState(false)


    const closeModalConfirmacion = () => {
        setModalInforme(false)

    }

    const confirmarModalInforme = () => {
        setModalConfirmacionInforme(true)
        handleCloseModal()
        setModalInforme(false)

    }











    const [loteInfo, setLoteInfo] = useState(null); // Estado para almacenar los datos del PPI
    const [sectorInfoLote, setSectorInfoLote] = useState(null); // Estado para almacenar los datos del PPI
    const [cierreInspeccion, setCierreInspeccion] = useState(false); // Estado para almacenar los datos del PPI
    const [actividadesAptas, setActividadesAptas] = useState(0); // Estado para almacenar los datos del PPI
    const [totalSubactividades, setTotalSubActividades] = useState(0); // Estado para almacenar los datos del PPI
    const [difActividades, setDifActividades] = useState(0); // Estado para almacenar los datos del PPI


    useEffect(() => {
        const obtenerLotePorId = async () => {
            if (!idLote) return;

            try {
                const docRef = doc(db, "lotes", idLote);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setLoteInfo({ id: docSnap.id, ...docSnap.data() });

                    let loteObject = { id: docSnap.id, ...docSnap.data() };
                    let actividadesAptas = loteObject.actividadesAptas;
                    console.log(actividadesAptas, 'actividades aptas');
                    setActividadesAptas(actividadesAptas);

                    // Calcular totalSubactividades solo para versiones 0
                    let totalSubactividades = ppi.actividades.reduce((sum, actividad) =>
                        sum + actividad.subactividades.filter(subactividad => subactividad.version === 0).length, 0);
                    setTotalSubActividades(totalSubactividades);

                    let difActividades = totalSubactividades - actividadesAptas;
                    setDifActividades(difActividades);

                    if (difActividades === 0) {
                        setCierreInspeccion(true);
                    } else {
                        setCierreInspeccion(false);
                    }

                    console.log(cierreInspeccion, difActividades, '******************');
                } else {
                    console.log("No se encontró el lote con el ID:", idLote);
                }
            } catch (error) {
                console.error("Error al obtener el lote:", error);
            }
        };

        obtenerLotePorId();
    }, [idLote, ppi]);


    const [formulario, setFormulario] = useState(true)

    // const crearVariableFormularioTrue = () => {
    //     setFormulario(true)
    // }


    const enviarDatosARegistros = async () => {
        // Descomponer currentSubactividadId para obtener los índices
        const [, actividadIndex, subactividadIndex] = currentSubactividadId.split('-').map(Number);

        // Acceder a la subactividad seleccionada
        const actividadSeleccionada = ppi.actividades[actividadIndex];
        const subactividadSeleccionada = ppi.actividades[actividadIndex].subactividades[subactividadIndex];

        // Objeto que representa los datos del formulario
        const datosFormulario = {
            nombreProyecto,
            obra: obra,
            tramo: tramo,
            ppiNombre: loteInfo.ppiNombre,
            observaciones: observaciones,
            comentario: comentario,
            sector: loteInfo.sectorNombre,
            subSector: loteInfo.subSectorNombre,
            parte: loteInfo.parteNombre,
            elemento: loteInfo.elementoNombre,
            lote: loteInfo.nombre,
            firma: firma,
            pkInicial: loteInfo.pkInicial,
            pkFinal: loteInfo.pkFinal,
            actividad: actividadSeleccionada.actividad,
            num_actividad: actividadSeleccionada.numero,
            version_subactividad: subactividadSeleccionada.version,
            numero_subactividad: subactividadSeleccionada.numero,
            subactividad: subactividadSeleccionada.nombre, // Nombre de la subactividad seleccionada
            criterio_aceptacion: subactividadSeleccionada.criterio_aceptacion,
            documentacion_referencia: subactividadSeleccionada.documentacion_referencia,
            tipo_inspeccion: subactividadSeleccionada.tipo_inspeccion,
            punto: subactividadSeleccionada.punto,
            responsable: subactividadSeleccionada.responsable,
            nombre_usuario: userName,
            signature: userSignature,
            fechaHoraActual: fechaHoraActual,
            globalId: loteInfo.globalId || '',
            nombreGlobalId: loteInfo.nameBim || '',
            resultadoInspeccion: resultadoInspeccion,
            formulario: formulario,
            imagen: imagen, // Incluyendo la primera imagen comprimida
            imagen2: imagen2
        };

        // Convertir datos a JSON y medir el tamaño
        const jsonString = JSON.stringify(datosFormulario);
        const dataSize = new Blob([jsonString]).size;
        console.log(`Tamaño total del registro (incluyendo imágenes): ${(dataSize / 1024 / 1024).toFixed(2)} MB`);


        try {
            // Referencia a la colección 'registros' en Firestore

            const coleccionRegistros = collection(db, "registros");
            const docRef = await addDoc(coleccionRegistros, datosFormulario);
            setMensajeExitoInspeccion('Inspección completada con éxito')

            // Opcionalmente, cierra el modal o limpia el formulario aquí
            setModalFormulario(false);

            setObservaciones('')
            setComentario('')

            return docRef.id; // Devolver el ID del documento creado


        } catch (e) {
            console.error("Error al añadir documento: ", e);
        }
    };

    const handleConfirmarEnviotablaPpi = async () => {
        // Aquí llamarías a la función que realmente envía los datos del formulario
        await handelEnviarFormulario();
        setMostrarConfirmacion(false);
        setModalInforme(false);

        setComentario('')
        // Esperar un poco antes de mostrar el modal de éxito para asegurar que los modales anteriores se han cerrado
        setTimeout(() => {
            setModalExito(true);


        }, 300); // Ajusta el tiempo según sea necesario
    };

    const handleConfirmarEnvioPdf = async () => {
        // Aquí llamarías a la función que realmente envía los datos del formulario
        setMostrarConfirmacion(false);
        setModalFormulario(false);
        setModalConfirmacionInforme(false)




        // Esperar un poco antes de mostrar el modal de éxito para asegurar que los modales anteriores se han cerrado
        setTimeout(() => {
            setModalExito(true);

        }, 300); // Ajusta el tiempo según sea necesario
    };






    const handelEnviarFormulario = async () => {
        const idRegistroFormulario = await enviarDatosARegistros();
        if (idRegistroFormulario) {
            await marcarFormularioComoEnviado(idRegistroFormulario, resultadoInspeccion);

        }
    };

    const [mensajeExitoInspeccion, setMensajeExitoInspeccion] = useState('')
    const [modalExito, setModalExito] = useState(false)

    const [documentoFormulario, setDocumentoFormulario] = useState(null)
    const [modalRecuperarFormulario, setModalRecuperarFormulario] = useState(false)

    const handleMostrarIdRegistro = async (subactividadId) => {
        const [actividadIndex, subactividadIndex] = subactividadId.split('-').slice(1).map(Number);
        const subactividadSeleccionada = ppi.actividades[actividadIndex].subactividades[subactividadIndex];
        const idRegistroFormulario = subactividadSeleccionada.idRegistroFormulario;

        // Asegúrate de que existe un id antes de intentar recuperar el documento
        if (idRegistroFormulario) {
            try {
                // Obtener la referencia del documento en la colección de registros
                const docRef = doc(db, "registros", idRegistroFormulario);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setDocumentoFormulario(docSnap.data());
                    // Llamar a generatePDF directamente
                    await generatePDF(docSnap.data());
                } else {
                    console.log("No se encontró el documento con el ID:", idRegistroFormulario);
                }
            } catch (error) {
                console.error("Error al obtener el documento:", error);
            }
        } else {
            console.log("No se proporcionó un idRegistroFormulario válido.");
        }
    };


    const cerrarModalYLimpiarDatos = () => {
        setDocumentoFormulario('')
        setModalRecuperarFormulario(false)
    }








    const generatePDF = async (documentoFormulario) => {
        const pdfDoc = await PDFDocument.create();
        let currentPage = pdfDoc.addPage([595, 842]); // Inicializa la primera página
        let currentY = currentPage.getSize().height; // Inicializa la coordenada Y actual



        const { height } = currentPage.getSize();

        // Funciones auxiliares
        const blackColor = rgb(0, 0, 0); // Color negro
        const greenColor = hexToRgb("#15803d")
        const redColor = hexToRgb("#ef4444")
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const replaceSpecialChars = (text) => {
            if (text === null || text === undefined) return "";
            return text.replace(/≤/g, "<=");
        };


        const addText = (text, x, y, fontSize, font, currentPage, color = blackColor, maxWidth = 400, newX = 50) => {
            text = replaceSpecialChars(text); // Reemplazar caracteres especiales

            const words = text.split(' ');
            let currentLine = '';
            let currentY = y;
            let currentX = x; // Almacenar la coordenada X actual

            words.forEach(word => {
                let testLine = currentLine + word + " ";
                let testWidth = font.widthOfTextAtSize(testLine, fontSize);

                // Verifica si la línea de prueba es más larga que el ancho máximo permitido
                if (testWidth > maxWidth) {
                    // Dibuja la línea actual si no está vacía
                    if (currentLine !== '') {
                        currentPage.drawText(currentLine, { x: currentX, y: currentY, size: fontSize, font, color });
                        currentLine = ''; // Reinicia la línea actual
                        currentY -= fontSize * 1.8; // Ajusta la posición Y para la nueva línea
                        currentX = newX; // Actualiza la coordenada X para la nueva línea
                    }
                    // Verifica si la posición Y actual es menos que la altura mínima requerida para una nueva línea
                    if (currentY < fontSize * 1.4) {
                        currentPage = pdfDoc.addPage([595, 842]); // Añade una nueva página
                        currentY = currentPage.getSize().height - fontSize * 1.8; // Restablece la posición Y en la nueva página
                        currentX = x; // Restablece la coordenada X en el margen original
                    }
                    currentLine = word + ' '; // Inicia una nueva línea con la palabra actual
                } else {
                    currentLine = testLine; // Agrega la palabra a la línea actual
                }
            });

            // Dibuja cualquier texto restante que no haya sido agregado todavía
            if (currentLine !== '') {
                currentPage.drawText(currentLine, { x: currentX, y: currentY, size: fontSize, font, color });
            }

            return { lastY: currentY, page: currentPage };
        };



        function hexToRgb(hex) {
            // Asegurarse de que el hex tiene el formato correcto
            hex = hex.replace("#", "");
            if (hex.length === 3) {
                hex = hex.split('').map((hex) => {
                    return hex + hex;
                }).join('');
            }

            // Convertir hex a rgb
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;

            return rgb(r, g, b);
        }

        const addHorizontalLine = (x1, y, x2, thickness, hexColor = "#000000") => {
            const color = hexToRgb(hexColor);
            currentPage.drawLine({
                start: { x: x1, y },
                end: { x: x2, y },
                thickness: thickness,
                color: color,
            });
        };


        // Función para agregar imágenes al PDF
        const embedImage = async (imagePath, x, y, width, height) => {
            const imageBytes = await fetch(imagePath).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imageBytes);
            currentPage.drawImage(image, {
                x,
                y,
                width,
                height,
            });
        };


        // Determinar el color del texto según el resultado
        let color = blackColor; // Color predeterminado: negro
        if (documentoFormulario.resultadoInspeccion === "Apto") {
            color = greenColor; // Verde oscuro
        } else if (documentoFormulario.resultadoInspeccion === "No apto") {
            color = redColor; // Rojo
        }

        const l = 'Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas Estlíneasnecesitar múltiples líneas ';

        // Agregar imágenes al lado del nombre del proyecto
        await embedImage(imagenPath2, 380, height - 58, 80, 45); // Ajusta las coordenadas y dimensiones según sea necesario
        await embedImage(imagenPath, 490, height - 55, 70, 35); // Ajusta las coordenadas y dimensiones según sea necesario


        // Primero, asegurémonos de que todos los elementos anteriores estén correctamente posicionados
        let result = addText(titulo, 40, currentY - 35, 12, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;



        result = addText(nombreProyecto, 40, currentY - 15, 12, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;



        addHorizontalLine(40, currentY - 11, 555, 1, "#000000", currentPage);

        result = addText(obra, 50, currentY - 35, 12, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(tramo, 50, currentY - 15, 12, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        // Cargar y agregar la flecha verde si el resultado es "Apto"
        if (documentoFormulario.resultadoInspeccion === "Apto") {
            const arrowPath = 'data:image/png;base64,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'; // Cambia esto por la ruta real de tu imagen
            await embedImage(arrowPath, 440, currentY - 5, 20, 20); // Ajusta las coordenadas y el tamaño según sea necesario
        }
        else {
            const arrowPath = 'https://static-00.iconduck.com/assets.00/error-icon-512x512-mmajyv8q.png';
            await embedImage(arrowPath, 440, currentY - 5, 20, 20); // Ajusta las coordenadas y el tamaño según sea necesario
        }

        result = addText(documentoFormulario.resultadoInspeccion, 470, currentY, 20, boldFont, currentPage, color);
        currentPage = result.page;
        currentY = result.lastY;

        addHorizontalLine(40, currentY - 40, 555, 30, "#e2e8f0", currentPage);

        result = addText("Trazabilidad: ", 50, currentY - 44, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Pk inicial: ", 50, currentY - 38, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;


        result = addText("Pk final: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;


        result = addText(documentoFormulario.pkFinal, 95, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Sector: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(documentoFormulario.sector, 95, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Sub sector: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(documentoFormulario.subSector, 115, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Parte: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(documentoFormulario.parte, 85, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Elemento: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(documentoFormulario.elemento, 110, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Lote: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(documentoFormulario.lote, 85, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Nombre modelo: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(documentoFormulario.nombreGlobalId, 145, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("GlobalID: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(documentoFormulario.globalId, 105, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        addHorizontalLine(40, currentY - 40, 555, 30, "#e2e8f0", currentPage);

        result = addText("Inspección: ", 50, currentY - 44, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Actividad: ", 50, currentY - 35, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.num_actividad}. ${documentoFormulario.actividad}`, 111, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Sub Actividad: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`(V-${documentoFormulario.version_subactividad}) ${documentoFormulario.numero_subactividad}. ${documentoFormulario.subactividad}`, 135, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Criterio aceptación: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.criterio_aceptacion}`, 160, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Documentación de referencia: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.documentacion_referencia}`, 210, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;


        result = addText("Tipo de inspección: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.tipo_inspeccion}`, 160, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Punto: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.punto}`, 90, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;


        //////////////////////////////////////////////////////////////////////////////////////////////////////////////////


        addHorizontalLine(40, currentY - 33, 555, 30, "#e2e8f0", currentPage);



        const commentsMaxWidth = 520; // Ancho máximo específico para la sección de comentarios

        result = addText("Comentarios: ", 50, currentY - 35, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.observaciones}`, 50, currentY - 35, 11, regularFont, currentPage, blackColor, commentsMaxWidth);
        currentPage = result.page;
        currentY = result.lastY;


        addHorizontalLine(40, currentY - 20, 555, 1, "#e2e8f0", currentPage);

        /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


        result = addText("Fecha inspección: ", 50, currentY - 50, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.fechaHoraActual}`, 150, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;



        result = addText("Responsable: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.responsable}`, 130, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText("Nombre usuario: ", 50, currentY - 20, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(`${documentoFormulario.nombre_usuario}`, 145, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        const embedSignatureImage = async (pdfDoc, imagePath, currentPage, x, y, maxWidth) => {
            const imageBytes = await fetch(imagePath).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imageBytes);

            const { width, height } = image.scale(1); // Obtén el tamaño original de la imagen

            const scaledWidth = width > maxWidth ? maxWidth : width;
            const scaledHeight = (height / width) * scaledWidth;

            currentPage.drawImage(image, {
                x: x + 5, // Posiciona la imagen 5 unidades a la derecha del final del texto
                y: y - scaledHeight / 2 + 40, // Centra verticalmente la imagen con el texto
                width: scaledWidth,
                height: scaledHeight
            });
        };

        // En tu código principal:
        result = addText(`${documentoFormulario.nombre_usuario}`, 145, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        // Calcula la posición X para la imagen en función de la longitud del texto
        const textWidth = regularFont.widthOfTextAtSize(documentoFormulario.nombre_usuario, 11);
        const imageX = 360 + textWidth; // Posición X del texto más su longitud

        // Ajusta el ancho máximo de la imagen
        const maxWidth = 70; // Puedes ajustar esto según sea necesario

        await embedSignatureImage(pdfDoc, userSignature, currentPage, imageX, currentY, maxWidth);

        addHorizontalLine(520, currentY - -14, 400, 0.5, "#030712", currentPage);

        result = addText("Firma ", 450, currentY - 1, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;
        // result = addText("Firma: ", 50, currentY - 60, 11, boldFont, currentPage);
        // currentPage = result.page;
        // currentY = result.lastY;

        // result = addText(`${documentoFormulario.firma}`, 95, currentY, 11, regularFont, currentPage);
        // currentPage = result.page;
        // currentY = result.lastY;


        // Función para agregar imágenes Base64 al PDF
        const embedBase64Image = async (base64Image, x, y, width, height) => {
            const base64String = base64Image.split(';base64,').pop(); // Extraer solo la parte Base64 sin el encabezado MIME
            const imageBytes = base64ToArrayBuffer(base64String);
            const image = await pdfDoc.embedPng(imageBytes);
            currentPage.drawImage(image, {
                x: x,
                y: y - height, // Ajusta la posición y porque en PDFLib la posición y es desde la parte inferior
                width: width,
                height: height,
            });
        };

        function base64ToArrayBuffer(base64) {
            const binaryString = window.atob(base64); // Decodificar base64 a string binario
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }
            return bytes.buffer;
        }

        // Verificar si hay imágenes para añadir y necesitan una página nueva
        if (documentoFormulario.imagen || documentoFormulario.imagen2) {
            // Crear una nueva página específicamente para las imágenes
            currentPage = pdfDoc.addPage([595, 842]);
            currentY = currentPage.getSize().height;

            // Agregar imágenes al lado del nombre del proyecto
            await embedImage(imagenPath2, 380, height - 58, 80, 45); // Ajusta las coordenadas y dimensiones según sea necesario
            await embedImage(imagenPath, 490, height - 55, 70, 35); // Ajusta las coordenadas y dimensiones según sea necesario


            // Primero, asegurémonos de que todos los elementos anteriores estén correctamente posicionados
            let result = addText(titulo, 40, currentY - 35, 12, boldFont, currentPage);
            currentPage = result.page;
            currentY = result.lastY;

            result = addText(nombreProyecto, 40, currentY - 15, 12, boldFont, currentPage);
            currentPage = result.page;
            currentY = result.lastY;

            addHorizontalLine(40, currentY - 11, 555, 1, "#000000", currentPage);

            addHorizontalLine(40, currentY - 50, 555, 30, "#e2e8f0", currentPage);

            result = addText("Imagenes adjuntas: ", 50, currentY - 53, 11, boldFont, currentPage);
            currentPage = result.page;
            currentY = result.lastY;

            // Agregar la primera imagen si existe
            if (documentoFormulario.imagen) {
                await embedBase64Image(documentoFormulario.imagen, 50, currentY - 40, 400, 300);
                currentY -= 320;  // Ajustar el currentY para la siguiente imagen, incluyendo un espacio adicional
            }

            // Agregar la segunda imagen si existe
            if (documentoFormulario.imagen2) {
                await embedBase64Image(documentoFormulario.imagen2, 50, currentY - 40, 400, 300);
            }
        }



        // Continuar con el guardado y descarga del PDF, etc.


        // Guardar y descargar PDF
        const pdfBytes = await pdfDoc.save();
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfUrl = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `${obra}_${ppi.nombre}${documentoFormulario.num_actividad}_${documentoFormulario.actividad}${documentoFormulario.fechaHoraActual}.pdf`;
        link.click();
        URL.revokeObjectURL(pdfUrl);

        // Función para cerrar modal y limpiar datos si es necesario
        cerrarModalYLimpiarDatos();
    };

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [allowPdfGeneration, setAllowPdfGeneration] = useState(false);


    //! ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    const [imagen, setImagen] = useState(null);
    const [imagen2, setImagen2] = useState(null);


    const handleImagenChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`Tamaño original de la imagen: ${(file.size / 1024 / 1024).toFixed(2)} MB`); // Log del tamaño original

            try {
                const options = {
                    maxSizeMB: 0.3, // Tamaño máximo en MB
                    maxWidthOrHeight: 1200, // Ajusta la imagen al tamaño máximo manteniendo la relación de aspecto
                    useWebWorker: true, // Usa un web worker para la compresión en un hilo de fondo
                };
                const compressedFile = await imageCompression(file, options);
                console.log(`Tamaño de la imagen comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`); // Log del tamaño comprimido

                const reader = new FileReader();
                reader.onload = async () => {
                    const imgElement = document.createElement("img");
                    imgElement.src = reader.result;
                    imgElement.onload = () => {
                        console.log(`Dimensiones de la imagen: ${imgElement.width}x${imgElement.height}`); // Log de las dimensiones

                        const canvas = document.createElement("canvas");
                        const maxSize = Math.max(imgElement.width, imgElement.height);
                        if (maxSize > 500) {
                            const scaleFactor = 500 / maxSize;
                            canvas.width = imgElement.width * scaleFactor;
                            canvas.height = imgElement.height * scaleFactor;
                        } else {
                            canvas.width = imgElement.width;
                            canvas.height = imgElement.height;
                        }
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
                        const pngDataUrl = canvas.toDataURL("image/png");
                        setImagen(pngDataUrl); // Almacenar la imagen PNG en el estado
                    };
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error durante la compresión de la imagen:', error);
            }
        }
    };

    const handleImagenChange2 = async (e) => {
        const file = e.target.files[0];
        if (file) {
            console.log(`Tamaño original de la segunda imagen: ${(file.size / 1024 / 1024).toFixed(2)} MB`); // Log del tamaño original

            try {
                const options = {
                    maxSizeMB: 0.3,
                    maxWidthOrHeight: 1200,
                    useWebWorker: true,
                };
                const compressedFile = await imageCompression(file, options);
                console.log(`Tamaño de la segunda imagen comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`); // Log del tamaño comprimido

                const reader = new FileReader();
                reader.onload = async () => {
                    const imgElement = document.createElement("img");
                    imgElement.src = reader.result;
                    imgElement.onload = () => {
                        console.log(`Dimensiones de la segunda imagen: ${imgElement.width}x${imgElement.height}`); // Log de las dimensiones

                        const canvas = document.createElement("canvas");
                        const maxSize = Math.max(imgElement.width, imgElement.height);
                        if (maxSize > 500) {
                            const scaleFactor = 500 / maxSize;
                            canvas.width = imgElement.width * scaleFactor;
                            canvas.height = imgElement.height * scaleFactor;
                        } else {
                            canvas.width = imgElement.width;
                            canvas.height = imgElement.height;
                        }
                        const ctx = canvas.getContext("2d");
                        ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
                        const pngDataUrl = canvas.toDataURL("image/png");
                        setImagen2(pngDataUrl); // Almacenar la segunda imagen PNG en el estado
                    };
                };
                reader.readAsDataURL(compressedFile);
            } catch (error) {
                console.error('Error durante la compresión de la segunda imagen:', error);
            }
        }
    };


    const [showConfirmModalRepetida, setShowConfirmModalRepetida] = useState(false);
    const [subactividadToRepeat, setSubactividadToRepeat] = useState(null);
    const [subactividadSeleccionada, setSubactividadSeleccionada] = useState(null);


    const openConfirmModal = async (subactividadId) => {
        setSubactividadToRepeat(subactividadId);

        const [actividadIndex, subactividadIndex] = subactividadId.split('-').slice(1).map(Number);
        const subactividad = ppi.actividades[actividadIndex].subactividades[subactividadIndex];

        const formularioData = await obtenerDatosFormulario(subactividad.idRegistroFormulario);

        setSubactividadSeleccionada(subactividad);
        setActividadNombre(subactividad.nombre || '');
        setCriterioAceptacion(subactividad.criterio_aceptacion || '');
        setDocReferencia(subactividad.documentacion_referencia || '');
        setTipoInspeccion(subactividad.tipo_inspeccion || '');
        setPunto(subactividad.punto || '');
        setResponsable(subactividad.responsable || '');
        setAptoNoapto(subactividad.resultadoInspeccion || '');
        setNombre_usuario_edit(subactividad.nombre_usuario || '');
        setComentario(subactividad.comentario || '');
        setFormularioData(formularioData || {});

        // Guardar las imágenes originales
        setImagenOriginal(formularioData.imagen || '');
        setImagen2Original(formularioData.imagen2 || '');

        setShowConfirmModalRepetida(true);
    };





    const duplicarRegistro = async (idRegistroFormulario, nuevoIdRegistroFormulario) => {
        try {
            const docRef = doc(db, "registros", idRegistroFormulario);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                const nuevoDocRef = doc(db, "registros", nuevoIdRegistroFormulario);
                await setDoc(nuevoDocRef, {
                    ...data,
                    edited: false,
                    idRegistroReferencia: idRegistroFormulario,
                    fechaHoraActual: new Date().toISOString(),
                    active: true,
                    version: (parseInt(data.version) + 1).toString(),
                    originalId: data.originalId || idRegistroFormulario,
                });

                console.log("Documento original:", data);
                console.log("Nuevo documento duplicado:", {
                    ...data,
                    edited: false,
                    idRegistroReferencia: idRegistroFormulario,
                    fechaHoraActual: new Date().toISOString(),
                    active: true,
                    version: (parseInt(data.version) + 1).toString(),
                    originalId: data.originalId || idRegistroFormulario,
                });

                return nuevoIdRegistroFormulario;
            } else {
                console.log("No se encontró el documento con el ID:", idRegistroFormulario);
                return null;
            }
        } catch (error) {
            console.error("Error al duplicar el documento:", error);
            return null;
        }
    };






    const handleRepetirInspeccion = async () => {
        if (!ppi || !subactividadToRepeat) return;

        const [actividadIndex, subactividadIndex] = subactividadToRepeat.split('-').slice(1).map(Number);

        let nuevoPpi = { ...ppi };
        let subactividadSeleccionada = { ...nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] };

        // Generar un nuevo ID para el registro duplicado
        const nuevoIdRegistroFormulario = doc(collection(db, "registros")).id;

        // Obtener datos actuales
        const duplicadoId = await duplicarRegistro(subactividadSeleccionada.idRegistroFormulario, nuevoIdRegistroFormulario);

        if (!duplicadoId) {
            console.error("Error al duplicar el registro en Firestore.");
            return;
        }

        // Crear la nueva subactividad con los valores editados
        let nuevaSubactividad = {
            ...subactividadSeleccionada,
            nombre: actividadNombre,
            criterio_aceptacion: criterioAceptacion,
            documentacion_referencia: docReferencia,
            tipo_inspeccion: tipoInspeccion,
            punto: punto,
            responsable: responsable,
            comentario: comentario,
            edited: true,  // Asignar el valor edited: true
            resultadoInspeccion: aptoNoapto,
            idRegistroFormulario: nuevoIdRegistroFormulario,  // Asignar el nuevo ID del registro duplicado
            version: (parseInt(subactividadSeleccionada.version) + 1).toString(), // Incrementar la versión
            active: true, // Esta es la versión activa
            originalId: subactividadSeleccionada.originalId || subactividadSeleccionada.idRegistroFormulario, // Mantener el ID original
            motivoVersion: 'editada',  // Actualizar el campo aquí
        };

        // Actualizar la subactividad seleccionada para que no esté activa
        nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] = {
            ...subactividadSeleccionada,
            active: false // Marcar la versión anterior como no activa
        };

        // Añadir la nueva subactividad con los valores editados después de la original
        nuevoPpi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividad);

        // Actualizar el nuevo registro con las imágenes y observaciones si hay nuevas imágenes
        const registroDocRef = doc(db, "registros", nuevoIdRegistroFormulario);
        const updateData = {
            observaciones: formularioData.observaciones,
            edited: true,  // Asignar el valor edited: true
            version: nuevaSubactividad.version,
            active: true, // Esta es la versión activa
            originalId: nuevaSubactividad.originalId,
            motivoVersion: 'editada',  // Actualizar el campo aquí
        };
        if (imagen) updateData.imagen = imagen;
        if (imagen2) updateData.imagen2 = imagen2;
        await updateDoc(registroDocRef, updateData);

        console.log("Datos actualizados en el nuevo registro:", updateData);

        await actualizarFormularioEnFirestore(nuevoPpi);

        setPpi(nuevoPpi);
        setShowConfirmModalRepetida(false);
    };


    const actualizarFormularioEnFirestore = async (nuevoPpi) => {
        if (!nuevoPpi.docId) {
            console.error("No se proporcionó docId para la actualización.");
            return;
        }

        try {
            const ppiRef = doc(db, "lotes", idLote, "inspecciones", nuevoPpi.docId);
            const updatedData = {
                actividades: nuevoPpi.actividades.map(actividad => ({
                    ...actividad,
                    subactividades: actividad.subactividades.map(subactividad => ({
                        ...subactividad,
                        edited: subactividad.edited || false,
                        motivoVersion: subactividad.motivoVersion || 'original',  // Asegurar que el campo está presente
                    }))
                }))
            };

            await updateDoc(ppiRef, updatedData);
        } catch (error) {
            console.error("Error al actualizar PPI en Firestore:", error);
        }
    };






    const [actividadNombre, setActividadNombre] = useState('');
    const [criterioAceptacion, setCriterioAceptacion] = useState('');
    const [docReferencia, setDocReferencia] = useState('');
    const [tipoInspeccion, setTipoInspeccion] = useState('');
    const [punto, setPunto] = useState('');
    const [responsable, setResponsable] = useState('');
    const [aptoNoapto, setAptoNoapto] = useState('');
    const [nombre_usuario_edit, setNombre_usuario_edit] = useState('');

    const [formularioData, setFormularioData] = useState({});


    const obtenerDatosFormulario = async (idRegistroFormulario) => {
        try {
            const docRef = doc(db, "registros", idRegistroFormulario);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data();
            } else {
                console.log("No se encontró el documento con el ID:", idRegistroFormulario);
                return null;
            }
        } catch (error) {
            console.error("Error al obtener el documento:", error);
            return null;
        }
    };


    const [imagenOriginal, setImagenOriginal] = useState('');
    const [imagen2Original, setImagen2Original] = useState('');

    const [showActiveOnly, setShowActiveOnly] = useState(true);

    const toggleActiveOnly = () => {
        setShowActiveOnly(!showActiveOnly);
    };
    return (
        <div className='container mx-auto min-h-screen px-14 py-5 text-gray-500 text-sm'>
            {showConfirmModalRepetida && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-800 opacity-75"></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto overflow-hidden">
                        <button
                            onClick={() => setShowConfirmModalRepetida(false)}
                            className="absolute top-4 right-4 text-3xl text-gray-500 hover:text-gray-700 transition-colors duration-300"
                        >
                            <IoCloseCircle />
                        </button>
                        <div className="p-8 overflow-y-auto max-h-[80vh]">
                            <div className="text-center">
                                <h2 className="text-2xl font-semibold mb-6">Editar inspección</h2>
                            </div>
                            {subactividadSeleccionada && (
                                <div className="mb-6">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Actividad</label>
                                        <input
                                            type="text"
                                            value={actividadNombre}
                                            onChange={(e) => setActividadNombre(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Criterio de aceptación</label>
                                        <input
                                            type="text"
                                            value={criterioAceptacion}
                                            onChange={(e) => setCriterioAceptacion(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Documentación de referencia</label>
                                        <input
                                            type="text"
                                            value={docReferencia}
                                            onChange={(e) => setDocReferencia(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Tipo de inspección</label>
                                        <input
                                            type="text"
                                            value={tipoInspeccion}
                                            onChange={(e) => setTipoInspeccion(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Punto</label>
                                        <input
                                            type="text"
                                            value={punto}
                                            onChange={(e) => setPunto(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Responsable</label>
                                        <input
                                            type="text"
                                            value={responsable}
                                            onChange={(e) => setResponsable(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Nombre</label>
                                        <input
                                            type="text"
                                            value={nombre_usuario_edit}
                                            onChange={(e) => setNombre_usuario_edit(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700">Comentarios inspección</label>
                                        <textarea
                                            value={comentario}
                                            onChange={(e) => setComentario(e.target.value)}
                                            className="mt-1 p-2 w-full border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Resultado inspección:</label>
                                        <input
                                            type="text"
                                            value={aptoNoapto}
                                            onChange={(e) => setAptoNoapto(e.target.value)}
                                            className="mt-1 p-2 w-full bg-white border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>
                                    {formularioData && (
                                        <>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700">Imagen 1</label>
                                                <input onChange={handleImagenChange} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                                {formularioData.imagen && (
                                                    <img src={formularioData.imagen} alt="Imagen 1" />
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700">Imagen 2</label>
                                                <input onChange={handleImagenChange2} type="file" id="imagen2" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                                {formularioData.imagen2 && (
                                                    <img src={formularioData.imagen2} alt="Imagen 2" />
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700">Observaciones del informe</label>
                                                <textarea
                                                    value={formularioData.observaciones}
                                                    onChange={(e) => setFormularioData({ ...formularioData, observaciones: e.target.value })}
                                                    className="mt-1 p-2 block w-full border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                                />
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleRepetirInspeccion}
                                    className="bg-amber-700 hover:bg-amber-800 px-4 py-2 rounded-md shadow-md text-white font-medium"
                                >
                                    Actualizar
                                </button>
                                <button
                                    onClick={() => setShowConfirmModalRepetida(false)}
                                    className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-md shadow-md text-white font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}










            <div className='flex gap-2 items-center justify-between bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                <div className='flex gap-2 items-center'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'/'}>
                        <h1 className=' text-gray-500'>Home</h1>
                    </Link>

                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />

                    <h1 className='cursor-pointer text-gray-500' onClick={regresar}>Elementos</h1>

                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'#'}>
                        <div className='font-medium text-sm text-amber-600 flex gap-2 items-center'>
                            <div className='flex gap-1'>
                                <p>Lote: </p>
                                <p>{lote}</p>
                            </div>

                            <div className='flex gap-1 items-center'>
                                <p className='text-sm'>- </p>
                                <p className='text-sm text-amber-600'>{ppiNombre}</p>
                            </div>

                        </div>
                    </Link>
                </div>


                <div className='flex items-center gap-4'>
                    <button className='text-amber-600 text-3xl' onClick={regresar}><IoArrowBackCircle /></button>



                </div>

            </div>




            <div className='flex gap-3 flex-col mt-5 bg-white  rounded-xl shadow-md'>
                <div className="w-full rounded-xl overflow-x-auto">
                    <div>
                        <div className="w-full bg-gray-300 text-gray-600 text-sm font-medium py-3 px-3 grid grid-cols-24">
                            <div className='col-span-1 flex items-center text-center'>Versión</div>
                            <div className='col-span-1 flex items-center text-center'>Nº</div>

                            <div className="col-span-2 flex items-center text-center">Actividad</div>
                            <div className="col-span-4 flex items-center text-center">Criterio de aceptación</div>
                            <div className="col-span-1 flex items-center text-center">Doc de referencia</div>
                            <div className="col-span-2 flex items-center text-center">Tipo de inspección</div>
                            <div className="col-span-1 flex items-center text-center">Punto</div>
                            <div className="col-span-2 flex items-center text-center">Responsable</div>
                            <div className="col-span-2 flex items-center text-center">Nombre usuario</div>
                            <div className="col-span-2 text-center flex items-center justify-center">Fecha</div>

                            <div className="col-span-3 flex items-center justify-center">Comentarios</div>
                            {/* <div className="col-span-2 text-center">Estatus</div> */}
                            {/* <div className="col-span-1 text-center">Inspección</div> */}
                            <div className="col-span-1 flex items-center text-center">Estado</div>
                            <div className="col-span-1 flex items-center text-center">Informe</div>
                            <div className="col-span-1 flex items-center justify-center">Edit  <button
                                className="text-gray-500 ms-1"
                                onClick={toggleActiveOnly}
                            >
                                {showActiveOnly ? <IoMdEye /> : <IoIosEyeOff />}
                            </button></div>

                        </div>


                        <div>
                            {ppi && ppi.actividades.map((actividad, indexActividad) => [
                                // Row for activity name
                                <div key={`actividad-${indexActividad}`} className="bg-gray-100 grid grid-cols-24 px-4 py-3 items-center border-b border-gray-200 text-sm font-medium">
                                    <div className="text-start">
                                        (V)
                                    </div>
                                    <div className="">
                                        {actividad.numero}
                                    </div>
                                    <div className="col-span-12 text-xs">
                                        {actividad.actividad}
                                    </div>
                                </div>,
                                // Rows for subactividades
                                ...actividad.subactividades
                                    .filter(subactividad => showActiveOnly ? subactividad.active : true)
                                    .map((subactividad, indexSubactividad) => (
                                        <div key={`subactividad-${indexActividad}-${indexSubactividad}`} className="grid grid-cols-24 items-center border-b border-gray-200 text-sm px-4 py-3">
                                            <div className="col-span-1 text-start text-xs ps-2">
                                                {subactividad.version}
                                            </div>
                                            <div className="col-span-1">
                                                {subactividad.numero}
                                            </div>
                                            <div className="col-span-2">
                                                {subactividad.nombre}
                                            </div>
                                            <div className="col-span-4">
                                                {subactividad.criterio_aceptacion}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                {subactividad.documentacion_referencia}
                                            </div>
                                            <div className="col-span-2 text-center">
                                                {subactividad.tipo_inspeccion}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                {subactividad.punto}
                                            </div>
                                            <div className="col-span-2 text-center">
                                                {subactividad.responsable || ''}
                                            </div>
                                            <div className="col-span-2 text-center">
                                                {subactividad.nombre_usuario || ''}
                                            </div>
                                            <div className="col-span-2 text-center text-xs">
                                                {subactividad.fecha || ''}
                                            </div>
                                            <div className="col-span-3 text-center">
                                                {subactividad.comentario || ''}
                                            </div>
                                            <div className="col-span-1 flex justify-center cursor-pointer">
                                                {subactividad.resultadoInspeccion ? (
                                                    subactividad.resultadoInspeccion === "Apto" ? (
                                                        <span className="w-full font-bold text-xs rounded text-green-500 cursor-pointer">
                                                            Apto
                                                        </span>
                                                    ) : subactividad.resultadoInspeccion === "No apto" ? (
                                                        <span className="w-full font-bold text-xs rounded w-full text-red-600 cursor-pointer">
                                                            No apto
                                                        </span>
                                                    ) : (
                                                        <span
                                                            onClick={() => handleOpenModalFormulario(`apto-${indexActividad}-${indexSubactividad}`)}
                                                            className="w-full font-bold text-medium text-xl rounded w-full flex justify-center cursor-pointer"
                                                        >
                                                            <IoMdAddCircle />
                                                        </span>
                                                    )
                                                ) : (
                                                    <span
                                                        onClick={() => handleOpenModalFormulario(`apto-${indexActividad}-${indexSubactividad}`)}
                                                        className="w-full font-bold text-medium text-xl rounded w-full flex justify-center cursor-pointer"
                                                    >
                                                        <IoMdAddCircle />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="col-span-1 bg-white flex justify-center cursor-pointer">
                                                {subactividad.formularioEnviado ? (
                                                    <p
                                                        onClick={() => handleMostrarIdRegistro(`apto-${indexActividad}-${indexSubactividad}`)}
                                                        className='text-xl'
                                                    >
                                                        <FaFilePdf />
                                                    </p>
                                                ) : null}
                                            </div>
                                            <div className="col-span-1 text-center">
                                                <button
                                                    onClick={() => openConfirmModal(`apto-${indexActividad}-${indexSubactividad}`)}
                                                    className="text-gray-500 font-bold text-xl"
                                                >
                                                    <FaRegEdit />
                                                </button>
                                            </div>
                                        </div>
                                    ))
                            ])}


                        </div>
                    </div>
                </div>


            </div>

            <div className='bg-white px-8 py-4 rounded-xl mt-4 rounded rounded-xl shadow-md'>
                {ppi ? (
                    <div className='flex gap-3 items-center'>
                        <div>
                            <p className='font-bold'>Inspecciones aptas: <span className='font-normal'>{actividadesAptas !== null && actividadesAptas !== undefined ? actividadesAptas : 0}</span></p>
                        </div>
                        {'/'}
                        <div>
                            <p className='font-bold'>Inspecciones totales: <span className='font-normal'>{totalSubactividades !== null && totalSubactividades !== undefined ? totalSubactividades : 0}</span></p>
                        </div>
                        <div className='ms-10'>
                            {difActividades === 0 && (
                                <button
                                    onClick={() => setShowConfirmModal(true)}
                                    className="bg-amber-600 text-white font-bold py-2 px-4 rounded-full"
                                >
                                    <p className='flex gap-2 items-center'><span><FaFilePdf /></span>Terminar inspección</p>
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div>Cargando...</div>
                )}
            </div>


            {/* {showConfirmModalRepetida && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-11">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>
                    <div className="mx-auto w-[400px] modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8">
                        <button
                            onClick={() => setShowConfirmModalRepetida(false)}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>
                        <div className="text-center">
                            <FaQuestionCircle className="text-5xl text-gray-500 mb-4" />
                            <h2 className="text-xl font-medium mb-4">¿Estás seguro de que deseas repetir la inspección?</h2>
                            <div className="flex justify-center gap-4">
                                <button
                                    onClick={handleRepetirInspeccion}
                                    className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-md shadow-md text-white font-medium"
                                >
                                    Repetir
                                </button>
                                <button
                                    onClick={() => setShowConfirmModalRepetida(false)}
                                    className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-md shadow-md text-white font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )} */}


            {modalFormulario && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-11">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[500px] h-800px] modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto px-12 py-8"
                    >
                        <button
                            onClick={handleCloseModal}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <div className="my-6">
                            <label htmlFor="resultadoInspeccion" className="block text-2xl font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <span className='text-3xl'></span> Resultado de la inspección:
                            </label>
                            <div className="block w-full py-2 text-base p-2 border-gray-300 focus:outline-none focus:ring-gray-500  sm:text-sm rounded-md">
                                {/* Opción Apto */}
                                <div>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="resultadoInspeccion"
                                            value="Apto"
                                            checked={resultadoInspeccion === "Apto"}
                                            onChange={(e) => setResultadoInspeccion(e.target.value)}
                                            className="form-radio"
                                        />
                                        <span className="ml-2">Apto</span>
                                    </label>
                                </div>

                                {/* Opción No apto */}
                                <div>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="resultadoInspeccion"
                                            value="No apto"
                                            checked={resultadoInspeccion === "No apto"}
                                            onChange={(e) => setResultadoInspeccion(e.target.value)}
                                            className="form-radio"
                                        />
                                        <span className="ml-2">No apto</span>
                                    </label>
                                </div>

                                <div className="my-4">
                                    <label htmlFor="comentario" className="block text-gray-500 text-sm font-bold mb-2">Comentarios de la inspección</label>
                                    <textarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                                </div>
                                <div className="mb-4 mt-4">
                                    <label htmlFor="imagen" className="block text-gray-500 text-sm font-bold mb-2">Seleccionar imagen</label>
                                    <input onChange={handleImagenChange} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                                <div className="">
                                    <label htmlFor="imagen" className="block text-gray-500 text-sm font-bold mb-2">Seleccionar imagen 2</label>
                                    <input onChange={handleImagenChange2} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                </div>
                            </div>
                        </div>


                        <FormularioInspeccion
                            setModalFormulario={setModalFormulario}
                            modalFormulario={modalFormulario}
                            currentSubactividadId={currentSubactividadId}
                            ppiSelected={ppi}
                            marcarFormularioComoEnviado={marcarFormularioComoEnviado}
                            actualizarFormularioEnFirestore={actualizarFormularioEnFirestore}
                            resultadoInspeccion={resultadoInspeccion}
                            comentario={comentario}
                            firma={firma}
                            signature={userSignature}

                            fechaHoraActual={fechaHoraActual}
                            handleCloseModal={handleCloseModal}
                            ppiNombre={ppiNombre}


                            setResultadoInspeccion={setResultadoInspeccion}
                            enviarDatosARegistros={enviarDatosARegistros}

                            setModalConfirmacionInforme={setModalConfirmacionInforme}

                            handleConfirmarEnvioPdf={handleConfirmarEnvioPdf}
                            setMensajeExitoInspeccion={setMensajeExitoInspeccion}
                            handleConfirmarEnviotablaPpi={handleConfirmarEnviotablaPpi}
                            onObservaciones={handleObservaciones}


                        />





                    </div>

                </div>
            )}

            {modalInforme && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-11">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[700px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
                    >
                        <button
                            onClick={closeModalConfirmacion}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300 mb-5">
                            <IoCloseCircle />
                        </button>

                        <p className='text-xl font-medium flex gap-2 mb-11 items-center'><p className='text-2xl'><FaQuestionCircle /></p> ¿Quieres generar un informe en Pdf?</p>


                        <div className='flex items-center gap-5 mt-5'>
                            <button className='bg-sky-600 hover:bg-sky-700 px-4 py-3 rounded-md shadow-md text-white font-medium flex gap-2 items-center'
                                onClick={() => {
                                    confirmarModalInforme()
                                    crearVariableFormularioTrue()
                                }}><p className='text-xl'><FaFilePdf /></p>Si, generar informe</button>
                            <button
                                onClick={handleConfirmarEnviotablaPpi}
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-md font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                No, realizar únicamente la inspección
                            </button>

                        </div>





                    </div>

                </div>
            )}

            {modalConfirmacionInforme && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-11">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[700px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
                    >
                        <button
                            onClick={() => setModalConfirmacionInforme(false)}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <FormularioInspeccion
                            setModalFormulario={setModalFormulario}
                            modalFormulario={modalFormulario}
                            currentSubactividadId={currentSubactividadId}
                            ppiSelected={ppi}
                            marcarFormularioComoEnviado={marcarFormularioComoEnviado}
                            actualizarFormularioEnFirestore={actualizarFormularioEnFirestore}
                            resultadoInspeccion={resultadoInspeccion}
                            comentario={comentario}
                            firma={firma}

                            fechaHoraActual={fechaHoraActual}
                            handleCloseModal={handleCloseModal}
                            ppiNombre={ppiNombre}


                            setResultadoInspeccion={setResultadoInspeccion}


                            setModalConfirmacionInforme={setModalConfirmacionInforme}

                            handleConfirmarEnvioPdf={handleConfirmarEnvioPdf}
                            setMensajeExitoInspeccion={setMensajeExitoInspeccion}
                            formulario={formulario}
                            setComentario={setComentario}

                        />





                    </div>

                </div>
            )}

            {modalExito && (
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
                                        <p className='text-teal-500 font-bold text-5xl'><FaCheckCircle /></p>
                                    </div>
                                    <div className="mt-3 text-center sm:mt-0 sm:ml-8 sm:text-left">
                                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                                            Éxito
                                        </h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">
                                                {mensajeExitoInspeccion}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                <button
                                    type="button"
                                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                                    onClick={() => setModalExito(false)}
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}


            {modalRecuperarFormulario && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-11">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[400px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8 text-center flex flex-col gap-5 items-center"
                    >
                        <button
                            onClick={cerrarModalYLimpiarDatos}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <p className='text-gray-500 font-bold text-5xl'><FaFilePdf /></p>

                        <p className='text-gray-500 font-bold text-xl'>¿Imprimir el informe?</p>
                        <div className='flex gap-5'>
                            <button className='bg-sky-600 hover:bg-sky-700 px-4 py-3 rounded-md shadow-md text-white font-medium flex gap-2 items-center' onClick={generatePDF}>Si</button>
                            <button className='bg-gray-500 hover:bg-gray-600 px-4 py-3 rounded-md shadow-md text-white font-medium flex gap-2 items-center' onClick={cerrarModalYLimpiarDatos}>Cancelar</button>
                        </div>
                    </div>

                </div>
            )}


            {showConfirmModal && (
                <div className="fixed inset-0 bg-gray-600 text-gray-500 bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-10 pb-12  rounded-lg shadow-lg max-w-xl mx-auto">
                        <div className='text-center flex flex-col items-start gap-1'>
                            <button
                                onClick={() => {
                                    setAllowPdfGeneration(false);
                                    setShowConfirmModal(false);

                                    ; // Cerrar el modal
                                }}
                                className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300 mb-2">
                                <IoCloseCircle />
                            </button>

                            <h2 className="text-xl font-semibold flex gap-1 items-center text-left"><span className='text-4xl'><FcInspection /></span>¿Quieres terminar la inspección?</h2>

                        </div>

                        <div className='flex mt-10'>
                            <Pdf_final
                                fileName="ejemplo.pdf"
                                ppi={ppi}
                                nombreProyecto={nombreProyecto}
                                obra={obra}
                                tramo={tramo}
                                titulo={titulo}
                                imagenPath={imagenPath}
                                imagenPath2={imagenPath2}
                                allowPdfGeneration={allowPdfGeneration}
                                setAllowPdfGeneration={setAllowPdfGeneration}
                                setShowConfirmModal={setShowConfirmModal}
                            />
                        </div>


                    </div>
                </div>
            )}




        </div>


    );
}

export default TablaPpi;




