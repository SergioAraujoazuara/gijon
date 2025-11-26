import React from 'react';
import { IoIosCloseCircle } from "react-icons/io"; // Icono de cerrar
import AptoNoApto from '../Graficas/AptoNoapto'; // Asegúrate de importar los componentes correctos
import GraficaLotesPorSector from '../Graficas/GraficasLotesPorSector';
import TimelineAptos from '../Graficas/TimeLineAptos';
import ProgressBar from './ProgressBar'; // Importa el componente ProgressBar

const ModalResumenSector = ({ isOpen, onClose, sectorSeleccionado, filteredLotes, datosAptosPorSector, lotes, getInspections, calcularProgresoPorNivel }) => {
    if (!isOpen) return null; // Si el modal no está abierto, no renderizar nada

    // Filtrar los lotes por el sector seleccionado
    const lotesFiltradosPorSector = filteredLotes.filter(lote => lote.sectorNombre === sectorSeleccionado);

    // Filtrar los datos aptos por sector
    const datosAptosPorSectorFiltrados = [['Sector', 'Aptos']]; // Mantén la estructura de datos para la gráfica
    datosAptosPorSector.slice(1).forEach(([sector, aptos]) => {
        if (sector === sectorSeleccionado) {
            datosAptosPorSectorFiltrados.push([sector, aptos]);
        }
    });

    // Calcular el progreso del sector seleccionado
    const progresoSector = calcularProgresoPorNivel('sectorNombre', sectorSeleccionado);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 text-gray-500">
            <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-8xl h-5/6 relative overflow-y-auto flex flex-col">
                {/* Botón de cerrar */}
                <IoIosCloseCircle
                    onClick={onClose}
                    className="absolute top-4 right-4 text-2xl cursor-pointer hover:text-red-500"
                />

                {/* Título del modal */}
                <h2 className="text-2xl font-bold text-center mb-4">{`${sectorSeleccionado}`}</h2>

                {/* Barra de Progreso del Sector */}
                <div className="mb-6">
                    <ProgressBar progreso={progresoSector} />
                </div>

                {/* Contenido del modal: Gráficas y Tarjetas */}
                <div className='grid grid-cols-1 xl:grid-cols-4 gap-6 mb-4'>
                    {/* Gráficas */}
                    <div className='xl:col-span-2'>
                        <TimelineAptos filteredLotes={lotesFiltradosPorSector} getInspections={getInspections} />
                    </div>
                    <div className='xl:col-span-1'>
                        <AptoNoApto datosAptosPorSector={datosAptosPorSectorFiltrados} filteredLotes={lotesFiltradosPorSector} />
                    </div>
                    <div className='xl:col-span-1'>
                        <GraficaLotesPorSector lotes={lotes} filteredLotes={lotesFiltradosPorSector} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalResumenSector;
