/*
1. Initialization:
   - Retrieve the project ID from the URL using `useParams`.
   - Initialize multiple state variables to manage project data, hierarchical structure (sectors, subsectors, parts, elements, lots), form inputs, alerts, and modals.

2. Data Fetching on Mount:
   - `useEffect` triggers two main functions when the component loads:
     - `obtenerProyecto()`: Fetches project details (name, ID, etc.) from Firestore.
     - `obtenerSectores()`: Retrieves the sectors for the current project, along with nested subsectors, parts, elements, and lots.

3. Sector Management:
   - Adding a Sector:
     - Validate input for duplicates.
     - Add a new sector to Firestore and update its ID within the document.
   - Editing a Sector:
     - Update the name of an existing sector in Firestore.
   - Deleting a Sector:
     - Remove the sector and its associated data from Firestore and update local state.

4. Subsector Management:
   - Adding a Subsector:
     - Validate duplicates within a sector.
     - Add a new subsector and associate it with its parent sector.
   - Editing and Deleting Subsector:
     - Similar CRUD operations are applied to subsectors.

5. Part Management:
   - Adding, Editing, and Deleting parts:
     - Parts are managed within subsectors.

6. Element Management:
   - Adding, Editing, and Deleting elements:
     - Elements are managed within parts.

7. Lot Management:
   - Adding a Lot:
     - Validate and add new lots to Firestore under their parent element.
     - Link the lot to additional details such as `ppi`, `pkInicial`, `pkFinal`, and optional `idBim`.
   - Editing and Deleting Lots:
     - Similar CRUD operations apply to lots.

8. User Interface (UI) Flow:
   - The UI consists of:
     - A **form** for adding sectors, subsectors, parts, elements, and lots.
     - A **dynamic list** that displays the current hierarchical structure.
     - **Action buttons** for editing and deleting items at each level.
   - Each level (Sector > Subsector > Part > Element > Lot) depends on the previous selection.

9. Alerts and Modals:
   - Alerts:
     - Display success or error messages for user actions.
   - Modals:
     - Confirm deletions or provide editing interfaces for each level of the hierarchy.

10. State Management:
   - After performing CRUD operations (add, edit, delete), the local state is updated to reflect the changes without needing to reload the page.
*/


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
import { VscEdit } from "react-icons/vsc";
import { RiDeleteBinLine } from "react-icons/ri";
import { IoArrowBackCircle } from "react-icons/io5";
import { GrSave } from "react-icons/gr";
import { SiBim } from "react-icons/si";
import { useNavigate } from 'react-router-dom';
import { FaArrowAltCircleRight } from "react-icons/fa";


function Trazabilidad() {
    // Navigation and URL Parameter
    const navigate = useNavigate();
    const id = localStorage.getItem('selectedProjectId')
    const nameProject = localStorage.getItem('selectedProjectName')

    // State Variables
    /*
    1. Project State:
       - `proyecto`: Stores the project information retrieved from Firestore.
       - `sectores`: Holds the hierarchical data of the project, including sectors, subsectors, parts, elements, and lots.
    */
    const [proyecto, setProyecto] = useState({}); // State for storing project details.
    const [sectores, setSectores] = useState([]); // State for storing the hierarchical structure (sectors and their children).
    // State to manage the modal visibility and IDs for deleting a subsector
    const [mostrarModalEliminarSubSector, setMostrarModalEliminarSubSector] = useState(false)
    const [sectorIdAEliminar, setSectorIdAEliminar] = useState(null);
    const [subsectorIdAEliminar, setSubsectorIdAEliminar] = useState(null);

    // State to store the list of PPIs and the selected PPI
    const [ppis, setPpis] = useState([]);
    const [selectedPpi, setSelectedPpi] = useState("");

    /*
 2. Input States for Form Management:
    - Each input state captures user input for adding or interacting with sectors, subsectors, parts, elements, and lots.
 */
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
    const [objetoLote, setObjetoLote] = useState({})
    //Alerts 
    const [alerta, setAlerta] = useState('');
    const [tipoAlerta, setTipoAlerta] = useState('');
    const [mostrarModal, setMostrarModal] = useState(false);

    // Navigate one step back in browser history.
    const handleGoBack = () => {
        navigate(-1); // Esto navega hacia atrás en la historia
    };
    // Close all active modals
    const handleCloseAlert = () => {
        setMostrarModal(false)
        setMostrarModalEliminarSector(false)
        setMostrarModalEliminarSubSector(false)
        setMostrarModalEliminarParte(false)
        setMostrarModalEliminarElemento(false)
        setMostrarModalEliminarLote(false)

    }

    // State to manage the visibility of the PPI modal
    const [mostrarModalPpi, setMostrarModalPpi] = useState(false);
    // Show the PPI modal
    const handleVerPpi = () => {
        setMostrarModalPpi(true)
    }
    // Close the PPI modal
    const handleCloseModalPpi = () => {
        setMostrarModalPpi(false)
    }

    // Fetch project details from Firestore
    useEffect(() => {
        obtenerProyecto();
        obtenerSectores();
    }, []);

    // Fetch info of the project.
    const obtenerProyecto = async () => {
        try {
            // get data
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

    // Fetch sectors and their related subsectors from Firestore
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

    // Fetch subsectors for a given sector from Firestore
    const obtenerSubsectores = async (sectorId) => {
        try {
            const subsectorCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector`);
            const subsectoresSnapshot = await getDocs(subsectorCollectionRef);
            // Map through each subsector and fetch its parts
            const subsectoresData = await Promise.all(subsectoresSnapshot.docs.map(async doc => {
                const subsectorData = { id: doc.id, ...doc.data() };
                subsectorData.partes = await obtenerPartes(sectorId, doc.id); // Obtener partes asociadas a este subsector
                return subsectorData;
            }));
            return subsectoresData;// Return array of subsectors with parts
        } catch (error) {
            console.error('Error al obtener los subsectores:', error);
        }
    };

    // Fetch parts for a given subsector
    const obtenerPartes = async (sectorId, subSectorId) => {
        try {
            const parteCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subSectorId}/parte`);
            const parteSnapshot = await getDocs(parteCollectionRef);
            // Map through each part and fetch its elements
            const partesData = await Promise.all(parteSnapshot.docs.map(async doc => {
                const parteData = { id: doc.id, ...doc.data() };
                // Aquí se obtienen los elementos de cada parte
                parteData.elementos = await obtenerElementos(sectorId, subSectorId, doc.id);
                return parteData;
            }));
            return partesData;// Return array of parts with elements
        } catch (error) {
            console.error('Error al obtener las partes:', error);
        }
    };

    // Add a new sector to Firestore
    const agregarSector = async () => {
        try {
            // Validate input
            if (!sectorInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }
            // Normalize input and check for duplicates
            const nombreSectorNormalizado = sectorInput.toLowerCase().trim();
            const nombresSectoresNormalizados = sectores.map(sector => sector.nombre.toLowerCase().trim());

            if (nombresSectoresNormalizados.includes(nombreSectorNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                // Create a new sector document in Firestore
                const nuevoSectorRef = doc(collection(db, `proyectos/${id}/sector`));
                await setDoc(nuevoSectorRef, { nombre: sectorInput });

                // Clear input and refresh sectors list
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



    // Handle sector selection change
    const handleSectorChange = async (event) => {
        const selectedSectorId = event.target.value;
        setSelectedSector(selectedSectorId);
    };
    // Add a new subsector under a specific sector
    const agregarSubsector = async (sectorId) => {
        try {
            // Validate input
            if (!subSectorInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }
            // Normalize input and check for duplicates
            const nombreSubsectorNormalizado = subSectorInput.toLowerCase().trim();
            const subsectoresDelSector = sectores.find(sector => sector.id === sectorId)?.subsectores || [];
            const nombresSubsectoresNormalizados = subsectoresDelSector.map(subsector => subsector.nombre.toLowerCase().trim());

            if (nombresSubsectoresNormalizados.includes(nombreSubsectorNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                // Create new subsector document in Firestore
                const sectorSeleccionado = sectores.find(sector => sector.id === sectorId);
                const sectorNombre = sectorSeleccionado ? sectorSeleccionado.nombre : '';
                const nuevoSubsectorRef = doc(collection(db, `proyectos/${id}/sector/${sectorId}/subsector`));
                await setDoc(nuevoSubsectorRef, { nombre: subSectorInput, sectorId: sectorId, sectorNombre: sectorNombre });

                setAlerta('Agregado correctamente.');
                setTipoAlerta('success');
                setMostrarModal(true);
                setSubSectorInput('');

                // Update subsectors in state
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


    // Handle subsector dropdown change
    const handleSubSectorChange = (event) => {
        setSelectedSubSector(event.target.value);
    };

    // Add a new part to a specific subsector
    const agregarParte = async (subSectorId) => {
        try {
            // Input validation
            if (!parteInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }
            // Normalize the part name and check for duplicates
            const nombreParteNormalizado = parteInput.toLowerCase().trim();

            // Find selected sector and subsector
            let subSectorNombre = '', sectorNombre = '';
            const subsectorSeleccionado = sectores.flatMap(sector => {
                if (sector.id === selectedSector) {
                    sectorNombre = sector.nombre; // Get subsector name
                }
                return sector.subsectores;
            }).find(subsector => subsector.id === subSectorId);

            if (subsectorSeleccionado) {
                subSectorNombre = subsectorSeleccionado.nombre; // Get subsector name
            }
            // Check for duplicate part names
            const nombresPartesNormalizados = subsectorSeleccionado?.partes.map(parte => parte.nombre.toLowerCase().trim()) || [];
            if (nombresPartesNormalizados.includes(nombreParteNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                // Create a new part document in Firestore with batch write
                const parteCollectionRef = collection(db, `proyectos/${id}/sector/${selectedSector}/subsector/${subSectorId}/parte`);
                const batch = writeBatch(db);
                const nuevaParteRef = doc(parteCollectionRef);
                batch.set(nuevaParteRef, {
                    nombre: parteInput,
                    sectorId: selectedSector,
                    subSectorId: subSectorId,
                    sectorNombre: sectorNombre, // Include sector name
                    subSectorNombre: subSectorNombre, // Include subsector name
                });
                await batch.commit();
                // Success alert and UI update
                setAlerta('Agregado correctamente.');
                setTipoAlerta('success');
                setMostrarModal(true);
                setParteInput('');

                // Refresh the subsector data and update the UI
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
    // Handles adding a part when the button is clicked
    const handleAgregarParte = () => {
        if (selectedSubSector) {
            agregarParte(selectedSubSector);
        } else {
            console.error('No se ha seleccionado ningún subsector.');
        }
    };

    // Updates the selected part state when the dropdown value changes
    const handleParteChange = (event) => {
        setSelectedParte(event.target.value);
    };

    // Adds a new element to a specific part
    const agregarElemento = async (parteId) => {
        try {
            // Validate input
            if (!elementoInput.trim()) {
                setAlerta('El campo no puede estar vacío.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return; // Detener la ejecución de la función
            }
            // Normalize the input name
            const nombreElementoNormalizado = elementoInput.toLowerCase().trim();
            let sectorNombre = '', subSectorNombre = '', parteNombre = '';

            // Retrieve sector, subsector, and part names
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
            // Check for duplicate element names in Firestore
            const elementoCollectionRef = collection(db, `proyectos/${id}/sector/${selectedSector}/subsector/${selectedSubSector}/parte/${parteId}/elemento`);
            const elementosSnapshot = await getDocs(elementoCollectionRef);
            const nombresElementosExistentes = elementosSnapshot.docs.map(doc => doc.data().nombre.toLowerCase().trim());

            if (nombresElementosExistentes.includes(nombreElementoNormalizado)) {
                setAlerta('El nombre ya existe en la base de datos.');
                setTipoAlerta('error');
                setMostrarModal(true);
            } else {
                // Add the new element to Firestore
                const nuevoElementoRef = doc(elementoCollectionRef);
                await setDoc(nuevoElementoRef, {
                    nombre: elementoInput,
                    sectorId: selectedSector,
                    subSectorId: selectedSubSector,
                    parteId: parteId,
                    sectorNombre: sectorNombre,
                    subSectorNombre: subSectorNombre,
                    parteNombre: parteNombre,
                });

                // Update the UI to include the new element
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
                                                    sectorNombre,
                                                    subSectorNombre,
                                                    parteNombre,
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
                // Show modal
                setSectores(nuevosSectores);
                setElementoInput('');
                setAlerta('Agregado correctamente.');
                setTipoAlerta('success');
                setMostrarModal(true);
            }
        } catch (error) {
            console.error('Error al agregar el elemento:', error);
            setAlerta('Error al agregar.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }
    };


    // Function to add a new lot to the Firestore database and update the UI
    const agregarLote = async (elementoId) => {
        // Verify that the lot input is not empty
        if (!loteInput.trim()) {
            setAlerta('El campo no puede estar vacío.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }
        // Validate that required selections (element, part, subsector, sector) are made
        if (!elementoId || !selectedParte || !selectedSubSector || !selectedSector) {
            console.error('No se ha seleccionado correctamente el elemento, parte, subsector, sector.');
            setAlerta('Selecciona correctamente todos los campos requeridos.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        try {
            // Normalize the lot name for validation
            const nombreLoteNormalizado = loteInput.toLowerCase().trim();

            // Generate a unique ID for the new lot
            const loteId = doc(collection(db, 'lotes')).id;

            // Retrieve the selected PPI object
            const ppiSeleccionado = ppis.find(ppi => ppi.id === selectedPpi);

            // Retrieve contextual names (sector, subsector, part, and element) for the new lot
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

            // Check for duplicate lot names within the current element
            const elementoActual = sectores.flatMap(sector => sector.subsectores)
                .flatMap(subsector => subsector.partes)
                .flatMap(parte => parte.elementos)
                .find(elemento => elemento.id === elementoId);
            if (elementoActual && elementoActual.lotes && elementoActual.lotes.some(lote => lote.nombre.toLowerCase().trim() === nombreLoteNormalizado)) {
                setAlerta('El nombre ya existe.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }


            // Prepare the new lot object with required details
            const nuevoLote = {
                nombre: loteInput,
                ppiId: selectedPpi || '', // Si no hay PPI seleccionado, deja el campo vacío
                ppiNombre: selectedPpi ? ppis.find(ppi => ppi.id === selectedPpi)?.nombre : '', // Nombre opcional
                totalSubactividades: ppiSeleccionado?.totalSubactividades || 0, // Si no hay PPI, total será 0
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
                idBim: idBimInput,
                estado: 'pendiente',
                idProyecto: id,
                nombreProyecto: nameProject,
            };

            // Add the new lot to the specific Firestore subcollection path
            const loteSubColeccionRef = doc(db, `proyectos/${id}/sector/${selectedSector}/subsector/${selectedSubSector}/parte/${selectedParte}/elemento/${elementoId}/lote/${loteId}`);
            await setDoc(loteSubColeccionRef, nuevoLote);

            // Add the new lot to the main "lotes" collection for centralized access
            const lotePrincipalRef = doc(db, `lotes/${loteId}`);
            await setDoc(lotePrincipalRef, nuevoLote);

            // Create the "inspecciones" subcollection inside the new lot with PPI details
            if (ppiSeleccionado) {
                const inspeccionRef = doc(collection(db, `lotes/${loteId}/inspecciones`));
                await setDoc(inspeccionRef, ppiSeleccionado);
            }

            // Reset form inputs
            setLoteInput('');
            setSelectedPpi('');
            setPkInicialInput('');
            setPkFinalInput('');
            setIdBimInput('');
            // Show success alert
            setAlerta('Agregado correctamente');
            setTipoAlerta('success');
            setMostrarModal(true);

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


            // Update the "sectores" state to reflect the new lot without refreshing data
            const sectoresActualizados = sectores.map(sector => {
                if (sector.id === selectedSector) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map(subsector => {
                            if (subsector.id === selectedSubSector) {
                                return {
                                    ...subsector,
                                    partes: subsector.partes.map(parte => {
                                        if (parte.id === selectedParte) {
                                            return {
                                                ...parte,
                                                elementos: parte.elementos.map(elemento => {
                                                    if (elemento.id === elementoId) {
                                                        const nuevosLotes = elemento.lotes ? [...elemento.lotes, { ...nuevoLote, id: loteId }] : [{ ...nuevoLote, id: loteId }];
                                                        return { ...elemento, lotes: nuevosLotes };
                                                    }
                                                    return elemento;
                                                })
                                            };
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

            setSectores(sectoresActualizados);
        } catch (error) {
            // Handle any errors and display an error alert
            console.error('Error al agregar el lote:', error);
            setAlerta('Error al agregar.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }
    };


    // Function to fetch "lotes" (lots) from the Firestore database for a specific element
    const obtenerLotes = async (sectorId, subSectorId, parteId, elementoId) => {
        try {
            // Reference to the "lote" subcollection path in Firestore
            const loteCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subSectorId}/parte/${parteId}/elemento/${elementoId}/lote`);
            // Fetch documents from the "lote" collection
            const loteSnapshot = await getDocs(loteCollectionRef);
            // Map the Firestore documents into an array of lot objects
            const lotesData = loteSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            return lotesData;
        } catch (error) {
            console.error('Error al obtener los lotes:', error);
            return []; // Return an empty array on error to prevent interruptions
        }
    };


    // Function to fetch "elementos" (elements) from the Firestore database for a specific part
    const obtenerElementos = async (sectorId, subSectorId, parteId) => {
        try {
            // Reference to the "elemento" subcollection path in Firestore
            const elementoCollectionRef = collection(db, `proyectos/${id}/sector/${sectorId}/subsector/${subSectorId}/parte/${parteId}/elemento`);
            // Fetch documents from the "elemento" collection
            const elementoSnapshot = await getDocs(elementoCollectionRef);
            // Fetch and include "lotes" for each element
            const elementos = await Promise.all(elementoSnapshot.docs.map(async doc => {
                const elementoData = { id: doc.id, ...doc.data() };
                // Fetch associated "lotes" for the current element
                elementoData.lotes = await obtenerLotes(sectorId, subSectorId, parteId, doc.id);
                return elementoData;
            }));
            return elementos;
        } catch (error) {
            console.error('Error al obtener los elementos:', error);
            return []; // Return an empty array on error to prevent interruptions
        }
    };


    // Function to load PPIs (Project Performance Indicators) from Firestore
    const cargarPpis = async () => {
        try {
            // Fetch all documents from the "ppis" collection in Firestore
            const querySnapshot = await getDocs(collection(db, "ppis"));
            // Transform documents into an array of objects with id and data
            const ppisList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            // Update the state with the fetched PPIs
            setPpis(ppisList);
        } catch (error) {
            console.error("Error al cargar los PPIs:", error);
        }
    };

    // useEffect to load PPIs when the component mounts
    useEffect(() => {
        cargarPpis();
    }, []);


    const eliminarSubsector = async () => {
        try {
            // Referencia a la subcolección 'parte' dentro del subsector
            const partesRef = collection(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector/${subsectorIdAEliminar}/parte`);

            // Obtener todas las partes dentro del subsector
            const partesSnapshot = await getDocs(partesRef);

            // Si hay partes dentro, mostrar alerta y cancelar eliminación
            if (!partesSnapshot.empty) {
                setAlerta('No se puede eliminar. El subsector tiene partes dentro. Elimínalas primero.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }

            // Referencia al documento 'subsector' en Firestore
            const subsectorRef = doc(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector`, subsectorIdAEliminar);

            // Eliminar el subsector de Firestore
            await deleteDoc(subsectorRef);

            // Actualizar el estado local para reflejar la eliminación
            const sectoresActualizados = sectores.map(sector => {
                if (sector.id === sectorIdAEliminar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.filter(subsector => subsector.id !== subsectorIdAEliminar),
                    };
                }
                return sector;
            });

            // Actualizar el estado con la nueva lista de sectores
            setSectores(sectoresActualizados);

            // Mostrar mensaje de éxito
            setAlerta('Subsector eliminado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);

        } catch (error) {
            // Manejar errores y mostrar alerta de error
            console.error('Error al eliminar el subsector:', error);
            setAlerta('Error al eliminar el subsector.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        // Cerrar el modal de confirmación
        setMostrarModalEliminarSubSector(false);
    };



    // State to manage the delete lote modal visibility and IDs
    const [mostrarModalEliminarLote, setMostrarModalEliminarLote] = useState(false);
    const [loteIdAEliminar, setLoteIdAEliminar] = useState(null);
    // Function to confirm lote deletion by setting relevant IDs and showing the modal
    const confirmarDeleteLote = (sectorId, subsectorId, parteId, elementoId, loteId) => {
        setSectorIdAEliminar(sectorId);
        setSubsectorIdAEliminar(subsectorId);
        setParteIdAEliminar(parteId);
        setElementoIdAEliminar(elementoId);
        setLoteIdAEliminar(loteId);
        setMostrarModalEliminarLote(true);
    };
    // Function to delete a specific 'lote' (batch) from Firestore and update the local state
    const eliminarLote = async () => {
        try {
            // Step 1: Delete the 'lote' document from the specific subcollection in Firestore
            const loteRefSubcoleccion = doc(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector/${subsectorIdAEliminar}/parte/${parteIdAEliminar}/elemento/${elementoIdAEliminar}/lote/${loteIdAEliminar}`);
            await deleteDoc(loteRefSubcoleccion);

            // Step 1.1: Delete the 'lote' document from the main 'lotes' collection
            const loteRefPrincipal = doc(db, `lotes/${loteIdAEliminar}`);
            await deleteDoc(loteRefPrincipal);

            // Step 2: Update the local state to remove the deleted 'lote' from the UI
            setSectores(prevSectores => prevSectores.map(sector => {
                if (sector.id === sectorIdAEliminar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map(subsector => {
                            if (subsector.id === subsectorIdAEliminar) {
                                return {
                                    ...subsector,
                                    partes: subsector.partes.map(parte => {
                                        if (parte.id === parteIdAEliminar) {
                                            return {
                                                ...parte,
                                                elementos: parte.elementos.map(elemento => {
                                                    if (elemento.id === elementoIdAEliminar) {
                                                        // Filter out the deleted 'lote'
                                                        const lotesActualizados = elemento.lotes.filter(lote => lote.id !== loteIdAEliminar);
                                                        return {
                                                            ...elemento,
                                                            lotes: lotesActualizados
                                                        };
                                                    }
                                                    return elemento;
                                                })
                                            };
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
            }));

            // Step 3: Display success message and close the modal
            setAlerta('Eliminado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);
        } catch (error) {
            // Step 4: Handle errors and display an error message
            console.error('Error al eliminar el lote:', error);
            setAlerta('Error al eliminar.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        // Step 5: Reset all state variables related to the deletion process
        setMostrarModalEliminarLote(false);
        setSectorIdAEliminar(null);
        setSubsectorIdAEliminar(null);
        setParteIdAEliminar(null);
        setElementoIdAEliminar(null);
        setLoteIdAEliminar(null);
    };





    // Function to confirm the deletion of a 'subsector' by setting its IDs and showing the confirmation modal
    const confirmarDeleteSubSector = (sectorId, subsectorId) => {
        setSectorIdAEliminar(sectorId);
        setSubsectorIdAEliminar(subsectorId);
        setMostrarModalEliminarSubSector(true);
    };

    // State to manage the confirmation modal for deleting a sector
    const [mostrarModalEliminarSector, setMostrarModalEliminarSector] = useState(false)
    // Function to prompt the deletion of a sector
    const solicitarEliminarSector = (sectorId) => {
        setSectorIdAEliminar(sectorId);
        setMostrarModalEliminarSector(true);
    };
    // Function to delete a sector from Firestore and update the local state
    const eliminarSector = async () => {
        try {
            // Referencia a la subcolección 'subsector' dentro del sector
            const subsectoresRef = collection(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector`);

            // Obtener todos los subsectores dentro del sector
            const subsectoresSnapshot = await getDocs(subsectoresRef);

            // Si hay subsectores dentro, mostrar alerta y cancelar eliminación
            if (!subsectoresSnapshot.empty) {
                setAlerta('No se puede eliminar. El sector tiene subsectores dentro. Elimínalos primero.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }

            // Referencia al documento del sector en Firestore
            const sectorRef = doc(db, `proyectos/${id}/sector`, sectorIdAEliminar);

            // Eliminar el sector de Firestore
            await deleteDoc(sectorRef);

            // Actualizar el estado eliminando el sector
            const sectoresActualizados = sectores.filter(sector => sector.id !== sectorIdAEliminar);
            setSectores(sectoresActualizados);

            // Mostrar mensaje de éxito
            setAlerta('Sector eliminado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);

        } catch (error) {
            // Manejar errores y mostrar alerta de error
            console.error('Error al eliminar el sector:', error);
            setAlerta('Error al eliminar el sector.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        // Ocultar el modal de confirmación
        setMostrarModalEliminarSector(false);
    };

    // State to store the ID of the 'parte' to delete and manage the delete confirmation modal visibility
    const [parteIdAEliminar, setParteIdAEliminar] = useState(null);
    const [mostrarModalEliminarParte, setMostrarModalEliminarParte] = useState(false)
    // Function to confirm the deletion of a 'parte' by storing IDs and showing the confirmation modal
    const confirmarDeleteParte = (sectorId, subsectorId, parteId) => {
        setSectorIdAEliminar(sectorId); // Asegúrate de tener este estado si necesitas referenciar al sector para la eliminación
        setSubsectorIdAEliminar(subsectorId); // Similarmente, si necesitas el ID del subsector, asegúrate de tener un estado para ello
        setParteIdAEliminar(parteId);
        setMostrarModalEliminarParte(true);
    };
    // Function to delete a 'parte' from Firestore and update the local state
    const eliminarParte = async () => {
        try {
            // Referencia a la subcolección 'elemento' dentro de la parte
            const elementosRef = collection(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector/${subsectorIdAEliminar}/parte/${parteIdAEliminar}/elemento`);

            // Obtener todos los elementos dentro de la parte
            const elementosSnapshot = await getDocs(elementosRef);

            // Si hay elementos dentro, mostrar alerta y cancelar eliminación
            if (!elementosSnapshot.empty) {
                setAlerta('No se puede eliminar. La parte tiene elementos dentro. Elimínalos primero.');
                setTipoAlerta('error');
                setMostrarModal(true);
                return;
            }

            // Referencia al documento 'parte' en Firestore
            const parteRef = doc(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector/${subsectorIdAEliminar}/parte`, parteIdAEliminar);

            // Eliminar la parte de Firestore
            await deleteDoc(parteRef);

            // Actualizar el estado local para reflejar la eliminación
            const sectoresActualizados = sectores.map(sector => {
                if (sector.id === sectorIdAEliminar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map(subsector => {
                            if (subsector.id === subsectorIdAEliminar) {
                                return {
                                    ...subsector,
                                    partes: subsector.partes.filter(parte => parte.id !== parteIdAEliminar),
                                };
                            }
                            return subsector;
                        }),
                    };
                }
                return sector;
            });

            // Actualizar el estado con la nueva lista de sectores
            setSectores(sectoresActualizados);

            // Mostrar mensaje de éxito
            setAlerta('Parte eliminada correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);

        } catch (error) {
            // Manejar errores y mostrar alerta de error
            console.error('Error al eliminar:', error);
            setAlerta('Error al eliminar la parte.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        // Cerrar el modal de confirmación
        setMostrarModalEliminarParte(false);
    };



    // Eliminar elemento
    const [mostrarModalEliminarElemento, setMostrarModalEliminarElemento] = useState(false);
    const [elementoIdAEliminar, setElementoIdAEliminar] = useState(null);

    const confirmarDeleteElemento = (sectorId, subsectorId, parteId, elementoId) => {
        setSectorIdAEliminar(sectorId);
        setSubsectorIdAEliminar(subsectorId);
        setParteIdAEliminar(parteId);
        setElementoIdAEliminar(elementoId);
        setMostrarModalEliminarElemento(true);
    };
    // Function to delete an 'elemento' document from Firestore and update the state
    const eliminarElemento = async () => {
        try {
            // Referencia a la subcolección 'lote' dentro del elemento
            const lotesRef = collection(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector/${subsectorIdAEliminar}/parte/${parteIdAEliminar}/elemento/${elementoIdAEliminar}/lote`);

            // Obtener todos los lotes dentro del elemento
            const lotesSnapshot = await getDocs(lotesRef);

            // 🔹 Si hay lotes, mostrar alerta y cancelar la eliminación
            if (!lotesSnapshot.empty) {
                setAlerta("⚠️ No puedes eliminar este elemento porque contiene actividades. Elimina las actividades primero.");
                setTipoAlerta("warning");
                setMostrarModal(true);
                return;
            }

            // Referencia al documento 'elemento'
            const elementoRef = doc(db, `proyectos/${id}/sector/${sectorIdAEliminar}/subsector/${subsectorIdAEliminar}/parte/${parteIdAEliminar}/elemento/${elementoIdAEliminar}`);

            // Eliminar el 'elemento'
            await deleteDoc(elementoRef);

            // Actualizar el estado local
            const sectoresActualizados = sectores.map(sector => {
                if (sector.id === sectorIdAEliminar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map(subsector => {
                            if (subsector.id === subsectorIdAEliminar) {
                                return {
                                    ...subsector,
                                    partes: subsector.partes.map(parte => {
                                        if (parte.id === parteIdAEliminar) {
                                            return {
                                                ...parte,
                                                elementos: parte.elementos.filter(elemento => elemento.id !== elementoIdAEliminar)
                                            };
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

            // Actualizar el estado en React
            setSectores(sectoresActualizados);

            // Mostrar mensaje de éxito
            setAlerta('✅ Elemento eliminado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);
        } catch (error) {
            console.error('❌ Error al eliminar:', error);
            setAlerta('❌ Error al eliminar el elemento.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        // Cerrar el modal de confirmación
        setMostrarModalEliminarElemento(false);
    };



    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


    // EDICION TRAZABILIDAD

    /// SECTOR ///
    // State for managing sector editing
    const [sectorIdAEditar, setSectorIdAEditar] = useState(null);// Stores the ID of the sector being edited
    const [nuevoNombreSector, setNuevoNombreSector] = useState(''); // Stores the new name for the sector
    const [mostrarModalEditarSector, setMostrarModalEditarSector] = useState(false); // Controls visibility of the edit modal

    // Function to initiate the editing process for a sector
    const solicitarEditarSector = (sectorId, nombreActual) => {
        setSectorIdAEditar(sectorId);
        setNuevoNombreSector(nombreActual);
        setMostrarModalEditarSector(true);
    };

    // Function to save the edited sector name to Firestore
    const guardarEdicionSector = async () => {
        if (!nuevoNombreSector.trim()) {
            setAlerta('El nombre no puede estar vacío.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        try {
            // Actualizar el sector en su subcolección
            const docRef = doc(db, `proyectos/${id}/sector`, sectorIdAEditar);
            await updateDoc(docRef, { nombre: nuevoNombreSector });

            // Propagar el cambio a la colección 'lotes'
            const lotesQuery = query(
                collection(db, 'lotes'),
                where('idSector', '==', sectorIdAEditar)
            );
            const lotesSnapshot = await getDocs(lotesQuery);
            const batch = writeBatch(db);

            lotesSnapshot.docs.forEach((loteDoc) => {
                batch.update(loteDoc.ref, { sectorNombre: nuevoNombreSector });
            });

            await batch.commit();

            // Actualizar el estado local
            const sectoresActualizados = sectores.map((sector) =>
                sector.id === sectorIdAEditar ? { ...sector, nombre: nuevoNombreSector } : sector
            );
            setSectores(sectoresActualizados);

            setAlerta('Actualizado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);
        } catch (error) {
            console.error('Error al actualizar:', error);
            setAlerta('Error al actualizar.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        setMostrarModalEditarSector(false);
        setSectorIdAEditar('');
        setNuevoNombreSector('');
    };




    /// SUB SECTOR ///
    // State for managing subsector editing
    const [subSectorIdAEditar, setSubSectorIdAEditar] = useState(null); // ID of the subsector being edited
    const [nuevoNombreSubSector, setNuevoNombreSubSector] = useState(''); // New name for the subsector
    const [mostrarModalEditarSubSector, setMostrarModalEditarSubSector] = useState(false); // Controls visibility of the edit modal


    // Function to initiate the editing process for a subsector
    const solicitarEditarSubSector = (sectorId, subSectorId, nombreActual) => {
        setSectorIdAEditar(sectorId); // Set the parent sector ID
        setSubSectorIdAEditar(subSectorId); // Set the subsector ID to be edited
        setNuevoNombreSubSector(nombreActual); // Pre-fill the input with the current subsector name
        setMostrarModalEditarSubSector(true); // Show the edit modal
    };

    // Function to save the edited subsector name to Firestore
    const guardarEdicionSubSector = async () => {
        if (!nuevoNombreSubSector.trim()) {
            setAlerta('El nombre no puede estar vacío.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        try {
            // Actualizar el subsector en su subcolección
            const docRef = doc(db, `proyectos/${id}/sector/${sectorIdAEditar}/subsector`, subSectorIdAEditar);
            await updateDoc(docRef, { nombre: nuevoNombreSubSector });

            // Propagar el cambio a la colección 'lotes'
            const lotesQuery = query(
                collection(db, 'lotes'),
                where('idSubSector', '==', subSectorIdAEditar)
            );
            const lotesSnapshot = await getDocs(lotesQuery);
            const batch = writeBatch(db);

            lotesSnapshot.docs.forEach((loteDoc) => {
                batch.update(loteDoc.ref, { subSectorNombre: nuevoNombreSubSector });
            });

            await batch.commit();

            // Actualizar el estado local
            const sectoresActualizados = sectores.map((sector) => {
                if (sector.id === sectorIdAEditar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map((subsector) =>
                            subsector.id === subSectorIdAEditar ? { ...subsector, nombre: nuevoNombreSubSector } : subsector
                        ),
                    };
                }
                return sector;
            });
            setSectores(sectoresActualizados);

            setAlerta('Actualizado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);
        } catch (error) {
            console.error('Error al actualizar:', error);
            setAlerta('Error al actualizar.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        setMostrarModalEditarSubSector(false);
        setSectorIdAEditar('');
        setSubSectorIdAEditar('');
        setNuevoNombreSubSector('');
    };


    /// PARTE ///
    // States for managing the editing of a specific part
    const [parteIdAEditar, setParteIdAEditar] = useState(null);
    const [nuevoNombreParte, setNuevoNombreParte] = useState('');
    const [mostrarModalEditarParte, setMostrarModalEditarParte] = useState(false);

    // Function to request the editing of a specific part
    const solicitarEditarParte = (sectorId, subSectorId, parteId, nombreActual) => {
        setSectorIdAEditar(sectorId);
        setSubSectorIdAEditar(subSectorId);
        setParteIdAEditar(parteId);
        setNuevoNombreParte(nombreActual);
        setMostrarModalEditarParte(true);
    };

    // Function to save the edits made to the part
    const guardarEdicionParte = async () => {
        if (!nuevoNombreParte.trim()) {
            setAlerta('El nombre no puede estar vacío.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        try {
            // Actualizar la parte en su subcolección
            const docRef = doc(db, `proyectos/${id}/sector/${sectorIdAEditar}/subsector/${subSectorIdAEditar}/parte`, parteIdAEditar);
            await updateDoc(docRef, { nombre: nuevoNombreParte });

            // Propagar el cambio a la colección 'lotes'
            const lotesQuery = query(
                collection(db, 'lotes'),
                where('parteId', '==', parteIdAEditar)
            );
            const lotesSnapshot = await getDocs(lotesQuery);
            const batch = writeBatch(db);

            lotesSnapshot.docs.forEach((loteDoc) => {
                batch.update(loteDoc.ref, { parteNombre: nuevoNombreParte });
            });

            await batch.commit();

            // Actualizar el estado local
            const sectoresActualizados = sectores.map((sector) => {
                if (sector.id === sectorIdAEditar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map((subsector) => {
                            if (subsector.id === subSectorIdAEditar) {
                                return {
                                    ...subsector,
                                    partes: subsector.partes.map((parte) =>
                                        parte.id === parteIdAEditar ? { ...parte, nombre: nuevoNombreParte } : parte
                                    ),
                                };
                            }
                            return subsector;
                        }),
                    };
                }
                return sector;
            });

            setSectores(sectoresActualizados);

            setAlerta('Actualizada correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);
        } catch (error) {
            console.error('Error al actualizar:', error);
            setAlerta('Error al actualizar.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        setMostrarModalEditarParte(false);
        setSectorIdAEditar('');
        setSubSectorIdAEditar('');
        setParteIdAEditar('');
        setNuevoNombreParte('');
    };


    /// ELEMENTO /// 

    const [elementoIdAEditar, setElementoIdAEditar] = useState(null);
    const [nuevoNombreElemento, setNuevoNombreElemento] = useState('');
    const [mostrarModalEditarElemento, setMostrarModalEditarElemento] = useState(false);

    // Función para solicitar la edición de un elemento
    const solicitarEditarElemento = (sectorId, subSectorId, parteId, elementoId, nombreActual) => {
        setSectorIdAEditar(sectorId);
        setSubSectorIdAEditar(subSectorId);
        setParteIdAEditar(parteId);
        setElementoIdAEditar(elementoId);
        setNuevoNombreElemento(nombreActual);
        setMostrarModalEditarElemento(true);
    };

    const guardarEdicionElemento = async () => {
        if (!nuevoNombreElemento.trim()) {
            setAlerta('El nombre no puede estar vacío.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        try {
            // Actualizar el nombre del elemento en la subcolección
            const docRef = doc(db, `proyectos/${id}/sector/${sectorIdAEditar}/subsector/${subSectorIdAEditar}/parte/${parteIdAEditar}/elemento`, elementoIdAEditar);
            await updateDoc(docRef, { nombre: nuevoNombreElemento });

            // Propagar el cambio a la colección 'lotes'
            const lotesQuery = query(
                collection(db, 'lotes'),
                where('elementoId', '==', elementoIdAEditar) // Asegurarse de que coincide correctamente con elementoId
            );
            const lotesSnapshot = await getDocs(lotesQuery);

            if (!lotesSnapshot.empty) {
                const batch = writeBatch(db);

                lotesSnapshot.docs.forEach((loteDoc) => {
                    batch.update(loteDoc.ref, { elementoNombre: nuevoNombreElemento });
                });

                await batch.commit();
            }

            // Actualizar el estado local
            const sectoresActualizados = sectores.map((sector) => {
                if (sector.id === sectorIdAEditar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map((subsector) => {
                            if (subsector.id === subSectorIdAEditar) {
                                return {
                                    ...subsector,
                                    partes: subsector.partes.map((parte) => {
                                        if (parte.id === parteIdAEditar) {
                                            return {
                                                ...parte,
                                                elementos: parte.elementos.map((elemento) =>
                                                    elemento.id === elementoIdAEditar
                                                        ? { ...elemento, nombre: nuevoNombreElemento }
                                                        : elemento
                                                ),
                                            };
                                        }
                                        return parte;
                                    }),
                                };
                            }
                            return subsector;
                        }),
                    };
                }
                return sector;
            });

            setSectores(sectoresActualizados);
            setAlerta('Actualizado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);
        } catch (error) {
            console.error('Error al actualizar:', error);
            setAlerta('Error al actualizarA.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        // Resetear los estados relacionados
        setMostrarModalEditarElemento(false);
        setSectorIdAEditar('');
        setSubSectorIdAEditar('');
        setParteIdAEditar('');
        setNuevoNombreParte('');
        setNuevoNombreElemento('');
    };




    /// LOTE ///
    // States for managing the editing of a specific element
    const [mostrarModalEditarLote, setMostrarModalEditarLote] = useState(false);
    const [loteIdAEditar, setLoteIdAEditar] = useState(null);
    const [ppiIdAEditar, setPpiIdAEditar] = useState(null);
    const [nuevoNombreLote, setNuevoNombreLote] = useState('');
    const [nuevoPkInicial, setNuevoPkInicial] = useState('');
    const [nuevoPkFinal, setNuevoPkFinal] = useState('');
    const [nuevoIdBim, setNuevoIdBim] = useState('');
    // Function to request the editing of a specific element
    const solicitarEditarLote = (sectorId, subSectorId, parteId, elementoId, loteId, lote, ppiId) => {
        setSectorIdAEditar(sectorId);
        setSubSectorIdAEditar(subSectorId);
        setParteIdAEditar(parteId);
        setElementoIdAEditar(elementoId);
        setLoteIdAEditar(loteId);
        setPpiIdAEditar(ppiId);
        setNuevoNombreLote(lote.nombre);
        setNuevoPkInicial(lote.pkInicial || '');
        setNuevoPkFinal(lote.pkFinal || '');
        setNuevoIdBim(lote.idBim || '');
        // Si no hay PPI asignado, inicializa el selector de PPI vacío
        setSelectedPpi(lote.ppiId || '');
        setMostrarModalEditarLote(true);

    };
    // Function to save the edits made to the element
    const guardarEdicionLote = async () => {
        if (!nuevoNombreLote.trim()) {
            setAlerta('El nombre no puede estar vacío.');
            setTipoAlerta('error');
            setMostrarModal(true);
            return;
        }

        // Obtener el nombre del PPI seleccionado
        const ppiSeleccionado = ppis.find(ppi => ppi.id === selectedPpi);
        const ppiNombre = ppiSeleccionado ? ppiSeleccionado.nombre : "";

        console.log(ppiNombre, 'ppi seleccionado *****')
        let ppiData = null;

        // Buscar el documento completo del PPI en Firestore
        if (selectedPpi) {
            const ppiRef = doc(db, `ppis/${selectedPpi}`);
            const ppiDoc = await getDoc(ppiRef);

            if (ppiDoc.exists()) {
                ppiData = ppiDoc.data(); // Guardamos la data del PPI para usarla después
            } else {
                console.log("⚠️ No se encontró el documento del PPI en Firestore.");
            }
        }

        // Actualizar el lote en su subcolección
        const loteSubRef = doc(
            db,
            `proyectos/${id}/sector/${sectorIdAEditar}/subsector/${subSectorIdAEditar}/parte/${parteIdAEditar}/elemento/${elementoIdAEditar}/lote`,
            loteIdAEditar
        );

        try {
            // Actualizar el lote en su subcolección
            const loteSubRef = doc(
                db,
                `proyectos/${id}/sector/${sectorIdAEditar}/subsector/${subSectorIdAEditar}/parte/${parteIdAEditar}/elemento/${elementoIdAEditar}/lote`,
                loteIdAEditar
            );
            await updateDoc(loteSubRef, {
                nombre: nuevoNombreLote,
                pkInicial: nuevoPkInicial,
                pkFinal: nuevoPkFinal,
                idBim: nuevoIdBim,
                ppiId: selectedPpi,
                ppiNombre: ppiNombre,
            });

            // Propagar el cambio a la colección 'lotes'
            const lotePrincipalRef = doc(db, 'lotes', loteIdAEditar);
            await updateDoc(lotePrincipalRef, {
                nombre: nuevoNombreLote,
                pkInicial: nuevoPkInicial,
                pkFinal: nuevoPkFinal,
                idBim: nuevoIdBim,
                ppiId: selectedPpi,
                ppiNombre: ppiNombre,
            });

            // Crear la subcolección 'inspecciones' y guardar la información del PPI
            if (ppiData) {
                const inspeccionRef = doc(collection(db, `lotes/${loteIdAEditar}/inspecciones`));
                await setDoc(inspeccionRef, {
                    ...ppiData, // Guardamos toda la información del PPI
                });
                console.log("✅ Subcolección 'inspecciones' creada con éxito.");
            } else {
                console.log("⚠️ No se pudo crear la subcolección 'inspecciones' porque no hay PPI.");
            }


            // Actualizar el estado local
            const sectoresActualizados = sectores.map((sector) => {
                if (sector.id === sectorIdAEditar) {
                    return {
                        ...sector,
                        subsectores: sector.subsectores.map((subsector) => {
                            if (subsector.id === subSectorIdAEditar) {
                                return {
                                    ...subsector,
                                    partes: subsector.partes.map((parte) => {
                                        if (parte.id === parteIdAEditar) {
                                            return {
                                                ...parte,
                                                elementos: parte.elementos.map((elemento) => {
                                                    if (elemento.id === elementoIdAEditar) {
                                                        return {
                                                            ...elemento,
                                                            lotes: elemento.lotes.map(lote =>
                                                                lote.id === loteIdAEditar
                                                                    ? {
                                                                        ...lote,
                                                                        nombre: nuevoNombreLote,  // Mantiene el cambio de nombre
                                                                        ppiId: selectedPpi,  // Actualiza el ID del PPI
                                                                        ppiNombre: ppis.find(ppi => ppi.id === selectedPpi)?.nombre || '' // Actualiza el nombre del PPI
                                                                    }
                                                                    : lote
                                                            )
                                                        };
                                                    }
                                                    return elemento;
                                                }),
                                            };
                                        }
                                        return parte;
                                    }),
                                };
                            }
                            return subsector;
                        }),
                    };
                }
                return sector;
            });

            setSectores(sectoresActualizados);

            setAlerta('Actualizado correctamente.');
            setTipoAlerta('success');
            setMostrarModal(true);
        } catch (error) {
            console.error('Error al actualizar:', error);
            setAlerta('Error al actualizar.');
            setTipoAlerta('error');
            setMostrarModal(true);
        }

        setMostrarModalEditarLote(false);
        setLoteIdAEditar('');
        setNuevoNombreLote('');
        setNuevoPkInicial('');
        setNuevoPkFinal('');
        setNuevoIdBim('');
    };



    // Objeto de lotes

    const [modoLote, setModoLote] = useState("unico");
    const [loteCampos, setLoteCampos] = useState([]);

    // Manejar cambio en el select
    const handleModoLoteChange = (event) => {
        setModoLote(event.target.value);
        if (event.target.value === "unico") {
            setLoteCampos([]);
        }
    };

    // Agregar un nuevo campo al lote
    const agregarCampoLote = () => {
        setLoteCampos([...loteCampos, { id: Date.now(), nombre: "", valor: "" }]);
    };

    // Manejar cambios en los inputs de los campos adicionales
    const handleCampoChange = (id, field, value) => {
        const nuevosCampos = loteCampos.map((campo) =>
            campo.id === id ? { ...campo, [field]: value } : campo
        );
        setLoteCampos(nuevosCampos);
    };

    return (
        <div className='container mx-auto min-h-screen py-2 xl:px-14 text-gray-500'>
            {/* Encabezado */}
            <div className='flex gap-2 items-center justify-between px-5 py-3 text-base'>
                <div className='flex items-center gap-2'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />

                    <Link to={'/admin'}>
                        <h1 className='text-gray-600'>Administración</h1>
                    </Link>

                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <Link to={'#'}>
                        <h1 className='text-gray-600'>Trazabilidad </h1>
                    </Link>
                    <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                    <h1 className='font-medium text-amber-600'>{nameProject} </h1>
                </div>
                <div className='flex items-center'>
                    <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>
                </div>
            </div>
            <div className='w-full border-b-2 border-gray-200'></div>
            {/* Content */}
            <div className='flex gap-3 flex-col mt-5 bg-white xl:p-4 px-4 rounded rounded-xl shadow-md'>
                {/* Form of trazabilidad */}
                <div>
                    <div className='grid grid-cols-24 gap-2 xl:gap-6 text-sm'>

                        <div className='col-span-24 xl:col-span-6'>
                            {/* Sector == Grupo activos */}
                            <div className="flex flex-col items-start gap-3">
                                <p className='text-md bg-gray-200 font-medium text-gray-500 rounded-md px-3 py-2 flex items-center gap-2 w-full'>1. Sector</p>
                                <div className="flex flex-col xl:flex-row items-center w-full">
                                    <div className='w-full flex gap-2'>
                                        <input
                                            placeholder='Grupo activos'
                                            type="text"
                                            className='border px-3 py-1 rounded-lg w-full'
                                            value={sectorInput}
                                            onChange={(e) => setSectorInput(e.target.value)}
                                        />
                                        <button
                                            onClick={agregarSector}
                                            className="flex justify-center w-40 xl:w-20  xl:ml-2 xl:mt-0 bg-sky-600 hover:bg-sky-600 text-white text-lg font-medium py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out  hover:shadow-lg hover:-translate-y-1"
                                        >
                                            <IoMdAddCircle className='text-sm' />
                                        </button>
                                    </div>

                                </div>
                                <div className="flex flex-col items-start gap-3 w-full">

                                    <select
                                        id="sectores"
                                        className="border px-3 py-1 rounded-lg w-full"
                                        value={selectedSector}
                                        onChange={handleSectorChange}
                                    >
                                        <option value="">Seleccione un grupo activos</option>
                                        {sectores.map((sector) => (
                                            <option key={sector.id} value={sector.id}>{sector.nombre}</option>
                                        ))}
                                    </select>

                                </div>
                            </div>
                            {/* Sub Sector == Activo */}
                            <div className="flex flex-col col-span-4 items-start gap-3 mt-3">
                                <p className='text-md bg-gray-200 font-medium text-gray-500 w-full rounded-md px-3 py-2 flex items-center gap-2'>2. Sub sector</p>


                                <div className="flex flex gap-2 xl:flex-row items-center w-full">

                                    <input
                                        placeholder='Nuevo activo: '
                                        type="text"
                                        id="subsector"
                                        className='border px-3 py-1 rounded-lg w-full'
                                        value={subSectorInput}
                                        onChange={(e) => setSubSectorInput(e.target.value)}
                                    />
                                    <button
                                        onClick={() => agregarSubsector(selectedSector)}
                                        className="w-40 xl:w-20  flex justify-center xl:ml-2 bg-sky-600 hover:bg-sky-600 text-white text-lg font-medium py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out  hover:shadow-lg hover:-translate-y-1"
                                    >
                                        <IoMdAddCircle className='text-sm' />
                                    </button>
                                </div>

                            </div>

                            <div className="flex flex-col items-start gap-3 w-full mt-3">

                                <select
                                    id="subsectores"
                                    className="border px-3 py-1 rounded-lg w-full"
                                    value={selectedSubSector}
                                    onChange={handleSubSectorChange}
                                >
                                    <option value="">Seleccione un activo</option>
                                    {(sectores.find(sector => sector.id === selectedSector)?.subsectores || []).map((subsector) => (
                                        <option key={subsector.id} value={subsector.id}>{subsector.nombre}</option>
                                    ))}
                                </select>
                            </div>

                        </div>

                        {/* Parte == Inventario vial */}

                        <div className='flex flex-col col-span-24 xl:col-span-6 gap-3  mt-4 xl:mt-0'>
                            <p className='text-md bg-gray-200 font-medium text-gray-500 w-full rounded-md px-3 py-2 flex items-center gap-2'>3. Parte</p>


                            <div className="flex gap-2 xl:flex-row items-center w-full">

                                <input
                                    placeholder='Nuevo inventario vial: '
                                    type="text"
                                    id="parte"
                                    className='border px-3 py-1 rounded-lg w-full'
                                    value={parteInput}
                                    onChange={(e) => setParteInput(e.target.value)}
                                />
                                <button
                                    onClick={handleAgregarParte}
                                    className="w-40 xl:w-20  flex justify-center xl:ml-2  bg-sky-600 hover:bg-sky-600 text-white text-lg font-medium py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out  hover:shadow-lg hover:-translate-y-1"
                                >
                                    <IoMdAddCircle className='text-sm' />
                                </button>
                            </div>

                            <div className="flex flex-col items-start gap-3 w-full">

                                <select
                                    id="partes"
                                    className="border px-3 py-1 rounded-lg w-full"
                                    value={selectedParte}
                                    onChange={handleParteChange}
                                >
                                    <option value="">Seleccione un inventario vial</option>
                                    {(sectores.find(sector => sector.id === selectedSector)?.subsectores.find(subsector => subsector.id === selectedSubSector)?.partes || []).map((parte) => (
                                        <option key={parte.id} value={parte.id}>{parte.nombre}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Elemento == Componente */}

                            <div className='flex flex-col col-span-24 xl:col-span-5 gap-3    mt-5 xl:mt-0'>
                                <p className='text-md bg-gray-200 font-medium text-gray-500 w-full rounded-md px-3 py-2 flex items-center gap-2'>4. Elemento</p>
                                <div className="flex gap-2 xl:flex-row items-center w-full">

                                    <input
                                        placeholder='Nuevo componente: '
                                        type="text"
                                        id="elemento"
                                        className='border px-3 py-1 rounded-lg w-full'
                                        value={elementoInput}
                                        onChange={(e) => setElementoInput(e.target.value)}
                                    />
                                    <button
                                        onClick={() => agregarElemento(selectedParte)} // Asegúrate de tener un estado selectedParte para manejar la parte seleccionada
                                        className="w-40 xl:w-20  flex justify-center bg-sky-600 hover:bg-sky-600 text-white text-lg font-medium py-2 px-4 rounded-xl shadow-md transition duration-300 ease-in-out  hover:shadow-lg hover:-translate-y-1"
                                    >
                                        <IoMdAddCircle className='text-sm' />
                                    </button>
                                </div>

                                <div className="flex flex-col items-start gap-3 w-full">

                                    <select
                                        id="elementos"
                                        className="border px-3 py-1 rounded-lg w-full"
                                        value={selectedElemento}
                                        onChange={(e) => setSelectedElemento(e.target.value)}
                                    >
                                        <option value="">Seleccione un componente</option>
                                        {/* Asumiendo que tienes una manera de obtener los elementos del estado para el subsector y parte seleccionados */}
                                        {sectores.find(sector => sector.id === selectedSector)?.subsectores.find(subsector => subsector.id === selectedSubSector)?.partes.find(parte => parte.id === selectedParte)?.elementos.map((elemento) => (
                                            <option key={elemento.id} value={elemento.id}>{elemento.nombre}</option>
                                        ))}
                                    </select>
                                </div>



                            </div>
                        </div>

                        {/* Lote == Actividades mantenimiento, conservación, rehabilitación */}


                        <div className='flex flex-col col-span-24 xl:col-span-12 gap-3 mt-5 xl:mt-0 '>
                            <div className='text-start'>
                                <p className='text-md bg-gray-200 font-medium text-gray-500 w-full rounded-md px-3 py-2 flex items-center gap-2'>5. Lote</p>
                            </div>




                            <div className='grid xl:grid-cols-12 gap-3'>
                                <div className='flex flex-col gap-3 col-span-8'>

                                    <input
                                        placeholder='Trabajos'
                                        type="text"
                                        id="lote"
                                        className='border px-3 py-1 rounded-lg w-full'
                                        value={loteInput}
                                        onChange={(e) => setLoteInput(e.target.value)}
                                    />

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

                                    <input
                                        placeholder='Pk inicial: '
                                        type="text"
                                        id="pkInicial"
                                        className='border px-3 py-1 rounded-lg w-full'
                                        value={pkInicialInput}
                                        onChange={(e) => setPkInicialInput(e.target.value)}
                                    />
                                    <input
                                        placeholder='Pk final: '
                                        type="text"
                                        id="pkFinal"
                                        className='border px-3 py-1 rounded-lg w-full'
                                        value={pkFinalInput}
                                        onChange={(e) => setPkFinalInput(e.target.value)}
                                    />
                                    <div className="flex items-center">
                                        <input
                                            placeholder='GlobalID (Opcional)'
                                            type="text"
                                            className='border px-3 py-1 rounded-lg w-full'
                                            value={idBimInput}
                                            onChange={(e) => setIdBimInput(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div className=' col-span-4 xl:px-5'>
                                    <p className='font-medium flex items-center gap-3 text-xs'>
                                        <span className='text-amber-600 '>*</span>Para guardar trazabilidad selecciona un item en el desplegable
                                        y posteriormente agrega la información en cada campo.
                                    </p>

                                    <div className='flex flex-col gap-2'>
                                        <button
                                            onClick={() => agregarLote(selectedElemento)}
                                            className="w-32 xl:h-10 h-10 text-white xl:px-8 mt-4 flex justify-center items-center gap-3 font-semibold bg-amber-600 hover:bg-amber-700 rounded-xl shadow-md transition duration-300 ease-in-out  hover:shadow-lg hover:-translate-y-1"
                                        >
                                            <span className='text-white text-md transition duration-300 ease-in-out hover:translate-x-1 shadow-xl'><FaArrowAltCircleRight /></span>
                                            Guardar
                                        </button>

                                        <p className=' flex items-center gap-2'><span className='text-amber-600 text-xl'> *</span>Asigna el globalId dentro del modelo BIM</p>

                                        <Link to={'/visorAdmin'}>
                                            <button className="w-20 xl:w-32 xl:h-10 h-10 text-white text-3xl flex justify-center items-center gap-3 font-semibold bg-sky-600 hover:bg-sky-600 rounded-xl shadow-md transition duration-300 ease-in-out  hover:shadow-lg hover:-translate-y-1"><SiBim /></button></Link>

                                    </div>

                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                {/* Table */}
                <div className="mt-5">
                    <div className="hidden xl:flex bg-gray-200 rounded-t-lg font-medium items-center">
                        <p className="px-4 py-2 w-1/5">Sector</p>
                        <p className="px-4 py-2 w-1/5">Sub sector</p>
                        <p className="px-4 py-2 w-1/5">Parte</p>
                        <p className=" py-2 w-1/5">Elemento</p>
                        <p className="mr-5 py-2 w-1/5">Lote</p>
                    </div>

                    <div className="divide-y divide-gray-200">
                        {sectores.map((sector, index) => (
                            <div
                                key={sector.id}
                                className={`flex flex-wrap items-center ${index % 2 === 0 ? 'bg-gray-100' : 'bg-gray-50'} md:flex-row flex-col`}
                            >
                                
                                
                                    <ul className="divide-y divide-gray-200 md:w-5/5 w-full">
                                        {sector.subsectores.map((subsector) =>
                                            subsector.partes && subsector.partes.length > 0
                                                ? subsector.partes.sort((a, b) => a.nombre.localeCompare(b.nombre)).map((parte) =>
                                                    parte.elementos && parte.elementos.length > 0
                                                        ? parte.elementos.map((elemento) =>
                                                            elemento.lotes && elemento.lotes.length > 0
                                                                ? elemento.lotes.map((lote) => (
                                                                    <li
                                                                        key={lote.id}
                                                                        className="py-4 p-4 mb-4 md:mb-0 md:grid md:grid-cols-5"
                                                                    >
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{sector.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarSector(sector.id, sector.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => solicitarEliminarSector(sector.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{subsector.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarSubSector(sector.id, subsector.id, subsector.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => confirmarDeleteSubSector(sector.id, subsector.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{parte.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarParte(sector.id, subsector.id, parte.id, parte.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => confirmarDeleteParte(sector.id, subsector.id, parte.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{elemento.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarElemento(sector.id, subsector.id, parte.id, elemento.id, elemento.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() =>
                                                                                        confirmarDeleteElemento(sector.id, subsector.id, parte.id, elemento.id)
                                                                                    }
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col justify-center">
                                                                            <p className="font-medium">{lote.nombre}</p>
                                                                            <div className="flex justify-between">
                                                                                <div>
                                                                                    <p className={`${lote.ppiNombre ? 'text-green-500' : 'text-amber-600'}`}>
                                                                                        {lote.ppiNombre ? <p>PPI: {lote.ppiNombre}</p> : 'Ppi sin Asignar'}
                                                                                    </p>
                                                                                </div>
                                                                                <div className="flex gap-4 group">

                                                                                    <div className="flex gap-4">
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                solicitarEditarLote(sector.id, subsector.id, parte.id, elemento.id, lote.id, lote, lote.ppiId)
                                                                                            }
                                                                                            className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                        >
                                                                                            <VscEdit />
                                                                                        </button>
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                confirmarDeleteLote(sector.id, subsector.id, parte.id, elemento.id, lote.id)
                                                                                            }
                                                                                            className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                        >
                                                                                            <RiDeleteBinLine />
                                                                                        </button>
                                                                                    </div>

                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                ))
                                                                : (
                                                                    <li
                                                                        key={`${elemento.id}-sin-lote`}
                                                                        className="py-4  rounded-lg p-4 mb-4 md:mb-0 md:grid md:grid-cols-5"
                                                                    >
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{sector.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarSector(sector.id, sector.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => solicitarEliminarSector(sector.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{subsector.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() => solicitarEditarSubSector(sector.id, subsector.id, subsector.nombre)}
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => confirmarDeleteSubSector(sector.id, subsector.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{parte.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() => solicitarEditarParte(sector.id, subsector.id, parte.id, parte.nombre)}
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => confirmarDeleteParte(sector.id, subsector.id, parte.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex justify-between items-center group">
                                                                            <p>{elemento.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarElemento(sector.id, subsector.id, parte.id, elemento.id, elemento.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => confirmarDeleteElemento(sector.id, subsector.id, parte.id, elemento.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col justify-center">
                                                                            <div className="flex justify-between">
                                                                                <div>
                                                                                    <p>-</p>
                                                                                    <p className="text-red-500">-</p>
                                                                                </div>
                                                                                <div className="flex gap-4 group">
                                                                                    {lote.ppiId && (
                                                                                        <button
                                                                                            onClick={() =>
                                                                                                confirmarDeleteLote(sector.id, subsector.id, parte.id, elemento.id, lote.id)
                                                                                            }
                                                                                            className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                        >
                                                                                            <RiDeleteBinLine />
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </li>
                                                                )
                                                        )
                                                        : (
                                                            <li
                                                                key={`${parte.id}-sin-elemento`}
                                                                className="py-4 rounded-lg p-4 mb-4 md:mb-0 md:grid md:grid-cols-5"
                                                            >
                                                                <div className="flex justify-between items-center group">
                                                                            <p>{sector.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarSector(sector.id, sector.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => solicitarEliminarSector(sector.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                <div className="flex justify-between items-center group">
                                                                    <p>{subsector.nombre}</p>
                                                                    <div className="flex gap-4">
                                                                        <button
                                                                            onClick={() => solicitarEditarSubSector(sector.id, subsector.id, subsector.nombre)}
                                                                            className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                        >
                                                                            <VscEdit />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => confirmarDeleteSubSector(sector.id, subsector.id)}
                                                                            className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                        >
                                                                            <RiDeleteBinLine />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <div className="flex justify-between items-center group">
                                                                    <p>{parte.nombre}</p>
                                                                    <div className="flex gap-4">
                                                                        <button
                                                                            onClick={() => solicitarEditarParte(sector.id, subsector.id, parte.id, parte.nombre)}
                                                                            className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                        >
                                                                            <VscEdit />
                                                                        </button>
                                                                        <button
                                                                            onClick={() => confirmarDeleteParte(sector.id, subsector.id, parte.id)}
                                                                            className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                        >
                                                                            <RiDeleteBinLine />
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                                <p className="px-4 ">-</p>
                                                                <div className="flex flex-col justify-center">
                                                                    <div className="flex justify-between">
                                                                        <div>
                                                                            <p>-</p>
                                                                            <p className="text-red-500">-</p>
                                                                        </div>
                                                                        <div className="flex gap-4 group">
                                                                            {lote.ppiId && (
                                                                                <button
                                                                                    onClick={() =>
                                                                                        confirmarDeleteLote(sector.id, subsector.id, parte.id, elemento.id, lote.id)
                                                                                    }
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </li>
                                                        )
                                                )
                                                : (
                                                    <li
                                                        key={`${subsector.id}-sin-parte`}
                                                        className="py-4 rounded-lg p-4 mb-4 md:mb-0 md:grid md:grid-cols-5"
                                                    >
                                                        <div className="flex justify-between items-center group">
                                                                            <p>{sector.nombre}</p>
                                                                            <div className="flex gap-4">
                                                                                <button
                                                                                    onClick={() =>
                                                                                        solicitarEditarSector(sector.id, sector.nombre)
                                                                                    }
                                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <VscEdit />
                                                                                </button>
                                                                                <button
                                                                                    onClick={() => solicitarEliminarSector(sector.id)}
                                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                                >
                                                                                    <RiDeleteBinLine />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                        <div className="flex justify-between items-center group">
                                                           <p>{subsector.nombre}</p>
                                                            <div className="flex gap-4">
                                                                <button
                                                                    onClick={() => solicitarEditarSubSector(sector.id, subsector.id, subsector.nombre)}
                                                                    className="text-gray-500 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                >
                                                                    <VscEdit />
                                                                </button>
                                                                <button
                                                                    onClick={() => confirmarDeleteSubSector(sector.id, subsector.id)}
                                                                    className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                >
                                                                    <RiDeleteBinLine />
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <p className="px-4 ">-</p>
                                                        <p className="px-4 ">-</p>
                                                        <div className="flex flex-col justify-center">
                                                            <div className="flex justify-between">
                                                                <div>
                                                                    <p>-</p>
                                                                    <p className="text-red-500">-</p>
                                                                </div>
                                                                <div className="flex gap-4 group">
                                                                    {lote.ppiId && (
                                                                        <button
                                                                            onClick={() =>
                                                                                confirmarDeleteLote(sector.id, subsector.id, parte.id, elemento.id, lote.id)
                                                                            }
                                                                            className="text-amber-600 text-md opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                                        >
                                                                            <RiDeleteBinLine />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </li>
                                                )
                                        )}
                                    </ul>
                                
                            </div>
                        ))}
                    </div>




                </div>






                {mostrarModalEliminarSubSector && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white xl:max-w-xl mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">

                            <button onClick={handleCloseAlert} className="text-2xl w-full flex justify-end text-gray-500"><IoCloseCircle /></button>
                            <div>
                                <p>¿Estas seguro de eliminar?</p>
                                <p className='text-amber-700 text-sm mt-2'>* Se eliminara el elemento seleccionado con sus datos asociados</p>
                            </div>

                            <div className='flex justify-center gap-5 mt-3'>
                                <button
                                    onClick={eliminarSubsector}
                                    className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'>Eliminar</button>
                                <button
                                    onClick={handleCloseAlert}
                                    className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
                {mostrarModalEliminarSector && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white xl:max-w-xl mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">

                            <button onClick={handleCloseAlert} className="text-2xl w-full flex justify-end text-gray-500"><IoCloseCircle /></button>
                            <div>
                                <p>¿Estas seguro de eliminar?</p>
                                <p className='text-amber-700 text-sm mt-2'>* Se eliminara el elemento seleccionado con sus datos asociados</p>
                            </div>

                            <div className='flex justify-center gap-5 mt-3'>
                                <button
                                    onClick={eliminarSector}
                                    className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'>Eliminar</button>
                                <button
                                    onClick={handleCloseAlert}
                                    className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarModalEliminarParte && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white xl:max-w-xl mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">

                            <button onClick={handleCloseAlert} className="text-2xl w-full flex justify-end text-gray-500"><IoCloseCircle /></button>
                            <div>
                                <p>¿Estas seguro de eliminar?</p>
                                <p className='text-amber-700 text-sm mt-2'>* Se eliminara el elemento seleccionado con sus datos asociados</p>
                            </div>

                            <div className='flex justify-center gap-5 mt-3'>
                                <button
                                    onClick={eliminarParte}
                                    className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'>Eliminar</button>
                                <button
                                    onClick={handleCloseAlert}
                                    className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
                {mostrarModalEliminarElemento && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white xl:max-w-xl mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">

                            <button onClick={handleCloseAlert} className="text-2xl w-full flex justify-end text-gray-500"><IoCloseCircle /></button>
                            <div>
                                <p>¿Estas seguro de eliminar?</p>
                                <p className='text-amber-700 text-sm mt-2'>* Se eliminara el elemento seleccionado con sus datos asociados</p>
                            </div>

                            <div className='flex justify-center gap-5 mt-3'>
                                <button
                                    onClick={eliminarElemento}
                                    className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'>Eliminar</button>
                                <button
                                    onClick={handleCloseAlert}
                                    className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarModalEliminarLote && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white xl:max-w-xl mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">

                            <button onClick={handleCloseAlert} className="text-2xl w-full flex justify-end text-gray-500"><IoCloseCircle /></button>
                            <div>
                                <p>¿Estas seguro de eliminar?</p>
                                <p className='text-amber-700 text-sm mt-2'>* Se eliminara el elemento seleccionado con sus datos asociados</p>
                            </div>

                            <div className='flex justify-center gap-5 mt-3'>
                                <button
                                    onClick={eliminarLote}
                                    className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'>Eliminar</button>
                                <button
                                    onClick={handleCloseAlert}
                                    className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'>Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}



                {mostrarModal && (
                    <div className="fixed z-50 inset-0 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                            {/* Success or Error Icon */}
                                            {tipoAlerta === 'success' ?
                                                <IoIosCheckmarkCircle className='text-6xl text-green-600' /> :
                                                <IoCloseCircle className='text-6xl text-red-600' />
                                            }
                                        </div>
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                                            <h3 className="text-lg leading-6 font-medium text-gray-900">
                                                {tipoAlerta === 'success' ? 'Éxito' : 'Error'}
                                            </h3>
                                            <div className="mt-2">
                                                <p className="text-sm text-gray-500">
                                                    {alerta}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={handleCloseAlert}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {mostrarModalPpi && (
                    <div className="fixed z-10 inset-0 overflow-y-auto">
                        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
                            </div>
                            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full" style={{ width: '320px', height: 'auto', maxWidth: '100%' }}>
                                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                                    <div className="sm:flex sm:items-start">
                                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
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
                                </div>
                                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="button"
                                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-gray-500 text-base font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 sm:ml-3 sm:w-auto sm:text-sm"
                                        onClick={handleCloseModalPpi}
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}



                {mostrarModalEditarSector && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">
                            <button onClick={() => setMostrarModalEditarSector(false)} className="text-2xl w-full flex justify-end text-gray-500">
                                <IoCloseCircle />
                            </button>
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Sector</h3>
                                <input
                                    type="text"
                                    value={nuevoNombreSector}
                                    onChange={(e) => setNuevoNombreSector(e.target.value)}
                                    placeholder="Nuevo nombre del sector"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />
                                <div className='flex justify-center gap-5 mt-3'>
                                    <button
                                        onClick={guardarEdicionSector}
                                        className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setMostrarModalEditarSector(false)}
                                        className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarModalEditarSubSector && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">
                            <button onClick={() => setMostrarModalEditarSubSector(false)} className="text-2xl w-full flex justify-end text-gray-500">
                                <IoCloseCircle />
                            </button>
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Subsector</h3>
                                <input
                                    type="text"
                                    value={nuevoNombreSubSector}
                                    onChange={(e) => setNuevoNombreSubSector(e.target.value)}
                                    placeholder="Nuevo nombre del subsector"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />
                                <div className='flex justify-center gap-5 mt-3'>
                                    <button
                                        onClick={guardarEdicionSubSector}
                                        className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setMostrarModalEditarSubSector(false)}
                                        className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarModalEditarParte && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">
                            <button onClick={() => setMostrarModalEditarParte(false)} className="text-2xl w-full flex justify-end text-gray-500">
                                <IoCloseCircle />
                            </button>
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Parte</h3>
                                <input
                                    type="text"
                                    value={nuevoNombreParte}
                                    onChange={(e) => setNuevoNombreParte(e.target.value)}
                                    placeholder="Nuevo nombre de la parte"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />
                                <div className='flex justify-center gap-5 mt-3'>
                                    <button
                                        onClick={guardarEdicionParte}
                                        className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setMostrarModalEditarParte(false)}
                                        className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarModalEditarElemento && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">
                            <button onClick={() => setMostrarModalEditarElemento(false)} className="text-2xl w-full flex justify-end text-gray-500">
                                <IoCloseCircle />
                            </button>
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Elemento</h3>
                                <input
                                    type="text"
                                    value={nuevoNombreElemento}
                                    onChange={(e) => setNuevoNombreElemento(e.target.value)}
                                    placeholder="Nuevo nombre del elemento"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />
                                <div className='flex justify-center gap-5 mt-3'>
                                    <button
                                        onClick={guardarEdicionElemento}
                                        className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setMostrarModalEditarElemento(false)}
                                        className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mostrarModalEditarLote && (
                    <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center">
                        <div className="modal-overlay absolute w-full h-full bg-gray-900 opacity-80"></div>

                        <div className="modal-container bg-white md:max-w-md mx-auto rounded shadow-lg z-50 overflow-y-auto p-4 text-center font-medium">
                            <button onClick={() => setMostrarModalEditarLote(false)} className="text-2xl w-full flex justify-end text-gray-500">
                                <IoCloseCircle />
                            </button>
                            <div>
                                <h3 className="text-lg leading-6 font-medium text-gray-900">Editar Lote</h3>
                                <input
                                    type="text"
                                    value={nuevoNombreLote}
                                    onChange={(e) => setNuevoNombreLote(e.target.value)}
                                    placeholder="Nuevo nombre del lote"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />
                                <input
                                    type="text"
                                    value={nuevoPkInicial}
                                    onChange={(e) => setNuevoPkInicial(e.target.value)}
                                    placeholder="Nuevo PK Inicial"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />
                                <input
                                    type="text"
                                    value={nuevoPkFinal}
                                    onChange={(e) => setNuevoPkFinal(e.target.value)}
                                    placeholder="Nuevo PK Final"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />
                                <input
                                    type="text"
                                    value={nuevoIdBim}
                                    onChange={(e) => setNuevoIdBim(e.target.value)}
                                    placeholder="Nuevo GlobalID"
                                    className="mt-2 border px-3 py-1 rounded-lg w-full"
                                />

                                {/* Selector de PPI para lotes sin PPI */}
                                {ppiIdAEditar == "" && (
                                    <select
                                        value={selectedPpi}
                                        onChange={(e) => setSelectedPpi(e.target.value)}
                                        className="mt-2 border px-3 py-1 rounded-lg w-full"
                                    >
                                        <option value="">Seleccione un PPI</option>
                                        {ppis.map(ppi => (
                                            <option key={ppi.id} value={ppi.id}>{ppi.nombre}</option>
                                        ))}
                                    </select>
                                )}




                                <div className='flex justify-center gap-5 mt-3'>
                                    <button
                                        onClick={guardarEdicionLote}
                                        className='bg-amber-600 hover:bg-amber-700 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Guardar
                                    </button>
                                    <button
                                        onClick={() => setMostrarModalEditarLote(false)}
                                        className='bg-gray-500 hover:bg-gray-600 text-white text-xs px-4 py-2 rounded-lg'
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}









            </div>
        </div>
    );
}

export default Trazabilidad;



