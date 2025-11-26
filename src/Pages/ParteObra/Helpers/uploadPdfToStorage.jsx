import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "../../../../firebase_config"; // Ajusta la ruta según tu estructura

/**
 * Sube un archivo PDF a Firebase Storage y devuelve la URL de descarga.
 * @param {Blob} pdfBlob - El archivo PDF en formato Blob.
 * @param {string} projectId - ID del proyecto al que pertenece el informe.
 * @returns {Promise<string|null>} - La URL del archivo subido o null en caso de error.
 */
export const uploadPdfToStorage = async (pdfBlob, projectId) => {
    try {
        const fechaHora = new Date().toISOString().replace(/:/g, "-").split(".")[0];
        const fileName = `informes/${projectId}_${fechaHora}.pdf`;
        const storageRef = ref(storage, fileName);

        // Subir el PDF a Firebase Storage
        await uploadBytes(storageRef, pdfBlob);

        // Obtener la URL de descarga
        const downloadURL = await getDownloadURL(storageRef);
        console.log("✅ Informe guardado en:", downloadURL);

        return downloadURL;
    } catch (error) {
        console.error("❌ Error al subir el PDF a Firebase Storage:", error);
        return null;
    }
};
