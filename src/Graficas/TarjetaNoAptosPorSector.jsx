import React, { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase_config';
import { RxCrossCircled } from "react-icons/rx";
import { RiCalendarCloseLine } from "react-icons/ri";

const TotalNoAptosPorSector = ({ filteredLotes }) => {
    const [datosSubactividades, setDatosSubactividades] = useState([]);
    const [noAptosPorSector, setNoAptosPorSector] = useState({});
    const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos');
    const [totalNoAptos, setTotalNoAptos] = useState(0);

    // Función para obtener los campos 'fecha', 'resultadoInspeccion', 'sector', 'numero' y 'version' de todas las subactividades de todas las inspecciones
    const obtenerDatosSubactividades = async (arrayLotes) => {
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
                                // Extraer 'resultadoInspeccion', 'numero' y 'version' de cada subactividad
                                return actividad.subactividades
                                    .filter((subactividad) => subactividad.fecha && subactividad.resultadoInspeccion)
                                    .map(({ fecha, resultadoInspeccion, numero, version }) => ({ fecha, resultadoInspeccion, sector, numero, version })); // Agregar 'sector' desde el lote
                            }
                            return [];
                        });
                    }
                    return [];
                });
            });

            // Ejecutar todas las promesas en paralelo
            const resultados = (await Promise.all(promesasLotes)).flat();
            console.log('Datos de subactividades obtenidos:', resultados); // Verificar datos obtenidos
            setDatosSubactividades(resultados); // Guardar los resultados en el estado

        } catch (error) {
            console.error('Error al obtener los datos de subactividades:', error);
        }
    };

    // Calcular el total de "No Aptos" activos y agruparlos por sector
    const calcularNoAptosPorSector = () => {
        const noAptosPorSectorTemp = {};
        let totalNoAptosTemp = 0;

        // Agrupar las inspecciones por el campo 'sector' y 'numero' para verificar su secuencia
        const inspeccionesPorNumero = datosSubactividades.reduce((acc, inspeccion) => {
            const { numero, sector } = inspeccion;
            const key = `${sector}-${numero}`; // Agrupar por sector y número de subactividad

            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(inspeccion);
            return acc;
        }, {});

        // Filtrar los "No apto" que no tengan un "Apto" posterior
        Object.values(inspeccionesPorNumero).forEach((inspecciones) => {
            // Ordenar las inspecciones por la versión (de menor a mayor)
            inspecciones.sort((a, b) => a.version - b.version);

            // Obtener la versión más alta
            const ultimaInspeccion = inspecciones[inspecciones.length - 1];

            // Verificar si la última inspección de la versión más alta es "No apto"
            if (ultimaInspeccion.resultadoInspeccion === 'No apto') {
                const sector = ultimaInspeccion.sector; // El sector de la primera inspección de este grupo
                if (!noAptosPorSectorTemp[sector]) {
                    noAptosPorSectorTemp[sector] = 0;
                }
                noAptosPorSectorTemp[sector] += 1;
            }
        });

        // Calcular el total de "No aptos" sumando los valores por sector
        totalNoAptosTemp = Object.values(noAptosPorSectorTemp).reduce((acc, curr) => acc + curr, 0);

        // Console logs para depuración
        console.log('No aptos por sector:', noAptosPorSectorTemp);  // Mostrar el conteo por sector
        console.log('Total de No aptos:', totalNoAptosTemp);  // Mostrar el total de "No aptos"

        setNoAptosPorSector(noAptosPorSectorTemp);
        setTotalNoAptos(totalNoAptosTemp);
    };

    useEffect(() => {
        if (filteredLotes.length > 0) { // Usar filteredLotes
            obtenerDatosSubactividades(filteredLotes); // Pasar filteredLotes
        }
    }, [filteredLotes]); // Dependencia de filteredLotes

    useEffect(() => {
        if (datosSubactividades.length > 0) {
            calcularNoAptosPorSector();
        }
    }, [datosSubactividades]);

    return (
        <div className='bg-gray-200 text-md p-4 rounded-lg shadow-lg flex items-center justify-center h-full'>
            <div className="flex items-center justify-center">
                <div className="font-medium text-gray-600 flex flex-col items-center justify-center gap-1 p-2">
                    <RiCalendarCloseLine className='text-gray-600 text-3xl'/>
                    <div className="text-gray-600 flex flex-col justify-center items-center">
                        <p>Total No apto</p> 
                        <p>{'\u00A0'} {sectorSeleccionado === 'Todos' ? totalNoAptos : noAptosPorSector[sectorSeleccionado] || 0}</p> 
                        
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TotalNoAptosPorSector;
