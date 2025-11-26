import React, { useEffect, useState } from 'react';
import { Chart } from 'react-google-charts';
import { MdFullscreen, MdFullscreenExit } from 'react-icons/md'; // Importar íconos
import { IoIosCloseCircle } from "react-icons/io";

const GraficaLotesPorSector = ({ filteredLotes }) => {
  const [datosLotesPorSector, setDatosLotesPorSector] = useState([]);
  const [sectorSeleccionado, setSectorSeleccionado] = useState('Todos'); // Estado para el filtro de sector
  const [isModalOpen, setIsModalOpen] = useState(false); // Estado para controlar el modal

  // Lista de colores para las barras
  const colors = ['#fcd34d', '#7dd3fc', '#a5b4fc', '#f9a8d4', '#5eead4', '#bef264', '#fca5a5', '#fdba74'];

  // Función para calcular el número de lotes por sector
  const calcularLotesPorSector = () => {
    const lotesPorSector = {};

    // Filtrar los lotes según el sector seleccionado
    const lotesFiltrados = sectorSeleccionado === 'Todos' ? filteredLotes : filteredLotes.filter(lote => lote.sectorNombre === sectorSeleccionado);

    lotesFiltrados.forEach(lote => {
      const sector = lote.sectorNombre || 'Sin sector';
      if (!lotesPorSector[sector]) {
        lotesPorSector[sector] = 0;
      }
      lotesPorSector[sector] += 1;
    });

    // Formatear datos para Google Charts
    const data = [['Sector', 'Número de Lotes', { role: 'style' }]];  // Añadir la columna para estilos de color
    Object.entries(lotesPorSector).forEach(([sector, count], index) => {
      data.push([sector, count, `color: ${colors[index % colors.length]}`]);  // Asignar color de forma cíclica
    });

    return data;
  };

  useEffect(() => {
    if (filteredLotes.length > 0) {
      const data = calcularLotesPorSector();
      setDatosLotesPorSector(data);
    }
  }, [filteredLotes, sectorSeleccionado]); // Dependencia del filtro de sector

  // Calcular el valor máximo para el eje Y con un margen adicional
  const calcularMaxValue = (data) => {
    const maxValue = Math.max(...data.slice(1).map(row => row[1])); // Obtener el valor máximo de los lotes
    return maxValue + 2; // Agregar un margen de 2
  };

  const maxValue = datosLotesPorSector.length > 1 ? calcularMaxValue(datosLotesPorSector) : 10; // Establecer un valor predeterminado si no hay datos

  // Manejar cambios en el filtro de sector
  const handleSectorChange = (e) => {
    setSectorSeleccionado(e.target.value);
  };

  // Obtener los sectores únicos para el filtro
  const obtenerSectoresUnicos = () => {
    const sectores = [...new Set(filteredLotes.map(lote => lote.sectorNombre || 'Sin sector'))];
    return ['Todos', ...sectores]; // Agregar 'Todos' como opción predeterminada
  };

  // Función para abrir/cerrar el modal
  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
  };

  return (
    <div className='bg-gray-100 text-gray-500 rounded-lg shadow-lg'>
      {/* Filtro de sector */}
      <div className='flex flex-col gap-2 justify-between items-center w-full mb-1'>
        <div className='w-full bg-gray-200 p-2 rounded-t-xl flex justify-between items-center'>
          <p className='font-medium flex-grow text-center text-xl'>Lotes por sector</p>
          {/* Botón de pantalla completa */}
          <MdFullscreen onClick={toggleModal} className='cursor-pointer text-gray-600 text-2xl hover:text-gray-800 transition' />
        </div>
      </div>

      <div className='py-2 px-4 flex flex-col h-full justify-center'>
        <div className='flex flex-col gap-2 justify-between items-center w-full mb-1'>
          <select id='sector-select' className='rounded-lg p-2 bg-gray-200 text-lg' value={sectorSeleccionado} onChange={handleSectorChange}>
            {obtenerSectoresUnicos().map(sector => (
              <option key={sector} value={sector}>{sector}</option>
            ))}
          </select>
        </div>

        {/* Gráfico de columnas para el número de lotes por sector */}
        <Chart
          chartType="ColumnChart"
          width="100%"
          height="300px"
          data={datosLotesPorSector}
          options={{
            hAxis: { title: 'Sector' },
            vAxis: { title: 'Número de Lotes', minValue: 0, maxValue: maxValue, format: '0' }, // Configurar maxValue dinámicamente
            legend: { position: 'none' },
            backgroundColor: '#f3f4f6', // Fondo del gráfico completo
          }}
        />
      </div>

      {/* Modal para pantalla completa */}
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
                <p className='font-bold text-2xl flex-grow text-center'>Lotes por sector</p>
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
                  {obtenerSectoresUnicos().map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
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
                data={datosLotesPorSector}
                options={{
                  hAxis: { title: 'Sector' },
                  vAxis: { title: 'Número de Lotes', minValue: 0, maxValue: maxValue, format: '0' },
                  legend: { position: 'none' },
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

export default GraficaLotesPorSector;
