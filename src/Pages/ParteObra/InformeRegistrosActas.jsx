import React, { useEffect, useState } from "react";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { useAuth } from "../../context/authContext";
import { db } from "../../../firebase_config";
import { doc, getDoc } from "firebase/firestore";
import { ref, getDownloadURL, getMetadata } from "firebase/storage";
import { storage } from "../../../firebase_config";
import EncabezadoInforme from "./ComponentesInforme/EncabezadoInforme";
import PiePaginaInforme from "./ComponentesInforme/PieDePaginaInforme";
import TituloInforme from "./ComponentesInforme/TituloInforme";
import DatosRegistro from "./ComponentesInforme/DatosRegistro";
import GaleriaImagenes from "./ComponentesInforme/GaleriaImagenes";
import ObservacionesRegistro from "./ComponentesInforme/SeccionesDatosRegistros";
import useProyecto from "../../Hooks/useProyectos";
import { AiOutlineClose } from "react-icons/ai";
import { FaFilePdf, FaBan } from "react-icons/fa6";
import DatosRegistroTabla from "./ComponentesInforme/DatosRegistroTabla";
import Formulario from "../../Components/Firma/Formulario";
import Firma from "../../Components/Firma/Firma";
import Spinner from "./ComponentesInforme/Spinner";

import { View, Text, Image, StyleSheet, Page, Document } from "@react-pdf/renderer";
import MedidasPreventivas from "./ComponentesInforme/MedidasPreventivas";
import DatosRegistroTablaActas from "./ComponentesInforme/DatosRegistroTablaActas";

/**
 * Component `InformeRegistrosActas`
 *
 * This component generates a one-page PDF report for a single act (registro) within a construction project.
 * It fetches metadata and images from Firebase Storage, and renders the PDF using `@react-pdf/renderer`.
 * The document includes project header data, a structured table of activity records, and signatures from both the company and the client.
 * 
 * The PDF is opened in a new browser tab, and generation is blocked if either signature is missing.
 * 
 * ---
 * 🔹 Key Features:
 * - Retrieves and uses project metadata (company, contractor, coordinator, etc.) from Firestore via `useProyecto`.
 * - Validates the presence of `firmaEmpresa` and `firmaCliente` before enabling PDF generation.
 * - Retrieves user signature and name from Firestore.
 * - Fetches image download URLs and their metadata (coordinates, observations) from Firebase Storage.
 * - Renders a clean PDF report with `EncabezadoInforme`, `DatosRegistroTablaActas`, and `PiePaginaInforme`.
 * - Opens the final PDF in a new browser tab without downloading.
 * - Clears temporary visit info (date, time, number) from `localStorage` after generation.
 *
 * ⚙️ Props:
 * - `registros`: List of records (not directly used here).
 * - `columnas`: Custom column mappings (optional).
 * - `fechaInicio`, `fechaFin`: Start and end dates for the visit.
 * - `fileName`: Not currently used.
 * - `formatFechaActual`: Formatted date string for the report.
 * - `datosVisita`: Metadata about the current visit.
 * - `dataRegister`: The specific registry object to use in the report.
 * - `registro`: Alias for `dataRegister` (could be removed or merged).
 * - `nombreUsuario`: Name of the logged-in user generating the report.
 *
 * 🧩 Used Components:
 * - `EncabezadoInforme`: Project header with logos and metadata.
 * - `DatosRegistroTablaActas`: Tabular display of activity fields.
 * - `PiePaginaInforme`: Displays company and client signatures.
 *
 * 🗃️ Dependencies:
 * - Firebase Firestore & Storage
 * - `@react-pdf/renderer` for PDF generation
 * - React Icons for UI icons
 * - `file-saver` (not used in this case but imported)
 */


const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Helvetica",
        backgroundColor: "#FFFFFF",
    },
    line: {
        marginTop: 20,
        borderBottomWidth: 2,
        borderBottomColor: "#cccccc",
        width: "100%",
    },
});

const InformeRegistrosActas = ({ registros, columnas, fechaInicio, fechaFin, fileName, formatFechaActual, datosVisita, dataRegister, registro, nombreUsuario }) => {

    const [modalOpen, setModalOpen] = useState(false);
    const [fechaVisita, setFechaVisita] = useState(localStorage.getItem("fechaVisita") || "");
    const [hora, setHora] = useState(localStorage.getItem("hora") || "");
    const [visitaNumero, setVisitaNumero] = useState(localStorage.getItem("visitaNumero") || "");
    const [firma, setFirma] = useState(null);  
    const [isGenerating, setIsGenerating] = useState(false); 
  

    useEffect(() => {
        localStorage.setItem("fechaVisita", fechaVisita);
        localStorage.setItem("hora", hora);
        localStorage.setItem("visitaNumero", visitaNumero);
    }, [fechaVisita, hora, visitaNumero]);



    const obtenerHoraActual = () => {
        const ahora = new Date();
        const horas = ahora.getHours().toString().padStart(2, "0");
        const minutos = ahora.getMinutes().toString().padStart(2, "0");
        return `${horas}:${minutos}`;  
    };


    const [userNombre, setUserNombre] = useState("");
    const [userSignature, setUserSignature] = useState(null);
    const { user } = useAuth();


    const columnasMap = {
        fechaHora: "Fecha y hora",
        sectorNombre: "Grupo activos",
        subSectorNombre: "Activo",
        parteNombre: "Inventario vial",
        elementoNombre: "Componente",
        nombre: "Actividad",
        observaciones: "Observaciones",
    };


    const selectedProjectId = localStorage.getItem("selectedProjectId");
    const selectedProjectName = localStorage.getItem("selectedProjectName");
    const { proyecto, loading: proyectoLoading, error: proyectoError } = useProyecto(selectedProjectId);

    const fetchUserDetails = async () => {
        if (user) {
            try {
                const userDocRef = doc(db, "usuarios", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                if (userDocSnap.exists()) {
                    const userData = userDocSnap.data();
                    setUserNombre(userData.nombre || "Usuario desconocido");
                    setUserSignature(userData.signature || null);
                }
            } catch (error) {
                console.error("Error al obtener detalles del usuario:", error);
            }
        }
    };


    const fetchImagesWithMetadata = async (imagePaths) => {
        return await Promise.all(
            imagePaths
                .filter((path) => path)
                .map(async (path) => {
                    try {
                        const storageRef = ref(storage, path);
                        const url = await getDownloadURL(storageRef);
                        const metadata = await getMetadata(storageRef);
                        const latitude = metadata.customMetadata?.latitude || null;
                        const longitude = metadata.customMetadata?.longitude || null;
                        const observacion = metadata.customMetadata?.observacion || null;

                        const googleMapsLink =
                            latitude && longitude
                                ? `https://www.google.com/maps?q=${latitude},${longitude}`
                                : null;

                        return { imageBase64: url, googleMapsLink, observacion };
                    } catch (error) {
                        console.error(`Error al descargar la imagen ${path}:`, error);
                        return null;
                    }
                })
        );
    };




    const downloadPdf = async () => {
     

        if (!dataRegister?.firmaEmpresa || !dataRegister?.firmaCliente) {
            console.error("⚠️ No hay firmas guardadas en Firestore.");
            return; 
        }


        if (userNombre !== "NA") {
            await fetchUserDetails();
        }


       
        let imagesWithMetadata = [];
        if (dataRegister.imagenes && dataRegister.imagenes.length > 0) {
            imagesWithMetadata = await fetchImagesWithMetadata(dataRegister.imagenes);
    
        }

        const docContent = (
            <Document>
             
                <Page size="A4" style={styles.page}>
                    <EncabezadoInforme
                        empresa={proyecto?.empresa || "Nombre de mpresa"}
                        obra={proyecto?.obra || "Nombre de obra"}
                        promotor={proyecto?.promotor || "Promotor"}
                        description={proyecto?.descripcion || "Contratista"}
                        coordinador={proyecto?.coordinador || "Nombre coordinador"}
                        director={proyecto?.director || "Nombre director de la obra"}
                        rangoFechas={`${fechaInicio || `${formatFechaActual} - ${obtenerHoraActual()} hrs`} ${fechaFin ? ` al ${fechaFin} - ${obtenerHoraActual()} hrs` : ""}`}
                        logos={[proyecto?.logo, proyecto?.logoCliente].filter(Boolean)}
                    />

                    <DatosRegistroTablaActas
                        registro={dataRegister}
                        excluirClaves={[
                            "id", "parteId", "ppiId", "idSubSector", "idSector", "idBim", "elementoId",
                            "imagenes", "observaciones", "idProyecto", "ppiNombre", "loteid", "totalSubactividades",
                            "nombreProyecto", "estado", "pkInicial", "pkFinal", "loteId",
                            "sectorNombre", "subSectorNombre", "parteNombre", "elementoNombre"
                        ]}
                        columnasMap={columnasMap}
                    />

                    <PiePaginaInforme
                        userNombre={userNombre}
                        firmaEmpresa={dataRegister.firmaEmpresa} 
                        firmaCliente={dataRegister.firmaCliente}
                        nombreUsuario={nombreUsuario}
                    />
                </Page>

                


            </Document>
        );

      
        const blob = await pdf(docContent).toBlob();
        const pdfURL = URL.createObjectURL(blob);
        window.open(pdfURL, "_blank");


    };


    const handlegeneratePDF = () => {
        if (!dataRegister || Object.keys(dataRegister).length === 0) {
            console.error("⚠️ No hay datos para generar el PDF");
            return;
        }
        setIsGenerating(true)
        setModalOpen(true); 

        setTimeout(() => {
            downloadPdf(); 
        }, 200); 

        setTimeout(() => {
           
            localStorage.removeItem("fechaVisita");
            localStorage.removeItem("hora");
            localStorage.removeItem("visitaNumero");


            setIsGenerating(false)
            setModalOpen(false); 
        }, 2000); 
    };


    return (
        <div>
            {isGenerating ? (
                <div className="flex justify-center items-center gap-2">
                    <Spinner /> 
                </div>
            ) : (
                <button
                    className={`w-10 h-10 flex justify-center items-center text-xl font-medium rounded-md ${dataRegister.firmaEmpresa && dataRegister.firmaCliente
                        ? "text-gray-500 hover:text-sky-700"
                        : "text-gray-500 cursor-not-allowed"
                        }`}
                    onClick={dataRegister.firmaEmpresa && dataRegister.firmaCliente ? handlegeneratePDF : null}
                    disabled={!dataRegister.firmaEmpresa || !dataRegister.firmaCliente} 
                >
                    {dataRegister.firmaEmpresa && dataRegister.firmaCliente ? (
                        <FaFilePdf className="w-6 h-6" />
                    ) : (
                        <FaBan className="w-6 h-6" />
                    )}
                </button>
            )}
        </div>
    );

};

export default InformeRegistrosActas;
