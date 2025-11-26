import React, { useEffect, useState } from 'react';
import { Chart } from "react-google-charts";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase_config';
import { RiLoader2Line } from "react-icons/ri";

const GraficaNoAptosPorSector = ({ filteredLotes }) => {
    const [datosNoAptosPorSector, setDatosNoAptosPorSector] = useState([]);
    const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos');
    const [loading, setLoading] = useState(true);  // Estado de carga
    const [error, setError] = useState(null);  // Estado de error

    const obtenerDatosNoAptos = async (arrayLotes) => {
        try {
            setLoading(true); // Inicia la carga
            const promesasLotes = arrayLotes.map(async (lote) => {
                const inspeccionesRef = collection(db, `lotes/${lote.id}/inspecciones`);
                const inspeccionesSnapshot = await getDocs(inspeccionesRef);
                const sector = lote.sectorNombre;

                return inspeccionesSnapshot.docs.flatMap((doc) => {
                    const inspeccionData = doc.data();
                    if (inspeccionData.actividades && Array.isArray(inspeccionData.actividades)) {
                        return inspeccionData.actividades.flatMap((actividad) => {
                            if (actividad.subactividades && Array.isArray(actividad.subactividades)) {
                                // Filtrar solo las actividades "No aptas"
                                return actividad.subactividades
                                    .filter((subactividad) => subactividad.fecha && subactividad.resultadoInspeccion === 'No apto')
                                    .map(({ fecha }) => ({ fecha, sector }));
                            }
                            return [];
                        });
                    }
                    return [];
                });
            });

            const resultados = (await Promise.all(promesasLotes)).flat();
            setDatosNoAptosPorSector(resultados);
        } catch (error) {
            console.error('Error al obtener los datos de actividades no aptas:', error);
            setError('Error al cargar los datos. Intenta nuevamente.'); // Guarda el error
        } finally {
            setLoading(false); // Finaliza la carga
        }
    };

    useEffect(() => {
        if (filteredLotes.length > 0) {
            obtenerDatosNoAptos(filteredLotes);
        }
    }, [filteredLotes]);

    // Procesar datos por sector para contar "No aptos"
    const procesarDatosNoAptos = () => {
        const conteoPorSector = {};

        datosNoAptosPorSector.forEach(({ sector }) => {
            if (!sector) return;

            if (!conteoPorSector[sector]) {
                conteoPorSector[sector] = 0;
            }
            conteoPorSector[sector] += 1;
        });

        // Convertir el objeto en un array para el gráfico
        const datosArray = [['Sector', 'No Aptos']];
        Object.keys(conteoPorSector).forEach((sector) => {
            datosArray.push([sector, conteoPorSector[sector]]);
        });

        return datosArray;
    };

    const datosParaMostrar = datosNoAptosPorSector.length > 0 ? procesarDatosNoAptos() : [['Sector', 'No Aptos']];

    // Calcular el valor máximo de "No Aptos" y añadir 10
    const maxNoAptos = Math.max(...datosParaMostrar.slice(1).map(item => item[1]), 0); // Obtener el máximo de "No Aptos"
    const maxValueY = maxNoAptos + 5; // Añadir 10 al máximo para establecer el límite del eje Y

    // Manejar cambios en el filtro de sector
    const handleSectorChange = (e) => {
        setSectorSeleccionado(e.target.value);
    };

    // Filtrar datos según el sector seleccionado
    const datosFiltrados = sectorSeleccionado === 'Todos'
        ? datosParaMostrar.slice(1) // Mostrar todos los sectores
        : datosParaMostrar.slice(1).filter(item => item[0] === sectorSeleccionado); // Filtrar por sector seleccionado

    // Transformar los datos para la gráfica de columnas
    const data = [
        ['Sector', 'No Aptos', { role: 'style' }],
        ...datosFiltrados.map((item, index) => [item[0], item[1], `color: #f87171`]), // Rojo para "No apto"
    ];

    return (
        <div className='bg-gray-100 p-4 rounded-lg shadow-lg flex flex-col items-start text-gray-600'>
            {/* Filtro de sector */}
            <div className='flex justify-between items-center w-full mb-1'>
            <p className='font-medium'>No aptos por sector</p>
                <select className='rounded-lg p-1 bg-gray-200' id='sector-select' value={sectorSeleccionado} onChange={handleSectorChange}>
                    <option value='Todos'>Todos</option>
                    {datosParaMostrar.slice(1).map((item, index) => (
                        <option key={index} value={item[0]}>{item[0]}</option>
                    ))}
                </select>
            </div>

            {/* Mostrar mensaje de carga, error o gráfico */}
            {loading ? (
                <div className='w-full h-full flex items-start pt-20 justify-center'>
                    <RiLoader2Line className='text-4xl'/>
                </div>
            ) : error ? (
                <p>{error}</p>
            ) : (
                /* Gráfico de columnas (ColumnChart) */
                <Chart
                    chartType="ColumnChart"
                    data={data}
                    options={{
                        // title: 'Actividades No Aptas por Sector',
                        vAxis: {
                            minValue: 0,
                            maxValue: maxValueY, // Establecer límite máximo del eje Y
                            title: 'No Aptos',
                        },
                        hAxis: {
                            title: 'Sector',
                            textPosition: 'out',
                        },
                        legend: { position: 'none' },
                        bar: { groupWidth: '75%' },
                        isStacked: false,
                        annotations: {
                            alwaysOutside: true,
                            textStyle: {
                                fontSize: 12,
                                auraColor: 'none',
                                color: '#555',
                            },
                        },
                        backgroundColor: '#f3f4f6', // Fondo del gráfico completo
                    }}
                    width="100%"
                    height="250px"
                />
            )}
        </div>
    );
};

export default GraficaNoAptosPorSector;
