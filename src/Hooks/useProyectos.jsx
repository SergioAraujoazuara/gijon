import { useState, useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../firebase_config";
/**
 * Custom Hook: useProyecto
 * 
 * The `useProyecto` hook is responsible for fetching a specific project's data from Firestore based on a provided project ID.
 * It manages the loading state while fetching the data and provides error handling in case the project cannot be found or there is an issue with the fetch process.
 * 
 * **Features**:
 * - Fetches a specific project from the "proyectos" collection in Firestore using the project ID.
 * - Manages the `proyecto` state (the project data), the `loading` state (indicating whether the data is still being fetched), and the `error` state (for handling errors).
 * 
 * **State Variables**:
 * - `proyecto`: An object that holds the project data fetched from Firestore.
 * - `loading`: A boolean that indicates if the data is still being fetched.
 * - `error`: A string that holds the error message in case of a failure in fetching the project data.
 * 
 * **Methods**:
 * - `fetchProyecto`: A function that fetches the project from Firestore by its ID and updates the `proyecto` state. It also handles error cases and sets the `error` state accordingly.
 * 
 * **Use Case**:
 * - This hook is used to fetch and display detailed information about a specific project by passing the project ID to it.
 * 
 * **Return**:
 * - The hook returns an object containing the `proyecto` data, the `loading` state, and the `error` message (if any).
 */

const useProyecto = (projectId) => {
  const [proyecto, setProyecto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProyecto = async () => {
      if (!projectId) {
        setError("No se encontró el ID del proyecto.");
        setLoading(false);
        return;
      }

      try {
        const proyectoRef = doc(db, "proyectos", projectId);
        const proyectoSnap = await getDoc(proyectoRef);

        if (proyectoSnap.exists()) {
          setProyecto(proyectoSnap.data());
        } else {
          setError("No se encontró el proyecto en la base de datos.");
        }
      } catch (err) {
        console.error("Error al obtener el proyecto:", err);
        setError("Error al obtener el proyecto.");
      } finally {
        setLoading(false);
      }
    };

    fetchProyecto();
  }, [projectId]);

  return { proyecto, loading, error };
};

export default useProyecto;
