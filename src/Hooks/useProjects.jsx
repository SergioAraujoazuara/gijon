import { useState, useEffect } from 'react';
import { db } from '../../firebase_config';  
import { collection, getDocs } from 'firebase/firestore';

/**
 * Custom Hook: useProjects
 * 
 * The `useProjects` hook is responsible for fetching a list of projects from the Firestore database 
 * and managing the loading state during this process. It retrieves the data from the "proyectos" collection 
 * and provides a mechanism for refreshing the project list.
 * 
 * **Features**:
 * - Fetches the list of projects from Firestore.
 * - Manages the `projects` state and loading state.
 * - Provides a function to refresh the project list after adding, editing, or deleting a project.
 * 
 * **State Variables**:
 * - `projects`: An array that holds the list of project objects fetched from Firestore.
 * - `loading`: A boolean indicating whether the projects are currently being fetched from the database.
 * 
 * **Methods**:
 * - `fetchProjects`: A function that fetches the projects from Firestore and updates the `projects` state.
 * - `refreshProjects`: A function that calls `fetchProjects` to refresh the project list after a modification (such as adding, editing, or deleting a project).
 * 
 * **Return**:
 * - The hook returns the `projects` array, the `loading` state, and the `refreshProjects` function to be used within a component.
 */

const useProjects = () => {
  const [projects, setProjects] = useState([]);  
  const [loading, setLoading] = useState(true);  

  const fetchProjects = async () => {
    try {
      const projectsCollection = collection(db, 'proyectos'); 
      const projectsSnapshot = await getDocs(projectsCollection);  
      const projectsList = projectsSnapshot.docs.map(doc => ({
        id: doc.id,  
        ...doc.data(),  
      }));
      setProjects(projectsList);  
    } catch (error) {
      console.error('Error obteniendo los proyectos: ', error);
    } finally {
      setLoading(false);  
    }
  };

 
  useEffect(() => {
    fetchProjects();  
  }, []);  


  const refreshProjects = () => {
    fetchProjects(); 
  };

  return { projects, loading, refreshProjects };  
};

export default useProjects;
