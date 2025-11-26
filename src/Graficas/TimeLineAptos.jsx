import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase_config';
import { RiLoader2Line } from "react-icons/ri";
import { MdFullscreen } from "react-icons/md";
import { IoIosCloseCircle } from "react-icons/io";

const CompanyPerformanceChart = ({ filteredLotes }) => {
    const [datosSubactividades, setDatosSubactividades] = useState([]);
    const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const obtenerDatosSubactividades = async (arrayLotes) => {
        try {
            setLoading(true);
            const promesasLotes = arrayLotes.map(async (lote) => {
                const inspeccionesRef = collection(db, `lotes/${lote.id}/inspecciones`);
                const inspeccionesSnapshot = await getDocs(inspeccionesRef);
                const sector = lote.sectorNombre;

                return inspeccionesSnapshot.docs.flatMap((doc) => {
                    const inspeccionData = doc.data();
                    if (inspeccionData.actividades && Array.isArray(inspeccionData.actividades)) {
                        return inspeccionData.actividades.flatMap((actividad) => {
                            if (actividad.subactividades && Array.isArray(actividad.subactividades)) {
                                return actividad.subactividades
                                    .filter((subactividad) => subactividad.fecha && subactividad.resultadoInspeccion)
                                    .map(({ fecha, resultadoInspeccion }) => {
                                        const soloFecha = fecha.split(' ')[0]; // Tomar solo la parte de la fecha
                                        return { fecha: soloFecha, resultadoInspeccion, sector };
                                    });
                            }
                            return [];
                        });
                    }
                    return [];
                });
            });

            const resultados = (await Promise.all(promesasLotes)).flat();
            setDatosSubactividades(resultados);
        } catch (error) {
            console.error('Error al obtener los datos de subactividades:', error);
            setError('Error al cargar los datos. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (filteredLotes.length > 0) {
            obtenerDatosSubactividades(filteredLotes);
        }
    }, [filteredLotes]);

    const procesarDatos = () => {
        const datosPorSector = {};
        const datosAgrupados = {};

        datosSubactividades.forEach(({ fecha, resultadoInspeccion, sector }) => {
            if (!fecha || !resultadoInspeccion || !sector) {
                console.error('Datos incompletos:', { fecha, resultadoInspeccion, sector });
                return;
            }

            if (!datosAgrupados[sector]) {
                datosAgrupados[sector] = {};
            }

            if (!datosAgrupados[sector][fecha]) {
                datosAgrupados[sector][fecha] = { 'Apto': 0, 'No apto': 0 };
            }

            if (resultadoInspeccion === 'Apto') {
                datosAgrupados[sector][fecha]['Apto'] += 1;
            } else if (resultadoInspeccion === 'No apto') {
                datosAgrupados[sector][fecha]['No apto'] += 1;
            }
        });

        Object.keys(datosAgrupados).forEach((sector) => {
            datosPorSector[sector] = [['Fecha', 'Apto', 'No apto']];

            Object.keys(datosAgrupados[sector]).forEach((fecha) => {
                const { 'Apto': apto, 'No apto': noApto } = datosAgrupados[sector][fecha];
                datosPorSector[sector].push([fecha, apto, noApto]);
            });
        });

        return datosPorSector;
    };

    const datosProcesados = procesarDatos();

    const combinarDatos = () => {
        const fechas = [...new Set(datosSubactividades.map(item => item.fecha))];
        const datosCombinados = [['Fecha', 'Apto', 'No apto']];

        fechas.forEach((fecha) => {
            let totalApto = 0;
            let totalNoApto = 0;

            Object.keys(datosProcesados).forEach((sector) => {
                const datosFecha = datosProcesados[sector].find(row => row[0] === fecha);
                if (datosFecha) {
                    totalApto += datosFecha[1];
                    totalNoApto += datosFecha[2];
                }
            });

            datosCombinados.push([fecha, totalApto, totalNoApto]);
        });

        return datosCombinados;
    };

    const calcularMaxValue = (datos) => {
        let maxValue = 0;
        datos.forEach((row, index) => {
            if (index > 0) {
                const valores = row.slice(1);
                valores.forEach(valor => {
                    if (valor > maxValue) {
                        maxValue = valor;
                    }
                });
            }
        });
        return maxValue + 5;
    };

    const datosParaMostrar = sectorSeleccionado === 'Todos' ? combinarDatos() : datosProcesados[sectorSeleccionado] || [['Fecha', 'Apto', 'No apto']];
    const maxValue = calcularMaxValue(datosParaMostrar);

    const generarSeries = (datos) => {
        const seriesOptions = {};
        datos[0].slice(1).forEach((_, index) => {
            if (index % 2 === 0) {
                seriesOptions[index] = { color: '#2dd4bf' }; // Verde para "Apto"
            } else {
                seriesOptions[index] = { color: '#f87171' }; // Rojo para "No apto"
            }
        });
        return seriesOptions;
    };

    const options = {
        hAxis: { title: 'Fecha', format: 'dd/MM/yyyy', slantedText: true, slantedTextAngle: 45 },
        vAxis: { title: 'Cantidad', minValue: 0, maxValue: maxValue, format: '0' },
        legend: { position: 'none' },
        pointSize: 5,
        series: generarSeries(datosParaMostrar),
        backgroundColor: '#f3f4f6',
        chartArea: {
            left: 50,
            right: 30,
            top: 20,
            bottom: 60,
            width: '80%',
            height: '70%'
        }
    };

    const handleSectorChange = (e) => {
        setSectorSeleccionado(e.target.value);
    };

    // Agregar modal de ventana completa
    const [isModalOpen, setIsModalOpen] = useState(false);  // Estado para controlar el modal

    const toggleModal = () => {
        setIsModalOpen(!isModalOpen);  // Función para abrir/cerrar el modal
    };

    return (
        <div className='bg-gray-100 rounded-lg shadow-lg text-gray-500'>
            <div className='flex flex-col gap-2 justify-between items-center w-full mb-1'>
                <div className='w-full bg-gray-200 text-xl p-4 rounded-t-xl flex justify-between items-center'>
                    {/* Contenedor Flex que usa justify-between para separar los elementos */}
                    <p className='font-medium flex-grow text-center'>
                        Timeline (Apto-No apto)
                    </p>
                    {/* Ícono alineado a la derecha */}
                    <MdFullscreen onClick={toggleModal} className='cursor-pointer text-xl' />
                </div>
            </div>

            <div className='py-2 px-4 flex flex-col items-center'>
                <div>
                    <select id='sector-select' className='rounded-lg p-2 bg-gray-200 text-lg'
                        value={sectorSeleccionado} onChange={handleSectorChange}>
                        <option value='Todos'>Todos</option>
                        {Object.keys(datosProcesados).map(sector => (
                            <option key={sector} value={sector}>{sector}</option>
                        ))}
                    </select>
                </div>

                {loading ? (
                    <div className='w-full h-full flex items-start pt-20 justify-center'>
                        <RiLoader2Line className='text-4xl' />
                    </div>
                ) : error ? (
                    <p>{error}</p>
                ) : (
                    <Chart
                        chartType="LineChart"
                        width="100%"
                        height="300px"
                        data={datosParaMostrar}
                        options={options}
                    />
                )}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-4xl xl:h-5/6 h-4/6 relative overflow-hidden flex flex-col justify-between">
                        {/* Botón de cerrar */}
                        <IoIosCloseCircle
                            onClick={toggleModal}
                            className="absolute top-4 right-2 text-2xl">
                            
                        </IoIosCloseCircle>

                        {/* Título y selector de sector */}
                        <div className='flex flex-col gap-4 justify-center items-center w-full mb-4'>
                            <div className='flex justify-between items-center w-full mb-4 px-4'>
                                {/* Título centrado */}
                                <p className='font-bold text-2xl flex-grow text-center'>Timeline (Apto-No apto)</p>
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
                                    {Object.keys(datosProcesados).map(sector => (
                                        <option key={sector} value={sector}>{sector}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Gráfica en pantalla completa */}
                        <div className='flex justify-center items-center w-full h-full'>
                            <Chart
                                chartType="LineChart"
                                width="100%"
                                height="100%"
                                data={datosParaMostrar}
                                options={{
                                    ...options,
                                    chartArea: {
                                        left: 60,  // Ajuste para el margen izquierdo (eje Y)
                                        right: 20, // Ajuste para el margen derecho
                                        top: 20,   // Ajuste para el margen superior
                                        bottom: 80, // Ajuste para el margen inferior (eje X)
                                        width: '90%',
                                        height: '70%'
                                    },
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyPerformanceChart;
