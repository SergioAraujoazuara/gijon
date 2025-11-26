import React, { useState, useEffect } from 'react';
import { Chart } from "react-google-charts";
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase_config';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'; // Importar íconos
import { IoIosCloseCircle } from "react-icons/io";

const AptoNoApto = ({ datosAptosPorSector, filteredLotes }) => {
    // Estados del componente
    const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos');
    const [datosNoAptosPorSector, setDatosNoAptosPorSector] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal

    // Colores para las barras de la gráfica
    const colorVerde = '#2dd4bf';  // Color para "Aptos"
    const colorRojo = '#f87171';   // Color para "No Aptos"

    // Obtener los datos de "No Aptos"
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

    // Ejecutar la función para obtener los datos "No Aptos" cuando se reciben los "filteredLotes"
    useEffect(() => {
        if (filteredLotes.length > 0) {
            obtenerDatosNoAptos(filteredLotes);
        }
    }, [filteredLotes]);

    // Procesar datos por sector para contar "No Aptos"
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

    // Obtener datos de "No Aptos" para la gráfica
    const datosNoAptos = datosNoAptosPorSector.length > 0 ? procesarDatosNoAptos() : [['Sector', 'No Aptos']];

    // Filtrar datos de "Aptos" según el sector seleccionado
    const datosFiltradosAptos = sectorSeleccionado === 'Todos'
        ? datosAptosPorSector.slice(1)
        : datosAptosPorSector.slice(1).filter(item => item[0] === sectorSeleccionado);

    // Filtrar datos de "No Aptos" según el sector seleccionado
    const datosFiltradosNoAptos = sectorSeleccionado === 'Todos'
        ? datosNoAptos.slice(1)
        : datosNoAptos.slice(1).filter(item => item[0] === sectorSeleccionado);

    // Combinar datos de "Aptos" y "No Aptos" para la gráfica
    const combinedData = [['Sector', 'Aptos', { role: 'style' }, 'No Aptos', { role: 'style' }]];

    datosFiltradosAptos.forEach((item, index) => {
        const sector = item[0];
        const aptos = item[1];
        const noAptos = datosFiltradosNoAptos.find(noApto => noApto[0] === sector)?.[1] || 0;
        combinedData.push([sector, aptos, `color: ${colorVerde}`, noAptos, `color: ${colorRojo}`]);
    });

    // Manejar cambios en el filtro de sector
    const handleSectorChange = (e) => {
        setSectorSeleccionado(e.target.value);
    };

    // Función para abrir/cerrar el modal
    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);
    };

    return (
        <div className='bg-gray-100 text-gray-500 rounded-lg shadow-lg flex flex-col items-start h-full'>
            {/* Filtro de sector */}
            <div className='flex flex-col gap-2 justify-between items-center w-full mb-1'>
                <div className='w-full bg-gray-200 p-2 rounded-t-xl flex justify-between items-center'>
                    <p className='font-medium flex-grow text-center text-xl'>Comparativa sectores</p>
                    {/* Botón de pantalla completa */}
                    <MdFullscreen onClick={toggleModal} className='cursor-pointer text-gray-600 text-2xl hover:text-gray-800 transition' />
                </div>
            </div>

            <div className='py-2 px-4 flex flex-col items-center w-full'>
                <div className='flex flex-col gap-2 justify-between items-center w-full mb-1'>
                    <select id='sector-select' className='rounded-lg p-2 bg-gray-200 text-lg' value={sectorSeleccionado} onChange={handleSectorChange}>
                        <option value='Todos'>Todos</option>
                        {datosAptosPorSector.slice(1).map((item, index) => (
                            <option key={index} value={item[0]}>{item[0]}</option>
                        ))}
                    </select>
                </div>

                {/* Mostrar mensaje de carga, error o gráfico */}
                {loading ? (
                    <p>Cargando datos...</p>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <Chart
                        chartType="ColumnChart"
                        data={combinedData}
                        options={{
                            hAxis: { title: 'Sector' },
                            vAxis: { title: 'Cantidad', minValue: 0 },
                            legend: {
                                position: 'top',
                                textStyle: { fontSize: 10 } // Opcional: puedes cambiar el tamaño de la fuente aquí
                            },
                            bar: { groupWidth: '75%' },
                            isStacked: false,
                            series: {
                                0: { color: '#2dd4bf' }, // Color verde para "Aptos"
                                1: { color: '#f87171' }, // Color rojo para "No Aptos"
                            },
                            annotations: {
                                alwaysOutside: true,
                                textStyle: { fontSize: 12, auraColor: 'none', color: '#555' },
                            },
                            backgroundColor: '#f3f4f6',
                        }}
                        width="100%"
                        height="300px"
                    />
                )}
            </div>

            {/* Modal para pantalla completa */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-4xl xl:h-5/6 h-4/6 relative overflow-hidden flex flex-col justify-between">
                        {/* Botón de cerrar */}
                        <IoIosCloseCircle
                            onClick={toggleModal}
                            className="absolute top-4 right-2 text-2xl">
                            Cerrar
                        </IoIosCloseCircle>

                        {/* Título y selector de sector */}
                        <div className='flex flex-col gap-4 justify-center items-center w-full mb-4'>
                            <div className='flex justify-between items-center w-full mb-4 px-4'>
                                {/* Título centrado */}
                                <p className='font-bold text-2xl flex-grow text-center'>Comparativa sectores</p>
                            </div>

                            {/* Selector de sectores dentro del modal */}
                            <div className='mb-5'>
                                <select
                                    id='sector-select'
                                    className='rounded-lg p-2 bg-gray-200 text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500'
                                    value={sectorSeleccionado}
                                    onChange={handleSectorChange} // Asegúrate de usar el mismo manejador
                                >
                                    <option value='Todos'>Todos</option>
                                    {datosAptosPorSector.slice(1).map((item, index) => (
                                        <option key={index} value={item[0]}>{item[0]}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Gráfica en pantalla completa */}
                        <div className='flex justify-center items-center w-full h-full'>
                            <Chart
                                chartType="ColumnChart"
                                width="100%"
                                height="100%"
                                data={combinedData}
                                options={{
                                    hAxis: { title: 'Sector' },
                                    vAxis: { title: 'Cantidad', minValue: 0 },
                                    legend: {
                                        position: 'top',
                                        textStyle: { fontSize: 10 }
                                    },
                                    bar: { groupWidth: '75%' },
                                    isStacked: false,
                                    series: {
                                        0: { color: '#2dd4bf' }, // Color verde para "Aptos"
                                        1: { color: '#f87171' }, // Color rojo para "No Aptos"
                                    },
                                    annotations: {
                                        alwaysOutside: true,
                                        textStyle: { fontSize: 12, auraColor: 'none', color: '#555' },
                                    },
                                    backgroundColor: '#f3f4f6',
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AptoNoApto;
