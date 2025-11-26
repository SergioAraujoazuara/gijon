import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para iconos de Leaflet (pueden no cargar correctamente sin esto en algunos entornos)
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: iconUrl,
  shadowUrl: iconShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

const LeafletMap = () => {
  // Lista de ubicaciones específicas en España
  const locations = [
    { lat: 43.3619, lng: -5.8494, name: "Oviedo, Asturias, Spain" }, // Oviedo
    { lat: 43.5393, lng: -5.7076, name: "Gijón, Asturias, Spain" }, // Gijón
    { lat: 43.4230, lng: -4.8140, name: "Cangas de Onís, Asturias, Spain" }, // Cangas de Onís
    { lat: 43.2500, lng: -5.7833, name: "Mieres, Asturias, Spain" }, // Mieres
  ];

  return (
    <div className='w-full'>
      <MapContainer center={[40.4637, -3.7492]} zoom={5} style={{ height: "280px", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
        />
        {locations.map((location, index) => (
          <Marker key={index} position={[location.lat, location.lng]}>
            <Popup>
              {location.name}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default LeafletMap;
