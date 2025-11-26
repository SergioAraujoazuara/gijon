import { useState } from 'react';
import { db } from '../../firebase_config';  // Asegúrate de que la ruta sea correcta
import { doc, deleteDoc } from 'firebase/firestore';
/**
 * Custom Hook: useDeleteProject
 * 
 * The `useDeleteProject` hook is designed to handle the logic for deleting a project from the system. 
 * It interacts with Firestore to remove a project document from the "proyectos" collection based on the provided project ID.
 * 
 * **Features**:
 * - Deletes a project from Firestore using the project's ID.
 * - Manages the loading and error states during the deletion process.
 * 
 * **Methods**:
 * - `deleteProject`: A function that deletes a project from Firestore by its `id`.
 *   - `id`: The ID of the project to be deleted.
 * 
 * **State Variables**:
 * - `loading`: A boolean indicating whether the project is being deleted.
 * - `error`: Stores any error messages that might occur during the process.
 * 
 * **Return**:
 * - The hook returns the `deleteProject` function, `loading`, and `error` to be used within a component.
 */

const useDeleteProject = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const deleteProject = async (id) => {
    setLoading(true);
    setError(null);

    try {
      const projectRef = doc(db, "proyectos", id);
      await deleteDoc(projectRef);  // Eliminar proyecto de Firestore

      setLoading(false);
      return "Proyecto eliminado exitosamente.";
    } catch (err) {
      setLoading(false);
      setError(err.message);
      return `Error al eliminar el proyecto: ${err.message}`;
    }
  };

  return { deleteProject, loading, error };
};

export default useDeleteProject;
