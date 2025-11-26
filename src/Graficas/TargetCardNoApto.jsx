import React from 'react';
import TargetCard from '../Graficas/TargetCard'; // Asegúrate de tener este componente para reutilizar estilos o contenido si es necesario
import { RiCalendarCloseLine } from "react-icons/ri";

const TargetCardNoApto = ({ title, value, message, icon }) => {
    return (
        <div className="flex flex-col justify-center items-center text-center px-8 py-4 bg-gray-200 rounded-lg shadow-lg">
            {/* Icono y título */}
            <div className="text-sm font-semibold text-gray-600 flex items-center gap-2">
                <span>
                    <RiCalendarCloseLine className='text-red-800 text-lg'/> {/* Mostrar el icono proporcionado */}
                </span>
                <span className='text-red-800'>{title}: </span>
                <span className='text-red-800'> {value}</span>
               
            </div>

            {/* Valor principal (número de no aptos) */}
            <div className="text-xl font-bold text-red-800">
               
            </div>

            {/* Mensaje adicional */}
            <div className="text-md font-light text-red-800 text-sm mt-2">
                {message}
            </div>
        </div>
    );
};

export default TargetCardNoApto;
