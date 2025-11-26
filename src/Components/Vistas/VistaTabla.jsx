import React, { useEffect, useState } from 'react';
import { getDocs, collection } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../../../firebase_config';
import { FiLoader } from "react-icons/fi";
const VistaTabla = ({ filteredLotes, showSector, handleCaptrurarTrazabilidad }) => {

    const [subactividadesPorLote, setSubactividadesPorLote] = useState({}); // Guardar el total de subactividades versión 0

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Simulación de carga (reemplaza con la lógica de carga real)
        setTimeout(() => {
            setLoading(false);
        }, 2000); // Simula 2 segundos de carga
    }, []);


    useEffect(() => {
        const contarSubactividadesPorLote = async () => {
            const subactividadesTotales = {};

            for (const lote of filteredLotes) {
                const inspeccionesRef = collection(db, `lotes/${lote.id}/inspecciones`);
                const inspeccionesSnap = await getDocs(inspeccionesRef);

                let totalSubactividadesVersion0 = 0;

                inspeccionesSnap.forEach((inspeccion) => {
                    const actividades = inspeccion.data().actividades || [];
                    actividades.forEach((actividad) => {
                        const subactividades = actividad.subactividades || [];
                        const subactividadesVersion0 = subactividades.filter(
                            (sub) => sub.version === 0
                        ).length;
                        totalSubactividadesVersion0 += subactividadesVersion0;
                    });
                });

                subactividadesTotales[lote.id] = totalSubactividadesVersion0;
            }

            setSubactividadesPorLote(subactividadesTotales); // Actualizar el estado
        };

        contarSubactividadesPorLote();
    }, [filteredLotes]);

    return (
        <div className="w-full rounded-xl mt-5">
            <div className="grid sm:grid-cols-12 grid-cols-1 sm:px-5 sm:py-2 sm:bg-gray-200 rounded-t-xl">
                {showSector && (
                    <div className="text-left font-medium text-gray-600 sm:block hidden px-2">
                        Sector
                    </div>
                )}
                <div className="text-left font-medium text-gray-600 col-span-2 sm:block hidden px-6 text-center">Sub Sector</div>
                <div className="text-left font-medium text-gray-600 sm:block hidden px-2">Parte</div>
                <div className="text-left font-medium text-gray-600 col-span-1 sm:block hidden px-2">Elemento</div>
                <div className="text-left font-medium text-gray-600 col-span-2 sm:block hidden px-2">Pk</div>
                <div className="text-left font-medium text-gray-600 col-span-3 sm:block hidden px-2">Lote y PPI</div>
                <div className="text-left font-medium text-gray-600 col-span-2 sm:block hidden px-2">Progreso inspección</div>
            </div>

            {filteredLotes.sort((a, b) => {
                const avanceA = (a.actividadesAptas || 0) / (subactividadesPorLote[a.id] || 1);
                const avanceB = (b.actividadesAptas || 0) / (subactividadesPorLote[b.id] || 1);
                return avanceB - avanceA;
            }).map((l, i) => {
                const totalSubactividadesVersion0 = subactividadesPorLote[l.id] || 0;
                const porcentajeProgreso =
                    totalSubactividadesVersion0 > 0
                        ? ((l.actividadesAptas || 0) / totalSubactividadesVersion0) * 100
                        : 0;

                return (
                    <>
                        {l.ppiNombre && (
                            <Link
                                to={`/tablaPpi/${l.id}/${l.ppiNombre}`}
                                onClick={() => handleCaptrurarTrazabilidad(l)}
                                key={i}
                            >
                                <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-1 items-center text-sm cursor-pointer p-5 border border-b-2 font-normal text-gray-600 hover:bg-gray-100">
                                {showSector && (
                                    <div className="w-full xl:col-span-1 flex xl:block gap-2 px-2">
                                        <p className="xl:hidden font-light">Sector: </p>
                                        {l.sectorNombre}
                                    </div>
                                )}
                                <div className="w-full xl:col-span-2 flex xl:block gap-2 px-2 text-center">
                                    <p className="xl:hidden font-light">Sub sector: </p>
                                    {l.subSectorNombre}
                                </div>
                                <div className="w-full xl:col-span-1 flex xl:block gap-2 px-2">
                                    <p className="xl:hidden font-light">Parte: </p>
                                    {l.parteNombre}
                                </div>
                                <div className="w-full xl:col-span-1 flex xl:block gap-2 px-2">
                                    <p className="xl:hidden font-light">Elemento: </p>
                                    {l.elementoNombre}
                                </div>
                                <div className="w-full xl:col-span-2 xl:text-start flex flex-col xl:flex-row xl:justify-start px-2 gap-2">
                                    <div className="w-full xl:w-auto">
                                        <p className="font-light">Pk Inicial: {l.pkInicial || '-'}</p>
                                    </div>
                                    <div className="w-full xl:w-auto">
                                        <p className="font-light">Pk Final: {l.pkFinal || '-'}</p>
                                    </div>
                                </div>
                                <div className="w-full flex flex-col items-start justify-center xl:col-span-3 px-2">
                                    <div className="flex gap-2 items-center">
                                        <p className="font-medium">Lote:</p>
                                        <p className="font-medium">{l.nombre}</p>
                                    </div>
                                    <div className="flex gap-2 mt-1">
                                        {l.ppiNombre
                                            ? <>
                                                <p className="font-medium">PPI:</p>
                                                <p className="font-medium">{l.ppiNombre}</p></>
                                            : <>
                                                <p className='text-xs ps-10 text-amber-600'>PPI sin asignar</p>
                                            </>
                                        }

                                    </div>
                                </div>
                                <div className="w-full xl:col-span-2 px-2">
                                    {loading ? ( // Mostrar el spinner mientras se cargan los datos
                                        <div className="flex flex-col items-center justify-center mt-4">
                                            <FiLoader className="animate-spin text-4xl text-gray-500" />
                                            <p className="mt-2 text-gray-500 text-sm">Cargando inspecciones...</p>
                                        </div>
                                    ) : totalSubactividadesVersion0 > 0 ? ( // Mostrar la barra de progreso si hay inspecciones
                                        <div className="text-start flex flex-col items-start gap-3">
                                            {/* Porcentaje de Progreso */}
                                            <div className="font-medium text-gray-600">
                                                {porcentajeProgreso.toFixed(2)}%
                                            </div>

                                            {/* Barra de Progreso */}
                                            <div
                                                style={{
                                                    background: "#e0e0e0",
                                                    borderRadius: "8px",
                                                    height: "20px",
                                                    width: "100%",
                                                }}
                                            >
                                                <div
                                                    style={{
                                                        background: "#d97706",
                                                        height: "100%",
                                                        borderRadius: "8px",
                                                        width: `${porcentajeProgreso.toFixed(2)}%`,
                                                    }}
                                                />
                                            </div>

                                            {/* Información de Inspecciones */}
                                            <div>
                                                <p className="font-medium text-green-600">{`Apto: ${l.actividadesAptas || 0}`}</p>
                                                <p className="font-medium text-gray-600">{`Total de inspecciones: ${totalSubactividadesVersion0}`}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        // Si no hay inspecciones, mostrar mensaje de PPI sin asignar
                                        <div className="flex flex-col items-center justify-center mt-4">
                                            <p className="text-sm text-amber-600 font-semibold">
                                                🚧Inspección inhabilitada.
                                            </p>
                                        </div>
                                    )}

                                    {/* Validación para mostrar el PPI en la columna */}
                                    <div className="w-full mt-2">
                                        {l.ppiNombre ? (
                                            <>
                                                <p className="font-medium">PPI:</p>
                                                <p className="font-medium">{l.ppiNombre}</p>
                                            </>
                                        ) : (
                                            <p className="text-xs ps-10 text-amber-600">PPI sin asignar</p>
                                        )}
                                    </div>
                                </div>

                            </div>
                            </Link>
                        )}

                        
                    </>
                );
            })}
        </div>
    );
};

export default VistaTabla;
