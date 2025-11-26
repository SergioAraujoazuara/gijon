import React, { useState, useEffect, useRef } from "react";
import { collection, getDocs, addDoc, where, query } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../../../firebase_config";
import { doc, getDoc } from "firebase/firestore";
import { IoClose } from "react-icons/io5";
import imageCompression from "browser-image-compression";
import { IoMdAddCircle } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
import { FaCheck, FaDeleteLeft } from "react-icons/fa6";
import { MdOutlineError } from "react-icons/md";
import { BsClipboardData } from "react-icons/bs";
import { GoHomeFill } from "react-icons/go";
import { Link, useNavigate } from "react-router-dom";
import Firma from "../../Components/Firma/Firma";
import VoiceRecorderInput from "./AudioTexto/VoiceRecorderInput";
import { v4 as uuidv4 } from 'uuid';
import PhotoUpload from "./PhotoUpload";
import { set, get, del } from "idb-keyval";

/**
 * ParteObra Component
 *
 * This component is a comprehensive inspection form used to register construction site activities.
 * It supports two types of reports: "visita" (site visit) and "acta" (meeting minutes).
 *
 * Features:
 * - Filters and selects inspection tasks ("lotes") associated with a selected project.
 * - Dynamically loads PPI (Inspection Point Plan) details and displays associated activities and subactivities.
 * - Allows recording general observations, safety issues, available resources (companies, workers, equipment), and inspection images with GPS metadata.
 * - Provides voice-to-text support via the VoiceRecorderInput component for easier input of observations.
 * - Validates required fields and ensures all activities are assessed.
 * - Compresses and uploads images with location metadata to Firebase Storage.
 * - Stores the complete record in Firestore under either `registrosParteDeObra` or `registrosActasDeReunion`, depending on the report type.
 * - Displays modals for success or validation errors with helpful feedback.
 *
 * Dependencies:
 * - Firebase Firestore & Storage
 * - React Router
 * - Tailwind CSS for styling
 * - UUID for unique file naming
 * - VoiceRecorderInput for dictation-based input
 * //TODO: Agregar la funcionalidad de la trazabilidad de la obra/lote
 * This form is optimized for both desktop and mobile views and aims to streamline and validate daily site inspection reporting.
 * 
 * Main Functions:
 * ---------------
 * - `fetchLotes`: Loads construction work units (lotes) from Firestore associated with the selected project.
 * - `fetchPpiDetails`: Retrieves the PPI (Inspection Point Plan) data for a selected work unit.
 * - `handleOpenModal`: Opens the form modal and loads the selected work unit and its PPI.
 * - `handleCloseModal`: Resets all form data and closes the modal.
 * - `handleInputChange`: Updates form values based on user input.
 * - `handleFileChange`: Compresses and prepares an image file for upload.
 * - `uploadImageWithMetadata`: Uploads an image to Firebase Storage with geolocation and observation metadata.
 * - `handleSubmit`: Validates the form and submits the final record to Firestore.
 * - `compressImage`: Compresses images to reduce file size before uploading.
 * - `handleActivityChange`: Marks an activity as applicable and sets the selected state for its subactivities.
 * - `handleSubactivityChange`: Toggles the selected state of a subactivity.
 * - `handleNoAplicaChange`: Marks an activity as "not applicable" and resets its statess.
 * - `handleFilterChange`: Updates filter values for selecting specific work units.
 * - `getBackgroundColor`: Returns a color class based on the percentage of compliant activities.
 * - `handleAddEmpresa`, `handleRemoveEmpresa`, `handleMediosChange`: Manage available resources (companies, workers, machinery) in the form.
 */

// Función para obtener la fecha y hora local en formato compatible con datetime-local
function getLocalDateTimeString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

const ParteObra = () => {
  const uniqueId = uuidv4();
  const navigate = useNavigate();
  const selectedProjectName = localStorage.getItem("selectedProjectName");
  const selectedProjectId = localStorage.getItem("selectedProjectId");
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLote, setSelectedLote] = useState(null);
  const [formData, setFormData] = useState({
    observaciones: "",
    observacionesActividad: "",
    observacionesActividades: { actividad1: "", actividad2: "", actividad3: "", actividad4: "", actividad5: "", actividad6: "" },
    observacionesLocalizacion: "",
    fechaHora: getLocalDateTimeString(), // Fecha y hora local por defecto
    imagenes: [],
    mediosDisponibles: [{ nombreEmpresa: "", numeroTrabajadores: "", maquinaria: "" }],
    previsionesActividades: { actividad1: "", actividad2: "", actividad3: "", actividad4: "", actividad5: "", actividad6: "" },
  });
  const [activityVisibility, setActivityVisibility] = useState(true);
  const [visibleActivities, setVisibleActivities] = useState(1);
  const [visiblePrevisiones, setVisiblePrevisiones] = useState(1);

  // Nuevos estados para el manejo de imágenes
  const [imageUploadStatus, setImageUploadStatus] = useState({});
  const [imagePreviews, setImagePreviews] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  // Estados para el modal del borrador
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [draftModalContent, setDraftModalContent] = useState('');
  const [draftModalType, setDraftModalType] = useState('info'); // 'info' o 'confirm'
  const [draftModalCallback, setDraftModalCallback] = useState(null); // Para la acción de confirmar

  const handleShowMoreActivities = () => {
    setVisibleActivities(prev => prev + 1);
  };

  const handleShowMorePrevisiones = () => {
    setVisiblePrevisiones(prev => prev + 1);
  };
  const handlePrevisionChange = (actividad, value) => {
    setFormData((prev) => ({
      ...prev,
      previsionesActividades: {
        ...prev.previsionesActividades,
        [actividad]: value,
      }
    }));
  };


  const fileInputsRefs = useRef([]);
  const [geolocalizacion, setGeolocalizacion] = useState(null);

  const [loteOptions, setLoteOptions] = useState([]);
  const [selectedLoteOption, setSelectedLoteOption] = useState("");


  const [filters, setFilters] = useState({
    sector: "",
    subSector: "",
    parte: "",
    elemento: "",
    nombre: ""
  });

  const [uniqueValues, setUniqueValues] = useState({
    sector: [],
    subSector: [],
    parte: [],
    elemento: [],
    nombre: [],
  });


  const [modalSend, setModalSend] = useState(false)
  const [messageModalSend, setMessageModalSend] = useState('')
  const [ppiDetails, setPpiDetails] = useState(null);
  const [selectedSubactivities, setSelectedSubactivities] = useState({});
  const [stats, setStats] = useState({ totalSi: 0, totalNo: 0, totalActividades: 0, porcentajeApto: 0 });
  const [activityObservations, setActivityObservations] = useState({});
  const [errorMessages, setErrorMessages] = useState([]);
  const [observacionesImagenes, setObservacionesImagenes] = useState({});
  const [firma, setFirma] = useState(null);
  const [formType, setFormType] = useState('visita');
  const [selectedActivities, setSelectedActivities] = useState({});

  const handleVisitaClick = () => {
    setFormType('visita');
    localStorage.setItem('formType', formType)
  };

  const handleActaReunionClick = () => {
    setFormType('acta');
    localStorage.setItem('formType', formType)
  };



  const handleObservationChange = (actividadIndex, value) => {
    setActivityObservations((prev) => ({
      ...prev,
      [actividadIndex]: value,
    }));
  };


  const handleAddEmpresa = () => {
    if (formData.mediosDisponibles.length < 9) {
      setFormData((prev) => ({
        ...prev,
        mediosDisponibles: [...prev.mediosDisponibles, { nombreEmpresa: "", numeroTrabajadores: "", maquinaria: "" }]
      }));
    }
  };
  const handleRemoveEmpresa = (index) => {
    setFormData((prev) => ({
      ...prev,
      mediosDisponibles: prev.mediosDisponibles.filter((_, i) => i !== index)
    }));
  };

  const handleMediosChange = (index, field, value) => {
    setFormData((prev) => {
      const updatedMedios = [...prev.mediosDisponibles];
      updatedMedios[index][field] = value;
      return { ...prev, mediosDisponibles: updatedMedios };
    });
  };






  useEffect(() => {
    if (ppiDetails && ppiDetails.actividades) {
      const totalActividadesInicial = ppiDetails.actividades.length;
      const totalActividades = totalActividadesInicial - Object.values(selectedActivities).filter(act => act.noAplica).length;
      const totalSi = Object.values(selectedActivities).filter(act => act.seleccionada === true).length;
      const totalNo = Object.values(selectedActivities).filter(act => act.seleccionada === false).length;
      const porcentajeApto = totalActividades > 0 ? Math.round((totalSi / totalActividades) * 100) : 0;

      setStats({ totalSi, totalNo, totalActividades, porcentajeApto, totalActividadesInicial });
    }
  }, [selectedActivities, ppiDetails]);



  useEffect(() => {
    if (lotes.length > 0) {
      setUniqueValues({
        sector: [...new Set(lotes
          .filter((l) =>
            (filters.subSector === "" || l.subSectorNombre === filters.subSector) &&
            (filters.parte === "" || l.parteNombre === filters.parte) &&
            (filters.elemento === "" || l.elementoNombre === filters.elemento) &&
            (filters.nombre === "" || l.nombre === filters.nombre)
          )
          .map((l) => l.sectorNombre))],
        subSector: [...new Set(lotes
          .filter((l) =>
            (filters.sector === "" || l.sectorNombre === filters.sector) &&
            (filters.parte === "" || l.parteNombre === filters.parte) &&
            (filters.elemento === "" || l.elementoNombre === filters.elemento) &&
            (filters.nombre === "" || l.nombre === filters.nombre)
          )
          .map((l) => l.subSectorNombre))],
        parte: [...new Set(lotes
          .filter((l) =>
            (filters.sector === "" || l.sectorNombre === filters.sector) &&
            (filters.subSector === "" || l.subSectorNombre === filters.subSector) &&
            (filters.parte === "" || l.parteNombre === filters.parte) &&
            (filters.nombre === "" || l.nombre === filters.nombre)
          )
          .map((l) => l.parteNombre))],
        elemento: [...new Set(lotes
          .filter((l) =>
            (filters.sector === "" || l.sectorNombre === filters.sector) &&
            (filters.subSector === "" || l.subSectorNombre === filters.subSector) &&
            (filters.parte === "" || l.parteNombre === filters.parte) &&
            (filters.nombre === "" || l.nombre === filters.nombre)
          )
          .map((l) => l.elementoNombre))],
        nombre: [...new Set(lotes
          .filter((l) =>
            (filters.sector === "" || l.sectorNombre === filters.sector) &&
            (filters.subSector === "" || l.subSectorNombre === filters.subSector) &&
            (filters.parte === "" || l.parteNombre === filters.parte) &&
            (filters.elemento === "" || l.elementoNombre === filters.elemento)
          )
          .map((l) => l.nombre))],
      });
    }
  }, [filters, lotes]);


  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeolocalizacion({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => console.error("Error al obtener la geolocalización:", error)
    );
  }, []);


  const fetchLotes = async () => {
    try {

      if (!selectedProjectId) {
        console.error("No se encontró selectedProjectId");
        return;
      }

      // Referencia a la colección "lotes"
      const lotesCollection = collection(db, "lotes");

      // Aplicar filtro para que solo se obtengan los lotes del proyecto seleccionado
      const queryRef = query(lotesCollection, where("idProyecto", "==", selectedProjectId));

      // Obtener los documentos
      const lotesSnapshot = await getDocs(queryRef);

      // Formatear los datos
      const lotesData = lotesSnapshot.docs.map((doc) => ({
        loteId: doc.id, // Renombramos a loteId
        ...doc.data(),
      }));

      // Actualizar el estado con los lotes obtenidos
      setLotes(lotesData);


    } catch (error) {
      console.error("Error al cargar los lotes:", error);
    } finally {
      setLoading(false); // Marcar que la carga ha terminado
    }
  };


  useEffect(() => {
    fetchLotes();
  }, []);


  useEffect(() => {
    if (modalSend) {
      const timer = setTimeout(() => {
        setModalSend(false);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [modalSend]);

  const fetchPpiDetails = async (ppiId) => {
    try {
      if (!ppiId) {
        console.error("No se encontró un ppiId válido.");
        return;
      }


      const ppiDocRef = doc(db, "ppis", ppiId);
      const ppiDocSnap = await getDoc(ppiDocRef);

      if (ppiDocSnap.exists()) {
        const ppiData = ppiDocSnap.data();
        setPpiDetails(ppiData);
      } else {
        console.warn("No se encontró el PPI con el ID:", ppiId);
      }
    } catch (error) {
      console.error("Error al obtener el PPI:", error);
    }
  };

  // Función para inicializar el estado del formulario a valores por defecto
  const initializeFormState = () => {
    setFormData({
      observaciones: "",
      observacionesActividad: "",
      observacionesLocalizacion: "",
      fechaHora: "",
      imagenes: [],
      mediosDisponibles: [{ nombreEmpresa: "", numeroTrabajadores: "", maquinaria: "" }],
      observacionesActividades: { actividad1: "", actividad2: "", actividad3: "", actividad4: "", actividad5: "", actividad6: "" },
      previsionesActividades: { actividad1: "", actividad2: "", actividad3: "", actividad4: "", actividad5: "", actividad6: "" },
    });
    setVisiblePrevisiones(1);
    setVisibleActivities(1);
    setSelectedActivities({});
    setSelectedSubactivities({});
    setActivityObservations({});
    setImageUploadStatus({});
    setImagePreviews({});
    setImageErrors({});
    fileInputsRefs.current.forEach((input) => {
      if (input) input.value = null;
    });
    setErrorMessages([]); // Limpiar mensajes de error
    setMessageModalSend(''); // Limpiar mensaje del modal de envío
  };

  // Función auxiliar para finalizar la apertura del modal principal
  const finalizeOpenModal = (lote) => {
    setIsModalOpen(true);

    // Asignar fecha y hora local al abrir el modal
    setFormData((prev) => ({
      ...prev,
      fechaHora: getLocalDateTimeString(),
    }));

    const valueLote = lote.nombre;
    const separators = /[,|\-\/]+/; // Regex corregida para incluir espacios

    if (separators.test(valueLote)) {
      const optionsValueLote = valueLote.split(separators).map(option => option.trim()).filter(option => option !== ""); // Filtrar cadenas vacías
      setLoteOptions(optionsValueLote);
    } else {
      setLoteOptions([valueLote]);
    }
  };

  const handleOpenModal = async (lote) => {
    fetchPpiDetails(lote.ppiId);
    setSelectedLote(lote);

    try {
      const savedDraft = await get(`parteObraDraft_${lote.loteId}`);

      if (savedDraft) {
        console.log('Cargando borrador con estructura:', {
          formData: savedDraft.formData,
          imagenes: savedDraft.formData.imagenes,
          imagePreviews: savedDraft.imagePreviews,
          imageUploadStatus: savedDraft.imageUploadStatus,
          imageErrors: savedDraft.imageErrors
        });

        setDraftModalContent("Se encontró un borrador guardado para este lote. ¿Deseas cargarlo?");
        setIsDraftModalOpen(true);
        setDraftModalType('confirm');
        setDraftModalCallback(() => async (loadDraft) => {
          if (loadDraft) {
            try {
              // Cargar estados básicos
              setFormData(savedDraft.formData);
              setSelectedActivities(savedDraft.selectedActivities);
              setSelectedSubactivities(savedDraft.selectedSubactivities);
              setActivityObservations(savedDraft.activityObservations);
              setObservacionesImagenes(savedDraft.observacionesImagenes);
              setVisibleActivities(savedDraft.visibleActivities);
              setVisiblePrevisiones(savedDraft.visiblePrevisiones);

              // Cargar estados de imágenes
              setImagePreviews(savedDraft.imagePreviews || {});
              setImageUploadStatus(savedDraft.imageUploadStatus || {});
              setImageErrors(savedDraft.imageErrors || {});

              // Convertir las imágenes base64 a File objects
              const imagenesFiles = await Promise.all(
                savedDraft.formData.imagenes.map(async (imgData, index) => {
                  if (imgData && imgData.base64) {
                    const response = await fetch(imgData.base64);
                    const blob = await response.blob();
                    return new File([blob], imgData.metadata.name, {
                      type: imgData.metadata.type,
                      lastModified: imgData.metadata.lastModified
                    });
                  }
                  return null;
                })
              );

              // Actualizar formData con los File objects
              setFormData(prev => ({
                ...prev,
                imagenes: imagenesFiles
              }));

              finalizeOpenModal(lote);
            } catch (error) {
              console.error("Error al cargar borrador:", error);
              alert("Error al cargar borrador. Se iniciará un formulario nuevo.");
              initializeFormState();
              finalizeOpenModal(lote);
            }
          } else {
            await del(`parteObraDraft_${lote.loteId}`);
            initializeFormState();
            finalizeOpenModal(lote);
          }
        });
      } else {
        initializeFormState();
        // Inicializar selectedActivities con todas las actividades en 'No Aplica' si hay ppiDetails
        if (lote.ppiId) {
          const ppiDocRef = doc(db, "ppis", lote.ppiId);
          const ppiDocSnap = await getDoc(ppiDocRef);
          if (ppiDocSnap.exists()) {
            const ppiData = ppiDocSnap.data();
            if (ppiData && ppiData.actividades) {
              const initialSelected = {};
              ppiData.actividades.forEach((actividad, idx) => {
                initialSelected[idx] = {
                  nombre: actividad.actividad,
                  seleccionada: false,
                  noAplica: true,
                  subactividades: Array.isArray(actividad.subactividades)
                    ? actividad.subactividades.map(sub => ({
                        nombre: sub.nombre,
                        seleccionada: false,
                      }))
                    : [],
                };
              });
              setSelectedActivities(initialSelected);
            }
          }
          finalizeOpenModal(lote);
        }
      }
    } catch (error) {
      console.error("Error al verificar borrador:", error);
      initializeFormState();
      finalizeOpenModal(lote);
    }
  };


  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalSend(false);
    setSelectedLote(null);
    setSelectedLoteOption("");
    initializeFormState(); // Usar la nueva función para resetear estados
  };


  const handleFileChange = async (e, index) => {
    const file = e.target.files[0];

    if (file) {
      try {
        // Actualizar estado de carga
        setImageUploadStatus(prev => ({
          ...prev,
          [index]: { status: 'compressing', progress: 0 }
        }));

        // Crear preview
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreviews(prev => ({
            ...prev,
            [index]: reader.result
          }));
        };
        reader.readAsDataURL(file);

        // Comprimir imagen
        const compressedFile = await compressImage(file);

        // Actualizar estado de compresión completada
        setImageUploadStatus(prev => ({
          ...prev,
          [index]: { status: 'compressed', progress: 100 }
        }));

        // Actualizar formData
        setFormData((prev) => {
          const updatedImages = [...prev.imagenes];
          updatedImages[index] = compressedFile;
          return { ...prev, imagenes: updatedImages };
        });

        // Limpiar error si existía
        setImageErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[index];
          return newErrors;
        });

      } catch (error) {
        console.error("Error al procesar la imagen:", error);
        setImageErrors(prev => ({
          ...prev,
          [index]: "Error al procesar la imagen. Intente nuevamente."
        }));
        setImageUploadStatus(prev => ({
          ...prev,
          [index]: { status: 'error', progress: 0 }
        }));
      }
    } else {
      // Limpiar estados si se elimina la imagen
      setImageUploadStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[index];
        return newStatus;
      });
      setImagePreviews(prev => {
        const newPreviews = { ...prev };
        delete newPreviews[index];
        return newPreviews;
      });
      setImageErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        return newErrors;
      });

      setFormData((prev) => {
        const updatedImages = [...prev.imagenes];
        updatedImages.splice(index, 1);
        return { ...prev, imagenes: updatedImages };
      });
    }
  };



  const uploadImageWithMetadata = async (file, index) => {
    if (!geolocalizacion) {
      throw new Error("Geolocalización no disponible.");
    }

    const loteNombre = selectedLote?.nombre || "SinNombreLote";

    const fechaActual = new Date().toISOString().split("T")[0];

    const fileName = `${selectedProjectName}_${loteNombre}_${fechaActual}_${uniqueId}_${index}.jpg`
      .replace(/[/\\?%*:|"<>]/g, "");

    const storagePath = `imagenes/${selectedProjectName}/${loteNombre}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    const metadata = {
      contentType: file.type,
      customMetadata: {
        latitude: geolocalizacion.lat.toString(),
        longitude: geolocalizacion.lng.toString(),
        proyecto: selectedProjectName,
        lote: loteNombre,
        fecha: fechaActual,
        observacion: observacionesImagenes[index] || ""
      },
    };

    await uploadBytes(storageRef, file, metadata);
    return await getDownloadURL(storageRef);
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    let errors = [];

    if (!formData.fechaHora) {
      errors.push("⚠️ Debes seleccionar una fecha y hora.");
    }

    const actividadesKeys = Object.keys(selectedActivities);

    if (actividadesKeys.length !== ppiDetails.actividades.length) {
      errors.push("⚠️ Debes evaluar todas las actividades (seleccionar 'Aplica' o 'No Aplica').");
    } else {
      actividadesKeys.forEach((index) => {
        const actividad = selectedActivities[index];

        if (!actividad.seleccionada && !actividad.noAplica) {
          errors.push(`⚠️ La actividad "${actividad.nombre}" no tiene selección (Aplica o No Aplica).`);
        }
      });
    }

    if (errors.length > 0) {
      setErrorMessages(errors);
      setModalSend(true);
      return;
    }

    try {
      const imageUrls = await Promise.all(
        formData.imagenes
          .filter((image) => image)
          .map(async (image, index) => await uploadImageWithMetadata(image, index, observacionesImagenes[index] || ""))
      );


      const actividadesConObservaciones = Object.keys(selectedActivities).map((index) => ({
        ...selectedActivities[index],
        observacion: activityObservations[index] || "",
      }));


      const registro = {
        ...selectedLote,
        ...formData,
        actividades: actividadesConObservaciones,

        imagenes: imageUrls,
        fechaHora: new Date(formData.fechaHora).toISOString(),
        actividad: selectedLote.nombre,
        resumenPuntosControl: {
          totalSi: stats.totalSi,
          totalActividades: stats.totalActividades,
          porcentajeApto: stats.porcentajeApto
        },
        formType: formType
      };


      if (formType === "visita") {
        await addDoc(collection(db, "registrosParteDeObra"), registro);
      }

      if (formType === "acta") {
        await addDoc(collection(db, "registrosActasDeReunion"), registro);
      }

      // Eliminar el borrador de IndexedDB después de enviar exitosamente
      await del(`parteObraDraft_${selectedLote.loteId}`);

      setFormData({
        observaciones: "",
        observacionesActividad: "",
        observacionesLocalizacion: "",
        fechaHora: "",
        imagenes: [],
        mediosDisponibles: [{ nombreEmpresa: "", numeroTrabajadores: "", maquinaria: "" }],
        previsionesActividades: { actividad1: "", actividad2: "", actividad3: "", actividad4: "", actividad5: "", actividad6: "" },
        observacionesActividades: { actividad1: "", actividad2: "", actividad3: "", actividad4: "", actividad5: "", actividad6: "" },
      });
      setVisiblePrevisiones(1);
      setVisibleActivities(1);
      setSelectedActivities({});
      setSelectedSubactivities({});
      setActivityObservations({});

      fileInputsRefs.current.forEach((input) => {
        if (input) input.value = null;
      });

      setIsModalOpen(false);
      setModalSend(true);
      setMessageModalSend("Registro enviado");
      setErrorMessages([]);

    } catch (error) {
      console.error("Error al guardar el registro:", error);
      setErrorMessages(["❌ Error al guardar. Revisa los datos antes de enviar."]);
      setModalSend(true);
    }
  };



  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-t-4 border-gray-300 rounded-full animate-spin"></div>
          <p className="mt-4 text-gray-700 font-semibold text-lg">Cargando datos...</p>
        </div>
      </div>
    );
  }


  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 0.4,
      maxWidthOrHeight: 2048,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      return file;
    }
  };


  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prevFilters) => ({ ...prevFilters, [name]: value }));
  };

  const filteredLotes = lotes.filter(
    (l) =>
      (filters.sector === "" || l.sectorNombre === filters.sector) &&
      (filters.subSector === "" || l.subSectorNombre === filters.subSector) &&
      (filters.parte === "" || l.parteNombre === filters.parte) &&
      (filters.elemento === "" || l.elementoNombre === filters.elemento) &&
      (filters.nombre === "" || l.nombre === filters.nombre)
  );

  const handleGoBack = () => {
    navigate('/');
  };

  const labelMapping = {
    sector: "Grupo activos",
    subSector: "Activo",
    parte: "Inventario vial",
    elemento: "Componente",
    nombre: "Área inspección",
  };


  const handleSubactivityChange = (actividadIndex, subIndex) => {
    setSelectedActivities((prev) => {
      const newSelected = { ...prev };
      if (!newSelected[actividadIndex]) return prev;
      // Cambiar el estado del subpunto
      newSelected[actividadIndex].subactividades[subIndex].seleccionada =
        !newSelected[actividadIndex].subactividades[subIndex].seleccionada;
      // Si hay al menos un subpunto seleccionado, 'Aplica' se marca
      const anyChecked = newSelected[actividadIndex].subactividades.some((sub) => sub.seleccionada);
      newSelected[actividadIndex].seleccionada = anyChecked;
      // Si no hay ninguno, 'Aplica' se desmarca
      if (!anyChecked) {
        newSelected[actividadIndex].seleccionada = false;
      }
      // Si se marca algún subpunto, 'No Aplica' se desmarca
      if (anyChecked) {
        newSelected[actividadIndex].noAplica = false;
      }
      return newSelected;
    });
  };


  const handleActivityChange = (actividadIndex, actividadNombre, subactividades, value) => {
    setSelectedActivities((prev) => {
      const newSelected = { ...prev };
      if (!newSelected[actividadIndex]) {
        newSelected[actividadIndex] = {
          nombre: actividadNombre,
          seleccionada: value === "si",
          noAplica: false, // Siempre desactivar 'No Aplica' al seleccionar 'Aplica'
          subactividades: subactividades.map((sub) => ({
            nombre: sub.nombre,
            seleccionada: value === "si",
          })),
        };
      } else {
        newSelected[actividadIndex].seleccionada = value === "si";
        newSelected[actividadIndex].subactividades = newSelected[actividadIndex].subactividades.map((sub) => ({
          ...sub,
          seleccionada: value === "si",
        }));
        newSelected[actividadIndex].noAplica = false; // Siempre desactivar 'No Aplica' al seleccionar 'Aplica'
      }
      return newSelected;
    });
  };



  const handleNoAplicaChange = (actividadIndex, actividadNombre) => {
    setSelectedActivities((prev) => {
      const newSelected = { ...prev };

      if (!newSelected[actividadIndex]) {
        newSelected[actividadIndex] = {
          nombre: actividadNombre,
          seleccionada: false,
          noAplica: true,
          subactividades: [],
        };
      } else {
        newSelected[actividadIndex].noAplica = !newSelected[actividadIndex].noAplica;

        if (newSelected[actividadIndex].noAplica) {
          newSelected[actividadIndex].seleccionada = false;
          newSelected[actividadIndex].subactividades = newSelected[actividadIndex].subactividades.map((sub) => ({
            ...sub,
            seleccionada: false,
          }));
          setActivityObservations((prev) => ({
            ...prev,
            [actividadIndex]: "",
          }));
        }
      }

      return newSelected;
    });
  };




  const getBackgroundColor = () => {
    if (stats.porcentajeApto === 100) return "bg-green-200 text-gray-500";
    if (stats.porcentajeApto >= 50) return "bg-amber-200 text-gray-500";
    return "bg-red-200 text-gray-500";
  };


  const handleActivityObservationChange = (actividad, value) => {
    setFormData((prev) => ({
      ...prev,
      observacionesActividades: {
        ...prev.observacionesActividades,
        [actividad]: value,
      }
    }));
  };

  const toggleActivityVisibility = () => {
    setActivityVisibility((prev) => !prev);
  };

  // Función para guardar borrador en IndexedDB
  const saveDraft = async () => {
    if (!selectedLote) {
      console.warn("No hay lote seleccionado para guardar borrador.");
      return;
    }

    // Convertir las imágenes a base64
    const imagenesBase64 = await Promise.all(
      formData.imagenes.map(async (file, index) => {
        if (file) {
          return {
            base64: imagePreviews[index],
            metadata: {
              name: file.name,
              type: file.type,
              size: file.size,
              lastModified: file.lastModified
            }
          };
        }
        return null;
      })
    );

    const formState = {
      formData: {
        ...formData,
        imagenes: imagenesBase64
      },
      selectedActivities,
      selectedSubactivities,
      activityObservations,
      observacionesImagenes,
      visibleActivities,
      visiblePrevisiones,
      imagePreviews,
      imageUploadStatus,
      imageErrors
    };

    console.log('Guardando borrador con estructura:', {
      formData: formState.formData,
      imagenes: formState.formData.imagenes,
      imagePreviews: formState.imagePreviews,
      imageUploadStatus: formState.imageUploadStatus,
      imageErrors: formState.imageErrors
    });

    try {
      await set(`parteObraDraft_${selectedLote.loteId}`, formState);
      setDraftModalContent("Borrador guardado exitosamente.");
      setDraftModalType('info');
      setIsDraftModalOpen(true);
    } catch (error) {
      console.error("Error al guardar borrador en IndexedDB:", error);
      setDraftModalContent("Error al guardar borrador.");
      setDraftModalType('info');
      setIsDraftModalOpen(true);
    }
  };

  return (
    <div className="container mx-auto xl:px-14 py-2 text-gray-500 mb-10 min-h-screen">
      <div className="flex md:flex-row flex-col gap-2 items-center justify-between px-5 py-3 text-md">

        <div className="flex gap-2 items-center">

          <GoHomeFill className="hidden md:block" style={{ width: 15, height: 15, fill: "#d97706" }} />
          <Link to="#" className="hidden md:block font-medium text-gray-600">
            Home
          </Link>
          <FaArrowRight className="hidden md:block" style={{ width: 12, height: 12, fill: "#d97706" }} />
          <h1 className="hidden md:block font-medium">Ver registros</h1>
          <FaArrowRight className="hidden md:block" style={{ width: 12, height: 12, fill: "#d97706" }} />


          <h1 className="font-medium text-amber-600 px-2 py-1 rounded-lg">
            {selectedProjectName}
          </h1>
        </div>


        <div className="flex items-center">
          <button className="text-amber-600 text-3xl" onClick={handleGoBack}>
            <IoArrowBackCircle />
          </button>
        </div>
      </div>

      <div className="w-full border-b-2"></div>


      <div className="pt-6 pb-8 px-4">
        <div className="grid grid-cols-1 gap-4 text-xs items-end">
          {/* Filtros de trazabilidad */}
          <div className="w-full flex flex-wrap gap-4 mb-4 px-4">
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.sector}
              onChange={e => setFilters(prev => ({ ...prev, sector: e.target.value }))}
            >
              <option value="">Todos los sectores</option>
              {uniqueValues.sector.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.subSector}
              onChange={e => setFilters(prev => ({ ...prev, subSector: e.target.value }))}
            >
              <option value="">Todos los subsectores</option>
              {uniqueValues.subSector.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.parte}
              onChange={e => setFilters(prev => ({ ...prev, parte: e.target.value }))}
            >
              <option value="">Todas las partes</option>
              {uniqueValues.parte.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.elemento}
              onChange={e => setFilters(prev => ({ ...prev, elemento: e.target.value }))}
            >
              <option value="">Todos los elementos</option>
              {uniqueValues.elemento.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              value={filters.nombre}
              onChange={e => setFilters(prev => ({ ...prev, nombre: e.target.value }))}
            >
              <option value="">Todos los lotes</option>
              {uniqueValues.nombre.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>
        </div>
      </div>




      <div className="px-4">
        {/* Contenedor general con scroll horizontal para pantallas grandes */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full bg-white shadow rounded-lg overflow-hidden">
            <thead className="border-gray-200 bg-sky-600 text-white">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold">Trazabilidad del Lote</th>
                <th className="text-left px-6 py-3 text-sm font-semibold">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {[...filteredLotes]
                .sort((a, b) => {
                  // Ordenar por sector, subsector, parte, elemento, nombre
                  const fields = ['sectorNombre', 'subSectorNombre', 'parteNombre', 'elementoNombre', 'nombre'];
                  for (let field of fields) {
                    const valA = (a[field] || '').toLowerCase();
                    const valB = (b[field] || '').toLowerCase();
                    if (valA < valB) return -1;
                    if (valA > valB) return 1;
                  }
                  return 0;
                })
                .map((lote) => (
                  <tr
                    key={lote.loteId}
                    className="hover:bg-gray-50 transition duration-150 ease-in-out"
                  >
                    <td className="px-6 py-4 text-sm w-3/4">
                      <div className="flex flex-row flex-wrap gap-2 items-center">
                        {[
                          { label: 'Sector', value: lote.sectorNombre },
                          { label: 'Subsector', value: lote.subSectorNombre },
                          { label: 'Parte', value: lote.parteNombre },
                          { label: 'Elemento', value: lote.elementoNombre },
                          { label: 'Lote', value: lote.nombre },
                        ]
                          .filter(
                            (item) => item.value && !['na', 'n-a', 'n/a'].includes(item.value.trim().toLowerCase())
                          )
                          .map((item, idx, arr) => (
                            <span key={item.label} className="font-medium text-gray-800">
                              {item.value}
                              {idx < arr.length - 1 && <span className="text-gray-400"> - </span>}
                            </span>
                          ))}
                        {lote.ppiNombre && (
                          <span className="font-semibold text-green-700 ml-2">PPI: <span className="text-green-600">{lote.ppiNombre}</span></span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm w-1/4 align-top text-right">
                      <button
                        onClick={() => handleOpenModal(lote)}
                        className="px-4 py-2 bg-gray-500 text-white font-medium rounded-md shadow-sm hover:bg-sky-700 transition duration-150 flex gap-2 items-center justify-end ml-auto"
                      >
                        <IoMdAddCircle /> Nuevo Registro
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

        </div>

        {/* Vista para dispositivos móviles: cards */}
        <div className="block lg:hidden">
          {filteredLotes
            .map((lote) => {
              const trazabilidad = [
                lote.sectorNombre,
                lote.subSectorNombre,
                lote.parteNombre,
                lote.elementoNombre,
                lote.nombre
              ].filter(
                v => v && !['na', 'n-a', 'n/a'].includes(v.trim().toLowerCase())
              ).join(' - ');
              return (
                <div
                  key={lote.loteId}
                  className="bg-gray-100 shadow rounded-lg p-4 mb-4 border border-gray-200"
                >
                  <p className="text-sm text-gray-700 font-medium">
                    {trazabilidad}
                  </p>
                  {lote.ppiNombre && (
                    <p className="text-sm text-green-700 font-semibold mt-1">
                      PPI: <span className="text-green-600">{lote.ppiNombre}</span>
                    </p>
                  )}
                  <button
                    onClick={() => handleOpenModal(lote)}
                    className="mt-4 w-full px-4 py-2 bg-gray-500 text-white font-medium rounded-md shadow-sm hover:bg-sky-700 transition duration-150 flex gap-2 justify-center items-center"
                  >
                    <IoMdAddCircle /> Nuevo Registro
                  </button>
                </div>
              );
            })}
        </div>
      </div>



      {/* Modal para el formulario */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 text-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-11/12 max-w-lg md:max-w-xl lg:max-w-2xl max-h-[90vh] relative overflow-y-auto">
            {/* Botón de cerrar */}
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-gray-500 text-2xl hover:text-gray-800 transition"
              aria-label="Cerrar"
            >
              <IoClose />
            </button>

            {/* Título del modal */}
            <div className="bg-gray-200 rounded-xl p-6 border border-gray-200 text-gray-500">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg">
                  <BsClipboardData className="text-2xl text-gray-500" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Registro de actividades
                  </h2>
                  <p className="text-gray-500 text-sm">Formulario seguridad y salud</p>
                </div>
              </div>
              <div className="bg-white border border-gray-200 p-4 rounded-lg shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="text-amber-500 text-xl">💡</span>
                  <p className="text-sm text-gray-600">
                    Si te encuentras en una zona de baja cobertura o necesitas llenar el formulario en un tiempo largo dispones de la opción guardar borrador para no perder los datos
                  </p>
                </div>
              </div>
            </div>

            <div className="w-full border-b-2 mt-6 mb-6"></div>

            {/* Botón flotante de guardar borrador dentro del modal */}
            <div className="fixed bottom-6 right-6 z-50">
              <button
                type="button"
                onClick={saveDraft}
                className="bg-teal-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2"
              >

                Guardar Borrador
              </button>
            </div>

            {/* Botones de tipos de formulario */}
            <div className="flex gap-4 mb-4">
              <button
                type="button"
                onClick={handleVisitaClick}
                className={`px-4 py-2 rounded-lg ${formType === "visita" ? "bg-amber-600 border text-white font-medium" : "bg-white border text-gray-500"}`}
              >
                Informe de Visita
              </button>
            </div>

            {/* ------------------------------------------------------- Formulario --------------------------------------------------*/}

            {/* Formulario visita*/}

            {formType === "visita" && (
              <div>
                <div>
                  <div>
                    <p className="font-semibold bg-sky-600 text-white rounded-t-lg px-4 py-2">
                      Trabajo seleccionado
                    </p>
                    {selectedLote && (
                      <div className="bg-gray-200 p-2 rounded-b-lg px-4 py-2 font-medium">
                        {/* Trazabilidad */}
                        <span className="text-gray-800">
                          {[
                            selectedLote.sectorNombre,
                            selectedLote.subSectorNombre,
                            selectedLote.parteNombre,
                            selectedLote.elementoNombre,
                            selectedLote.nombre
                          ].filter(
                            v => v && !['na', 'n-a', 'n/a'].includes(v.trim().toLowerCase())
                          ).join(' - ')}
                        </span>
                        {selectedLote.ppiNombre && (
                          <div className="text-green-700 font-semibold mt-1">
                            PPI: <span className="text-green-600">{selectedLote.ppiNombre}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fecha y Hora */}
                  <div>
                    <label className="mt-4 block bg-sky-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Fecha y Hora
                    </label>
                    <input
                      required
                      type="datetime-local"
                      name="fechaHora"
                      value={formData.fechaHora}
                      onChange={e => setFormData(prev => ({ ...prev, fechaHora: e.target.value }))}
                      className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 bg-gray-100"
                    />
                  </div>

                  {/* Observaciones en materia seguridad y salud */}
                  <h3 className="w-full bg-sky-600 text-white font-medium rounded-md px-4 py-2 my-4">1. Observaciones generales</h3>
                  <div>
                    <label className="mt-4 block bg-gray-200 px-4 py-2 rounded-md text-sm font-medium">
                      Observaciones generales
                    </label>
                    <VoiceRecorderInput
                      maxLength={1800}
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={(name, value) => setFormData((prev) => ({ ...prev, [name]: value }))}
                      placeholder="Escribe tus observaciones aquí..."
                    />
                  </div>

                  <h3 className="w-full bg-sky-600 text-white font-medium rounded-md px-4 py-2 my-4">2. Detalles de la inspección</h3>
                  {ppiDetails && (
                    <div>
                      <div className="mt-4 ps-4">
                        {ppiDetails.actividades.map((actividad, actividadIndex) => {
                          const subactividadesValidas = Array.isArray(actividad.subactividades)
                            ? actividad.subactividades.filter((sub) => sub.nombre.trim() !== "")
                            : [];
                          return (
                            <div key={actividadIndex} className="mb-4 border-b pb-3">
                              <div className="">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex gap-2">
                                    <p className="font-semibold text-sky-700">{actividad.numero}-</p>
                                    <p className="font-semibold text-sky-700">{actividad.actividad}</p>
                                  </div>
                                  <div className="flex gap-3 text-xs text-gray-700 font-medium">
                                    <label className={`flex items-center gap-1 px-3 py-1 border rounded-md cursor-pointer
                                      ${selectedActivities[actividadIndex]?.noAplica ? "text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed" :
                                        selectedActivities[actividadIndex]?.seleccionada === true ? "text-gray-800 font-bold bg-gray-300 border-gray-500" : "text-gray-500 border-gray-300"}`}
                                    >
                                      <input
                                      
                                        type="radio"
                                        name={`actividad-${actividadIndex}`}
                                        value="si"
                                        checked={selectedActivities[actividadIndex]?.seleccionada === true}
                                        onChange={() => handleActivityChange(actividadIndex, actividad.actividad, subactividadesValidas, "si")}
                                        className="hidden"
                                      />
                                      ✅ Aplica
                                    </label>
                                    <label className={`flex items-center gap-1 px-3 py-1 border rounded-md cursor-pointer
                                      ${selectedActivities[actividadIndex]?.noAplica ? "text-gray-800 font-bold bg-gray-200 border-gray-500" : "text-gray-500 border-gray-300"}`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={selectedActivities[actividadIndex]?.noAplica || false}
                                        onChange={() => handleNoAplicaChange(actividadIndex, actividad.actividad)}
                                        className="hidden"
                                      />
                                      ⚪ No Aplica
                                    </label>
                                  </div>
                                </div>
                              </div>
                              {subactividadesValidas.length > 0 &&
                                subactividadesValidas.map((sub, subIndex) => (
                                  <div key={subIndex} className="ml-4 flex items-center gap-2 text-xs border-l-4 border-gray-500 pl-2 mt-2">
                                    <input
                                      type="checkbox"
                                      checked={selectedActivities[actividadIndex]?.subactividades[subIndex]?.seleccionada || false}
                                      onChange={() => handleSubactivityChange(actividadIndex, subIndex)}
                                      disabled={selectedActivities[actividadIndex]?.noAplica}
                                      className="form-checkbox h-3 w-3 text-sky-600"
                                    />
                                    <div>
                                      <p className="text-gray-700 font-medium">{sub.numero} - {sub.nombre}</p>
                                      <p className="text-gray-600 italic text-xs">Tipo: {sub.tipo_inspeccion}</p>
                                    </div>
                                  </div>
                                ))}
                              <VoiceRecorderInput
                                name={`observacionesActividad-${actividadIndex}`}
                                value={activityObservations[actividadIndex] || ""}
                                onChange={(name, value) => handleObservationChange(actividadIndex, value)}
                                placeholder="Escribe observaciones aquí..."
                                maxLength={350}
                                disabled={selectedActivities[actividadIndex]?.noAplica}
                                className={selectedActivities[actividadIndex]?.noAplica ? "bg-gray-200 cursor-not-allowed" : ""}
                              />
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  <div className={` font-medium py-2 px-4 rounded-lg flex gap-5 justify-between ${getBackgroundColor()}`}>
                    <span>Resumen total</span><p>{stats.totalSi} puntos de {stats.totalActividades}  ({stats.porcentajeApto}%)</p>
                  </div>
                  <form onSubmit={handleSubmit} className="space-y-6 mt-4">
                    <div className="mt-6">
                      <h3 className="w-full bg-sky-600 text-white font-medium rounded-md px-4 py-2 my-4">3. Reportaje fotográfico de la visita.</h3>
                      <p className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md mb-4 border border-amber-200">
                        Si tienes poca cobertura, guarda el borrador o adjunta las imágenes al final de la inspección
                      </p>
                      {/* Imágenes */}
                      <div className="mb-4 ps-4">
                        <label className="block text-sm font-medium text-gray-700">
                          Registro fotográfico
                          <p className="text-amber-600 text-xs">* Mínimo 1 imagen</p>
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                            <div key={index} className="relative">
                              <PhotoUpload
                                index={index}
                                onFileSelected={(file, index) => handleFileChange({ target: { files: [file] } }, index)}
                              />
                              {imagePreviews[index] && (
                                <div className="mt-2 relative">
                                  <img
                                    src={imagePreviews[index]}
                                    alt={`Preview ${index}`}
                                    className="w-full h-48 object-contain rounded-lg border border-gray-200"
                                  />
                                  {imageUploadStatus[index]?.status === 'compressing' && (
                                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                                      <div className="text-white text-sm">Comprimiendo...</div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {imageErrors[index] && (
                                <div className="mt-2 text-red-500 text-sm">
                                  {imageErrors[index]}
                                </div>
                              )}
                              <textarea
                                maxLength={600}
                                placeholder="Observaciones de la imagen..."
                                value={observacionesImagenes[index] || ""}
                                onChange={(e) => setObservacionesImagenes((prev) => ({
                                  ...prev,
                                  [index]: e.target.value
                                }))}
                                className="mt-2 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm text-sm focus:outline-none focus:ring-sky-500 focus:border-sky-500 resize-none"
                              ></textarea>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="w-full pb-8 border-b-4"></div>
                    {/* Botones */}
                    <div className="flex justify-between items-center gap-4 mt-12">
                      <button
                        type="submit"
                        className="w-2/3 py-2 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 transition mt-4"
                        onClick={handleSubmit}
                      >
                        Enviar
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="w-1/3 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition mt-4"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {formType === "acta" && (
              <div>
                <div>
                  <div>
                    <p className="font-semibold bg-sky-600 text-white rounded-t-lg px-4 py-2">
                      Trabajo seleccionado
                    </p>
                    {selectedLote && (
                      <div className="bg-gray-200 p-2 rounded-b-lg px-4 py-2 font-medium">
                        {/* Trazabilidad */}
                        <span className="text-gray-800">
                          {[
                            selectedLote.sectorNombre,
                            selectedLote.subSectorNombre,
                            selectedLote.parteNombre,
                            selectedLote.elementoNombre,
                            selectedLote.nombre
                          ].filter(
                            v => v && !['na', 'n-a', 'n/a'].includes(v.trim().toLowerCase())
                          ).join(' - ')}
                        </span>
                        {selectedLote.ppiNombre && (
                          <div className="text-green-700 font-semibold mt-1">
                            PPI: <span className="text-green-600">{selectedLote.ppiNombre}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Fecha y Hora */}
                  <div>
                    <label className="mt-4 block bg-sky-600 text-white px-4 py-2 rounded-md text-sm font-medium">
                      Fecha y Hora
                    </label>
                    <input
                      required
                      type="datetime-local"
                      name="fechaHora"
                      value={formData.fechaHora}
                      onChange={e => setFormData(prev => ({ ...prev, fechaHora: e.target.value }))}
                      className="mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-sky-500 focus:border-sky-500 bg-gray-100"
                    />
                  </div>
                </div>

                <h3 className="w-full bg-sky-600 text-white font-medium rounded-md px-4 py-2 my-4">4. Detalles de la inspección</h3>

                {ppiDetails && (
                  <div>


                    {/* Contenedor con scroll vertical */}
                    <div className="mt-4 ps-4">
                      {ppiDetails.actividades.map((actividad, actividadIndex) => {

                        const subactividadesValidas = Array.isArray(actividad.subactividades)
                          ? actividad.subactividades.filter((sub) => sub.nombre.trim() !== "")
                          : [];

                        return (
                          <div key={actividadIndex} className="mb-4 border-b pb-3">
                            {/* Checkbox y título de la actividad */}
                            <div className="">
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex gap-2">
                                  <p className="font-semibold text-sky-700">{actividad.numero}-</p>
                                  <p className="font-semibold text-sky-700">{actividad.actividad}</p>
                                </div>


                                {/* Estado de la actividad (Cumple, No cumple, No aplica) */}
                                <div className="flex gap-3 text-xs text-gray-700 font-medium">

                                  {/* ✅ Checkbox para marcar Sí (Cumple) */}
                                  <label className={`flex items-center gap-1 px-3 py-1 border rounded-md cursor-pointer
    ${selectedActivities[actividadIndex]?.noAplica ? "text-gray-400 bg-gray-100 border-gray-300 cursor-not-allowed" :
                                      selectedActivities[actividadIndex]?.seleccionada === true ? "text-gray-800 font-bold bg-gray-300 border-gray-500" : "text-gray-500 border-gray-300"}`}
                                  >
                                    <input
                                      maxLength={300}
                                      type="radio"
                                      name={`actividad-${actividadIndex}`}
                                      value="si"
                                      checked={selectedActivities[actividadIndex]?.seleccionada === true}
                                      onChange={() => handleActivityChange(actividadIndex, actividad.actividad, subactividadesValidas, "si")}
                                      className="hidden"
                                    />
                                    ✅ Aplica
                                  </label>



                                  {/* ⚪ Checkbox "No Aplica" */}
                                  <label className={`flex items-center gap-1 px-3 py-1 border rounded-md cursor-pointer
    ${selectedActivities[actividadIndex]?.noAplica ? "text-gray-800 font-bold bg-gray-200 border-gray-500" : "text-gray-500 border-gray-300"}`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={selectedActivities[actividadIndex]?.noAplica || false}
                                      onChange={() => handleNoAplicaChange(actividadIndex, actividad.actividad)}
                                      className="hidden"
                                    />
                                    ⚪ No Aplica
                                  </label>

                                </div>


                              </div>






                            </div>

                            {/* Mostrar subactividades solo si existen y tienen nombre válido */}
                            {subactividadesValidas.length > 0 &&
                              subactividadesValidas.map((sub, subIndex) => (
                                <div key={subIndex} className="ml-4 flex items-center gap-2 text-xs border-l-4 border-gray-500 pl-2 mt-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedActivities[actividadIndex]?.subactividades[subIndex]?.seleccionada || false}
                                    onChange={() => handleSubactivityChange(actividadIndex, subIndex)}
                                    disabled={selectedActivities[actividadIndex]?.noAplica}
                                    className="form-checkbox h-3 w-3 text-sky-600"
                                  />
                                  <div>
                                    <p className="text-gray-700 font-medium">{sub.numero} - {sub.nombre}</p>
                                    <p className="text-gray-600 italic text-xs">Tipo: {sub.tipo_inspeccion}</p>
                                  </div>
                                </div>
                              ))}

                            {/* Observaciones de la actividad */}


                            {/* Observaciones de la actividad */}
                            <VoiceRecorderInput
                              name={`observacionesActividad-${actividadIndex}`}
                              value={activityObservations[actividadIndex] || ""}
                              onChange={(name, value) => handleObservationChange(actividadIndex, value)}
                              placeholder="Escribe observaciones aquí..."
                              maxLength={500}
                              disabled={selectedActivities[actividadIndex]?.noAplica} // 
                              className={selectedActivities[actividadIndex]?.noAplica ? "bg-gray-200 cursor-not-allowed" : ""}
                            />


                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}


                {/* Estadísticas de apto debajo de los checkboxes */}
                <div className={` font-medium py-2 px-4 rounded-lg flex gap-5 justify-between ${getBackgroundColor()}`}>
                  <span>Resumen total</span><p>{stats.totalSi} puntos de {stats.totalActividades}  ({stats.porcentajeApto}%)</p>
                </div>






                {/* Formulario */}
                <form onSubmit={handleSubmit} className="space-y-6 mt-4">


                  <div className="w-full p-2 border-b-4"></div>
                  {/* Botones */}
                  <div className="flex justify-between items-center gap-4 mt-12">
                    <button
                      type="submit"
                      className="w-2/3 py-2 bg-amber-600 text-white font-semibold rounded-lg shadow-md hover:bg-amber-700 transition mt-4"
                      onClick={handleSubmit}
                    >
                      Enviar
                    </button>
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="w-1/3 py-2 bg-gray-500 text-white font-semibold rounded-lg shadow-md hover:bg-gray-600 transition mt-4"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}




          </div>
        </div>
      )}

      {
        modalSend && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-md flex items-center justify-center z-50">
            <div className={`bg-white p-8 rounded-2xl shadow-xl relative flex flex-col justify-center items-center gap-4 w-80 
      ${errorMessages.length > 0 ? 'border-red-500' : 'border-teal-500'}`}>

              {/* ❌ Botón de cerrar */}
              <button
                onClick={() => setModalSend(false)}
                className="absolute top-4 right-4 text-gray-500 text-2xl hover:text-gray-800 transition"
                aria-label="Cerrar"
              >
                <IoClose />
              </button>

              {/* 🚨 Modal de Error */}
              {errorMessages.length > 0 ? (
                <>
                  <MdOutlineError className="text-red-500 text-4xl" />
                  <p className="text-lg font-medium text-red-600">Error en el formulario</p>
                  <ul className="text-sm text-gray-600 list-disc px-6 space-y-1">
                    {errorMessages.map((msg, index) => (
                      <li key={index}>{msg}</li>
                    ))}
                  </ul>
                </>
              ) : (
                /* ✅ Modal de Éxito */
                <>
                  <FaCheck className="text-teal-500 text-4xl" />
                  <p className="text-lg font-medium text-gray-700">{messageModalSend}</p>
                </>
              )}
            </div>
          </div>
        )
      }


      {/* Modal del borrador (personalizado, sin iconos) */}
      {isDraftModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm flex items-center justify-center z-[60]"> {/* z-[60] asegura que esté por encima de todo */}
          <div className="bg-white p-8 rounded-xl shadow-2xl relative flex flex-col items-center gap-6 w-11/12 max-w-sm text-gray-700 border border-gray-200">

            {/* Contenido del modal */}
            {/* Agregar checkmark si es modal de info (éxito) */}
            {draftModalType === 'info' && (
              <div className="text-teal-500 text-4xl mb-2">✅</div> // Checkmark de Unicode
            )}
            <p className="text-lg font-medium text-center">{draftModalContent}</p>

            {/* Botones de acción */}
            {draftModalType === 'confirm' && (
              <div className="flex gap-4 w-full">
                <button
                  onClick={() => {
                    if (draftModalCallback) draftModalCallback(true); // Ejecuta callback con true (Aceptar)
                    setIsDraftModalOpen(false); // Cierra el modal
                    setDraftModalCallback(null); // Limpiar callback
                  }}
                  className="flex-1 px-4 py-2 bg-amber-600 text-white font-semibold rounded-md shadow-md hover:bg-amber-700 transition"
                >
                  Aceptar
                </button>
                <button
                  onClick={() => {
                    if (draftModalCallback) draftModalCallback(false); // Ejecuta callback con false (Cancelar)
                    setIsDraftModalOpen(false); // Cierra el modal
                    setDraftModalCallback(null); // Limpiar callback
                  }}
                  className="flex-1 px-4 py-2 bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 transition"
                >
                  Nuevo
                </button>
              </div>
            )}

            {/* Botón de cerrar (solo para modals de tipo info) */}
            {draftModalType === 'info' && (
              <button
                onClick={() => setIsDraftModalOpen(false)} // Simplemente cierra el modal
                className="px-4 py-2 w-full bg-gray-500 text-white font-semibold rounded-md shadow-md hover:bg-gray-600 transition"
              >
                Cerrar
              </button>
            )}

          </div>
        </div>
      )}


    </div >
  );
};

export default ParteObra;
