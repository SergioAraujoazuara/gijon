import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Chart } from 'react-google-charts';
import Modal from 'react-modal';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './App.css';

// Ajustar la URL de los iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

Modal.setAppElement('#root');

const markers = [
  { id: 1, position: [40.4168, -3.7038], title: 'Puente A', chartData: [['Fecha', 'Temperatura'], ['2023-01-01', 20], ['2023-01-02', 22], ['2023-01-03', 23], ['2023-01-04', 25]] },
  { id: 2, position: [41.3851, 2.1734], title: 'Puente B', chartData: [['Fecha', 'Temperatura'], ['2023-01-01', 18], ['2023-01-02', 19], ['2023-01-03', 21], ['2023-01-04', 26]] },
  { id: 3, position: [39.4699, -0.3763], title: 'Puente C', chartData: [['Fecha', 'Temperatura'], ['2023-01-01', 16], ['2023-01-02', 17], ['2023-01-03', 19], ['2023-01-04', 20]] },
  { id: 4, position: [37.7749, -4.8970], title: 'Puente D', chartData: [['Fecha', 'Temperatura'], ['2023-01-01', 21], ['2023-01-02', 22], ['2023-01-03', 24], ['2023-01-04', 27]] },
  { id: 5, position: [36.7213, -4.4214], title: 'Puente E', chartData: [['Fecha', 'Temperatura'], ['2023-01-01', 19], ['2023-01-02', 20], ['2023-01-03', 22], ['2023-01-04', 23]] },
];

const App = () => {
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [filter, setFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All');
  const [chartType, setChartType] = useState('LineChart');
  const [temperatureThreshold, setTemperatureThreshold] = useState(25);

  useEffect(() => {
    // Fetch data from the Flask API
    fetch('http://127.0.0.1:5000/sql/print_results')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log(data); // Log the fetched data to the console
      })
      .catch(error => {
        console.error("Error fetching data from the API:", error);
      });
  }, []);

  const handleMarkerClick = (marker) => {
    setSelectedMarker(marker);
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
    setSelectedMarker(null);
  };

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
  };

  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
  };

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  const handleTemperatureThresholdChange = (event) => {
    setTemperatureThreshold(Number(event.target.value));
  };

  const filteredMarkers = filter === 'All' ? markers : markers.filter(marker => marker.title === filter);

  const aggregatedData = (data) => {
    const result = [['Fecha', 'Temperatura']];
    data.forEach(marker => {
      marker.chartData.slice(1).forEach(([date, temperature]) => {
        if (dateFilter === 'All' || date === dateFilter) {
          const existing = result.find(([cat]) => cat === date);
          if (existing) {
            existing[1] = Math.max(existing[1], temperature); // Mostrar la temperatura máxima del día
          } else {
            result.push([date, temperature]);
          }
        }
      });
    });
    return result;
  };

  const uniqueDates = [...new Set(markers.flatMap(marker => marker.chartData.slice(1).map(([date]) => date)))];

  return (
    <div className="app">
      <div className="header">
        <h1>Dashboard de Sensores de Temperatura en Puentes</h1>
      </div>
      <div className="filters">
        <div className="filter-container">
          <label htmlFor="locationFilter">Filtrar por Ubicación: </label>
          <select id="locationFilter" value={filter} onChange={handleFilterChange}>
            <option value="All">Todos</option>
            {markers.map(marker => (
              <option key={marker.id} value={marker.title}>{marker.title}</option>
            ))}
          </select>
        </div>
        <div className="filter-container">
          <label htmlFor="dateFilter">Filtrar por Fecha: </label>
          <select id="dateFilter" value={dateFilter} onChange={handleDateFilterChange}>
            <option value="All">Todas</option>
            {uniqueDates.map(date => (
              <option key={date} value={date}>{date}</option>
            ))}
          </select>
        </div>
        <div className="filter-container">
          <label htmlFor="chartType">Tipo de Gráfico: </label>
          <select id="chartType" value={chartType} onChange={handleChartTypeChange}>
            <option value="LineChart">Gráfico de Líneas</option>
            <option value="BarChart">Gráfico de Barras</option>
            <option value="ColumnChart">Gráfico de Columnas</option>
          </select>
        </div>
        <div className="filter-container">
          <label htmlFor="temperatureThreshold">Umbral de Temperatura: </label>
          <input
            id="temperatureThreshold"
            type="number"
            value={temperatureThreshold}
            onChange={handleTemperatureThresholdChange}
          />
        </div>
      </div>
      <div className="content">
        <div className="map-container">
          <MapContainer
            center={[40.4168, -3.7038]}
            zoom={6}
            style={{ height: '600px', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {filteredMarkers.map((marker) => (
              <Marker
                key={marker.id}
                position={marker.position}
                eventHandlers={{
                  click: () => {
                    handleMarkerClick(marker);
                  },
                }}
              >
                <Popup>{marker.title}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
        <div className="charts-container">
          <div className="data-table">
            <table>
              <thead>
                <tr>
                  <th>Puente</th>
                  <th>Temperatura Máxima</th>
                </tr>
              </thead>
              <tbody>
                {filteredMarkers.map((marker) => {
                  const maxTemp = Math.max(...marker.chartData.slice(1).map(([date, temp]) => temp));
                  return (
                    <tr key={marker.id} style={{ color: maxTemp > temperatureThreshold ? 'red' : 'black' }}>
                      <td>{marker.title}</td>
                      <td>{maxTemp}°C</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="chart">
            <Chart
              chartType={chartType}
              width="100%"
              height="300px"
              data={aggregatedData(filteredMarkers)}
              options={{
                title: 'Temperatura Máxima por Fecha',
                series: {
                  0: { color: temperatureThreshold ? '#FF0000' : '#0000FF' }
                }
              }}
            />
          </div>
        </div>
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Datos del Sensor de Temperatura"
        className="modal"
        overlayClassName="overlay"
      >
        {selectedMarker && (
          <div>
            <div className="modal-header">
              <h2>{selectedMarker.title} - Datos de Temperatura</h2>
              <button onClick={closeModal} className="close-button">Cerrar</button>
            </div>
            <div className="modal-content">
              <div className="chart-item">
                <Chart
                  chartType="LineChart"
                  width="100%"
                  height="200px"
                  data={selectedMarker.chartData}
                  options={{
                    title: 'Temperatura Distribución',
                    series: {
                      0: { color: temperatureThreshold ? '#FF0000' : '#0000FF' }
                    }
                  }}
                />
              </div>
              <div className="chart-item">
                <Chart
                  chartType="BarChart"
                  width="100%"
                  height="200px"
                  data={selectedMarker.chartData}
                  options={{
                    title: 'Comparación de Temperaturas',
                    hAxis: { title: 'Fecha' },
                    vAxis: { title: 'Temperatura (°C)' },
                  }}
                />
              </div>
              <div className="chart-item">
                <Chart
                  chartType="ColumnChart"
                  width="100%"
                  height="200px"
                  data={selectedMarker.chartData}
                  options={{
                    title: 'Temperatura por Fecha',
                    hAxis: { title: 'Fecha' },
                    vAxis: { title: 'Temperatura (°C)' },
                  }}
                />
              </div>
              <div className="chart-item">
                <Chart
                  chartType="LineChart"
                  width="100%"
                  height="200px"
                  data={selectedMarker.chartData}
                  options={{
                    title: 'Temperatura en el Tiempo (Eje Y Invertido)',
                    hAxis: { title: 'Fecha' },
                    vAxis: { title: 'Temperatura (°C)', direction: -1 }, // Invertir eje Y
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default App;
