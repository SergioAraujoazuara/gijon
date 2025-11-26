import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * MapWithButton Component
 *
 * This component renders a map interface for selecting geographic coordinates.
 * It includes a modal-style layout with options to save or cancel the selection.
 *
 * @param {Function} onCoordinatesCaptured - Callback function to pass the selected coordinates to the parent component.
 */

const MapWithButton = ({ onCoordinatesCaptured }) => {
  const [selectedCoordinates, setSelectedCoordinates] = useState(null);

  /**
   * Handles saving the selected coordinates.
   * Logs the coordinates to the console and invokes the callback with the selected coordinates.
   */
  const handleSaveCoordinates = () => {
    if (selectedCoordinates) {
      console.log("Coordenadas guardadas:", selectedCoordinates); // Imprimir coordenadas en la consola
      onCoordinatesCaptured(selectedCoordinates); // Pasar las coordenadas seleccionadas al padre
    }
  };

    /**
   * ClickHandler Component
   *
   * A component to handle map click events and capture the clicked coordinates.
   */
  const ClickHandler = () => {
    useMapEvents({
      click(e) {
        const coords = e.latlng;
        console.log("Coordenadas seleccionadas:", coords); // Imprimir coordenadas en la consola
        setSelectedCoordinates(coords); // Capturar coordenadas del clic
      },
    });
    return null;
  };

  return (
    <div>
      {/* Modal map */}
      <div className="fixed inset-0 bg-gray-800 bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white w-11/12 md:w-3/4 h-3/4 rounded-md shadow-md overflow-hidden">
          <h2 className="text-lg font-bold p-4 text-center">Selecciona la ubicación</h2>
          <div style={{ height: "70%", width: "100%" }}>
            <MapContainer
              center={[51.505, -0.09]} 
              zoom={13}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickHandler />
              {selectedCoordinates && (
                <Marker position={selectedCoordinates}>
                  <Popup>
                    {`Lat: ${selectedCoordinates.lat}, Lng: ${selectedCoordinates.lng}`}
                  </Popup>
                </Marker>
              )}
            </MapContainer>
          </div>
          <div className="p-4 flex justify-end gap-4">
            <button
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              onClick={() => onCoordinatesCaptured(null)} // Cerrar el mapa
            >
              Cancelar
            </button>
            <button
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
              onClick={handleSaveCoordinates}
              disabled={!selectedCoordinates}
            >
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapWithButton;
