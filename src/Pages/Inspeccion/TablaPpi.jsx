/**
 * @file TablaPpi.jsx
 * @description
 * This component displays and manages a table (and optionally a grid) view of inspection data for a specific "PPI" (Project Plan Item).
 * It:
 * - Retrieves inspection data from Firestore.
 * - Allows filtering and sorting of inspections and sub-inspections ("subactividades").
 * - Supports editing inspection entries, attaching images, handling geolocation (auto/manual), and signing off on inspections.
 * - Includes logic for versioning of inspections and controlling which version is the active one.
 * - Integrates with a PDF generation component (Pdf_final) to finalize inspections with a PDF report.
 *
 * Key functionalities:
 * - Show inspections in either table or grid layout.
 * - Filter by status (Apto/No apto), responsible person, activities, etc.
 * - Edit existing sub-inspections (repeating them with a new version) and attach images with geolocation.
 * - Finish/pending toggle for each inspection version.
 * - Generate a final PDF report of the completed inspection.
 *
 * Complex logic is documented near relevant code sections.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { db } from '../../../firebase_config';
import { getDoc, getDocs, query, collection, where, doc, updateDoc, increment, addDoc, or, setDoc } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { FaArrowRight, FaBan, FaExclamationCircle } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { IoMdAddCircle } from "react-icons/io";
import { FaFilePdf } from "react-icons/fa6";
import { FaQuestionCircle } from "react-icons/fa";
import { FiRefreshCcw } from "react-icons/fi";
import { FaCheckCircle } from "react-icons/fa";
import { FcInspection } from "react-icons/fc";
import { FaRegEdit } from "react-icons/fa";
import { IoMdEye } from "react-icons/io";
import { FaImage } from 'react-icons/fa';
import { FaWpforms } from "react-icons/fa6";
import { AiOutlineCheckCircle } from "react-icons/ai";
import { FaTable } from "react-icons/fa";
import { FaTabletAlt } from "react-icons/fa";
import FormularioInspeccion from '../../Components/FormularioInspeccion'
import logo from '../../assets/tpf_logo_azul.png'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import Pdf_final from './Pdf_final';
import imageCompression from 'browser-image-compression';

import { IoArrowBackCircle } from "react-icons/io5";
import { useAuth } from '../../context/authContext';
import { TiLockClosedOutline } from "react-icons/ti";
import PdfListViewer from '../../Components/FeatureSendMail/PdfListViewer';
import Mapa from '../../Components/Geolocalizacion/Mapa'
import useProyecto from '../../Hooks/useProyectos';


function TablaPpi() {
    /**
         * COMPONENT OVERVIEW:
         * This component manages inspection data, displaying it in a table or grid.
         * Major actions:
         * - Filtering inspections by status, responsible, activity, etc.
         * - Adding/editing inspections with images and geolocation.
         * - Handling versioning: If "No apto", a new version is created and appended for re-check.
         * - Finishing inspections (marking them as done) if they are the latest version.
         * - Generating a final PDF once all inspections are completed and marked as done.
         */

    const id = localStorage.getItem('selectedProjectId')
    const nameProject = localStorage.getItem('selectedProjectName')
    const { proyecto } = useProyecto(id)
    const logoEmpresa = proyecto?.logo
    const logoCliente = proyecto?.logoCliente
   
   

    const { user } = useAuth();
    const titulo = "REGISTRO DE INSPECCIÓN DE OBRA REV-1"
    const imagenPath = logoCliente
    const imagenPath2 = logoEmpresa
    const [nombreProyecto, setNombreProyecto] = useState(localStorage.getItem('selectedProjectName') || '');
    const [obra, setObra] = useState(localStorage.getItem('obra'));
    const [tramo, setTramo] = useState(localStorage.getItem('tramo'));
    const [observaciones, setObservaciones] = useState('');
    const { idLote } = useParams();
    const navigate = useNavigate();
    const [ppi, setPpi] = useState(null);
    const lote = localStorage.getItem('lote')
    const [userName, setUserName] = useState('')
    const [userSignature, setUserSignature] = useState('')
    const [seleccionApto, setSeleccionApto] = useState({});
    const [tempSeleccion, setTempSeleccion] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [modal, setModal] = useState(false);
    const [modalFormulario, setModalFormulario] = useState(false);
    const [currentSubactividadId, setCurrentSubactividadId] = useState(null);
    const [ppiNombre, setPpiNombre] = useState('');
    const [comentario, setComentario] = useState("");
    const [resultadoInspeccion, setResultadoInspeccion] = useState("Apto");
    const [modalInforme, setModalInforme] = useState(false)
    const [modalConfirmacionInforme, setModalConfirmacionInforme] = useState(false)
    const [loteInfo, setLoteInfo] = useState(null);
    const [sectorInfoLote, setSectorInfoLote] = useState(null);
    const [cierreInspeccion, setCierreInspeccion] = useState(false);
    const [actividadesAptas, setActividadesAptas] = useState(0);
    const [totalSubactividades, setTotalSubActividades] = useState(0);
    const [difActividades, setDifActividades] = useState(0);
    const [formulario, setFormulario] = useState(true)
    const [mensajeExitoInspeccion, setMensajeExitoInspeccion] = useState('')
    const [modalExito, setModalExito] = useState(false)
    const [documentoFormulario, setDocumentoFormulario] = useState(null)
    const [modalRecuperarFormulario, setModalRecuperarFormulario] = useState(false)
    const [imagen, setImagen] = useState('');
    const [imagen2, setImagen2] = useState('');
    const [imagenEdit, setImagenEdit] = useState('');
    const [imagen2Edit, setImagen2Edit] = useState('');
    const [imagen1Nombre, setImagen1Nombre] = useState('imagen1');
    const [imagen2Nombre, setImagen2Nombre] = useState('imagen2');
    const [imagenDataCoordinates, setImagenDataCoordinates] = useState([]);
    const [isAuto, setIsAuto] = useState(true);
    const [isManual, setIsManual] = useState(false);
    const [showConfirmModalRepetida, setShowConfirmModalRepetida] = useState(false);
    const [subactividadToRepeat, setSubactividadToRepeat] = useState(null);
    const [subactividadSeleccionada, setSubactividadSeleccionada] = useState(null);
    const imagenDataCoordinatesRef = useRef([]);
    const [subActividadReference, setSubActividadreference] = useState({})
    const [idRegistroImagen, setIdRegistroImagen] = useState('')
    const [imagen1Url, setImagen1Url] = useState('');
    const [imagen2Url, setImagen2Url] = useState('');
    const [actividadNombre, setActividadNombre] = useState('');
    const [criterioAceptacion, setCriterioAceptacion] = useState('');
    const [docReferencia, setDocReferencia] = useState('');
    const [tipoInspeccion, setTipoInspeccion] = useState('');
    const [punto, setPunto] = useState('');
    const [responsable, setResponsable] = useState('');
    const [aptoNoapto, setAptoNoapto] = useState('');
    const [nombre_usuario_edit, setNombre_usuario_edit] = useState('');
    const [formularioData, setFormularioData] = useState({});
    const [showActiveOnly, setShowActiveOnly] = useState(true);
    const [responsableFilter, setResponsableFilter] = useState('Todos');
    const [isFinishInspectionModalOpen, setIsFinishInspectionModalOpen] = useState(false);
    const [inspectionToFinish, setInspectionToFinish] = useState(null);
    const [terminadasCount, setTerminadasCount] = useState(0);
    const [filter, setFilter] = useState('Todos');
    const [activityFilter, setActivityFilter] = useState('Actividades');
    const firma = 'zO9c82%&45e6e0b74cfccg97e/&/8714u32342&%&/28fb4xcd2'

    const handleObservaciones = (nuevasObservaciones) => {
        setObservaciones(nuevasObservaciones);
    };
    const handleGoBack = () => {
        navigate(`/elementos/${id}`); // Esto navega hacia atrás en la historia
    };
    const regresar = () => {
        navigate(-1); // Regresa a la página anterior
    };
    const closeModalConfirmacion = () => {
        setModalInforme(false)

    }
    const confirmarModalInforme = () => {
        setModalConfirmacionInforme(true)
        handleCloseModal()
        setModalInforme(false)

    }
    // Retrieve user name and signature from Firestore
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
            setUserName('');
        }
    }, [user]);

    // Load PPI inspections for the given "lote"
    useEffect(() => {
        const obtenerInspecciones = async () => {
            try {
                const inspeccionesRef = collection(db, "lotes", idLote, "inspecciones");
                const querySnapshot = await getDocs(inspeccionesRef);
                const inspeccionesData = querySnapshot.docs.map(doc => ({
                    docId: doc.id,
                    ...doc.data()
                }));
                if (inspeccionesData.length > 0) {
                    setPpi(inspeccionesData[0]);
                    setPpiNombre(inspeccionesData[0].nombre)
                } else {
                    setPpi(null);
                }
            } catch (error) {
                console.error('Error al obtener las inspecciones:', error);
            }
        };
        obtenerInspecciones();
    }, [idLote]);

    /**
    * @function handleOpenModalFormulario
    * Opens the form modal for editing/adding inspection results.
    * Resets comments and observations.
    */

    const handleOpenModalFormulario = (subactividadId) => {
        setCurrentSubactividadId(subactividadId);
        const valorActual = seleccionApto[subactividadId]?.resultadoInspeccion;
        setTempSeleccion(valorActual);
        setComentario('');
        setObservaciones('');
        setModalFormulario(true);
    };

    const handleCloseModal = () => {
        setModal(false)
        setModalFormulario(false)
        setComentario('')
        setResultadoInspeccion('Apto')


    };

    const cerrarModalYLimpiarDatos = () => {
        setDocumentoFormulario('')
        setModalRecuperarFormulario(false)
    }

    // Date and our
    const fechaHoraActual = new Date().toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });

    // Check if the ppi exist and save the data of activities and subactitivities aptas y no apto
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


    ////////////////////////7 FUNCIONES APTA Y NO APTA ////////////////////////////////////////////////////////////////////7

    // This function handles the re-inspection (repetition) of a particular sub-activity (subactividad) of a PPI (Plan de Puntos de Inspección).
    // When triggered, it:
    // 1. Duplicates the existing record in Firestore to create a new version.
    // 2. Adjusts versions and states of the sub-activities, managing both "rejected" and "original" scenarios.
    // 3. Preserves or updates images, comments, and observations for the new version.
    // 4. Updates the PPI data structure in Firestore and in the local state to reflect the new editable version.

    const handleRepetirInspeccion = async () => {
        if (!ppi || !subactividadToRepeat) return;
        // Extract indexes of the activity and sub-activity from the selected ID (format: "apto-actividadIndex-subactividadIndex").
        const [actividadIndex, subactividadIndex] = subactividadToRepeat.split('-').slice(1).map(Number);
        // Clone the PPI object to avoid direct state mutation.
        let nuevoPpi = { ...ppi };
        let subactividadSeleccionada = { ...nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] };

        // Duplicate the existing record in Firestore to reference it in the new version.
        const nuevoIdRegistroFormulario = doc(collection(db, "registros")).id;

        // Retrieve all versions of the same subactivity (based on 'numero') to determine the next version number.
        const duplicadoId = await duplicarRegistro(subactividadSeleccionada.idRegistroFormulario, nuevoIdRegistroFormulario);

        if (!duplicadoId) {
            console.error("Error duplicando el registro en Firestore.");
            return;
        }

        // Check if there's a "rejected" version for the given subactivity to determine versioning logic.
        const subactividadesMismaActividad = nuevoPpi.actividades[actividadIndex].subactividades
            .filter(subact => subact.numero === subactividadSeleccionada.numero);
        const rejectedSubactividad = subactividadesMismaActividad.find(subact => subact.motivoVersion === 'rechazada');

        let newEditVersion;
        let newRejectedVersion;

        // Case 1: A previously rejected subactivity exists. Reuse its versioning logic.
        if (rejectedSubactividad) {
            newEditVersion = rejectedSubactividad.version;
            newRejectedVersion = (parseInt(rejectedSubactividad.version) + 1).toString();
            rejectedSubactividad.version = newRejectedVersion;

            // Case 2: No rejected subactivity. Use the highest existing version + 1.
        } else {
            // Usar la versión más alta actual + 1 para la subactividad editada
            newEditVersion = (Math.max(...subactividadesMismaActividad.map(subact => parseInt(subact.version))) + 1).toString();
        }

        // Create a new edited subactivity version, updating fields like comentario and observaciones.
        let nuevaSubactividadEditada = {
            ...subactividadSeleccionada,
            nombre: subactividadSeleccionada.nombre,
            criterio_aceptacion: subactividadSeleccionada.criterio_aceptacion,
            documentacion_referencia: subactividadSeleccionada.documentacion_referencia,
            tipo_inspeccion: subactividadSeleccionada.tipo_inspeccion,
            punto: subactividadSeleccionada.punto,
            responsable: subactividadSeleccionada.responsable,
            comentario: comentario,
            observaciones: formularioData.observaciones,
            edited: true,
            resultadoInspeccion: subactividadSeleccionada.resultadoInspeccion,
            idRegistroFormulario: nuevoIdRegistroFormulario,
            version: newEditVersion,
            active: true,
            originalId: subactividadSeleccionada.originalId || subactividadSeleccionada.idRegistroFormulario,
            motivoVersion: 'editada',
        };

        let subAct = subactividadSeleccionada.motivoVersion;
        let resultadoInspeccion = subactividadSeleccionada.resultadoInspeccion;

        // Additional versioning logic based on conditions:
        if (subAct === 'original' && resultadoInspeccion === 'Apto') {

            nuevaSubactividadEditada = {
                ...nuevaSubactividadEditada,
                motivoVersion: 'editada',
            };
        }
        if (subAct === 'rechazada' && resultadoInspeccion === 'Apto') {

            nuevaSubactividadEditada = {
                ...nuevaSubactividadEditada,
                version: (parseInt(newEditVersion) + 1).toString(), // Asignar la nueva versión para la subactividad editada
                motivoVersion: 'editada',
            };
        }
        // Mark the old subactivity version as inactive, since we are creating a new active version.
        nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] = {
            ...subactividadSeleccionada,
            active: false // Marcar la versión anterior como no activa
        };

        // Insert the new edited subactivity right after the original one.
        nuevoPpi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividadEditada);

        // Update Firestore record with new images and observations if provided.
        const registroDocRef = doc(db, "registros", nuevoIdRegistroFormulario);
        const updateData = {
            edited: true,  // Marcar como editada
            version: nuevaSubactividadEditada.version,
            active: true, // Esta es la versión activa
            originalId: nuevaSubactividadEditada.originalId,
            motivoVersion: 'editada',  // Actualizar el campo aquí
            observaciones: formularioData.observaciones,
            comentario: comentario,
            imagen: imagen || imagen1Url,
            imagen2: imagen2 || imagen2Url,
        };
        if (subactividadSeleccionada.imagen) updateData.imagen = subactividadSeleccionada.imagen;
        if (subactividadSeleccionada.imagen2) updateData.imagen2 = subactividadSeleccionada.imagen2;
        await updateDoc(registroDocRef, updateData);
        // Update the PPI structure in Firestore.
        await actualizarFormularioEnFirestore(nuevoPpi);


        // Update local state to reflect the changes.
        setPpi(nuevoPpi);
        setShowConfirmModalRepetida(false);
    };


    // This function marks a given sub-activity form as "sent" (submitted) to Firestore, updating its versioning, active status,
    // and related fields. It handles both "Apto" (approved) and "No apto" (not approved) results, as well as version logic 
    // for original, rejected, and edited sub-activities.
    //
    // Key points:
    // 1. Updates the form submission status, user info, comments, and observations for the current sub-activity.
    // 2. If the result is "Apto", increments a counter for "actividadesAptas" in the lot document.
    // 3. If the result is "No apto", creates a new "rechazada" version of the sub-activity to be addressed later.
    // 4. Manages complex version logic:
    //    - For "No apto", it deactivates the current version and creates a new rejected version.
    //    - For "Apto" in a non-original version scenario, it updates related rejected versions accordingly.
    // 5. Finally, it updates the PPI structure in Firestore and the local state.

    const marcarFormularioComoEnviado = async (idRegistroFormulario, resultadoInspeccion) => {
        if (!ppi || !currentSubactividadId) {
            return;
        }
        // Extract the activity and sub-activity indices from the currentSubactividadId.
        const [actividadIndex, subactividadIndex] = currentSubactividadId.split('-').slice(1).map(Number);
        let nuevoPpi = { ...ppi };
        let subactividadSeleccionada = nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex];

        let motivoVersionActual = subactividadSeleccionada.motivoVersion || 'original';
        // Update the selected sub-activity with new form data and set as active.
        subactividadSeleccionada.formularioEnviado = formulario;
        subactividadSeleccionada.idRegistroFormulario = idRegistroFormulario;
        subactividadSeleccionada.resultadoInspeccion = resultadoInspeccion;
        subactividadSeleccionada.fecha = fechaHoraActual;
        subactividadSeleccionada.nombre_usuario = userName;
        subactividadSeleccionada.signature = userSignature;
        subactividadSeleccionada.firma = firma;
        subactividadSeleccionada.comentario = comentario; // comentario input // PASO 1 para guardar info en la inspeccion
        subactividadSeleccionada.observaciones = observaciones; // obsevaciones input // PASO 1 para guardar info en la inspeccion
        subactividadSeleccionada.active = true;

        // If the result is "Apto", increment the count of "actividadesAptas" in the corresponding lot document.
        if (resultadoInspeccion === "Apto") {
            const loteRef = doc(db, "lotes", idLote);
            await updateDoc(loteRef, {
                actividadesAptas: increment(1)
            });
        }
        // If the result is "No apto", handle the logic of creating a new "rechazada" version.
        if (resultadoInspeccion === "No apto") {
            let nuevaSubactividad = {
                ...subactividadSeleccionada,
                active: false,
                motivoVersion: motivoVersionActual
            };
            nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] = nuevaSubactividad;

            // Assign a new version number, one more than the current version.
            let nuevaVersion = (parseInt(subactividadSeleccionada.version) + 1).toString();

            let nuevaSubactividadRepetida = {
                ...nuevaSubactividad,
                version: nuevaVersion,
                active: true,
                comentario: '',
                observaciones: '',
                resultadoInspeccion: '',
                nombre_usuario: '',
                signature: '',
                firma: '',
                fecha: '',
                formularioEnviado: false,
                motivoVersion: 'rechazada'
            };
            // Insert the new "rechazada" version right after the current one.
            nuevoPpi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividadRepetida);
        }

        // Additional logic for version management:
        // If the current version isn't 'original' and the result is "Apto", we need to handle any subsequent rejected versions.
        // Specifically, find any sub-activities that came after this one and were "rechazada", and update them to "editada".
        if (motivoVersionActual !== 'original' && resultadoInspeccion === "Apto") {
            nuevoPpi.actividades[actividadIndex].subactividades.forEach((subactividad, index) => {
                if (index > subactividadIndex && subactividad.motivoVersion === 'rechazada') {
                    subactividad.version = nuevaVersion;
                    subactividad.active = false;
                    subactividad.motivoVersion = 'editada';
                }
            });
        }
        // Update the modified PPI structure in Firestore and then reflect the changes in local state.
        await actualizarFormularioEnFirestore(nuevoPpi);
        setPpi(nuevoPpi);
    };



    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // This useEffect hook fetches the lote (lot) information from Firestore based on the provided idLote.
    // Once the lote data is retrieved, it updates various local states such as:
    // - actividadesAptas (count of apt sub-activities)
    // - totalSubactividades (total count of sub-activities in version 0)
    // - difActividades (difference between total and apt sub-activities)
    // Additionally, it determines whether the inspection should be considered complete (cierreInspeccion) if all sub-activities are apt.
    //
    // Detailed logic:
    // 1. If idLote is not provided, simply return and do nothing.
    // 2. Retrieves the lote document from Firestore using the idLote.
    // 3. If the document exists, it stores the lote data in local state.
    //    - Extracts actividadesAptas from the lote data.
    //    - Calculates totalSubactividades by summing only those sub-activities whose version is 0 (original versions).
    // 4. difActividades is computed as the total sub-activities minus the apt ones. If this equals zero, it means all are apt.
    // 5. Based on difActividades, it sets cierreInspeccion to true (finished) or false (pending).
    // 6. If no document is found, logs that it was not found.
    //
    // The effect also depends on changes to idLote and ppi. If either changes, it re-runs the logic.

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
                    setActividadesAptas(actividadesAptas);

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


                } else {
                    console.log("No se encontró el lote con el ID:", idLote);
                }
            } catch (error) {
                console.error("Error al obtener el lote:", error);
            }
        };

        obtenerLotePorId();
    }, [idLote, ppi]);

    // This function saves the inspection form data into the Firestore 'registros' collection for a specific sub-activity.
    // Steps:
    // 1. Identify the currently selected activity and sub-activity indices from currentSubactividadId.
    // 2. Construct a data object (datosFormulario) containing all relevant inspection details, including:
    //    - Project information (nombreProyecto, obra, tramo, ppiNombre, etc.)
    //    - Lote and sub-activity details (sector, subSector, parte, elemento, lote, pkInicial, pkFinal)
    //    - Activity and sub-activity info (numero_subactividad, version, criterio_aceptacion, etc.)
    //    - User and timing details (nombre_usuario, signature, fechaHoraActual)
    //    - Result of the inspection (resultadoInspeccion), comments, observations, and images
    //    - Geolocation data of images (coordenadas)
    //
    // 3. Convert the data to JSON and optionally measure the size (for reference).
    // 4. Add the document to Firestore using 'addDoc'.
    // 5. Update the state to reflect success, close modals, clear form states, and reset image & coordinate data.
    //
    // If successful, returns the newly created document ID, otherwise logs the error.
    //
    // This function works in tandem with other steps that mark the form as sent and update PPI in Firestore.

    const enviarDatosARegistros = async () => {
        // Extract the indices of the activity and sub-activity from the currentSubactividadId.
        const [, actividadIndex, subactividadIndex] = currentSubactividadId.split('-').map(Number);

        // Access the selected activity and sub-activity from the PPI structure.
        const actividadSeleccionada = ppi.actividades[actividadIndex];
        const subactividadSeleccionada = ppi.actividades[actividadIndex].subactividades[subactividadIndex];

        // Construct the form data object with all required fields
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
            version: subactividadSeleccionada.version,
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
            imagen2: imagen2,
            coordenadas: imagenDataCoordinates
        };

        // Convert to JSON and measure size (optional)
        const jsonString = JSON.stringify(datosFormulario);
        const dataSize = new Blob([jsonString]).size;
        try {
            // Reference to the 'registros' collection in Firestore
            const coleccionRegistros = collection(db, "registros");
            const docRef = await addDoc(coleccionRegistros, datosFormulario);
            setMensajeExitoInspeccion('Inspección completada con éxito')

            // Close modals and clear relevant states
            setModalFormulario(false);

            setObservaciones('')
            setComentario('')
            setImagenDataCoordinates([])
            setImagen('')
            setImagen2('')
            setIsAuto(true)
            setIsManual(false)

            return docRef.id; // Devolver el ID del documento creado


        } catch (e) {
            console.error("Error al añadir documento: ", e);
        }
    };

    // This function is triggered after confirming the submission of the form data to the PPI table.
    // It:
    // 1. Calls the function that actually sends the form data (handelEnviarFormulario).
    // 2. Closes any confirmation modals.
    // 3. Clears the comment field.
    // 4. After a short delay, shows a success modal (modalExito) indicating the inspection was completed successfully.

    const handleConfirmarEnviotablaPpi = async () => {
        await handelEnviarFormulario();
        setMostrarConfirmacion(false);
        setModalInforme(false);
        setComentario('')
        setTimeout(() => {
            setModalExito(true);
        }, 300);
    };

    // This function is called after confirming the intent to also generate a PDF report.
    // It:
    // 1. Closes the confirmation and form modals.
    // 2. Waits a brief moment.
    // 3. Displays the success modal (modalExito) to notify the user that the inspection process (with PDF generation) was completed successfully.

    const handleConfirmarEnvioPdf = async () => {
        setMostrarConfirmacion(false);
        setModalFormulario(false);
        setModalConfirmacionInforme(false)
        setTimeout(() => {
            setModalExito(true);

        }, 300);
    };


    // This function orchestrates the sending of form data to Firestore and then marks the form as "sent."
    // Steps:
    // 1. Calls enviarDatosARegistros() to insert the form data into the 'registros' collection, returning a reference ID.
    // 2. If a valid document ID is returned, calls marcarFormularioComoEnviado() to update the PPI structure and set the form as submitted.
    // Essentially, it ensures that after storing form data, the PPI is also updated to reflect the new state of the inspection.

    const handelEnviarFormulario = async () => {
        const idRegistroFormulario = await enviarDatosARegistros();
        if (idRegistroFormulario) {
            await marcarFormularioComoEnviado(idRegistroFormulario, resultadoInspeccion);

        }
    };

    // This function retrieves the specific inspection record (using idRegistroFormulario) associated with a chosen sub-activity.
    // Steps:
    // 1. Extract activity and sub-activity indices from subactividadId.
    // 2. Access the corresponding sub-activity in PPI and get its idRegistroFormulario.
    // 3. If a valid ID is found, fetch that record from Firestore.
    // 4. If the record exists, store its data in state and immediately generate a PDF report from it.
    // 5. If no record or ID is provided, log the issue.

    const handleMostrarIdRegistro = async (subactividadId) => {
        const [actividadIndex, subactividadIndex] = subactividadId.split('-').slice(1).map(Number);
        const subactividadSeleccionada = ppi.actividades[actividadIndex].subactividades[subactividadIndex];
        const idRegistroFormulario = subactividadSeleccionada.idRegistroFormulario;
        if (idRegistroFormulario) {
            try {
                const docRef = doc(db, "registros", idRegistroFormulario);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setDocumentoFormulario(docSnap.data());
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

    /**
 * This function generates a PDF report for a given inspection form document (`documentoFormulario`). 
 * It uses pdf-lib to create a structured PDF, embedding images, drawing text with custom fonts, 
 * and handling text wrapping and image scaling. The final PDF is automatically downloaded.
 * 
 * Key steps:
 * - Create a new PDF document.
 * - Add and configure the first page.
 * - Draw project metadata, inspection results, and various text fields with automatic line wrapping.
 * - Conditionally embed images (logo, status icon, and user signature), scaling and positioning them as needed.
 * - Handle coordinate links from images if provided.
 * - If there are images for the inspection, add a second page and display them along with their corresponding map links.
 * - Save and prompt automatic download of the final PDF.
 */

    const generatePDF = async (documentoFormulario) => {
        // Create a new PDF Document
        const pdfDoc = await PDFDocument.create();
        // Create a new PDF Document
        let currentPage = pdfDoc.addPage([595, 842]);
        let currentY = currentPage.getSize().height;



        const { height } = currentPage.getSize();
        // Define colors and fonts
        const blackColor = rgb(0, 0, 0);
        const greenColor = hexToRgb("#15803d")
        const redColor = hexToRgb("#ef4444")
        const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        /**
     * Helper function: 
     * Replaces special characters (like '≤') with simpler alternatives (like '<=') 
     * to avoid rendering issues.
     */

        const replaceSpecialChars = (text) => {
            if (text === null || text === undefined) return "";
            return text.replace(/≤/g, "<=");
        };

        /**
             * Helper function: addText()
             * Draws text on the current page, automatically wrapping lines that exceed maxWidth.
             * If the text runs out of space on the page, a new page is added.
             * 
             * @param text The text content to draw
             * @param x Starting x position
             * @param y Starting y position
             * @param fontSize Font size for the text
             * @param font Chosen PDFLib font
             * @param currentPage The current PDF page we are drawing onto
             * @param color The color of the text (default black)
             * @param maxWidth Maximum width before wrapping the text onto a new line
             * @param newX The x position to jump to after wrapping lines
             * @return { lastY, page } The updated Y position and possibly a new page if added
             */

        const addText = (text, x, y, fontSize, font, currentPage, color = blackColor, maxWidth = 400, newX = 50) => {
            text = replaceSpecialChars(text);

            const words = text.split(' ');
            let currentLine = '';
            let currentY = y;
            let currentX = x;
            // Loop through each word to build lines dynamically
            words.forEach(word => {
                let testLine = currentLine + word + " ";
                let testWidth = font.widthOfTextAtSize(testLine, fontSize);
                // If adding this word exceeds maxWidth, we render the line and move to next
                if (testWidth > maxWidth) {
                    if (currentLine !== '') {
                        currentPage.drawText(currentLine, { x: currentX, y: currentY, size: fontSize, font, color });
                        currentLine = '';
                        currentY -= fontSize * 1.8;
                        currentX = newX;
                    }

                    if (currentY < fontSize * 1.4) {
                        currentPage = pdfDoc.addPage([595, 842]);
                        currentY = currentPage.getSize().height - fontSize * 1.8;
                        currentX = x;
                    }
                    currentLine = word + ' ';
                } else {
                    currentLine = testLine;
                }
            });
            // Draw any remaining text in the buffer after finishing the words
            if (currentLine !== '') {
                currentPage.drawText(currentLine, { x: currentX, y: currentY, size: fontSize, font, color });
            }
            return { lastY: currentY, page: currentPage };
        };
        /**
             * Helper function: hexToRgb()
             * Converts a hex color string (#RRGGBB) into an rgb() compatible object for pdf-lib.
             */

        function hexToRgb(hex) {
            hex = hex.replace("#", "");
            if (hex.length === 3) {
                hex = hex.split('').map((hex) => {
                    return hex + hex;
                }).join('');
            }
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            return rgb(r, g, b);
        }
        /**
            * Helper function: addHorizontalLine()
            * Draws a horizontal line across the page for visual section separation.
            */

        const addHorizontalLine = (x1, y, x2, thickness, hexColor = "#000000") => {
            const color = hexToRgb(hexColor);
            currentPage.drawLine({
                start: { x: x1, y },
                end: { x: x2, y },
                thickness: thickness,
                color: color,
            });
        };
        /**
     * Helper function: embedImage()
     * Embeds a PNG image from a given URL into the current PDF page at given coordinates and size.
     */

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
        // Determine the color for the result text based on pass/fail
        let color = blackColor;
        if (documentoFormulario.resultadoInspeccion === "Apto") {
            color = greenColor;
        } else if (documentoFormulario.resultadoInspeccion === "No apto") {
            color = redColor;
        }

        // Embed header images (logos)
        await embedImage(imagenPath2, 380, height - 58, 80, 45);
        await embedImage(imagenPath, 490, height - 55, 70, 35);
        // Now draw the main content of the PDF (titles, project info, inspection info, etc.)
        let result = addText(titulo, 40, currentY - 35, 12, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;
        result = addText(nombreProyecto, 40, currentY - 15, 12, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;
        addHorizontalLine(40, currentY - 11, 555, 1, "#000000", currentPage);
        // Project and inspection data
        result = addText(obra, 50, currentY - 35, 12, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(tramo, 50, currentY - 15, 12, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        result = addText(ppi.nombre, 50, currentY - 18, 12, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;
        // Depending on the inspection result, draw a status icon

        if (documentoFormulario.resultadoInspeccion === "Apto") {
            const arrowPath = 'data:image/png;base64,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'; // Cambia esto por la ruta real de tu imagen
            await embedImage(arrowPath, 440, currentY - 5, 20, 20); // Ajusta las coordenadas y el tamaño según sea necesario
        }
        else {
            const arrowPath = 'https://static-00.iconduck.com/assets.00/error-icon-512x512-mmajyv8q.png';
            await embedImage(arrowPath, 440, currentY - 5, 20, 20); // Ajusta las coordenadas y el tamaño según sea necesario
        }
        // Write the inspection result in bold with the chosen color
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

        result = addText(`(V-${documentoFormulario.version}) ${documentoFormulario.numero_subactividad}. ${documentoFormulario.subactividad}`, 135, currentY, 11, regularFont, currentPage);
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

        // Embed a user signature if available
        const embedSignatureImage = async (pdfDoc, imagePath, currentPage, x, y, maxWidth) => {
            const imageBytes = await fetch(imagePath).then(res => res.arrayBuffer());
            const image = await pdfDoc.embedPng(imageBytes);

            const { width, height } = image.scale(1); // Obtén el tamaño original de la imagen
            // Scale down the signature if it's too large
            const scaledWidth = width > maxWidth ? maxWidth : width;
            const scaledHeight = (height / width) * scaledWidth;

            currentPage.drawImage(image, {
                x: x + 5, // Posiciona la imagen 5 unidades a la derecha del final del texto
                y: y - scaledHeight / 2 + 40, // Centra verticalmente la imagen con el texto
                width: scaledWidth,
                height: scaledHeight
            });
        };

        result = addText(`${documentoFormulario.nombre_usuario}`, 145, currentY, 11, regularFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        const textWidth = regularFont.widthOfTextAtSize(documentoFormulario.nombre_usuario, 11);
        const imageX = 320 + textWidth;

        const maxWidth = 70;

        await embedSignatureImage(pdfDoc, userSignature, currentPage, imageX, currentY, maxWidth);

        addHorizontalLine(520, currentY - -14, 400, 0.5, "#030712", currentPage);

        result = addText("Firma ", 450, currentY - 1, 11, boldFont, currentPage);
        currentPage = result.page;
        currentY = result.lastY;

        // If images are provided for the inspection, add a second page with embedded images and map links
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

        if (documentoFormulario.imagen || documentoFormulario.imagen2) {
            currentPage = pdfDoc.addPage([595, 842]);
            currentY = currentPage.getSize().height;

            await embedImage(imagenPath2, 380, currentY - 58, 80, 45);
            await embedImage(imagenPath, 490, currentY - 55, 70, 35);

            // Title
            let result = addText(titulo, 40, currentY - 35, 12, boldFont, currentPage);
            currentPage = result.page;
            currentY = result.lastY;

            // name project
            result = addText(nombreProyecto, 40, currentY - 15, 12, boldFont, currentPage);
            currentPage = result.page;
            currentY = result.lastY;

            // Lines
            addHorizontalLine(40, currentY - 11, 555, 1, "#000000", currentPage);
            addHorizontalLine(40, currentY - 50, 555, 30, "#e2e8f0", currentPage);

            // Imagen titles
            result = addText("Imágenes adjuntas: ", 50, currentY - 53, 11, boldFont, currentPage);
            currentPage = result.page;
            currentY = result.lastY;

            // Imagen
            if (documentoFormulario.imagen) {
                await embedBase64Image(documentoFormulario.imagen, 50, currentY - 35, 400, 300);
                currentY -= 340;

                // Link maps
                const link1 = documentoFormulario.coordenadas[0]?.link || "";
                if (link1) {
                    result = addText(`Ver en Google Maps: ${link1}`, 50, currentY - 10, 9, regularFont, currentPage);
                    currentPage = result.page;
                    currentY = result.lastY - 10; // Reducir espacio después del enlace
                }
            }

            // Imagen 2
            if (documentoFormulario.imagen2) {
                await embedBase64Image(documentoFormulario.imagen2, 50, currentY - 15, 400, 300);
                currentY -= 310;  // Ajustar currentY para dejar espacio justo debajo de la imagen

                // Link maps
                const link2 = documentoFormulario.coordenadas[1]?.link || "";
                if (link2) {
                    result = addText(`Ver en Google Maps: ${link2}`, 50, currentY - 20, 9, regularFont, currentPage);
                    currentPage = result.page;
                    currentY = result.lastY - 10; // Reducir espacio después del enlace
                }
            }
        }

        // save pdf
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
    // Configuration options for image compression
    // maxSizeMB: Maximum size in MB the compressed image should have
    // maxWidthOrHeight: The maximum width or height of the output image
    // useWebWorker: Whether to use a web worker for compression (improves performance)

    const compressionOptions = {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 1200,
        useWebWorker: true,
    };

    // Function to compress the image using the given compressionOptions
    // This returns a compressed image file.
    const compressImage = async (file) => {
        return await imageCompression(file, compressionOptions);
    };

    // Function to convert a file into a Data URL (Base64) so it can be manipulated as an image source
    // Using FileReader to read the file and return a promise that resolves with the data URL.
    const convertToDataURL = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    };

    // Function to resize an image (provided as a Data URL) down to a maximum dimension
    // The image is drawn into a canvas and then exported as a resized PNG data URL.
    // The largest dimension is scaled down to 500px if it exceeds that.
    const resizeImage = (dataUrl) => {
        return new Promise((resolve) => {
            const img = document.createElement("img");
            img.src = dataUrl;
            img.onload = () => {
                const canvas = document.createElement("canvas");
                const maxSize = Math.max(img.width, img.height);
                const scaleFactor = maxSize > 500 ? 500 / maxSize : 1;

                canvas.width = img.width * scaleFactor;
                canvas.height = img.height * scaleFactor;

                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL("image/png"));
            };
        });
    };

    // handleImageChange is a generalized function to handle image file input changes.
    // It compresses the image, converts it to a Data URL, resizes it, updates the state with the processed image,
    // and if coordinates are set to 'auto', it retrieves the geolocation and stores it along with the image data.
    // If coordinates are manual, it simply logs a message stating that manual coordinates should be added.
    const handleImageChange = async (e, setImageState, setEditState, setImageNameState, imageIdentifier) => {
        const file = e.target.files[0];
        if (!file) return;

        // Store the image identifier (e.g., 'imagen' or 'imagen2') to track which image corresponds to which data
        setImageNameState(imageIdentifier);
        console.log("Identificador de la imagen:", imageIdentifier); // Console log para verificar el identificador

        try {
            // Process the image: compress, convert to Data URL, and resize it
            const compressedFile = await compressImage(file);
            const dataUrl = await convertToDataURL(compressedFile);
            const resizedDataUrl = await resizeImage(dataUrl);

            setImageState(resizedDataUrl);
            setEditState(resizedDataUrl);

            // Update the component states with the processed image data
            if (isAuto) {
                const coordenadas = await obtenerGeolocalizacion();
                const objetoImagen = {
                    nombre: imageIdentifier,
                    ...coordenadas
                };
                // If coordinates are automatic, get current geolocation automatically and store it
                setImagenDataCoordinates((prevData) => [...prevData, objetoImagen]);

            } else if (isManual) {
                // If coordinates are set manually, just log the message indicating that manual coordinates are needed
                console.log("Debes de agregar las coordenadas manualmente.");
            }
        } catch (error) {
            console.error('Error durante la compresión o procesamiento de la imagen o al obtener geolocalización:', error);
        }
    };

    // handleImagenChange is specifically for handling the first image input change.
    // It calls handleImageChange with the appropriate parameters to process the first image.
    const handleImagenChange = (e) => {
        handleImageChange(e, setImagen, setImagenEdit, setImagen1Nombre, "imagen")
    };


    // handleImagenChange2 is specifically for the second image input change.
    // It calls handleImageChange with the parameters for the second image.
    const handleImagenChange2 = (e) => handleImageChange(e, setImagen2, setImagen2Edit, setImagen2Nombre, "imagen2");


    ///!!!! Coordenadas
    // This function attempts to retrieve the user's current geographical position using the browser's geolocation API.
    // It returns a Promise that resolves with an object containing the latitude, longitude,
    // and a Google Maps link corresponding to that location. If geolocation is not available
    // or an error occurs, the promise rejects with an appropriate error.

    const obtenerGeolocalizacion = () => {
        return new Promise((resolve, reject) => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        const coordenadas = {
                            latitud: position.coords.latitude,
                            longitud: position.coords.longitude,
                            link: `https://www.google.com/maps/search/?api=1&query=${position.coords.latitude},${position.coords.longitude}`
                        };
                        console.log(coordenadas);
                        resolve(coordenadas);
                    },
                    (error) => {
                        console.error("Error al obtener la geolocalización:", error);
                        reject(error); // En caso de error, rechaza la promesa
                    }
                );
            } else {
                reject(new Error("La geolocalización no está disponible en este navegador."));
            }
        });
    };

    // Show coordinates (automáticas o manuales)
    const handleSelectCoordenadas = (option) => {
        if (option === 'auto') {
            setIsAuto(true);
            setIsManual(false);
            console.log("Seleccionaste coordenadas automáticas");
        } else if (option === 'manual') {
            setIsAuto(false);
            setIsManual(true);
            console.log("Seleccionaste coordenadas manuales");
        }
    };

    // Selection coordinates (automáticas o manuales)
    const handleSelectCoordinates = (coords, imageIdentifier) => {

        // Create object
        const objetoImagen = {
            nombre: imageIdentifier,
            latitud: coords.latitude,
            longitud: coords.longitude,
            link: `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`
        };

        // Update de state
        setImagenDataCoordinates(prevState => {
            const updatedCoordinates = [...prevState, objetoImagen];
            imagenDataCoordinatesRef.current = updatedCoordinates; // Actualiza la referencia con el valor actualizado
            return updatedCoordinates; // Retorna el nuevo estado actualizado
        });
    };




    /////////////////////////////////////////////////////////////////////////////////////////////////////////
    // This function duplicates a record from the "registros" collection in Firestore, creating a new document
    // with a generated ID and incrementing its version number. It also updates coordinates if available,
    // resets certain states like image coordinates, and toggles coordinate mode back to automatic.

    // Parameters:
    // - idRegistroFormulario (string): The ID of the original record to be duplicated.
    // - nuevoIdRegistroFormulario (string): A new generated ID to create the duplicated record under.

    // Returns:
    // - The new document ID if duplication is successful, or null if the original record was not found or an error occurs.


    const duplicarRegistro = async (idRegistroFormulario, nuevoIdRegistroFormulario) => {
        try {
            // Reference to the original record in "registros"
            const docRef = doc(db, "registros", idRegistroFormulario);
            // Attempt to retrieve the document
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                // If the original document is found
                const data = docSnap.data();
                const nuevoDocRef = doc(db, "registros", nuevoIdRegistroFormulario);

                // Create the new document, using the original data but making some changes:
                // - Set 'edited' to false since it's a fresh duplicate
                // - Provide a reference to the original record ID
                // - Update the date and time
                // - Set 'active' to true and increment the version number by 1
                // - Add 'coordenadas' from the current stored coordinates array

                await setDoc(nuevoDocRef, {
                    ...data,
                    edited: false,
                    idRegistroReferencia: idRegistroFormulario,
                    fechaHoraActual: new Date().toISOString(),
                    active: true,
                    version: (parseInt(data.version) + 1).toString(),
                    originalId: data.originalId || idRegistroFormulario,
                    coordenadas: imagenDataCoordinatesRef.current,
                });
                // Reset the image coordinates array and coordinate modes after duplication
                setImagenDataCoordinates([])
                setIsAuto(true)
                setIsManual(false)
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


    // Brief Description:
    // Opens a confirmation modal to repeat the selected inspection (subactivity). 
    // It extracts the activity and subactivity indices, fetches form data from Firestore, 
    // updates the component state with all details (e.g., images, comments), and then 
    // displays a modal to confirm the repetition process.

    const openConfirmModal = async (subactividadId) => {
        setSubactividadToRepeat(subactividadId);
        // Check if the ppi and value
        const [actividadIndex, subactividadIndex] = subactividadId.split('-').slice(1).map(Number);
        const subactividad = ppi.actividades[actividadIndex].subactividades[subactividadIndex];

        setIdRegistroImagen(subactividad);

        // save ppi
        setSubActividadreference(subactividad);

        // Get doc of firestore
        const formularioData = await obtenerDatosFormulario(subactividad.idRegistroFormulario);

        // Save data
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
        setFormularioData({ ...formularioData, observaciones: subactividad.observaciones || '' });
        setImagen1Url(formularioData.imagen || '');
        setImagen2Url(formularioData.imagen2 || '');
        setShowConfirmModalRepetida(true);
    };

    // Brief Description:
    // This function updates the PPI (Project Production Index) document in Firestore with the 
    // latest activities and subactivities data. It ensures that each subactivity has the necessary 
    // fields (`edited`, `motivoVersion`) and then updates the Firestore document accordingly.
    // Send data to firestore
    const actualizarFormularioEnFirestore = async (nuevoPpi) => {
        // Validate if ppi exist
        if (!nuevoPpi.docId) {
            console.error("No se proporcionó docId para la actualización.");
            return;
        }

        try {
            // Save the ppi in teh document
            // Navigate inside the doc and go to the subactivities
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


    // Brief Description:
    // This function fetches a form document from the Firestore "registros" collection using its ID.
    // If the document exists, it returns its data; otherwise, it logs a message and returns null.

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

    // toggleActiveOnly: Toggles a boolean that determines if only active subactivities should be shown.
    const toggleActiveOnly = () => {
        setShowActiveOnly(!showActiveOnly);
    };

    // handleFilterChange: Updates the current result filter (e.g., "Apto", "No apto", or "Todos").
    const handleFilterChange = (event) => {
        setFilter(event.target.value);
    };
    // handleActivityFilterChange: Updates which activity is selected from the dropdown (either a specific activity or all).
    const handleActivityFilterChange = (event) => {
        setActivityFilter(event.target.value);
    };
    // filterSubactividades: Applies the currently selected filters ("filter" for resultadoInspeccion and "responsableFilter" for responsable) to a given list of subactividades.
    const filterSubactividades = (subactividades) => {
        let filtered = subactividades;
        if (filter !== 'Todos') {
            filtered = filtered.filter(subactividad => subactividad.resultadoInspeccion === filter);
        }
        if (responsableFilter !== 'Todos') {
            filtered = filtered.filter(subactividad => subactividad.responsable === responsableFilter);
        }
        return filtered;
    };

    // filterActividades: Applies the subactivity filter to each activity, then removes activities with no subactividades that match the filters, and also filters by the selected activity if chosen.
    const filterActividades = (actividades) => {
        return actividades
            .map(actividad => ({
                ...actividad,
                subactividades: filterSubactividades(actividad.subactividades)
            }))
            .filter(actividad => actividad.subactividades.length > 0)
            .filter(actividad => activityFilter === 'Actividades' || `${actividad.numero}. ${actividad.actividad}` === activityFilter);
    };
    // activityOptions: Creates a dropdown array containing "Actividades" plus the number and name of each activity from the ppi data, for activity selection.
    const activityOptions = ppi ? ['Actividades', ...ppi.actividades.map(actividad => `${actividad.numero}. ${actividad.actividad}`)] : [];
    // handleResponsableFilterChange: Updates which responsible person is selected from the dropdown.
    const handleResponsableFilterChange = (event) => {
        setResponsableFilter(event.target.value);
    };


    // Controller the viewe of table and grid

    const [view, setView] = useState('table');

    const showTableView = () => {
        setView('table');
    };

    const showGridView = () => {
        setView('grid');
    };



    // The isLatestVersion function checks if a given subactivity is currently the newest (latest) version among all versions of that specific subactivity. 
    // It looks up all versions for a particular subactivity (identified by its 'numero'), finds the highest version number, 
    // and returns true if the subactivity's version matches this highest number, indicating it is the most recent version.

    const isLatestVersion = (actividadIndex, subactividad) => {
        // Obtener todas las versiones de la misma subactividad
        const allVersions = ppi.actividades[actividadIndex].subactividades
            .filter(s => s.numero === subactividad.numero)
            .map(s => parseInt(s.version, 10));

        // Encontrar la versión más alta
        const latestVersion = Math.max(...allVersions);

        // Comparar la versión actual con la más alta
        return parseInt(subactividad.version, 10) === latestVersion;
    };

    // These functions manage the process of marking an inspection as finished or reverting it to a pending state. 
    // The `openFinishInspectionModal` function verifies that the chosen subactivity is the latest version before allowing the user 
    // to finish the inspection. If it is, the confirmation modal opens.

    const openFinishInspectionModal = (actividadIndex, subactividadIndex) => {
        const actividad = ppi.actividades[actividadIndex];
        const subactividad = actividad.subactividades[subactividadIndex];

        if (isLatestVersion(actividadIndex, subactividad)) {
            setInspectionToFinish({ actividadIndex, subactividadIndex, ...subactividad });
            setIsFinishInspectionModalOpen(true);
        } else {
            console.log("No puedes terminar esta inspección, selecciona la versión más reciente.");
        }
    };

    // The `confirmFinishInspection` function toggles the 'terminada' (finished) state of the selected subactivity in Firestore. 
    // It fetches the current data, updates the 'terminada' field, and updates the component's state to reflect the change. 
    // This may increment or decrement the counter of finished inspections depending on the action taken.
    const confirmFinishInspection = async () => {
        try {
            const { actividadIndex, subactividadIndex } = inspectionToFinish;
            const ppiRef = doc(db, "lotes", idLote, "inspecciones", ppi.docId);

            // Obtener los datos actuales del documento
            const docSnap = await getDoc(ppiRef);
            if (!docSnap.exists()) {
                console.error("No se encontró el documento.");
                return;
            }

            const existingData = docSnap.data();
            const currentStatus = existingData.actividades[actividadIndex].subactividades[subactividadIndex].terminada;

            existingData.actividades[actividadIndex].subactividades[subactividadIndex] = {
                ...existingData.actividades[actividadIndex].subactividades[subactividadIndex],
                terminada: !currentStatus, // Alterna el valor de terminada
            };

            await updateDoc(ppiRef, { actividades: existingData.actividades });

            setPpi((prevPpi) => {
                const updatedActividades = [...prevPpi.actividades];
                updatedActividades[actividadIndex].subactividades[subactividadIndex] = {
                    ...updatedActividades[actividadIndex].subactividades[subactividadIndex],
                    terminada: !currentStatus,
                };

                return { ...prevPpi, actividades: updatedActividades };
            });

            setTerminadasCount((prevCount) => currentStatus ? prevCount - 1 : prevCount + 1);

            setIsFinishInspectionModalOpen(false);
            setInspectionToFinish(null);
        } catch (error) {
            console.error("Error al actualizar la subactividad en Firestore:", error);
        }
    };


    // The `closeFinishInspectionModal` simply closes the confirmation modal without making any changes.
    const closeFinishInspectionModal = () => {
        setIsFinishInspectionModalOpen(false);
        setInspectionToFinish(null);
    };


    // This useEffect hook calculates the total number of completed ('terminada') inspections each time the 'ppi' state updates.
    // It iterates over all activities and their subactivities to count how many are marked as 'terminada',
    // and then updates the 'terminadasCount' state with that total. This ensures that the displayed count of completed inspections
    // remains accurate whenever there are changes in the 'ppi' data.

    useEffect(() => {
        if (ppi && ppi.actividades) {
            const newTerminadasCount = ppi.actividades.reduce((count, actividad) => {
                return count + actividad.subactividades.filter(subactividad => subactividad.terminada).length;
            }, 0);

            setTerminadasCount(newTerminadasCount); // Actualizamos el estado
        }
    }, [ppi]);





    return (
        <div className='container mx-auto min-h-screen xl:px-12 py-3 text-gray-500 text-sm'>
            {showConfirmModalRepetida && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-gray-800 opacity-75"></div>
                    <div className="relative bg-white rounded-lg shadow-lg w-full max-w-lg mx-auto overflow-hidden">

                        <div className="p-8 overflow-auto h-[80vh]">
                            <div className="text-center flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-medium">Editar inspección</h2>
                                <button
                                    onClick={() => {
                                        setShowConfirmModalRepetida(false)
                                        setImagenEdit('')
                                        setImagen2Edit('')
                                        setImagenDataCoordinates([])
                                        setImagen('')
                                        setImagen2('')
                                        setIsAuto(true)
                                        setIsManual(false)
                                    }}
                                    className="text-3xl text-gray-500 hover:text-gray-700 transition-colors duration-300"
                                >
                                    <IoCloseCircle />
                                </button>
                            </div>

                            <div className='w-full border-b-2 mb-5'></div>
                            {subactividadSeleccionada && (
                                <div className="mb-6">
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Actividad</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={actividadNombre}
                                            className="mt-1 p-2 w-full bg-gray-200 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Criterio de aceptación</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={criterioAceptacion}
                                            className="mt-1 p-2 w-full bg-gray-200 border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Documentación de referencia</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={docReferencia}
                                            className="mt-1 p-2 w-full bg-gray-200  border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Tipo de inspección</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={tipoInspeccion}
                                            className="mt-1 p-2 w-full bg-gray-200  border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Punto</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={punto}
                                            className="mt-1 p-2 w-full bg-gray-200  border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Responsable</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={responsable}
                                            className="mt-1 p-2 w-full bg-gray-200  border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>

                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Nombre</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={nombre_usuario_edit}
                                            className="mt-1 p-2 w-full bg-gray-200  border border-gray-300 rounded-md shadow-sm sm:text-sm"
                                        />
                                    </div>



                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 flex gap-1"><span className='text-gray-400 text-lg'><TiLockClosedOutline /></span>Resultado inspección:</label>
                                        <input
                                            readOnly
                                            type="text"
                                            value={aptoNoapto}
                                            onChange={(e) => setAptoNoapto(e.target.value)}
                                            className="mt-1 p-2 w-full bg-gray-200  border border-gray-300 rounded-md shadow-sm sm:text-sm"
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
                                    {formularioData && (
                                        <>
                                            <div className="mb-4 mt-4">
                                                <label className="block text-gray-500 text-sm font-medium">Editar geolocalización de imagenes</label>
                                                <p><strong className='text-amber-500'>*</strong>Agregar las coordenadas manualmente</p>
                                                <div className="flex gap-4 mt-4">
                                                    <button
                                                        onClick={() => handleSelectCoordenadas('auto')}
                                                        className={`px-4 py-2 rounded-full text-sm font-medium border ${isAuto ? "bg-blue-500 text-white border-blue-500" : "bg-gray-200 text-gray-700 border-gray-300"
                                                            }`}
                                                    >
                                                        Automática
                                                    </button>
                                                    <button
                                                        onClick={() => handleSelectCoordenadas('manual')}
                                                        className={`px-4 py-2 rounded-full text-sm font-medium border ${isManual ? "bg-blue-500 text-white border-blue-500" : "bg-gray-200 text-gray-700 border-gray-300"
                                                            }`}
                                                    >
                                                        Manual
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 flex gap-1 items-center">
                                                    <span><FaImage className="text-gray-500 mr-2" /></span>Imagen 1
                                                </label>
                                                <input onChange={handleImagenChange} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                                {imagenEdit ? (
                                                    <img src={imagenEdit} alt="Imagen 1" className="mt-2 " />
                                                ) : (
                                                    imagen1Url && <img src={imagen1Url} alt="Imagen 1" className="mt-2" />
                                                )}
                                                {isManual && (
                                                    <Mapa
                                                        onSelect={handleSelectCoordinates}
                                                        imageIdentifier="imagen1"
                                                    />
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm font-medium text-gray-700 flex gap-1 items-center">
                                                    <span><FaImage className="text-gray-500 mr-2" /></span>Imagen 1
                                                </label>
                                                <input onChange={handleImagenChange2} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                                {imagen2Edit ? (
                                                    <img src={imagen2Edit} alt="Imagen 1" className="mt-2" />
                                                ) : (
                                                    imagen2Url && <img src={imagen2Url} alt="Imagen 1" className="mt-2" />
                                                )}
                                                {isManual && (
                                                    <Mapa
                                                        onSelect={handleSelectCoordinates}
                                                        imageIdentifier="imagen2"
                                                    />
                                                )}
                                            </div>

                                            <div className="mb-4">
                                                <label className="block text-sm text-gray-500">Observaciones del informe</label>
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
                                    onClick={() => {
                                        setShowConfirmModalRepetida(false)
                                        setImagenEdit('')
                                        setImagen2Edit('')
                                        setImagenDataCoordinates([])
                                        setImagen('')
                                        setImagen2('')
                                        setIsAuto(true)
                                        setIsManual(false)
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 px-4 py-2 rounded-md shadow-md text-white font-medium"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}










            <div className='flex gap-2 items-center justify-between bg-white px-5 py-3 text-xs xl:text-sm'>
                <div className='flex flex-wrap gap-2 items-center'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'/'}>
                        <h1 className=' text-gray-500'>Home</h1>
                    </Link>

                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} className='hidden xl:block' />

                    <h1 className='cursor-pointer text-gray-500 hidden xl:block' onClick={regresar}>Elementos</h1>
                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                                        <h1 className='font-medium text-amber-600'>{nameProject} </h1>

                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'#'}>
                        <div className='font-medium text-sm text-gray-600 flex gap-2 items-center'>
                            <div className='flex gap-1'>
                                <p>Lote: </p>
                                <p>{lote}</p>
                            </div>


                        </div>
                    </Link>
                </div>


                <div className='flex items-center gap-4'>
                    <button className='text-amber-600 text-3xl' onClick={regresar}><IoArrowBackCircle /></button>
                </div>

            </div>

            <div className='w-full border-b-2 border-gray-200'></div>

            <div className='flex flex-col mt-4 px-4 xl:px-0'>
                <div className=' px-2 xl:px-0'>
                    {ppi ? (
                        <>

                            <div className='flex gap-5 flex-col xl:flex-row xl:justify-between items-center bg-gray-200 w-full rounded-lg px-5 py-3'>
                                <div className='flex flex-col xl:flex-row gap-8'>
                                    <div className='flex gap-2 items-center '>
                                        <span className='text-green-500 text-xl'><AiOutlineCheckCircle /></span>
                                        <p className='font-medium text-md'>
                                            Inspecciones aptas: <span>{actividadesAptas || 0}</span>
                                        </p>
                                    </div>

                                    <div className='flex gap-2 items-center '>
                                        <span className='text-amber-600 text-xl'><FaWpforms /></span>
                                        <p className='font-medium font-medium text-md'>
                                            Inspecciones totales: <span>{totalSubactividades || 0}</span>
                                        </p>
                                    </div>
                                    <div className='flex gap-2 items-center '>
                                        <span className='text-blue-500 text-xl'><AiOutlineCheckCircle /></span>
                                        <p className='font-medium text-md'>
                                            Inspecciones terminadas: <span>{terminadasCount || 0}</span>
                                        </p>
                                    </div>
                                </div>



                                <div className=''>
                                    {actividadesAptas === totalSubactividades && terminadasCount === totalSubactividades && (
                                        <button
                                            onClick={() => setShowConfirmModal(true)}
                                            className="bg-amber-600 text-white font-medium py-2 px-4 rounded-lg"
                                        >
                                            <p className='flex gap-2 items-center'><FaFilePdf />Terminar inspección</p>
                                        </button>
                                    )}
                                </div>



                            </div>





                            <div className='flex gap-2 flex-col xl:flex-row xl:justify-between items-center xl:items-end mb-4'>


                                <div className='flex-col xl:flex-row gap-5 flex items-center xl:items-center'>

                                    <select value={activityFilter} onChange={handleActivityFilterChange} className="bg-white border rounded-md px-4 py-2">
                                        {activityOptions.map(option => (
                                            <option key={option} value={option}>{option}</option>
                                        ))}
                                    </select>

                                    <div className='flex gap-5'>
                                        <select value={responsableFilter} onChange={handleResponsableFilterChange} className="bg-white border rounded-md px-4 py-2">
                                            <option value="Todos">Responsable</option>
                                            {ppi && [...new Set(ppi.actividades.flatMap(actividad => actividad.subactividades.map(subactividad => subactividad.responsable)))].map(responsable => (
                                                <option key={responsable} value={responsable}>{responsable}</option>
                                            ))}
                                        </select>

                                        <select value={filter} onChange={handleFilterChange} className="bg-white border rounded-md px-4 py-2">
                                            <option value="Todos">Estatus</option>
                                            <option value="Apto" className='text-green-500'>Apto</option>
                                            <option value="No apto" className='text-red-600'>No Apto</option>
                                        </select>
                                    </div>

                                </div>


                                <div className='flex gap-5 justify-center mt-4'>
                                    <button onClick={showTableView} className={`flex gap-2 items-center bg-gray-200 rounded-lg px-4 py-2 ${view === 'table' ? 'bg-yellow-600 text-gray-100' : 'bg-gray-200'}`}>
                                        <span><FaTable /></span>Tabla
                                    </button>
                                    <button onClick={showGridView} className={`flex gap-2 items-center bg-gray-200 rounded-lg px-4 py-2 ${view === 'grid' ? 'bg-yellow-600 text-gray-100' : 'bg-gray-200'}`}>
                                        <span><FaTabletAlt /></span>Grid
                                    </button>
                                </div>

                                <div><PdfListViewer /></div>





                            </div>
                        </>
                    ) : (
                        <div>Cargando...</div>
                    )}
                </div>

                {view === 'table' ? (
                    <div className='flex gap-3 flex-col px-3 xl:p-0'>
                        <div className="w-full rounded-xl overflow-x-auto">
                            <div>
                                <div className="w-full bg-sky-600 text-gray-100 text-xs xl:text-sm font-medium py-3 px-3 grid grid-cols-24 items-center">
                                    <div className='col-span-2 xl:col-span-1'>V</div>
                                    <div className='col-span-2 xl:col-span-1  px-2'>Nº</div>
                                    <div className="col-span-10 xl:col-span-3 flex items-center justify-start text-xs px-5">Actividad</div>
                                    <div className="col-span-4 xl:col-span-3 hidden xl:flex">Criterio de aceptación</div>
                                    <div className="col-span-1  hidden xl:flex">Doc de ref.</div>
                                    <div className="col-span-2 xl:col-span-2 hidden xl:flex">Tipo de inspección</div>
                                    <div className="col-span-1 xl:col-span-1 hidden xl:flex">Punto</div>
                                    <div className="col-span-2 xl:col-span-2 hidden xl:flex">Responsable</div>
                                    <div className="col-span-2 xl:col-span-2 hidden xl:block ">Nombre</div>
                                    <div className="col-span-4 xl:col-span-2 hidden xl:block ">Fecha</div>
                                    <div className="col-span-2  hidden xl:flex">Comentarios</div>
                                    <div className="col-span-3 xl:col-span-1">Result.</div>
                                    <div className="col-span-2 xl:col-span-1 ">Pdf</div>
                                    <div className="col-span-3 xl:col-span-1 ">Editar</div>
                                    <div className="col-span-1 xl:col-span-1 ">Estado</div>
                                </div>

                                <div>
                                    {ppi && filterActividades(ppi.actividades).map((actividad, indexActividad) => [
                                        // Row for activity name
                                        <div key={`actividad-${indexActividad}`} className="bg-gray-200 grid grid-cols-24  px-3 py-3 items-center border-b border-gray-200 text-xs xl:text-sm font-medium">
                                            <div className="col-span-2 xl:col-span-1 text-start">
                                                (V)
                                            </div>
                                            <div className="col-span-2 xl:col-span-1">
                                                {actividad.numero}
                                            </div>
                                            <div className="col-span-10 xl:col-span-2 px-5">
                                                {actividad.actividad}
                                            </div>
                                        </div>,
                                        // Rows for subactividades
                                        ...actividad.subactividades
                                            .filter(subactividad => filter === 'Todos' || subactividad.resultadoInspeccion === filter)
                                            .map((subactividad, indexSubactividad) => (
                                                <div key={`subactividad-${indexActividad}-${indexSubactividad}`} className="grid grid-cols-24 items-center bg-white border-b border-gray-200 text-sm px-4 py-3">
                                                    <div className="col-span-2 xl:col-span-1">
                                                        {subactividad.version}
                                                    </div>
                                                    <div className="col-span-2 xl:col-span-1 text-start px-2">
                                                        {subactividad.numero}
                                                    </div>
                                                    <div className="col-span-10 xl:col-span-3 text-start px-5">
                                                        {subactividad.nombre}
                                                    </div>
                                                    <div className="col-span-4 xl:col-span-3 hidden xl:block px-3">
                                                        {subactividad.criterio_aceptacion}
                                                    </div>
                                                    <div className="col-span-1 xl:col-span-1 hidden xl:block">
                                                        {subactividad.documentacion_referencia}
                                                    </div>
                                                    <div className="col-span-2 xl:col-span-2 hidden xl:block">
                                                        {subactividad.tipo_inspeccion}
                                                    </div>
                                                    <div className="col-span-1 xl:col-span-1 hidden xl:block text-center">
                                                        {subactividad.punto}
                                                    </div>
                                                    <div className="col-span-2 xl:col-span-2 hidden xl:block">
                                                        {subactividad.responsable || ''}
                                                    </div>
                                                    <div className="col-span-2 xl:col-span-2 hidden xl:block">
                                                        {subactividad.nombre_usuario || ''}
                                                    </div>
                                                    <div className="col-span-4 xl:col-span-2 hidden xl:block block">
                                                        {subactividad.fecha || ''}
                                                    </div>
                                                    <div className="col-span-3 xl:col-span-2 hidden xl:block">
                                                        {subactividad.comentario || ''}
                                                    </div>
                                                    <div className="col-span-3 xl:col-span-1 text-start">
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
                                                                className="w-full font-bold text-medium text-xl rounded w-full flex justify-start cursor-pointer"
                                                            >
                                                                <IoMdAddCircle />
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="col-span-2 xl:col-span-1 block bg-white cursor-pointer flex justify-start">
                                                        {subactividad.formularioEnviado ? (
                                                            <p
                                                                onClick={() => handleMostrarIdRegistro(`apto-${indexActividad}-${indexSubactividad}`)}
                                                                className='text-xl'
                                                            >
                                                                <FaFilePdf />
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                    <div className="col-span-3 xl:col-span-1 block  cursor-pointer flex justify-start ps-2">
                                                        {subactividad.formularioEnviado ? (
                                                            // Verificar si esta subactividad es la versión más reciente para su número
                                                            ppi.actividades
                                                                .flatMap((actividad) => actividad.subactividades)
                                                                .filter((sub) => sub.numero === subactividad.numero)
                                                                .reduce((max, sub) => (sub.version > max ? sub.version : max), 0) === subactividad.version && !subactividad.terminada ? (
                                                                <button
                                                                    onClick={() => openConfirmModal(`apto-${indexActividad}-${indexSubactividad}`)}
                                                                    className="text-gray-500 font-bold text-lg"
                                                                >
                                                                    <FaRegEdit />
                                                                </button>
                                                            ) : (
                                                                // Versiones anteriores o terminadas muestran un check
                                                                <FaCheckCircle className="text-gray-400 text-lg" />
                                                            )
                                                        ) : null}
                                                    </div>


                                                    <div>
                                                        {/* Botón para abrir el modal de confirmación para terminar la inspección */}
                                                        <div className="col-span-1 xl:col-span-1 block bg-white cursor-pointer flex justify-center">
                                                            {subactividad.formularioEnviado ? (
                                                                subactividad.terminada ? (
                                                                    <button
                                                                        onClick={() => openFinishInspectionModal(indexActividad, indexSubactividad)}
                                                                        className="bg-green-500 text-white px-2 py-1 font-bold text-xs rounded-lg"
                                                                    >
                                                                        Terminada
                                                                    </button>
                                                                ) : (
                                                                    isLatestVersion(indexActividad, subactividad) && (
                                                                        <button
                                                                            onClick={() => openFinishInspectionModal(indexActividad, indexSubactividad)}
                                                                            className="bg-yellow-500 text-white px-2 py-1  font-bold text-xs rounded-lg"
                                                                        >
                                                                            Pendiente
                                                                        </button>
                                                                    )
                                                                )
                                                            ) : null}
                                                        </div>

                                                        {/* Modal de confirmación para terminar la inspección */}
                                                        {isFinishInspectionModalOpen && (
                                                            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-800 bg-opacity-75">
                                                                <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                                                                    <h2 className="text-xl font-semibold mb-4">
                                                                        {inspectionToFinish?.terminada ? "¿Regresar a pendiente?" : "¿Terminar la inspección?"}
                                                                    </h2>
                                                                    <p className="text-gray-600 mb-6">
                                                                        {inspectionToFinish?.terminada
                                                                            ? "¿Estás seguro de que deseas marcar esta inspección como pendiente?"
                                                                            : "¿Estás seguro de que deseas marcar esta inspección como terminada?"}
                                                                    </p>
                                                                    <div className="flex justify-end gap-4">
                                                                        <button
                                                                            onClick={confirmFinishInspection}
                                                                            className={`font-bold py-2 px-4 rounded ${inspectionToFinish?.terminada ? "bg-yellow-500" : "bg-green-600"} text-white`}
                                                                        >
                                                                            {inspectionToFinish?.terminada ? "Regresar a pendiente" : "Terminar inspección"}
                                                                        </button>
                                                                        <button
                                                                            onClick={closeFinishInspectionModal}
                                                                            className="bg-gray-500 text-white font-bold py-2 px-4 rounded"
                                                                        >
                                                                            Cancelar
                                                                        </button>

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>



                                                </div>
                                            ))
                                    ])}
                                </div>
                            </div>
                        </div>
                    </div>

                ) : (
                    <div className="flex flex-col mt-5">
                        {ppi && filterActividades(ppi.actividades).map((actividad, indexActividad) => (
                            <div key={`actividad-${indexActividad}`} className="mb-6">
                                <div className="flex gap-2 items-center border-b-2 p-4 mb-4 bg-gray-200 text-gray-600 rounded-lg">
                                    <div className="font-semibold">{actividad.numero}.- </div>
                                    <div className="font-semibold">{actividad.actividad}</div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {actividad.subactividades
                                        .filter(subactividad => filter === 'Todos' || subactividad.resultadoInspeccion === filter)
                                        .map((subactividad, indexSubactividad) => (
                                            <div key={`subactividad-${indexActividad}-${indexSubactividad}`} className="bg-white rounded-lg shadow-md h-full flex flex-col">
                                                <div className="flex gap-2 items-center bg-sky-600 text-gray-100 text-md py-1 h-20 px-6 font-medium rounded-t-lg">
                                                    <span>{subactividad.numero}</span>
                                                    <span>{subactividad.nombre}</span>
                                                </div>

                                                <div className="px-6 py-3 flex flex-col justify-between h-full">
                                                    <div className='flex flex-col gap-1'>

                                                        <div className="flex gap-2">
                                                            <span className="font-medium">Versión:</span>
                                                            <span>{subactividad.version}</span>
                                                        </div>

                                                        <div className="flex flex-col">
                                                            <span className="font-medium">Criterio de aceptación:</span>
                                                            <span>{subactividad.criterio_aceptacion}</span>
                                                        </div>


                                                        <div className="flex gap-2">
                                                            <span className="font-medium">Doc de referencia:</span>
                                                            <span>{subactividad.documentacion_referencia}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="font-medium">Tipo de inspección:</span>
                                                            <span>{subactividad.tipo_inspeccion}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="font-medium">Punto:</span>
                                                            <span>{subactividad.punto}</span>
                                                        </div>
                                                        <div className="flex gap-2">
                                                            <span className="font-medium">Responsable:</span>
                                                            <span>{subactividad.responsable || ''}</span>
                                                        </div>


                                                        <div className='border-b-2 my-2'></div>

                                                        <div className="mb-4">
                                                            <div className="flex gap-2">
                                                                <span className="font-medium">Nombre usuario:</span>
                                                                <span>{subactividad.nombre_usuario || ''}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="font-medium text-gray-600">Fecha:</span>
                                                                <span>{subactividad.fecha || ''}</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="font-medium">Comentarios:</span>
                                                                <span>{subactividad.comentario || ''}</span>
                                                            </div>
                                                        </div>
                                                    </div>



                                                    <div className="flex justify-start items-center gap-5 pb-4">
                                                        <div className="flex items-center">
                                                            {subactividad.resultadoInspeccion ? (
                                                                subactividad.resultadoInspeccion === "Apto" ? (
                                                                    <span className="text-teal-500 text-lg font-bold">Apto</span>
                                                                ) : (
                                                                    <span className="text-red-600 text-lg font-bold">No apto</span>
                                                                )
                                                            ) : (
                                                                <span onClick={() => handleOpenModalFormulario(`apto-${indexActividad}-${indexSubactividad}`)} className="text-gray-500 text-4xl cursor-pointer">
                                                                    <IoMdAddCircle />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center">
                                                            {subactividad.formularioEnviado && (
                                                                <span onClick={() => handleMostrarIdRegistro(`apto-${indexActividad}-${indexSubactividad}`)} className="text-gray-500 text-2xl cursor-pointer">
                                                                    <FaFilePdf />
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center">
                                                            {subactividad.formularioEnviado ? (
                                                                <button
                                                                    onClick={() => openConfirmModal(`apto-${indexActividad}-${indexSubactividad}`)}
                                                                    className="text-gray-500 font-bold text-xl"
                                                                >
                                                                    <FaRegEdit />
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                        <div>
                                                            {/* Botón para abrir el modal de confirmación para terminar la inspección */}
                                                            <div className="col-span-1 xl:col-span-1 block bg-white cursor-pointer flex justify-center">
                                                                {subactividad.formularioEnviado ? (
                                                                    subactividad.terminada ? (
                                                                        <button
                                                                            onClick={() => openFinishInspectionModal(indexActividad, indexSubactividad)}
                                                                            className="bg-green-500 text-white px-2 py-1 font-bold text-xs rounded-lg"
                                                                        >
                                                                            Terminada
                                                                        </button>
                                                                    ) : (
                                                                        isLatestVersion(indexActividad, subactividad) && (
                                                                            <button
                                                                                onClick={() => openFinishInspectionModal(indexActividad, indexSubactividad)}
                                                                                className="bg-yellow-500 text-white px-2 py-1  font-bold text-xs rounded-lg"
                                                                            >
                                                                                Pendiente
                                                                            </button>
                                                                        )
                                                                    )
                                                                ) : null}
                                                            </div>

                                                            {/* Modal de confirmación para terminar la inspección */}
                                                            {isFinishInspectionModalOpen && (
                                                                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-800 bg-opacity-75">
                                                                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
                                                                        <h2 className="text-xl font-semibold mb-4">
                                                                            {inspectionToFinish?.terminada ? "¿Regresar a pendiente?" : "¿Terminar la inspección?"}
                                                                        </h2>
                                                                        <p className="text-gray-600 mb-6">
                                                                            {inspectionToFinish?.terminada
                                                                                ? "¿Estás seguro de que deseas marcar esta inspección como pendiente?"
                                                                                : "¿Estás seguro de que deseas marcar esta inspección como terminada?"}
                                                                        </p>
                                                                        <div className="flex justify-end gap-4">
                                                                            <button
                                                                                onClick={confirmFinishInspection}
                                                                                className={`font-bold py-2 px-4 rounded ${inspectionToFinish?.terminada ? "bg-yellow-500" : "bg-green-600"} text-white`}
                                                                            >
                                                                                {inspectionToFinish?.terminada ? "Regresar a pendiente" : "Terminar inspección"}
                                                                            </button>
                                                                            <button
                                                                                onClick={closeFinishInspectionModal}
                                                                                className="bg-gray-500 text-white font-bold py-2 px-4 rounded"
                                                                            >
                                                                                Cancelar
                                                                            </button>

                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>

                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        ))}
                    </div>


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
                <div className="fixed inset-0 z-50 flex justify-center items-center overflow-auto px-4">
                    <div className="absolute inset-0 bg-gray-800 opacity-90"></div>

                    {/* Contenedor del modal */}
                    <div className="relative bg-white rounded-lg shadow-lg z-50 w-full max-w-lg lg:max-w-2xl xl:max-w-3xl h-auto max-h-[90vh] p-8 overflow-y-auto">
                        <div className="my-6">
                            <div className='flex justify-between items-center mb-4'>
                                <h2 className='text-center font-medium text-2xl text-gray-400 w-full text-center'>Formulario</h2>

                                <button
                                    onClick={() => {
                                        handleCloseModal()
                                        setImagen('')
                                        setImagen2('')
                                        setImagenDataCoordinates([])
                                        setImagen('')
                                        setImagen2('')
                                        setIsAuto(true)
                                        setIsManual(false)
                                    }}
                                    className="text-3xl text-gray-500 hover:text-gray-700 transition-colors duration-300">
                                    <IoCloseCircle />
                                </button>
                            </div>
                            <div className='w-full border-b-2 mb-5'></div>

                            <label htmlFor="resultadoInspeccion" className="block font-medium text-gray-500 flex items-center gap-2">
                                <span className='text-lg'></span> Resultado de la inspección:
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
                                    <label htmlFor="comentario" className="block text-gray-500 text-sm font-medium mb-2">Comentarios de la inspección</label>
                                    <textarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                                </div>

                                <div className="mb-4 mt-4">
                                    <label className="block text-gray-500 text-sm font-medium">Geolocalización de las imagenes</label>
                                    <div className="flex gap-4 mt-4">
                                        <button
                                            onClick={() => handleSelectCoordenadas('auto')}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border ${isAuto ? "bg-blue-500 text-white border-blue-500" : "bg-gray-200 text-gray-700 border-gray-300"
                                                }`}
                                        >
                                            Automática
                                        </button>
                                        <button
                                            onClick={() => handleSelectCoordenadas('manual')}
                                            className={`px-4 py-2 rounded-full text-sm font-medium border ${isManual ? "bg-blue-500 text-white border-blue-500" : "bg-gray-200 text-gray-700 border-gray-300"
                                                }`}
                                        >
                                            Manual
                                        </button>
                                    </div>
                                </div>
                                <div className="mb-4 mt-4">
                                    <label htmlFor="imagen" className="block text-gray-500 text-sm font-medium">Seleccionar imagen</label>
                                    <input onChange={handleImagenChange} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                    {imagen && (
                                        <img src={imagen} className='w-40' />
                                    )}
                                    {isManual && (
                                        <Mapa
                                            onSelect={handleSelectCoordinates}
                                            imageIdentifier="imagen1"
                                        />
                                    )}
                                </div>
                                <div className="">
                                    <label htmlFor="imagen" className="block text-gray-500 text-sm font-medium">Seleccionar imagen 2</label>
                                    <input onChange={handleImagenChange2} type="file" id="imagen" accept="image/*" className="rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline" />
                                    {imagen2 && (
                                        <img src={imagen2} className='w-40' />
                                    )}
                                    {isManual && (
                                        <Mapa
                                            onSelect={handleSelectCoordinates}
                                            imageIdentifier="imagen2"
                                        />
                                    )}
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
                            userName={userName}
                            fechaHoraActual={fechaHoraActual}
                            handleCloseModal={handleCloseModal}
                            ppiNombre={ppiNombre}

                            setImagen={setImagen}
                            setImagen2={setImagen2}
                            setImagenDataCoordinates={setImagenDataCoordinates}
                            setIsAuto={setIsAuto}
                            setIsManual={setIsManual}
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

                    <div className="mx-auto w-[700px] modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
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
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-md font-medium py-3 px-4 rounded focus:outline-none focus:shadow-outline"
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

                    <div className="mx-auto w-[600px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
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
                                        <p className='text-teal-500 font-medium text-5xl'><FaCheckCircle /></p>
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

                        <p className='text-gray-500 font-medium text-5xl'><FaFilePdf /></p>

                        <p className='text-gray-500 font-medium text-xl'>¿Imprimir el informe?</p>
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
                                user={user}
                                userName={userName}
                            />
                        </div>


                    </div>
                </div>
            )}




        </div>


    );
}

export default TablaPpi;




