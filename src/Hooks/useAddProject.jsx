import { useState } from 'react';
import { db, storage } from '../../firebase_config';  // Asegúrate de que la ruta sea correcta
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Custom Hook: useAddProject
 * 
 * The `useAddProject` hook is designed to handle the logic of adding a new project to the system. 
 * It manages uploading logos (both project and client logos) to Firebase Storage and saving project details to Firebase Firestore.
 * 
 * **Features**:
 * - Upload project and client logos to Firebase Storage if provided.
 * - Save project details, including the uploaded logos, to Firestore.
 * - Manage loading and error states during the process.
 * 
 * **Methods**:
 * - `addProject`: A function that adds a project with the following details:
 *   - `empresa`: The company name.
 *   - `work`: The name of the work/project.
 *   - `descripcion`: A description of the project.
 *   - `contract`: The project contract.
 *   - `logo`: The project's logo (optional).
 *   - `clientLogo`: The client's logo (optional).
 *   - `promotor`: The project's promoter.
 *   - `plazo`: The project's deadline.
 *   - `presupuesto`: The project budget.
 *   - `coordinador`: The project coordinator.
 *   - `director`: The project director.
 * 
 * **State Variables**:
 * - `loading`: A boolean that indicates whether the project is being added.
 * - `error`: Stores any error messages that might occur during the process.
 * 
 * **Return**:
 * - The hook returns the `addProject` function, `loading`, and `error` to be used within the component.
 */

const useAddProject = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const addProject = async (empresa, work, descripcion, contract, logo, clientLogo, promotor, plazo, presupuesto, coordinador, director) => {
    setLoading(true);
    setError(null);  

    try {
      let logoURL = null;
      if (logo) {
        const logoRef = ref(storage, `logos/${logo.name}`);
        await uploadBytes(logoRef, logo);
        logoURL = await getDownloadURL(logoRef);
      }
      let clientLogoURL = null;
      if (clientLogo) {
        const clientLogoRef = ref(storage, `logos_clientes/${clientLogo.name}`);
        await uploadBytes(clientLogoRef, clientLogo);
        clientLogoURL = await getDownloadURL(clientLogoRef);
      }
      const projectsCollection = collection(db, "proyectos");
      await addDoc(projectsCollection, {
        empresa,
        obra: work,
        descripcion,
        promotor,
        contrato: contract,
        logo: logoURL,
        logoCliente: clientLogoURL,
        plazo: plazo,
        presupuesto: presupuesto,
        coordinador: coordinador,
        director: director,
      });

      setLoading(false);
      return "Proyecto agregado exitosamente.";
    } catch (err) {
      setLoading(false);
      setError(err.message);
      return `Error al agregar el proyecto: ${err.message}`;
    }
  };

  return { addProject, loading, error };
};

export default useAddProject;
