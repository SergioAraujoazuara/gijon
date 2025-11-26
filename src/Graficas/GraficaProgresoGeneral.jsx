import React from 'react';
import { Chart } from "react-google-charts";

const GraficaProgresoGeneral = ({ progresoGeneral }) => {
    return (
        <div className='bg-white p-4 rounded-lg shadow-lg'>
            <Chart
                chartType="PieChart"
                data={[
                    ['Progreso', 'Porcentaje'],
                    ['Completo', parseFloat(progresoGeneral)],
                    ['Pendiente', 100 - parseFloat(progresoGeneral)]
                ]}
                options={{
                    title: 'Progreso General de la Obra',
                    pieHole: 0.4,
                    slices: [
                        { color: '#4CAF50' },  // Green for progress
                        { color: '#F0F0F0' }   // Light gray for remaining
                    ],
                    legend: { 
                        position: 'bottom',
                        textStyle: {
                            fontSize: 14,
                            color: '#333',  // Darker text for better visibility
                        }
                    },
                    pieSliceText: 'percentage',  // Show percentage on the slices
                    pieSliceTextStyle: {
                        fontSize: 16,  // Larger font size for slice text
                        color: '#000',  // Black text for better contrast
                    },
                    tooltip: {
                        textStyle: {
                            fontSize: 14,  // Consistent tooltip text size
                            color: '#555',  // Darker tooltip text
                        }
                    }
                }}
                width="100%"
                height="250px"
            />
        </div>
    );
};

export default GraficaProgresoGeneral;
