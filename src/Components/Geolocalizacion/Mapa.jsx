import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const Mapa = ({ onSelect, imageIdentifier }) => {
    const [position, setPosition] = useState(null);

    // Manejar el evento de click en el mapa
    const MapClickHandler = () => {
        useMapEvents({
            click(e) {
                const coords = { latitude: e.latlng.lat, longitude: e.latlng.lng };
                setPosition(e.latlng);
                // Pasar las coordenadas y el identificador de la imagen al componente padre
                onSelect(coords, imageIdentifier);
            },
        });
        return position ? <Marker position={position} /> : null;
    };

    return (
        <div className="w-full mt-2">
        <div className="h-52 w-full relative -z-0">
            <MapContainer center={[41.3851, 2.1734]} zoom={13} style={{ height: "100%", width: "100%" }}>
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler />
            </MapContainer>
        </div>
    </div>
    


    );
};

export default Mapa;
