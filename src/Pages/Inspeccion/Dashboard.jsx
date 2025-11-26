/**
 * @file Elemento.jsx
 * @description
 * This component provides a dashboard-like view of inspections data for a construction project.
 * It fetches "lotes" (lots/segments of the project) and displays their inspection progress, aptos (conforming items),
 * and no aptos (non-conforming items). The component allows filtering by various fields (sector, subSector, etc.)
 * and shows different KPIs, charts, and summary data.
 *
 * Key functionalities:
 * - Fetches "lotes" data from Firestore and calculates progress, aptos/no aptos counts per sector.
 * - Provides filters for sector, subSector, parte, elemento, lote, and ppi.
 * - Allows switching views between a table-like view and a cards/graph view.
 * - Displays KPIs such as completed lots, started lots, overall progress percentage.
 * - Integrates multiple custom components: filters, charts, PDF creation, and modal summaries.
 *
 * Complex logic sections are commented inline.
 */

import React, { useEffect, useRef, useState } from 'react';
import { db } from '../../../firebase_config';
import { getDocs, collection } from 'firebase/firestore';
import { FaArrowRight, FaSearch, FaTimes, FaThLarge, FaTable, FaChartPie } from "react-icons/fa";
import { GoHomeFill } from "react-icons/go";
import { Link } from 'react-router-dom';
import { SiBim } from "react-icons/si";
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircle } from "react-icons/io5";


// Importación de componentes personalizados
import GraficaAptosPorSector from '../../Graficas/GraficaAptosPorSector ';
import GraficaNoAptosPorSector from '../../Graficas/GraficaNoAptosPorSector ';
import ResumenPorNivel from '../../Graficas/ResumenPorNivel';
import TargetCard from '../../Graficas/TargetCard';
import FiltrosDashboard from '../../Components/Filtros/FiltrosDashboard';
import TimelineAptos from '../../Graficas/TimeLineAptos';
import GraficaLotesPorSector from '../../Graficas/GraficasLotesPorSector';
import TarjetaNoAptosPorSector from '../../Graficas/TarjetaNoAptosPorSector';

// Importar funciones de utilidades
import { getLotes } from '../../Functions/GetLotes'; // Importar la función de obtención de lotes
import { getInspections } from '../../Functions/GetInspections'; // Importar la función de obtención de inspecciones
import { getNoAptos } from '../../Functions/getNoAptos'; // Importar la función de obtención de inspecciones
import AptoNoApto from '../../Graficas/AptoNoapto';
import ModalResumenSector from '../../Graficas/ModalResumenSector';
import PdfCreator from '../../Components/PdfCreator';


function Elemento() {
    // Navegación para regresar a la página principal
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate('/');
    };



    // State hooks
    const [lotes, setLotes] = useState([]);
    const [filterText, setFilterText] = useState('');
    const [filters, setFilters] = useState({
        sector: '',
        subSector: '',
        parte: '',
        elemento: '',
        lote: '',
        ppi: ''
    });
    const [isTableView, setIsTableView] = useState(true);
    const [showSector, setShowSector] = useState(true);
    const [activeView, setActiveView] = useState('tabla');

    const [uniqueValues, setUniqueValues] = useState({
        sector: [],
        subSector: [],
        parte: [],
        elemento: [],
        lote: [],
        ppi: []
    });

    // States for "No Aptos" counts
    const [noAptosPorSector, setNoAptosPorSector] = useState({});
    const [totalNoAptos, setTotalNoAptos] = useState(0);
    const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos');

    useEffect(() => {
        fetchLotes();
    }, []);

    /**
        * @function fetchLotes
        * Fetches all "lotes" from Firestore and sets up unique values for filtering.
        * Also calculates no aptos by sector using getNoAptos.
        */

    const fetchLotes = async () => {
        try {
            const lotesData = await getLotes();
            setLotes(lotesData);
            setUniqueValues({
                sector: getUniqueValues(lotesData, 'sectorNombre'),
                subSector: getUniqueValues(lotesData, 'subSectorNombre'),
                parte: getUniqueValues(lotesData, 'parteNombre'),
                elemento: getUniqueValues(lotesData, 'elementoNombre'),
                lote: getUniqueValues(lotesData, 'nombre'),
                ppi: getUniqueValues(lotesData, 'ppiNombre')
            });

            // Calculate no aptos data
            const { noAptosPorSector, totalNoAptos } = await getNoAptos(lotesData);
            setNoAptosPorSector(noAptosPorSector);
            setTotalNoAptos(totalNoAptos);
        } catch (error) {
            console.error('Error al obtener los lotes:', error);
        }
    };

    // Extract unique values for dropdown filters
    const getUniqueValues = (data, key) => {
        return [...new Set(data.map(item => item[key]))];
    };

    /**
    * @function handleCaptrurarTrazabilidad
    * Saves selected lot information (such as sector, parte, elemento, etc.) into localStorage
    * for future reference or navigation to a different page.
    */

    const handleCaptrurarTrazabilidad = (l) => {
        localStorage.setItem('sector', l.sectorNombre || '');
        localStorage.setItem('subSector', l.subSectorNombre || '');
        localStorage.setItem('parte', l.parteNombre || '');
        localStorage.setItem('elemento', l.elementoNombre || '');
        localStorage.setItem('lote', l.nombre || '');
        localStorage.setItem('loteId', l.id || '');
        localStorage.setItem('ppi', l.ppiNombre || '');
        localStorage.setItem('pkInicial', l.pkInicial || '');
        localStorage.setItem('pkFinal', l.pkFinal || '');
    };

    // Handle filter text input
    const handleFilterChange = (e) => {
        setFilterText(e.target.value);
    };

    // Handle dropdown filters
    const handleSelectChange = (e) => {
        const { name, value } = e.target;
        setFilters(prevFilters => ({
            ...prevFilters,
            [name]: value
        }));
    };

    // Clear all filters
    const handleClearFilters = () => {
        setFilters({
            sector: '',
            subSector: '',
            parte: '',
            elemento: '',
            lote: '',
            ppi: ''
        });
        setFilterText(''); // Limpiar el texto de filtro
    };


    /**
     * @constant filteredLotes
     * Filters the lotes based on text search and selected filters.
     * Complex logic:
     * - Matches lot names or PPI names to filterText.
     * - Checks each filter (sector, subSector, etc.) if applied.
     */

    const filteredLotes = lotes.filter(l =>
        (l.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
            l.ppiNombre.toLowerCase().includes(filterText.toLowerCase())) &&
        (filters.sector === '' || l.sectorNombre === filters.sector) &&
        (filters.subSector === '' || l.subSectorNombre === filters.subSector) &&
        (filters.parte === '' || l.parteNombre === filters.parte) &&
        (filters.elemento === '' || l.elementoNombre === filters.elemento) &&
        (filters.lote === '' || l.nombre === filters.lote) &&
        (filters.ppi === '' || l.ppiNombre === filters.ppi)
    );

    // Calculate overall progress
    const calcularProgresoGeneral = () => {
        const totalLotes = filteredLotes.length;
        const progresoTotal = filteredLotes.reduce((sum, lote) => {
            const avance = (lote.actividadesAptas || 0) / lote.totalSubactividades;
            return sum + (avance * 100);
        }, 0);
        return (progresoTotal / totalLotes).toFixed(2);
    };


    /**
    * @function obtenerDatosAptosPorSector
    * Aggregates aptos count by sector to feed into charts.
    */

    const obtenerDatosAptosPorSector = () => {
        const data = [['Sector', 'Aptos']];
        uniqueValues.sector.forEach(sector => {
            const lotesPorSector = filteredLotes.filter(l => l.sectorNombre === sector);
            let aptos = 0;
            lotesPorSector.forEach(lote => {
                aptos += lote.actividadesAptas || 0;
            });
            data.push([sector, aptos]);
        });
        return data;
    };

    /**
       * @function obtenerDatosNoAptosPorSector
       * Aggregates no aptos count by sector.
       */

    const obtenerDatosNoAptosPorSector = () => {
        const data = [['Sector', 'No Aptos']];
        uniqueValues.sector.forEach(sector => {
            const lotesPorSector = filteredLotes.filter(l => l.sectorNombre === sector);
            let noAptos = 0;
            lotesPorSector.forEach(lote => {
                if (lote.totalSubactividades > 0 && (lote.actividadesAptas > 0 || lote.actividadesNoAptas > 0)) {
                    noAptos += lote.actividadesNoAptas || 0;
                }
            });
            data.push([sector, noAptos]);
        });
        return data;
    };

    // Count aptos/no aptos per given level (e.g., sector, subSector)
    const contarAptos = (nivel, valor) => {
        return filteredLotes
            .filter(l => l[nivel] === valor)
            .reduce((sum, lote) => sum + (lote.actividadesAptas || 0), 0);
    };

    const contarNoAptos = (nivel, valor) => {
        return filteredLotes
            .filter(l => l[nivel] === valor)
            .reduce((sum, lote) => sum + (lote.actividadesNoAptas || 0), 0);
    };

    // Calculate progress for a given level (sector, etc.)
    const calcularProgresoPorNivel = (nivel, valor) => {
        const totalSubactividades = filteredLotes
            .filter(l => l[nivel] === valor)
            .reduce((sum, lote) => sum + lote.totalSubactividades, 0);

        const actividadesAptas = contarAptos(nivel, valor);

        return totalSubactividades > 0
            ? ((actividadesAptas / totalSubactividades) * 100).toFixed(2)
            : 0;
    };

    // KPI calculations

    const totalLotes = lotes.filter(l => l.ppiNombre).length;
    const lotesIniciados = lotes.filter(l =>
        (l.actividadesAptas > 0 || l.actividadesNoAptas > 0) && l.totalSubactividades > 0
    ).length;

    const datosAptosPorSector = obtenerDatosAptosPorSector();
    const datosNoAptosPorSector = obtenerDatosNoAptosPorSector();

    const totalAptos = datosAptosPorSector.slice(1).reduce((sum, sector) => sum + sector[1], 0);

    // Percentage of completed inspections
    const calcularPorcentajeInspeccionesCompletadas = () => {
        if (totalLotes === 0) return 0;
        return ((lotesIniciados / totalLotes) * 100).toFixed(2);
    };

    const porcentajeInspeccionesCompletadas = calcularPorcentajeInspeccionesCompletadas();

    // Percentage of aptos items
    const totalSubactividadesInspeccionadas = filteredLotes.reduce((sum, lote) => sum + (lote.totalSubactividades || 0), 0);
    const totalSubactividadesAptas = filteredLotes.reduce((sum, lote) => sum + (lote.actividadesAptas || 0), 0);

    const calcularPorcentajeElementosAptos = () => {
        if (totalSubactividadesInspeccionadas === 0) return 0;
        return ((totalSubactividadesAptas / totalSubactividadesInspeccionadas) * 100).toFixed(2);
    };


    // Pending inspections
    const totalInspecciones = lotes.length; // Total de lotes o inspecciones disponibles
    const inspeccionesPendientes = totalInspecciones - lotesIniciados;

    const calcularPorcentajeInspeccionesPendientes = () => {
        if (totalLotes === 0) return 0;
        return ((inspeccionesPendientes / totalLotes) * 100).toFixed(2);
    };


    /**
      * @function calcularProgresoGeneralObra
      * Aggregates the progress of all filtered lots to find the average completion percentage.
      * Complex logic: Sums up ratio of aptas/totalSubactividades for each lote and averages it.
      */

    const calcularProgresoGeneralObra = () => {
        const totalProgreso = filteredLotes.reduce((sum, lote) => {
            const progresoLote = (lote.actividadesAptas || 0) / (lote.totalSubactividades || 1);
            return sum + progresoLote;
        }, 0);

        if (filteredLotes.length === 0) return 0;
        return ((totalProgreso / filteredLotes.length) * 100).toFixed(2);
    };

    const progresoGeneralObra = calcularProgresoGeneralObra();


    // Count completed inspections (all subactivities aptas)
    const contarInspeccionesTerminadas = () => {
        return filteredLotes.filter(lote => {
            return lote.totalSubactividades > 0 &&
                lote.actividadesAptas === lote.totalSubactividades;
        }).length;
    };

    // Inspections finished
    const inspeccionesTerminadas = contarInspeccionesTerminadas();


    // Verifify if selctor is selected
    const isSectorSelected = filters.sector !== '';



    // Modal and chart references
    const [isModalOpen, setIsModalOpen] = useState(false);
    // Función para abrir el modal
    const handleOpenModal = (sector) => {
        setSectorSeleccionado(sector); // Establece el sector seleccionado
        setIsModalOpen(true); // Abre el modal
    };

    // Close modal
    const handleCloseModal = () => {
        setIsModalOpen(false); // Cierra el modal
        setSectorSeleccionado(''); // Reinicia el sector seleccionado
    };
    // Graphs
    const timelineRef = useRef(null);
    const aptoNoAptoRef = useRef(null);
    const graficaLotesRef = useRef(null);

    const sectorsData = uniqueValues.sector.map((sector) => {
        const lotesPorSector = filteredLotes.filter(l => l.sectorNombre === sector);

        const aptos = lotesPorSector.reduce((sum, lote) => sum + (lote.actividadesAptas || 0), 0);
        const noAptos = lotesPorSector.reduce((sum, lote) => sum + (lote.actividadesNoAptas || 0), 0);
        const total = lotesPorSector.reduce((sum, lote) => sum + (lote.totalSubactividades || 0), 0);

        return {
            name: sector,
            aptos,
            noAptos,
            total,
        };
    });


    return (
        <div className='container mx-auto min-h-screen xl:px-14 py-2'>
            {/* Barra de navegación */}
            <div className='flex items-center justify-between bg-white px-5 py-3 text-base'>
                <div className='flex gap-2 items-center'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'/'}>
                        <h1 className='text-gray-500'>Home</h1>
                    </Link>
                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'#'}>
                        <h1 className='font-medium text-amber-600'>Inspección</h1>
                    </Link>
                </div>
                <div className='flex items-center gap-4'>

                    <div className='flex gap-3'>
                        <div >
                            <Link to={'/visor_inspeccion'}>
                                <button className='text-white bg-sky-600 flex items-center px-4 py-2 rounded-lg'>
                                    <span className='text-2xl'><SiBim /> </span>
                                </button>
                            </Link>
                        </div>
                    </div>



                    <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>

                </div>
            </div>

            <div className='w-full border-b-2 border-gray-200'></div>


            <div className='flex flex-col items-start justify-center mt-2 bg-white p-4 rounded-xl'>
                <div className='flex justify-between w-full gap-4'>

                    <FiltrosDashboard
                        filters={filters}
                        uniqueValues={uniqueValues}
                        filterText={filterText}
                        onFilterChange={handleFilterChange}
                        onSelectChange={handleSelectChange}
                        onClearFilters={handleClearFilters}
                    />

                    <PdfCreator
                        progresoGeneralObra={progresoGeneralObra}
                        inspeccionesTerminadas={inspeccionesTerminadas}
                        totalLotes={totalLotes}
                        lotesIniciados={lotesIniciados}
                        porcentajeInspeccionesCompletadas={porcentajeInspeccionesCompletadas}
                        timelineRef={timelineRef}
                        aptoNoAptoRef={aptoNoAptoRef}
                        graficaLotesRef={graficaLotesRef}
                        sectorsData={sectorsData} // Pasa la información de los sectores aquí
                    /></div>
                {/* Filtros para la vista de gráficos */}


                <div className='w-full'>
                    <div className='my-5 grid xl:grid-cols-4 grid-cols-1 gap-5'>
                        {/* TargetCards para mostrar métricas generales */}
                        <TargetCard
                            title="Total aptos (Progreso):"
                            value={`${progresoGeneralObra}%`}
                        />
                        <TarjetaNoAptosPorSector filteredLotes={filteredLotes} />


                        {!isSectorSelected && (
                            <>

                                <TargetCard title="Lotes completados:"
                                    value={
                                        <div>{inspeccionesTerminadas}</div>
                                    }
                                    message={
                                        <div>{`Lotes totales: ${totalLotes}`}</div>
                                    } />

                                <TargetCard
                                    title="Lotes iniciados:"
                                    value={
                                        <div>{`${lotesIniciados}`}</div>
                                    }
                                    message={
                                        <div>{`Porcentaje: ${porcentajeInspeccionesCompletadas} %`}</div>
                                    }
                                />

                            </>
                        )}

                    </div>

                    {/* Gráficos y mapa */}

                    <div className='grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4'>


                        <div className='xl:col-span-2' ref={timelineRef}>
                            <TimelineAptos filteredLotes={filteredLotes} getInspections={getInspections} />
                        </div>
                        <div className='xl:col-span-1' ref={aptoNoAptoRef}>
                            <AptoNoApto datosAptosPorSector={datosAptosPorSector} filteredLotes={filteredLotes} />
                        </div>
                        <div className='xl:col-span-1' ref={graficaLotesRef}>
                            <GraficaLotesPorSector lotes={lotes} filteredLotes={filteredLotes} />
                        </div>



                    </div>
                </div>

                {/* Resumen por nivel */}
                <ResumenPorNivel
                    nivel="sector"
                    titulo="Resumen de Todos los Sectores"
                    uniqueValues={uniqueValues} // Asegúrate de pasar los valores únicos correctamente
                    calcularProgresoPorNivel={calcularProgresoPorNivel}
                    contarAptos={contarAptos}
                    contarNoAptos={contarNoAptos}
                    onClick={handleOpenModal} // Pasa la función como prop
                />

                {/* Modal de Resumen de Sector */}
                <ModalResumenSector
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    sectorSeleccionado={sectorSeleccionado}
                    datosAptosPorSector={datosAptosPorSector} filteredLotes={filteredLotes} lotes={lotes}
                    getInspections={getInspections}
                    calcularProgresoPorNivel={calcularProgresoPorNivel}
                />
            </div>



        </div>
    );
}

export default Elemento;
