import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase_config'; 

export const getLotes = async (selectedProjectId) => {
  try {
    if (!selectedProjectId) {
      console.warn('No hay un selectedProjectId definido.');
      return [];
    }

    const lotesCollectionRef = collection(db, "lotes");
    const q = query(lotesCollectionRef, where("idProyecto", "==", selectedProjectId));
    const lotesSnapshot = await getDocs(q);
    
    const lotesData = lotesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return lotesData;
  } catch (error) {
    console.error('Error al obtener los lotes:', error);
    return [];
  }
};
