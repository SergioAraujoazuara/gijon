import React, { useEffect, useState } from "react";
import { Document, Page, StyleSheet } from "@react-pdf/renderer";
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
import { FaFilePdf } from "react-icons/fa6";
import DatosRegistroTabla from "./ComponentesInforme/DatosRegistroTabla";
import Formulario from "../../Components/Firma/Formulario";
import Firma from "../../Components/Firma/Firma";
import { PDFDocument } from "pdf-lib";
import Spinner from "./ComponentesInforme/Spinner";
import { uploadPdfToStorage } from "../ParteObra/Helpers/uploadPdfToStorage";
import { FaRegCheckCircle } from "react-icons/fa";
import MedidasPreventivas from "./ComponentesInforme/MedidasPreventivas";
import PrevisionesActividades from "./ComponentesInforme/PrevisionActividades";
/**
 * Component `InformeFinal`
 *
 * This component is responsible for generating a final inspection report in PDF format based on a list of inspection records linked to a specific project.
 * For each record, it creates a PDF using `@react-pdf/renderer`, downloads related images and their metadata from Firebase Storage,
 * and merges all the PDFs into a single final document using `pdf-lib`. The final report is both downloaded by the user and uploaded to Firebase Storage.
 *
 * Additionally, it displays a success modal once the report has been successfully saved.
 *
 * ---
 * 🔹 Main functionality:
 * - Iterates over each inspection record and generates an individual PDF.
 * - Downloads images and extracts metadata (coordinates, observations) from Firebase Storage.
 * - Merges all generated PDFs into one final report.
 * - Allows the user to download the report and automatically uploads it to Firebase Storage.
 *
 * ⚙️ Props:
 * - `fechaInicio`, `fechaFin`, `formatFechaActual`: Dates to display in the report header.
 * - `nombreUsuario`: Name of the user who creates/signs the report.
 * - `registros`: List of inspection records to include.
 * - `selectedProjectName`, `selectedProjectId`: Information about the current project.
 *
 * 🧩 Reused components:
 * - `EncabezadoInforme`, `DatosRegistro`, `DatosRegistroTabla`, `GaleriaImagenes`, `PiePaginaInforme`
 *
 * 🗃️ External libraries:
 * - `@react-pdf/renderer`, `pdf-lib`, `firebase`, `file-saver`
 */

const styles = StyleSheet.create({
    page: {
        padding: 30,
        fontFamily: "Helvetica",
        backgroundColor: "#FFFFFF",
    },
});

const InformeFinal = ({ fechaInicio, fechaFin, formatFechaActual, nombreUsuario, registros, selectedProjectName, selectedProjectId }) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [fechaVisita, setFechaVisita] = useState(localStorage.getItem("fechaVisita") || "");
    const [hora, setHora] = useState(localStorage.getItem("hora") || "");
    const [visitaNumero, setVisitaNumero] = useState(localStorage.getItem("visitaNumero") || "");
    const [firma, setFirma] = useState(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [showSuccessModalMessage, setShowSuccessModalMessage] = useState('');
    const { proyecto, loading: proyectoLoading, error: proyectoError } = useProyecto(selectedProjectId);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        localStorage.setItem("fechaVisita", fechaVisita);
        localStorage.setItem("hora", hora);
        localStorage.setItem("visitaNumero", visitaNumero);
    }, [fechaVisita, hora, visitaNumero]);

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

    // Descargar imágenes y metadatos
    const fetchImagesWithMetadata = async (imagePaths) => {
        return await Promise.all(
            imagePaths
                .filter((path) => path)  // Filtrar imágenes nulas antes de procesar
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

    const obtenerHoraActual = () => {
        const ahora = new Date();
        const horas = ahora.getHours().toString().padStart(2, "0");
        const minutos = ahora.getMinutes().toString().padStart(2, "0");
        return `${horas}:${minutos}`;  // Devuelve la hora en formato HH:mm
    };

    const obtenerFechaHoraActual = () => {
        const ahora = new Date();
        const year = ahora.getFullYear();
        const month = String(ahora.getMonth() + 1).padStart(2, '0');
        const day = String(ahora.getDate()).padStart(2, '0');
        const hours = String(ahora.getHours()).padStart(2, '0');
        const minutes = String(ahora.getMinutes()).toString().padStart(2, '0');

        const nombreArchivo = `${year}-${month}-${day}_${hours}-${minutes}`;
        const fechaTexto = `${day}/${month}/${year} a las ${hours}:${minutes} hrs`;

        return { nombreArchivo, fechaTexto };
    };

    const { fechaTexto } = obtenerFechaHoraActual();


    const downloadPdf = async (registroIndividual) => {
        if (!registroIndividual) return null;

        let imagesWithMetadata = [];
        if (registroIndividual.imagenes && registroIndividual.imagenes.length > 0) {
            imagesWithMetadata = await fetchImagesWithMetadata(registroIndividual.imagenes);
        }

        // Dividir imágenes: primeras 2 para la página de datos, el resto para las siguientes páginas (6 por página)
        const primerasDos = imagesWithMetadata.slice(0, 2);
        const resto = imagesWithMetadata.slice(2);
        const chunkArray = (arr, size) =>
            arr.reduce((acc, _, i) =>
                i % size === 0 ? [...acc, arr.slice(i, i + size)] : acc
            , []);
        const imagenesPorPagina = chunkArray(resto, 6);

        const docContent = (
            <Document>
                {/* Página 1: Encabezado + DatosRegistro + 2 imágenes */}
                <Page size="A4" style={styles.page}>
                    <EncabezadoInforme
                        empresa={proyecto?.empresa || "Nombre de mpresa"}
                        obra={proyecto?.obra || "Nombre de obra"}
                        promotor={proyecto?.promotor || "Nombre promotor"}
                        description={proyecto?.descripcion || "Nombre contratista"}
                        coordinador={proyecto?.coordinador || "Nombre coordinador de seguridad y salud"}
                        director={proyecto?.director || "Nombre director de la obra"}
                        rangoFechas={`${registroIndividual?.fechaHora
                            ? new Date(registroIndividual.fechaHora).toLocaleString("es-ES", {
                                day: "2-digit",
                                month: "2-digit",
                                year: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                            }) + " hrs"
                            : "Fecha no disponible"
                            }`}
                        logos={[proyecto?.logo, proyecto?.logoCliente].filter(Boolean)}
                    />

                    <DatosRegistro
                        registro={registroIndividual}
                        excluirClaves={["id", "parteId", "ppiId", "idSubSector", "idSector", "idBim", "elementoId", "imagenes"]}
                        dataRegister={registroIndividual}
                        columnasMap={columnasMap}
                    />
                    {/* Mostrar solo 2 imágenes en la primera página, con título */}
                    <GaleriaImagenes imagesWithMetadata={primerasDos} mostrarTitulo={true} />
                  
                </Page>

                {/* Páginas siguientes: solo galería de imágenes (6 por página), sin título */}
                {imagenesPorPagina.map((grupo, idx) => (
                    <Page key={idx} size="A4" style={styles.page}>
                        <GaleriaImagenes imagesWithMetadata={grupo} mostrarTitulo={false} />
                    </Page>
                ))}

                {/* Página: Tabla de datos */}
                <Page size="A4" style={styles.page}>
                    <DatosRegistroTabla
                        registro={registroIndividual}
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
                        firmaEmpresa={registroIndividual.firmaEmpresa}
                        firmaCliente={registroIndividual.firmaCliente}
                        nombreUsuario={nombreUsuario}
                    />
                    
                </Page>

                

              
            </Document>
        );

        return await pdf(docContent).toBlob();
    };


    const handlegeneratePDF = async () => {
        if (!registros || registros.length === 0) {
            console.error("⚠️ No hay registros para generar el PDF");
            return;
        }

        setIsGenerating(true);
        setProgress(0);

        const pdfDoc = await PDFDocument.create();

        for (let i = 0; i < registros.length; i++) {
            const registroIndividual = registros[i];
            console.log(`📄 Creando informe para el registro ID: ${registroIndividual.id}`);

            const blob = await downloadPdf(registroIndividual);
            if (!blob) continue;

            const pdfBytes = await blob.arrayBuffer();
            const tempPdf = await PDFDocument.load(pdfBytes);
            const copiedPages = await pdfDoc.copyPages(tempPdf, tempPdf.getPageIndices());

            copiedPages.forEach((page) => pdfDoc.addPage(page));

            // Actualizar progreso
            setProgress(Math.round(((i + 1) / registros.length) * 100));
        }

        const finalPdfBytes = await pdfDoc.save();
        const finalBlob = new Blob([finalPdfBytes], { type: "application/pdf" });

        const pdfURL = URL.createObjectURL(finalBlob);
        const link = document.createElement("a");
        link.href = pdfURL;
        link.download = `Informe_${selectedProjectName}_${fechaTexto}.pdf`;
        link.click();

        const downloadURL = await uploadPdfToStorage(finalBlob, selectedProjectName, selectedProjectId);
        if (downloadURL) {
            setShowSuccessModal(true);
            setShowSuccessModalMessage('Informe guardado correctamente')// Mostrar el modal de éxito
        }

        setIsGenerating(false);
        setProgress(0);
    };


    return (
        <div>
            <div>
                <div>
                    {isGenerating ? (
                        <div className="flex flex-col justify-center items-center gap-4 w-full">
                            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                                <div
                                    className="bg-blue-500 h-4 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>
                            <span className="text-blue-700 font-semibold">Generando PDF... {progress}%</span>
                        </div>
                    ) : (
                        <button
                            className="px-4 py-2 h-12 bg-amber-600 text-white text-md rounded-md hover:bg-amber-700 flex gap-2 items-center"
                            onClick={handlegeneratePDF}
                        >
                            <FaFilePdf /> <span className="text-sm">Informe final</span>
                        </button>
                    )}
                </div>
            </div>

            {showSuccessModal && (
                <div className="fixed inset-0 flex items-center justify-center backdrop-blur-md bg-black bg-opacity-40 transition-opacity">
                    <div className="bg-white p-8 rounded-2xl shadow-2xl w-[350px] text-center relative transform transition-transform scale-95 animate-fadeIn">


                        <button
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-700 transition"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            <AiOutlineClose size={22} />
                        </button>


                        <div className="flex justify-center items-center mb-4">
                            <FaRegCheckCircle className="text-green-500 text-6xl" />
                        </div>


                        <h2 className="text-lg font-semibold text-gray-800">{showSuccessModalMessage}</h2>


                        <div className="mt-6">
                            <button
                                onClick={() => setShowSuccessModal(false)}
                                className="px-5 py-2 bg-gray-500 text-white font-medium rounded-md shadow-md hover:scale-105 hover:from-green-600 hover:to-green-800 transition-all duration-300"
                            >
                                Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>

    );
};

export default InformeFinal;
