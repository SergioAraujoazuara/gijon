import React, { useState } from 'react';
import VerPpis from './VerPpis';  // El componente que ya tienes para ver los PPIs
import CopiarPpi from './CopiarPpi';  // El componente para copiar un PPI
import { Link } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import { GoHomeFill } from "react-icons/go";
import { FaEdit } from "react-icons/fa";
import { MdDeleteOutline } from "react-icons/md";
import { IoCloseCircle } from "react-icons/io5";
import { useNavigate } from 'react-router-dom';
import { IoArrowBackCircle } from "react-icons/io5";
import { IoAlertCircleSharp } from "react-icons/io5";

function TabsPpi() {
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate('/admin'); // Esto navega hacia atrás en la historia
    };
    // Estado para gestionar la pestaña seleccionada
    const [selectedTab, setSelectedTab] = useState('verPpis');

    // Función para cambiar la pestaña seleccionada
    const handleTabChange = (tab) => {
        setSelectedTab(tab);
    };

    return (
        <div className="container mx-auto min-h-screen xl:px-14 py-2 text-gray-500">
            <div className='flex gap-2 items-center justify-between px-4 py-3 text-base'>
                {/* Header Navigation */}
                <div className='flex gap-2 items-center'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'/admin'}>
                        <h1 className='text-gray-500 text-gray-500'>Administración</h1>
                    </Link>
                    <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
                    <Link to={'/verPpis'}>
                        <h1 className='text-amber-500 font-medium'>Plantillas PPI</h1>
                    </Link>
                </div>
                <div className='flex items-center'>
                    <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>

                </div>
            </div>
            <div className='w-full border-b-2 border-gray-200'></div>

            {/* Tabs */}
            <div className="flex  border-gray-300 mt-5">
                <button
                    className={`px-4 py-2 text-sm font-medium ${selectedTab === 'verPpis' ? 'border-b-2 border-amber-500' : ''}`}
                    onClick={() => handleTabChange('verPpis')}
                >
                    Ver PPIs
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium ${selectedTab === 'copiarPpi' ? 'border-b-2 border-amber-500' : ''}`}
                    onClick={() => handleTabChange('copiarPpi')}
                >
                    Copiar PPI
                </button>
            </div>

            {/* Renderiza el componente según la pestaña seleccionada */}
            {selectedTab === 'verPpis' && <VerPpis />}
            {selectedTab === 'copiarPpi' && <CopiarPpi />}
        </div>
    );
}

export default TabsPpi;
