// src/utils/fetchInspecciones.js
import { collection, getDocs } from 'firebase/firestore'; // Importación correcta de Firestore
import { db } from '../../firebase_config'; // Asegúrate de que la ruta a tu configuración de Firebase sea correcta

// Función para obtener los datos de subactividades de todas las inspecciones
export const getInspections = async (arrayLotes) => {
  try {
    const promesasLotes = arrayLotes.map(async (lote) => {
      const inspeccionesRef = collection(db, `lotes/${lote.id}/inspecciones`);
      const inspeccionesSnapshot = await getDocs(inspeccionesRef);

      // Extraer 'sector' del nivel del lote
      const sector = lote.sectorNombre;

      return inspeccionesSnapshot.docs.flatMap((doc) => {
        const inspeccionData = doc.data();

        if (inspeccionData.actividades && Array.isArray(inspeccionData.actividades)) {
          return inspeccionData.actividades.flatMap((actividad) => {
            if (actividad.subactividades && Array.isArray(actividad.subactividades)) {
              // Extraer 'resultadoInspeccion' y 'numero' de cada subactividad
              return actividad.subactividades
                .filter((subactividad) => subactividad.fecha && subactividad.resultadoInspeccion)
                .map(({ resultadoInspeccion, numero }) => ({ resultadoInspeccion, sector, numero })); // Agregar 'sector' desde el lote
            }
            return [];
          });
        }
        return [];
      });
    });

    // Ejecutar todas las promesas en paralelo
    const resultados = (await Promise.all(promesasLotes)).flat();
    return resultados; // Devolver los resultados
  } catch (error) {
    console.error('Error al obtener los datos de subactividades:', error);
    return [];
  }
};
