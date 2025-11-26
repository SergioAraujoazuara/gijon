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
import PrevisionesActividades from "./ComponentesInforme/PrevisionActividades"

/**
 * Component `PdfInformeTablaRegistros`
 *
 * This component is used to generate a single-page PDF report for a specific inspection record.
 * It builds the report using reusable PDF sections such as project header, data tables, image galleries with metadata, preventive measures,
 * and activity forecasts. It validates the presence of both client and company signatures before allowing PDF generation.
 * 
 * Upon generation:
 * - It fetches related images from Firebase Storage, including their metadata (coordinates and notes).
 * - Renders all content using `@react-pdf/renderer` and opens the final document in a new browser tab.
 * - Uses localStorage to persist visit data temporarily (date, hour, visit number).
 *
 * ---
 * 🔹 Main functionality:
 * - Renders PDF with project info, registry data, image gallery, preventive measures, and user/company signatures.
 * - Fetches and includes images with metadata from Firebase Storage.
 * - Prevents PDF generation unless both signatures are present.
 * - Automatically clears visit data stored in localStorage after generation.
 *
 * ⚙️ Props:
 * - `registros`: (Optional) List of all records — not used directly in generation here.
 * - `columnas`: Column mapping for the data table.
 * - `fechaInicio`, `fechaFin`, `formatFechaActual`: Dates for display in the header.
 * - `fileName`: (Unused here, possibly legacy).
 * - `datosVisita`: Additional visit info (hour, number, etc.).
 * - `dataRegister`: The inspection record to render in the report.
 * - `registro`: (Alias of `dataRegister` – might be refactored).
 * - `nombreUsuario`: Name of the user signing or generating the report.
 *
 * 🧩 Components used:
 * - `EncabezadoInforme`, `DatosRegistro`, `DatosRegistroTabla`, `GaleriaImagenes`
 * - `MedidasPreventivas`, `PrevisionesActividades`, `PiePaginaInforme`
 *
 * 🗃️ Libraries:
 * - `@react-pdf/renderer`, `firebase/storage`, `firebase/firestore`, `file-saver`, `react-icons`
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

const PdfInformeTablaRegistros = ({ registros, columnas, fechaInicio, fechaFin, fileName, formatFechaActual, datosVisita, dataRegister, registro, nombreUsuario }) => {

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
        {/* Página 1: Datos + 2 imágenes */}
        <Page size="A4" style={styles.page}>
          <EncabezadoInforme
            empresa={proyecto?.empresa || "Nombre de mpresa"}
            obra={proyecto?.obra || "Nombre de obra"}
            promotor={proyecto?.promotor || "Promotor"}
            description={proyecto?.descripcion || "Contratista"}
            coordinador={proyecto?.coordinador || "Nombre coordinador de seguridad y salud"}
            director={proyecto?.director || "Nombre director de la obra"}
            rangoFechas={`${dataRegister?.fechaHora
              ? new Date(dataRegister.fechaHora).toLocaleString("es-ES", {
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
            registro={dataRegister}
            excluirClaves={[
              "id", "parteId", "ppiId", "idSubSector", "idSector", "idBim", "elementoId",
              "imagenes", "idProyecto", "ppiNombre", "loteid", "totalSubactividades",
              "nombreProyecto", "estado", "pkInicial", "pkFinal", "loteId",
              "sectorNombre", "subSectorNombre", "parteNombre", "elementoNombre"
            ]}
            dataRegister={dataRegister}
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

        <Page size="A4" style={styles.page}>
          <DatosRegistroTabla
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


    const fecha = new Date(dataRegister.fechaHora);
    const year = fecha.getFullYear();
    const month = String(fecha.getMonth() + 1).padStart(2, '0');
    const day = String(fecha.getDate()).padStart(2, '0');
    const hours = String(fecha.getHours()).padStart(2, '0');
    const minutes = String(fecha.getMinutes()).padStart(2, '0');
    const cleanProjectName = selectedProjectName?.replace(/\s+/g, "_") || "Proyecto";
    const fileName = `${cleanProjectName}_${year}-${month}-${day}_${hours}-${minutes}-hrs.pdf`;
    const blob = await pdf(docContent).toBlob();
    saveAs(blob, fileName);


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

export default PdfInformeTablaRegistros;
