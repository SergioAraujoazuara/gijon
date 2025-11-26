import React, { useState } from 'react';
import { Chart } from "react-google-charts";

const GraficaAptosPorSector = ({ datosAptosPorSector }) => {
    // Estado para el sector seleccionado
    const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos');

    // Color verde empresarial para todas las barras
    const colorVerde = '#14b8a6';

    // Filtrar datos según el sector seleccionado
    const datosFiltrados = sectorSeleccionado === 'Todos'
        ? datosAptosPorSector.slice(1) // Mostrar todos los sectores
        : datosAptosPorSector.slice(1).filter(item => item[0] === sectorSeleccionado); // Filtrar por sector seleccionado

    // Transformar datos para la gráfica
    const data = [
        ['Sector', 'Aptos', { role: 'style' }],
        ...datosFiltrados.map((item) => [item[0], item[1], `color: ${colorVerde}`]) // Usar el mismo color verde para todas las barras
    ];

    // Manejar cambios en el filtro de sector
    const handleSectorChange = (e) => {
        setSectorSeleccionado(e.target.value);
    };

    return (
        <div className='bg-gray-100 p-4 rounded-lg shadow-lg flex flex-col items-start text-gray-600'>
            {/* Filtro de sector */}
            <div className='flex justify-between items-center w-full mb-1'>
                <p className='font-medium'>Aptos por sector</p>
                <select id='sector-select' className='rounded-lg p-1 bg-gray-200' value={sectorSeleccionado} onChange={handleSectorChange}>
                    <option value='Todos'>Todos</option>
                    {datosAptosPorSector.slice(1).map((item, index) => (
                        <option key={index} value={item[0]}>{item[0]}</option>
                    ))}
                </select>
            </div>

            {/* Gráfico de columnas (ColumnChart) */}
            <Chart
                chartType="ColumnChart" // Cambiado de BarChart a ColumnChart
                data={data}
                options={{
                    hAxis: {  // Ahora hAxis es el eje X, que muestra los sectores
                        title: 'Sector',
                    },
                    vAxis: {  // vAxis es el eje Y, que muestra los valores de "Aptos"
                        title: 'Aptos',
                        minValue: 0,
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
                height="200px"
            />
        </div>
    );
};

export default GraficaAptosPorSector;
