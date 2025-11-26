import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { db } from '../../../firebase_config';
import { getDoc, getDocs, doc, collection, addDoc, runTransaction, writeBatch, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { IoMdAddCircle } from "react-icons/io";
import { FaArrowRight } from "react-icons/fa";
import { TbBuildingFactory } from "react-icons/tb";
import { IoIosCheckmarkCircle } from "react-icons/io";
import { IoCloseCircle } from "react-icons/io5";
import { MdOutlineAddLocationAlt } from "react-icons/md";
import { ImLocation } from "react-icons/im";
import { FaEdit } from "react-icons/fa";
import { RiDeleteBinLine } from "react-icons/ri";


function TrazabilidadBim({ selectedGlobalId, obtenerLotesBim, actualizarLotesDesdeHijo, obtenerInspecciones }) {
    const  id  = localStorage.getItem('idProyecto');

    // Variables de estado
    const [proyecto, setProyecto] = useState({});
    const [sectores, setSectores] = useState([]);

    // Inputs
    const [sectorInput, setSectorInput] = useState('');
    const [selectedSector, setSelectedSector] = useState('');
    const [subSectorInput, setSubSectorInput] = useState('');
    const [selectedSubSector, setSelectedSubSector] = useState('');
    const [parteInput, setParteInput] = useState('');
    const [selectedParte, setSelectedParte] = useState('');
    const [elementoInput, setElementoInput] = useState('');
    const [selectedElemento, setSelectedElemento] = useState('');
    const [loteInput, setLoteInput] = useState('');
    const [pkInicialInput, setPkInicialInput] = useState('');
    const [pkFinalInput, setPkFinalInput] = useState('');
    const [selectedLote, setSelectedLote] = useState('');
    const [idBimInput, setIdBimInput] = useState('');
    const [lotes, setLotes] = useState([]);


    const [objetoLote, setObjetoLote] = useState({})


    //alertas 
    const [alerta, setAlerta] = useState('');
    const [tipoAlerta, setTipoAlerta] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);

    const handleCloseAlert = () => {
        setMostrarModal(false)
     

    }

    // Modal PPI
    const [mostrarModalPpi, setMostrarModalPpi] = useState(false);

    const handleVerPpi = () => {
        setMostrarModalPpi(true)
    }

    const handleCloseModalPpi = () => {
        setMostrarModalPpi(false)
    }

    // Llamar elemetos de la base de datos
    useEffect(() => {
        obtenerProyecto();
        obtenerSectores();
    }, []);

    // Obtener información del proyecto
    const obtenerProyecto = async () => {
        try {
            const proyectoRef = doc(db, 'proyectos', id);
            const proyectoSnapshot = await getDoc(proyectoRef);

            if (proyectoSnapshot.exists()) {
                setProyecto({ id: proyectoSnapshot.id, ...proyectoSnapshot.data() });
                
            } else {
                console.log('No se encontró ningún proyecto con el ID:', id);
            }
        } catch (error) {
            console.error('Error al obtener el proyecto:', error);
        }
    };

    // Obtener sectores
    const obtenerSectores = async () => {
        try {
            const sectoresCollectionRef = collection(db, `proyectos/${id}/sector`);
            const sectoresSnapshot = await getDocs(sectoresCollectionRef);
            const sectoresData = await Promise.all(sectoresSnapshot.docs.map(async doc => {
                const sectorData = { id: doc.id, ...doc.data() };
                sectorData.subsectores = await obtenerSubsectores(doc.id); // Obtener subsectores asociados a este sector
                return sectorData;
            }));
            setSectores(sectoresData);
        } catch (error) {
            console.error('Error al obtener los sectores:', error);
        }
    };

    // Obtener subsectores
    const obtenerSubsectores = async (sectorId) => {
        try {
            const subsectorCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector`);
            const subsectoresSnapshot = await getDocs(subsectorCollectionRef);
            const subsectoresData = await Promise.all(subsectoresSnapshot.docs.map(async doc => {
                const subsectorData = { id: doc.id, ...doc.data() };
                subsectorData.partes = await obtenerPartes(sectorId, doc.id); // Obtener partes asociadas a este subsector
                return subsectorData;
            }));
            return subsectoresData;
        } catch (error) {
            console.error('Error al obtener los subsectores:', error);
        }
    };



    const obtenerPartes = async (sectorId, subSectorId) => {
        try {
            const parteCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subSectorId}/parte`);
            const parteSnapshot = await getDocs(parteCollectionRef);
            const partesData = await Promise.all(parteSnapshot.docs.map(async doc => {
                const parteData = { id: doc.id, ...doc.data() };
                // Aquí se obtienen los elementos de cada parte
                parteData.elementos = await obtenerElementos(sectorId, subSectorId, doc.id);
                return parteData;
            }));
            return partesData;
        } catch (error) {
            console.error('Error al obtener las partes:', error);
        }
    };




    const agregarSector = async () => {
        try {
            if (!sectorInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }
            const nombreSectorNormalizado = sectorInput.toLowerCase().trim();
            const nombresSectoresNormalizados = sectores.map(sector => sector.nombre.toLowerCase().trim());

            if (nombresSectoresNormalizados.includes(nombreSectorNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                // Primero, crea el documento sin el campo 'id'
                const nuevoSectorRef = doc(collection(db, `proyectos/${id}/sector`));
                await setDoc(nuevoSectorRef, { nombre: sectorInput });

                // Luego, actualiza el documento recién creado con su 'id'
                await updateDoc(nuevoSectorRef, { id: nuevoSectorRef.id });

                setAlerta('Agregado correctamente.');
                setTipoAlerta('success');
                setMostrarModal(true);
                setSectorInput('');
                obtenerSectores();
            }
        } catch (error) {
            console.error('Error al agregar el sector:', error);
        }
    };



    // Función para manejar el cambio de selección en el desplegable de sector
    const handleSectorChange = async (event) => {
        const selectedSectorId = event.target.value;
        setSelectedSector(selectedSectorId);
    };

    const agregarSubsector = async (sectorId) => {
        try {
            if (!subSectorInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }
            const nombreSubsectorNormalizado = subSectorInput.toLowerCase().trim();
            const subsectoresDelSector = sectores.find(sector => sector.id === sectorId)?.subsectores || [];
            const nombresSubsectoresNormalizados = subsectoresDelSector.map(subsector => subsector.nombre.toLowerCase().trim());

            if (nombresSubsectoresNormalizados.includes(nombreSubsectorNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                // Obtener el nombre del sector seleccionado
                const sectorSeleccionado = sectores.find(sector => sector.id === sectorId);
                const sectorNombre = sectorSeleccionado ? sectorSeleccionado.nombre : '';

                // Crear el documento con el nombre del subsector, el id y el nombre del sector
                const nuevoSubsectorRef = doc(collection(db, `proyectos/${id}/sector/${sectorId}/subsector`));
                await setDoc(nuevoSubsectorRef, { nombre: subSectorInput, sectorId: sectorId, sectorNombre: sectorNombre });

                setAlerta('Agregado correctamente.');
                setTipoAlerta('success');
                setMostrarModal(true);
                setSubSectorInput('');

                // Actualizar la lista de subsectores del sector
                const nuevosSubsectores = await obtenerSubsectores(sectorId);
                const sectoresActualizados = sectores.map(sector => {
                    if (sector.id === sectorId) {
                        sector.subsectores = nuevosSubsectores;
                    }
                    return sector;
                });
                setSectores(sectoresActualizados);
            }
        } catch (error) {
            console.error('Error al agregar el subsector:', error);
        }
    };


    // Función para manejar el cambio de selección en el desplegable de subsector
    const handleSubSectorChange = (event) => {
        setSelectedSubSector(event.target.value);
    };

    // Función para agregar una parte a la subcolección de un subsector específico
    const agregarParte = async (subSectorId) => {
        try {
            if (!parteInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }
            const nombreParteNormalizado = parteInput.toLowerCase().trim();

            // Encuentra el subsector y el sector seleccionados
            let subSectorNombre = '', sectorNombre = '';
            const subsectorSeleccionado = sectores.flatMap(sector => {
                if (sector.id === selectedSector) {
                    sectorNombre = sector.nombre; // Obtener el nombre del sector
                }
                return sector.subsectores;
            }).find(subsector => subsector.id === subSectorId);

            if (subsectorSeleccionado) {
                subSectorNombre = subsectorSeleccionado.nombre; // Obtener el nombre del subsector
            }

            const nombresPartesNormalizados = subsectorSeleccionado?.partes.map(parte => parte.nombre.toLowerCase().trim()) || [];
            if (nombresPartesNormalizados.includes(nombreParteNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                const parteCollectionRef = collection(db, `proyectos/${id}/sector/${selectedSector}/subsector/${subSectorId}/parte`);
                const batch = writeBatch(db);
                const nuevaParteRef = doc(parteCollectionRef);
                // Agregar nombre del sector y del subsector al documento
                batch.set(nuevaParteRef, {
                    nombre: parteInput,
                    sectorId: selectedSector,
                    subSectorId: subSectorId,
                    sectorNombre: sectorNombre, // Agregado
                    subSectorNombre: subSectorNombre, // Agregado
                });
                await batch.commit();

                setAlerta('Agregado correctamente.');
                setTipoAlerta('success');
                setMostrarModal(true);
                setParteInput('');

                // Actualizar la UI con los nuevos subsectores
                const nuevosSubsectores = await obtenerSubsectores(selectedSector);
                const sectoresActualizados = sectores.map(sector => {
                    if (sector.id === selectedSector) {
                        sector.subsectores = nuevosSubsectores;
                    }
                    return sector;
                });
                setSectores(sectoresActualizados);
            }
        } catch (error) {
            console.error('Error al agregar la parte:', error);
        }
    };



    // Función para manejar el evento cuando se hace clic en el botón para agregar una parte
    const handleAgregarParte = () => {
        if (selectedSubSector) {
            agregarParte(selectedSubSector);
        } else {
            console.error('No se ha seleccionado ningún subsector.');
        }
    };

    // Función para manejar el cambio de selección en el desplegable de parte
    const handleParteChange = (event) => {
        setSelectedParte(event.target.value);
    };


    const agregarElemento = async (parteId) => {
        try {
            if (!elementoInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return; // Detener la ejecución de la función
            }

            const nombreElementoNormalizado = elementoInput.toLowerCase().trim();
            let sectorNombre = '', subSectorNombre = '', parteNombre = '';

            // Encuentra los nombres del sector y subsector seleccionados, y el nombre de la parte
            const sectorSeleccionado = sectores.find(sector => sector.id === selectedSector);
            if (sectorSeleccionado) {
                sectorNombre = sectorSeleccionado.nombre; // Obtener el nombre del sector
                const subsectorSeleccionado = sectorSeleccionado.subsectores.find(subsector => subsector.id === selectedSubSector);
                if (subsectorSeleccionado) {
                    subSectorNombre = subsectorSeleccionado.nombre; // Obtener el nombre del subsector
                    const parteSeleccionada = subsectorSeleccionado.partes.find(parte => parte.id === parteId);
                    if (parteSeleccionada) {
                        parteNombre = parteSeleccionada.nombre; // Obtener el nombre de la parte
                    }
                }
            }

            const elementoCollectionRef = collection(db, `proyectos/${id}/sector/${selectedSector}/subsector/${selectedSubSector}/parte/${parteId}/elemento`);
            const elementosSnapshot = await getDocs(elementoCollectionRef);
            const nombresElementosExistentes = elementosSnapshot.docs.map(doc => doc.data().nombre.toLowerCase().trim());

            if (nombresElementosExistentes.includes(nombreElementoNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                const nuevoElementoRef = doc(elementoCollectionRef);
                await setDoc(nuevoElementoRef, {
                    nombre: elementoInput,
                    sectorId: selectedSector,
                    subSectorId: selectedSubSector,
                    parteId: parteId,
                    sectorNombre: sectorNombre, // Nombre del sector
                    subSectorNombre: subSectorNombre, // Nombre del subsector
                    parteNombre: parteNombre, // Nombre de la parte
                });

                // Actualización de la UI con el nuevo elemento
                const nuevosSectores = sectores.map(sector => {
                    if (sector.id === selectedSector) {
                        return {
                            ...sector,
                            subsectores: sector.subsectores.map(subsector => {
                                if (subsector.id === selectedSubSector) {
                                    return {
                                        ...subsector,
                                        partes: subsector.partes.map(parte => {
                                            if (parte.id === parteId) {
                                                const nuevoElemento = {
                                                    id: nuevoElementoRef.id,
                                                    nombre: elementoInput,
                                                    sectorNombre, // Agregado
                                                    subSectorNombre, // Agregado
                                                    parteNombre, // Agregado
                                                };
                                                const nuevosElementos = [...parte.elementos, nuevoElemento];
                                                return { ...parte, elementos: nuevosElementos };
                                            }
                                            return parte;
                                        })
                                    };
                                }
                                return subsector;
                            })
                        };
                    }
                    return sector;
                });

                setSectores(nuevosSectores);
                setElementoInput('');
                setAlerta('Elemento agregado correctamente.');
                setTipoAlerta('success');
                setMostrarModal(true);
            }
        } catch (error) {
            console.error('Error al agregar el elemento:', error);
            setAlerta('Error al agregar el elemento.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }
    };



    const agregarLote = async (elementoId) => {
        // Verificación inicial de los campos requeridos
        if (!loteInput.trim()) {
            setAlerta('El campo no puede estar vacío.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        if (!elementoId || !selectedParte || !selectedSubSector || !selectedSector) {
            console.error('No se ha seleccionado correctamente el elemento, parte, subsector, sector.');
            setAlerta('Selecciona correctamente todos los campos requeridos.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        if (!selectedPpi) {
            console.error('No se ha seleccionado un PPI.');
            setAlerta('Debes seleccionar un PPI.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        try {
            const nombreLoteNormalizado = loteInput.toLowerCase().trim();

            // Genera un ID único para el nuevo lote
            const loteId = doc(collection(db, 'lotes')).id;
            localStorage.setItem('loteId', loteId)
            


            // Asume que 'ppi' es tu objeto con toda la información del PPI que quieres guardar
            const ppiSeleccionado = ppis.find(ppi => ppi.id === selectedPpi);

            // Verifica que ppiSeleccionado no sea undefined antes de proceder
            if (!ppiSeleccionado) {
                console.error('PPI seleccionado no encontrado.');
                setAlerta('Error al encontrar el PPI seleccionado.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }

            // Encuentra los nombres del sector, subsector, parte y elemento
            let sectorNombre = '', subSectorNombre = '', parteNombre = '', elementoNombre = '';
            const sectorSeleccionado = sectores.find(sector => sector.id === selectedSector);
            if (sectorSeleccionado) {
                sectorNombre = sectorSeleccionado.nombre;
                const subsectorSeleccionado = sectorSeleccionado.subsectores.find(subsector => subsector.id === selectedSubSector);
                if (subsectorSeleccionado) {
                    subSectorNombre = subsectorSeleccionado.nombre;
                    const parteSeleccionada = subsectorSeleccionado.partes.find(parte => parte.id === selectedParte);
                    if (parteSeleccionada) {
                        parteNombre = parteSeleccionada.nombre;
                        const elementoSeleccionado = parteSeleccionada.elementos.find(elemento => elemento.id === elementoId);
                        if (elementoSeleccionado) {
                            elementoNombre = elementoSeleccionado.nombre;
                        }
                    }
                }
            }

            // Verifica si el nombre del lote ya existe
            const elementoActual = sectores.flatMap(sector => sector.subsectores)
                .flatMap(subsector => subsector.partes)
                .flatMap(parte => parte.elementos)
                .find(elemento => elemento.id === elementoId);
            if (elementoActual && elementoActual.lotes && elementoActual.lotes.some(lote => lote.nombre.toLowerCase().trim() === nombreLoteNormalizado)) {
                setAlerta('El nombre del lote ya existe.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }


            // Prepara el nuevo lote
            const nuevoLote = {
                nombre: loteInput,
                ppiId: selectedPpi,
                ppiNombre: ppis.find(ppi => ppi.id === selectedPpi)?.nombre || '',
                idSector: selectedSector,
                idSubSector: selectedSubSector,
                parteId: selectedParte,
                elementoId: elementoId,
                sectorNombre: sectorNombre,
                subSectorNombre: subSectorNombre,
                parteNombre: parteNombre,
                elementoNombre: elementoNombre,
                pkInicial: pkInicialInput, // Incluir pkInicial
                pkFinal: pkFinalInput,
                idBim: selectedGlobalId,
                totalSubactividades: ppiSeleccionado.totalSubactividades || 0,
            };
            
            

            // Referencia a la subcolección específica y añade el nuevo lote
            const loteSubColeccionRef = doc(db, `proyectos/${id}/sector/${selectedSector}/subsector/${selectedSubSector}/parte/${selectedParte}/elemento/${elementoId}/lote/${loteId}`);
            await setDoc(loteSubColeccionRef, nuevoLote);

            // Referencia a la colección principal y añade el nuevo lote
            const lotePrincipalRef = doc(db, `lotes/${loteId}`);
            await setDoc(lotePrincipalRef, nuevoLote);

            // Crear la subcolección 'inspecciones' dentro del lote recién creado
            // y agregar el objeto ppiSeleccionado como documento
            const inspeccionRef = doc(collection(db, `lotes/${loteId}/inspecciones`));
            await setDoc(inspeccionRef, ppiSeleccionado);

            
            actualizarLotesDesdeHijo(nuevoLote);
           
            
           
            obtenerInspecciones(loteId);
                
             
            // Limpia los campos y muestra alerta de éxito
            setLoteInput('');
            setSelectedPpi('');
            setPkFinalInput('');
            setPkFinalInput('');
            setIdBimInput('');
            setAlerta('Lote agregado correctamente con PPI asociado.');
            setTipoAlerta('success');
            setMostrarModal(true);
            

          
                
             // Establece un tiempo de espera de 2 segundos
          

            function estimatedDocumentSize(obj) {
                const stringSize = (s) => new Blob([s]).size;
                let size = 0;

                const recurse = (obj) => {
                    if (obj !== null && typeof obj === 'object') {
                        Object.entries(obj).forEach(([key, value]) => {
                            size += stringSize(key);
                            if (typeof value === 'string') {
                                size += stringSize(value);
                            } else if (typeof value === 'boolean') {
                                size += 4;
                            } else if (typeof value === 'number') {
                                size += 8;
                            } else if (Array.isArray(value) || typeof value === 'object') {
                                recurse(value);
                            }
                        });
                    } else if (typeof obj === 'string') {
                        size += stringSize(obj);
                    }
                };

                recurse(obj);

                return size;
            }


            console.log('Tamaño estimado del documento:', estimatedDocumentSize(ppiSeleccionado), 'bytes');

        } catch (error) {
            console.error('Error al agregar el lote:', error);
            setAlerta('Error al agregar el lote.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }
    };










    const obtenerLotes = async (sectorId, subSectorId, parteId, elementoId) => {
        try {
            const loteCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subSectorId}/parte/${parteId}/elemento/${elementoId}/lote`);
            const loteSnapshot = await getDocs(loteCollectionRef);
            const lotesData = loteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return lotesData;
        } catch (error) {
            console.error('Error al obtener los lotes:', error);
            return []; // Retorna un arreglo vacío en caso de error para evitar interrupciones
        }
    };



    const obtenerElementos = async (sectorId, subSectorId, parteId) => {
        try {
            const elementoCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subSectorId}/parte/${parteId}/elemento`);
            const elementoSnapshot = await getDocs(elementoCollectionRef);
            const elementos = await Promise.all(elementoSnapshot.docs.map(async doc => {
                const elementoData = { id: doc.id, ...doc.data() };
                elementoData.lotes = await obtenerLotes(sectorId, subSectorId, parteId, doc.id);
                return elementoData;
            }));
            return elementos;
        } catch (error) {
            console.error('Error al obtener los elementos:', error);
            return []; // Retorna un arreglo vacío en caso de error para evitar interrupciones
        }
    };


    const [ppis, setPpis] = useState([]);
    const [selectedPpi, setSelectedPpi] = useState("");

    // Función para cargar los PPIs
    const cargarPpis = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "ppis"));
            const ppisList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPpis(ppisList);
        } catch (error) {
            console.error("Error al cargar los PPIs:", error);
        }
    };

    // Llamar a cargarPpis en useEffect para cargar los PPIs al montar el componente
    useEffect(() => {
        cargarPpis();
    }, []);


    const [mostrarModalEliminarSubSector, setMostrarModalEliminarSubSector] = useState(false)
    const [sectorIdAEliminar, setSectorIdAEliminar] = useState(null);
    const [subsectorIdAEliminar, setSubsectorIdAEliminar] = useState(null);




 



    return (
        <div className='min-h-screen text-gray-500'>




            {/* Contenido */}
            <div className='flex gap-3 flex-col bg-white  rounded rounded-xl shadow-md overflow-y-scroll h-[750px]'>




                {/* Formulario de trazabilidad */}
                <div className="mt-4 flex flex-col">


                    <p className='px-4 py-2 font-medium flex gap-2'><strong className='text-xl text-amber-500'>*</strong>Selecciona la trazabilidad para agregar la información al modelo:</p>
                    <div className='grid grid-cols-1 text-sm'>

                        {/* Sector */}
                        <div className="flex flex-col items-start gap-3 border-r-2 p-5">
                            <p className='text-lg font-medium text-gray-500 flex items-center gap-2'><TbBuildingFactory /> Sector</p>
                            <div className="flex items-center w-full">
                                <input
                                    placeholder='Agregar sector'
                                    type="text"
                                    className='border px-3 py-1 rounded-lg w-full'
                                    value={sectorInput}
                                    onChange={(e) => setSectorInput(e.target.value)}
                                />
                                <button
                                    onClick={agregarSector}
                                    className="ml-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    <IoMdAddCircle />
                                </button>
                            </div>

                        </div>
                        {/* Sub Sector */}
                        <div className="flex flex-col items-start gap-3 border-r-2 p-5">
                            <p className='text-lg font-medium text-gray-500 flex items-center gap-2'><TbBuildingFactory /> Sub sector</p>
                            <div className="flex flex-col items-start gap-3 w-full">
                                <label htmlFor="sectores"><strong className='text-amber-600 '>*</strong> Para agregar información selecciona el sector: </label>
                                <select
                                    id="sectores"
                                    className="border px-3 py-1 rounded-lg w-full"
                                    value={selectedSector}
                                    onChange={handleSectorChange}
                                >
                                    <option value="">Seleccione un sector</option>
                                    {sectores.map((sector) => (
                                        <option key={sector.id} value={sector.id}>{sector.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center w-full">

                                <input
                                    placeholder='Agregar sub sector: '
                                    type="text"
                                    id="subsector"
                                    className='border px-3 py-1 rounded-lg w-full'
                                    value={subSectorInput}
                                    onChange={(e) => setSubSectorInput(e.target.value)}
                                />
                                <button
                                    onClick={() => agregarSubsector(selectedSector)}
                                    className="ml-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    <IoMdAddCircle />
                                </button>
                            </div>

                        </div>

                        <div className="flex flex-col items-start gap-3 border-r-2 p-5 w-full">
                            <p className='text-lg font-medium text-gray-500 flex items-center gap-2'><TbBuildingFactory /> Parte</p>
                            <div className="flex flex-col items-start gap-3 w-full">
                                <label htmlFor="subsectores"><strong className='text-amber-600'>*</strong> Para agregar información selecciona el sub sector: </label>
                                <select
                                    id="subsectores"
                                    className="border px-3 py-1 rounded-lg w-full"
                                    value={selectedSubSector}
                                    onChange={handleSubSectorChange}
                                >
                                    <option value="">Seleccione un subsector</option>
                                    {(sectores.find(sector => sector.id === selectedSector)?.subsectores || []).map((subsector) => (
                                        <option key={subsector.id} value={subsector.id}>{subsector.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center w-full">

                                <input
                                    placeholder='Agregar parte: '
                                    type="text"
                                    id="parte"
                                    className='border px-3 py-1 rounded-lg w-full'
                                    value={parteInput}
                                    onChange={(e) => setParteInput(e.target.value)}
                                />
                                <button
                                    onClick={handleAgregarParte}
                                    className="ml-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    <IoMdAddCircle />
                                </button>
                            </div>


                        </div>

                        <div className="flex flex-col items-start gap-3 border-r-2 p-5">
                            <p className='text-lg font-medium text-gray-500 flex items-center gap-2'><TbBuildingFactory /> Elemento</p>
                            <div className="flex flex-col items-start gap-3 w-full">
                                <label htmlFor="partes"><strong className='text-amber-600'>*</strong> Para agregar información selecciona el parte: </label>
                                <select
                                    id="partes"
                                    className="border px-3 py-1 rounded-lg w-full"
                                    value={selectedParte}
                                    onChange={handleParteChange}
                                >
                                    <option value="">Seleccione una parte</option>
                                    {(sectores.find(sector => sector.id === selectedSector)?.subsectores.find(subsector => subsector.id === selectedSubSector)?.partes || []).map((parte) => (
                                        <option key={parte.id} value={parte.id}>{parte.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center w-full">

                                <input
                                    placeholder='Agregar elemento: '
                                    type="text"
                                    id="elemento"
                                    className='border px-3 py-1 rounded-lg w-full'
                                    value={elementoInput}
                                    onChange={(e) => setElementoInput(e.target.value)}
                                />
                                <button
                                    onClick={() => agregarElemento(selectedParte)} // Asegúrate de tener un estado selectedParte para manejar la parte seleccionada
                                    className="ml-2 bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded"
                                >
                                    <IoMdAddCircle />
                                </button>
                            </div>



                        </div>


                        <div className="flex flex-col items-start gap-3 p-5">
                            <p className='text-lg font-medium text-gray-500 flex items-center gap-2'><TbBuildingFactory /> Lote y ppi</p>
                            <div className="flex flex-col items-start gap-3 w-full">
                                <label htmlFor="elementos"><strong className='text-amber-600'>*</strong> Para agregar información selecciona el elemento: </label>
                                <select
                                    id="elementos"
                                    className="border px-3 py-1 rounded-lg w-full"
                                    value={selectedElemento}
                                    onChange={(e) => setSelectedElemento(e.target.value)}
                                >
                                    <option value="">Seleccione un elemento</option>
                                    {/* Asumiendo que tienes una manera de obtener los elementos del estado para el subsector y parte seleccionados */}
                                    {sectores.find(sector => sector.id === selectedSector)?.subsectores.find(subsector => subsector.id === selectedSubSector)?.partes.find(parte => parte.id === selectedParte)?.elementos.map((elemento) => (
                                        <option key={elemento.id} value={elemento.id}>{elemento.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex flex-col items-start gap-3 w-full">
                                <select
                                    value={selectedPpi}
                                    onChange={(e) => setSelectedPpi(e.target.value)}
                                    className="border px-3 py-1 rounded-lg w-full"
                                >
                                    <option value="">Seleccione un PPI</option>
                                    {ppis.map(ppi => (
                                        <option key={ppi.id} value={ppi.id}>{ppi.nombre}</option>
                                    ))}
                                </select>
                                <div className="flex flex-col items-start gap-4 w-full"> {/* Asegúrate de que este contenedor tenga un ancho definido o sea flexible */}
                                    <input
                                        placeholder='Agregar lote: '
                                        type="text"
                                        id="lote"
                                        className='w-full border px-3 py-1 rounded-lg' // Clase w-full añadida aquí
                                        value={loteInput}
                                        onChange={(e) => setLoteInput(e.target.value)}
                                    />
                                    <input
                                        placeholder='Agregar pk inicial: '
                                        type="text"
                                        id="pkInicial"
                                        className='w-full border px-3 py-1 rounded-lg' // Clase w-full añadida aquí
                                        value={pkInicialInput}
                                        onChange={(e) => setPkInicialInput(e.target.value)}
                                    />
                                    <input
                                        placeholder='Agregar pk final: '
                                        type="text"
                                        id="pkFinal"
                                        className='w-full border px-3 py-1 rounded-lg' // Clase w-full añadida aquí
                                        value={pkFinalInput}
                                        onChange={(e) => setPkFinalInput(e.target.value)}
                                    />
                                    <div className="flex justify-center flex-col w-full"> {/* Añadir w-full aquí para asegurar que el contenedor ocupe todo el ancho */}
                                        <label htmlFor="idBim" className='ms-1 mb-2 font-medium text-amber-500'>Id Bim:</label>
                                        <input
                                            readOnly
                                            id='idBim'
                                            placeholder='ID BIM'
                                            type="text"
                                            className='w-full border px-3 py-1 rounded-lg bg-gray-200 text-amber-600' // Clase w-full añadida aquí
                                            value={selectedGlobalId}
                                            onChange={(e) => setIdBimInput(e.target.value)}
                                        />
                                    </div>

                                    <button
                                        onClick={() => agregarLote(selectedElemento)} // Función para agregar lote a elemento seleccionado
                                        className="bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 w-full rounded flex justify-center items-center" // Clase w-full añadida aquí y ajustes en padding para uniformidad
                                    >
                                        Guardar
                                    </button>
                                </div>


                            </div>








                        </div>





                    </div>
                </div>




               
               

                
               
                




                {mostrarModal && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto p-4">

                            <button onClick={handleCloseAlert} className="text-2xl w-full flex justify-end text-gray-500"><IoCloseCircle /></button>
                            {tipoAlerta === 'success' ?
                                <div className='text-green-600 flex justify-center'><IoIosCheckmarkCircle className='text-6xl' /></div>
                                :
                                null
                            }

                            {tipoAlerta === 'error' ?
                                <div className='text-red-600 flex justify-center'><IoCloseCircle className='text-6xl' /></div>
                                :
                                null
                            }

                            <div className="modal-content py-4 text-left px-6 flex justify-center font-medium">
                                {alerta}
                            </div>
                        </div>
                    </div>
                )}

                {mostrarModalPpi && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white mx-auto rounded shadow-lg z-50 overflow-y-auto p-5"
                            style={{ width: '320px', height: 'auto', maxWidth: '100%' }}>
                            <button onClick={handleCloseModalPpi} className="text-2xl w-full flex justify-end text-gray-500"><IoCloseCircle /></button>

                            <div className='text-center flex justify-center flex-col items-center gap-2'>
                                <MdOutlineAddLocationAlt className='font-bold text-2xl' />

                                <p><strong>Lote: </strong>{objetoLote.nombre ? objetoLote.nombre : "Ppi no encontrado, selecciona la ubicación correctamente"}</p>

                                {ppiObject && ppiObject.data && (
                                    <div>
                                        <p><strong>Ppi: </strong>{ppiObject.data.nombre}</p>
                                    </div>
                                )}

                                {!ppiObject && (
                                    <div>
                                        <p className='font-medium'>No se encontraron PPIs para el lote.</p>
                                        <Link to={`/agregarPpi/${selectedLote}`}>
                                            <button className='bg-amber-600 text-white px-4 py-1 rounded-md mt-2 font-medium text-sm'>Agregar Ppi</button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}


                {/* {mostrarModalEditarSector && (
                    <div className="modal">
                        <div className="modal-content">
                            <h3>Editar Sector</h3>
                            <input
                                type="text"
                                value={nuevoNombreSector}
                                onChange={(e) => setNuevoNombreSector(e.target.value)}
                                placeholder="Nuevo nombre del sector"
                            />
                            <button onClick={guardarEdicionSector}>Guardar</button>
                            <button onClick={() => setMostrarModalEditarSector(false)}>Cancelar</button>
                        </div>
                    </div>
                )} */}


            </div>
        </div>
    );
}

export default TrazabilidadBim;



