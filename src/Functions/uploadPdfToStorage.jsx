import { db, storage } from "../../../firebase_config"; // Importa Firestore y Storage
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc } from "firebase/firestore";

const uploadPdfToStorage = async (pdfBlob, selectedProjectId, selectedProjectName) => {
    try {
        const fechaHora = new Date().toISOString().replace(/:/g, "-").split(".")[0];
        const fileName = `informes/${selectedProjectId}/${selectedProjectName}_${fechaHora}.pdf`;
        const storageRef = ref(storage, fileName);

        // Subir el PDF a Storage
        await uploadBytes(storageRef, pdfBlob);
        const downloadURL = await getDownloadURL(storageRef);

        // Guardar metadatos en Firestore en la colección "pdfs"
        await addDoc(collection(db, "pdfs"), {
            projectId: selectedProjectId,
            projectName: selectedProjectName,
            userId: userId, // Guardar el ID del usuario que subió el PDF
            fileName: `${selectedProjectName}_${fechaHora}.pdf`,
            filePath: fileName, // Ruta en Storage
            downloadURL: downloadURL,
            uploadedAt: new Date(),
        });

        console.log("✅ Informe guardado en:", downloadURL);
        return downloadURL;
    } catch (error) {
        console.error("❌ Error al subir el PDF a Firebase Storage:", error);
        return null;
    }
};

export default uploadPdfToStorage;
