
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase_config'; // Ajusta esta importación según tu configuración

function Elemento() {
    const { id } = useParams(); // ID del proyecto
    const [sectores, setSectores] = useState([]);
    const [sectorSeleccionado, setSectorSeleccionado] = useState('');
    const [subsectores, setSubsectores] = useState([]);
    const [subsectorSeleccionado, setSubsectorSeleccionado] = useState('');
    const [partes, setPartes] = useState([]);
    const [parteSeleccionada, setParteSeleccionada] = useState('');
    const [elementos, setElementos] = useState([]);
    const [elementoSeleccionado, setElementoSeleccionado] = useState('');
    const [lotes, setLotes] = useState([]);

    useEffect(() => {
        if (id) {
            obtenerSectores();
        }
    }, [id]);

    const obtenerSectores = async () => {
        const querySnapshot = await getDocs(collection(db, `proyectos/${id}/sector`));
        const sectoresData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        setSectores(sectoresData);
    };

    const handleSectorChange = async (event) => {
        const sectorId = event.target.value;
        setSectorSeleccionado(sectorId);
        setSubsectores([]);
        setSubsectorSeleccionado('');
        setPartes([]);
        setParteSeleccionada('');
        setElementos([]);
        setElementoSeleccionado('');
        setLotes([]);
        if (sectorId) {
            obtenerSubsectores(sectorId);
        }
    };

    const obtenerSubsectores = async (sectorId) => {
        const querySnapshot = await getDocs(collection(db, `proyectos/${id}/sector/${sectorId}/subsector`));
        const subsectoresData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        setSubsectores(subsectoresData);
    };

    const handleSubsectorChange = async (event) => {
        const subsectorId = event.target.value;
        setSubsectorSeleccionado(subsectorId);
        setPartes([]);
        setParteSeleccionada('');
        setElementos([]);
        setElementoSeleccionado('');
        setLotes([]);
        if (subsectorId) {
            obtenerPartes(sectorSeleccionado, subsectorId);
        }
    };

    const obtenerPartes = async (sectorId, subsectorId) => {
        const querySnapshot = await getDocs(collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subsectorId}/parte`));
        const partesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        setPartes(partesData);
    };

    const handleParteChange = async (event) => {
        const parteId = event.target.value;
        setParteSeleccionada(parteId);
        setElementos([]);
        setElementoSeleccionado('');
        setLotes([]);
        if (parteId) {
            obtenerElementos(sectorSeleccionado, subsectorSeleccionado, parteId);
        }
    };

    const obtenerElementos = async (sectorId, subsectorId, parteId) => {
        const querySnapshot = await getDocs(collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subsectorId}/parte/${parteId}/elemento`));
        const elementosData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        setElementos(elementosData);
    };

    const handleElementoChange = async (event) => {
        const elementoId = event.target.value;
        setElementoSeleccionado(elementoId);
        setLotes([]);
        if (elementoId) {
            obtenerLotes(sectorSeleccionado, subsectorSeleccionado, parteSeleccionada, elementoId);
        }
    };

    const obtenerLotes = async (sectorId, subsectorId, parteId, elementoId) => {
        const querySnapshot = await getDocs(collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subsectorId}/parte/${parteId}/elemento/${elementoId}/lote`));
        const lotesData = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
        }));
        setLotes(lotesData);
    };

    return (
        <div className='min-h-screen px-14 py-5'>
            <div>
                <label>Sector:</label>
                <select value={sectorSeleccionado} onChange={handleSectorChange}>
                    <option value="">Selecciona un sector</option>
                    {sectores.map((sector) => (
                        <option key={sector.id} value={sector.id}>{sector.nombre}</option>
                    ))}
                </select>
            </div>

            {subsectores.length > 0 && (
                <div>
                    <label>Subsector:</label>
                    <select value={subsectorSeleccionado} onChange={handleSubsectorChange}>
                        <option value="">Selecciona un subsector</option>
                        {subsectores.map((subsector) => (
                            <option key={subsector.id} value={subsector.id}>{subsector.nombre}</option>
                        ))}
                    </select>
                </div>
            )}

            {partes.length > 0 && (
                <div>
                    <label>Parte:</label>
                    <select value={parteSeleccionada} onChange={handleParteChange}>
                        <option value="">Selecciona una parte</option>
                        {partes.map((parte) => (
                            <option key={parte.id} value={parte.id}>{parte.nombre}</option>
                        ))}
                    </select>
                </div>
            )}

            {elementos.length > 0 && (
                <div>
                    <label>Elemento:</label>
                    <select value={elementoSeleccionado} onChange={handleElementoChange}>
                        <option value="">Selecciona un elemento</option>
                        {elementos.map((elemento) => (
                            <option key={elemento.id} value={elemento.id}>{elemento.nombre}</option>
                        ))}
                    </select>
                </div>
            )}

            {lotes.length > 0 && (
                <div>
                    <label>Lotes:</label>
                    <ul>
                        {lotes.map((lote) => (
                            <li key={lote.id}>{lote.nombre}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export default Elemento;






// import React, { useEffect, useState } from 'react'
// import { db } from '../../firebase_config';
// import { getDoc, getDocs, doc, collection, addDoc, runTransaction, writeBatch, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
// import logo from '../assets/logo_solo.png';
// import { FaArrowRight } from "react-icons/fa";
// import { GoHomeFill } from "react-icons/go";
// import { Link } from 'react-router-dom';
// import { SiBim } from "react-icons/si";
// import { useNavigate } from 'react-router-dom';
// import { IoArrowBackCircle } from "react-icons/io5";

// function Elemento() {
//     const navigate = useNavigate();
//     const handleGoBack = () => {
//         navigate('/'); // Esto navega hacia atrás en la historia
//     };

//     const [lotes, setLotes] = useState([]);
//     const [ppiNombre, setPpiNombre] = useState([]);
//     const [filterText, setFilterText] = useState('');

//     const handleFilterChange = (e) => {
//         setFilterText(e.target.value);
//     };

//     const filteredLotes = lotes.filter(l => 
//         l.nombre.toLowerCase().includes(filterText.toLowerCase()) ||
//         l.ppiNombre.toLowerCase().includes(filterText.toLowerCase())
//     );


//     // Llamar elementos de la base de datos
//     useEffect(() => {
//         obtenerLotes();
//     }, []);

//     // Obtener lotes
//     const obtenerLotes = async () => {
//         try {
//             const lotesCollectionRef = collection(db, "lotes");
//             const lotesSnapshot = await getDocs(lotesCollectionRef);
//             const lotesData = lotesSnapshot.docs.map(doc => ({
//                 id: doc.id,
//                 ...doc.data()
//             }));
//             setLotes(lotesData);
//             console.log(lotesData[0]);
//             console.log(lotesData[0].actividadesAptas)
//             console.log(lotesData[0].totalSubactividades)
//         } catch (error) {
//             console.error('Error al obtener los lotes:', error);
//         }
//     };




//     const handleCaptrurarTrazabilidad = (l) => {
//         localStorage.setItem('sector', l.sectorNombre || '')
//         localStorage.setItem('subSector', l.subSectorNombre || '')
//         localStorage.setItem('parte', l.parteNombre || '')
//         localStorage.setItem('elemento', l.elementoNombre || '')
//         localStorage.setItem('lote', l.nombre || '')
//         localStorage.setItem('loteId', l.id || '')
//         localStorage.setItem('ppi', l.ppiNombre || '')
//         localStorage.setItem('pkInicial', l.pkInicial || '')
//         localStorage.setItem('pkFinal', l.pkFinal || '')
//     }



//     return (
//         <div className='container mx-auto min-h-screen px-14 py-5'>

//             <div className='flex gap-2 items-center justify-between bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
//                 <div className='flex gap-2 items-center'>
//                     <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
//                     <Link to={'/'}>
//                         <h1 className=' text-gray-500'>Home</h1>
//                     </Link>


//                     <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
//                     <Link to={'#'}>
//                         <h1 className='font-medium text-amber-600'>Inspección</h1>
//                     </Link>
//                 </div>


//                 <div className='flex items-center gap-4'>
//                     <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>

//                     <div className='px-4 bg-sky-600 text-white rounded-full '>
//                         <Link to={'/visor_inspeccion'}>
//                             <button className='text-white flex items-center gap-3'>
//                                 <span className='text-2xl'><SiBim /> </span>
//                             </button>
//                         </Link>
//                     </div>

//                 </div>

//             </div>





//             <div>
//                 <div className='flex gap-3 flex-col items-start justify-center mt-5 bg-white p-8 rounded rounded-xl shadow-md'>



//                     <div class="w-full rounded rounded-xl">
//                         <div className='grid sm:grid-cols-12 grid-cols-1 sm:px-5 sm:py-2 sm:bg-gray-200 rounded rounded-md'>
//                             <div className='text-left font-medium text-gray-600 border-r-2 border-gray-300 sm:block hidden border-r-2 border-gray-300'>Sector</div>
//                             <div className='text-left sm:ps-10 font-medium text-gray-600 col-span-2  sm:block hidden border-r-2 border-gray-300'>Sub Sector</div>
//                             <div className='text-left sm:ps-5 font-medium text-gray-600 border-r sm:block hidden border-r-3 border-gray-300'>Parte</div>
//                             <div className='text-left sm:ps-5 font-medium text-gray-600 col-span-1  sm:block hidden border-r-2 border-gray-300'>Elemento</div>
//                             <div className='text-left sm:ps-10 font-medium text-gray-600 col-span-2 sm:block hidden border-r-2 border-gray-300'>Pk</div>
//                             <div className='text-left sm:ps-10 font-medium text-gray-600 col-span-3 sm:block hidden border-r-2 border-gray-300'>Lote y ppi</div>
//                             <div className='text-left sm:ps-10 font-medium text-gray-600 col-span-2  sm:block hidden border-gray-300'>Progreso inspección</div>
//                         </div>



//                         {lotes.sort((a, b) => {
//                             const avanceA = (a.actividadesAptas || 0) / a.totalSubactividades;
//                             const avanceB = (b.actividadesAptas || 0) / b.totalSubactividades;
//                             return avanceB - avanceA; // Orden descendente: de mayor a menor avance
//                         }).map((l, i) => (
//                             <Link to={`/tablaPpi/${l.id}/${l.ppiNombre}`} onClick={() => handleCaptrurarTrazabilidad(l)} key={i}>
//                                 <div className='text-sm cursor-pointer grid sm:grid-cols-12 grid-cols-1 items-center justify-start sm:p-5 border-b-2 font-normal text-gray-600 hover:bg-gray-100'>
//                                     <div className='sm:border-r-2 sm:border-b-0 flex items-center sm:pr-10'>
//                                         {l.sectorNombre}
//                                     </div>

//                                     <div className='sm:border-r-2 sm:border-b-0 flex items-center col-span-2  sm:ps-10'>
//                                         {l.subSectorNombre}
//                                     </div>

//                                     <div className='sm:border-r-2  flex items-center sm:justify-start  sm:ps-6'>
//                                         {l.parteNombre}
//                                     </div>

//                                     <div className=' sm:border-r-2 flex items-center sm:justify-start col-span-1  sm:ps-4 text-sm'>
//                                         {l.elementoNombre}
//                                     </div>

//                                     <div className='sm:border-r-2 flex flex-col col-span-2 items-start justify-center text-center sm:ps-8'>
//                                         <div className='col-span-2'><p className='p-1'>Inicial: {l.pkInicial}</p></div>
//                                         <div className='col-span-2'><p className='  p-1'>Final: {l.pkFinal}</p></div>
//                                     </div>
//                                     <div className='sm:border-r-2  flex flex-col col-span-3 items-start sm:justify-center sm:ps-10 sm:pr-5'>
//                                         <div className='flex gap-3 items-center'>
//                                         <p className='text-amber-600 font-medium'>Lote:</p>
//                                          <p className='font-medium'> {l.nombre}</p>
//                                             </div>
//                                         <div className='flex gap-3 mt-1'>
//                                         <p className='text-amber-600 font-medium'>Ppi:</p> 
//                                         <p className='font-medium'>{l.ppiNombre}</p>
//                                             </div>
//                                     </div>

//                                     <div className=' flex flex-col items-center sm:justify-start gap-5 col-span-2 sm:ps-10'>
//                                         {
//                                             l.totalSubactividades > 0 ? (
//                                                 <>
//                                                     {`${l.actividadesAptas || 0}/${l.totalSubactividades} `}
//                                                     ({((l.actividadesAptas || 0) / l.totalSubactividades * 100).toFixed(2)}%)
//                                                     <div style={{ background: '#e0e0e0', borderRadius: '8px', height: '20px', width: '100%' }}>
//                                                         <div
//                                                             style={{
//                                                                 background: '#d97706',
//                                                                 height: '100%',
//                                                                 borderRadius: '8px',
//                                                                 width: `${((l.actividadesAptas || 0) / l.totalSubactividades * 100).toFixed(2)}%`
//                                                             }}
//                                                         />
//                                                     </div>
//                                                 </>
//                                             ) : "Inspección no iniciada"
//                                         }
//                                     </div>
//                                 </div>
//                             </Link>
//                         ))}





//                     </div>

//                 </div>





//             </div>

//         </div>
//     )
// }

// export default Elemento
