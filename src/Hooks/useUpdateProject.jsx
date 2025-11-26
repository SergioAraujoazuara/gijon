import { useState } from 'react';
import { db, storage } from '../../firebase_config';  // Asegúrate de que la ruta sea correcta
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
/**
 * Custom Hook: useUpdateProject
 * 
 * The `useUpdateProject` hook allows for updating an existing project in Firestore by passing the project ID and the new data. 
 * It manages the loading and error states during the update process, and handles the uploading of logos to Firebase Storage.
 * 
 * **Features**:
 * - Updates project data in Firestore based on the provided project ID.
 * - Optionally uploads new logos for the project and client to Firebase Storage.
 * - Provides feedback on the operation's status, such as loading and error states.
 * 
 * **State Variables**:
 * - `loading`: A boolean that indicates whether the update operation is in progress.
 * - `error`: A string containing the error message if an error occurs during the update.
 * 
 * **Methods**:
 * - `updateProject`: A function that updates the project in Firestore with the new data provided. It handles the uploading of new logo images (if present) and updates the relevant project fields.
 * 
 * **Parameters**:
 * - `id`: The ID of the project to update.
 * - `empresa`: The company name (optional).
 * - `work`: The project name (optional).
 * - `descripcion`: The project description (optional).
 * - `contract`: The contract details (optional).
 * - `logo`: The project logo image (optional).
 * - `clientLogo`: The client logo image (optional).
 * - `promotor`: The promoter of the project (optional).
 * - `plazo`: The project deadline (optional).
 * - `presupuesto`: The project budget (optional).
 * - `coordinador`: The project coordinator (optional).
 * - `director`: The project director (optional).
 * 
 * **Return**:
 * - The hook returns an object containing the `updateProject` function, the `loading` state, and the `error` message (if any).
 * 
 * **Use Case**:
 * - This hook is used to update the project information, including the ability to upload new logos for the project and the client.
 * 
 * **Example**:
 * ```javascript
 * const { updateProject, loading, error } = useUpdateProject();
 * 
 * const handleUpdateProject = async () => {
 *   const result = await updateProject(id, empresa, work, descripcion, contract, logo, clientLogo, promotor, plazo, presupuesto, coordinador, director);
 *   console.log(result);
 * };
 * ```
 */


const useUpdateProject = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateProject = async (id, empresa, work, descripcion, contract, logo, clientLogo, promotor, plazo, presupuesto, coordinador, director) => {
    setLoading(true);
    setError(null);

    try {
      const projectRef = doc(db, "proyectos", id);

      let updatedData = {};
      if (empresa) updatedData.empresa = empresa;
      if (work) updatedData.obra = work;
      if (descripcion) updatedData.descripcion = descripcion;
      if (promotor) updatedData.promotor = promotor;
      if (contract) updatedData.contrato = contract;
      if (plazo) updatedData.plazo = plazo;
      if (presupuesto) updatedData.presupuesto = presupuesto;
      if (coordinador) updatedData.coordinador = coordinador;
      if (director) updatedData.director = director;

      if (logo) {
        const logoRef = ref(storage, `logos/${logo.name}`);
        await uploadBytes(logoRef, logo);
        const logoURL = await getDownloadURL(logoRef);
        updatedData.logo = logoURL;
      }

      if (clientLogo) {
        const clientLogoRef = ref(storage, `logos_clientes/${clientLogo.name}`);
        await uploadBytes(clientLogoRef, clientLogo);
        const clientLogoURL = await getDownloadURL(clientLogoRef);
        updatedData.logoCliente = clientLogoURL;
      }

      await updateDoc(projectRef, updatedData);

      setLoading(false);
      return "Proyecto actualizado exitosamente.";
    } catch (err) {
      setLoading(false);
      setError(err.message);
      return `Error al actualizar el proyecto: ${err.message}`;
    }
  };

  return { updateProject, loading, error };
};

export default useUpdateProject;
