import React, { useState, useEffect } from 'react';
import * as OBC from "openbim-components";
import * as THREE from "three";
import { db } from '../../../firebase_config';
import { getDoc, getDocs, doc, collection, addDoc, runTransaction, writeBatch, setDoc, query, where, updateDoc, deleteDoc } from 'firebase/firestore';
import { IoMdAddCircle } from 'react-icons/io';
import { FaCheckCircle, FaTimesCircle } from 'react-icons/fa';
import { FaFilePdf } from "react-icons/fa6"; // Importa los íconos para "Apto" y "No apto"
import { GoHomeFill } from "react-icons/go";
import { FaArrowRight } from "react-icons/fa";
import { IoCloseCircle } from "react-icons/io5";
import { SiReacthookform } from "react-icons/si";
import { FaQuestionCircle } from "react-icons/fa";
import jsPDF from 'jspdf';
import logo from './assets/tpf_logo_azul.png'
import { Link, useNavigate, useParams } from 'react-router-dom';
import FormularioInspeccion from '../../Components/FormularioInspeccion';
import Trazabilidad from '../Administrador/Trazabilidad'
import TrazabilidadBim from '../Administrador/TrazabiidadBim';


interface Lote {
    docId: string;
    nombre: string;
    idBim: string;
    sectorNombre: string;
    subSectorNombre: string;
    parteNombre: string;
    elementoNombre: string;
    loteNombre: string;
    ppiNombre: string;
}

export default function VisorPrueba() {
    const [modelCount, setModelCount] = useState(0);
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [selectedGlobalId, setSelectedGlobalId] = useState<string | null>(null);
    const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
    const [inspecciones, setInspecciones] = useState([]);



    const titulo = "REGISTRO DE INSPECCIÓN DE OBRA REV-1"

    const imagenPath = "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2f/Adif_wordmark.svg/1200px-Adif_wordmark.svg.png"
    const imagenPath2 = logo
    const [nombreProyecto, setNombreProyecto] = useState(localStorage.getItem('nombre_proyecto') || '');
    const [obra, setObra] = useState(localStorage.getItem('obra'));
    const [tramo, setTramo] = useState(localStorage.getItem('tramo'));
    const [observaciones, setObservaciones] = useState('');
    const idLote = localStorage.getItem('loteId');
  
    const navigate = useNavigate();
    const [ppi, setPpi] = useState(null);


    // En ViewerComponent
const actualizarLotesDesdeHijo = (nuevoLote) => {
    console.log(nuevoLote, 'nuevo lote******')
    setLotes((lotesActuales) => [...lotesActuales, nuevoLote]);
    setSelectedLote(nuevoLote)
    
};

    // En el componente padre
const actualizarLotes = (nuevoLote) => {
    // Asumiendo que 'lotes' es el estado que contiene todos los lotes
    setLotes(lotesActuales => [...lotesActuales, nuevoLote]);
};
useEffect(() => {
    console.log(lotes, 'lotes actualizados')
}, [lotes]);

  


    useEffect(() => {
        obtenerLotes();
    }, []);

        const obtenerLotes = async () => {
            try {
                const lotesRef = collection(db, "lotes");
                const querySnapshot = await getDocs(lotesRef);
                const lotesData = querySnapshot.docs.map(doc => ({
                    docId: doc.id,
                    ...doc.data(),
                })) as Lote[];
                setLotes(lotesData);
                console.log(lotesData, 'lotes revisar*********')
            } catch (error) {
                console.error('Error al obtener los lotes:', error);
            }
        };

        
        // useEffect(() => {
        //     let viewer;
        //     let grid;
        //     let fragmentManager;
        //     let ifcLoader;
        //     let highlighter;
        //     let propertiesProcessor;
        //     let mainToolbar;
    
        //     const initViewer = async () => {
        //         console.log("Iniciando el visor...");
    
        //         viewer = new OBC.Components();
        //         console.log("Componentes del visor creados.");
    
        //         const sceneComponent = new OBC.SimpleScene(viewer);
        //         sceneComponent.setup();
        //         viewer.scene = sceneComponent;
        //         console.log("Componente de escena configurado.");
    
        //         const viewerContainer = document.getElementById("viewerContainer");
        //         const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer);
        //         viewer.renderer = rendererComponent;
        //         console.log("Componente de renderizado configurado.");
    
        //         const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
        //         viewer.camera = cameraComponent;
        //         console.log("Componente de cámara configurado.");
    
        //         const raycasterComponent = new OBC.SimpleRaycaster(viewer);
        //         viewer.raycaster = raycasterComponent;
    
        //         viewer.init();
        //         cameraComponent.updateAspect();
        //         rendererComponent.postproduction.enabled = true;
    
        //         grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
        //         rendererComponent.postproduction.customEffects.excludedMeshes.push(grid.get());
    
        //         fragmentManager = new OBC.FragmentManager(viewer);
        //         ifcLoader = new OBC.FragmentIfcLoader(viewer);
    
        //         highlighter = new OBC.FragmentHighlighter(viewer);
        //         highlighter.setup();
    
        //         propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer);
    
        //         highlighter.events.select.onHighlight.add((selection) => {
        //             const fragmentID = Object.keys(selection)[0];
        //             const expressID = Number([...selection[fragmentID]][0]);
        //             const properties = propertiesProcessor.getProperties(fragmentID, expressID.toString());
        //             if (properties) {
        //                 const globalIdProperty = properties.find(prop => prop.Name === 'GlobalId' || (prop.GlobalId && prop.GlobalId.value));
        //                 const globalId = globalIdProperty ? globalIdProperty.GlobalId.value : 'No disponible';
        //                 setSelectedGlobalId(globalId);
        //                 const lote = lotes.find(l => l.idBim === globalId);
    
        //                 if (lote) {
        //                     setSelectedLote(lote);
        //                     localStorage.setItem('loteId', lote.docId);
        //                     obtenerInspecciones(lote.docId);
        //                 } else {
        //                     setSelectedLote(null);
        //                     setInspecciones([]);
        //                     localStorage.removeItem('loteId');
        //                 }
        //             }
        //         });
    
        //         const loadIfcAsFragments = async () => {
        //             console.log("Cargando archivo IFC...");
        //             const file = await fetch('/modelos/Clinic_Architectural.ifc');
        //             const data = await file.arrayBuffer();
        //             const buffer = new Uint8Array(data);
        //             const model = await ifcLoader.load(buffer, "example");
        //             console.log("Archivo IFC cargado.");
    
        //             if (typeof viewer.scene.add === 'function') {
        //                 viewer.scene.add(model);  // Añade el modelo al escenario
        //             } else {
        //                 console.error("El método 'add' no está disponible en 'viewer.scene'");
        //             }
    
        //             setModelCount(fragmentManager.groups.length);
        //             propertiesProcessor.process(model);
        //             highlighter.update();
        //         };
    
        //         loadIfcAsFragments();
    
        //         mainToolbar = new OBC.Toolbar(viewer);
        //         mainToolbar.addChild(
        //             ifcLoader.uiElement.get("main"),
        //             propertiesProcessor.uiElement.get("main")
        //         );
        //         viewer.ui.addToolbar(mainToolbar);
        //         console.log("Visor completamente inicializado.");
        //     };
    
        //     initViewer();
    
        //     return () => {
        //         if (viewer) {
        //             console.log("Disposing viewer...");
        //             viewer.dispose();
        //         }
        //     };
        // }, [lotes]); 
    

// carga solo Srrgio
        // useEffect(() => {
        //     let viewer;
        //     let grid;
        //     let fragmentManager;
        //     let ifcLoader;
        //     let highlighter;
        //     let propertiesProcessor;
        //     let mainToolbar;
        
        //     const initViewer = async () => {
        //         viewer = new OBC.Components();
        
        //         const sceneComponent = new OBC.SimpleScene(viewer);
        //         sceneComponent.setup();
        //         viewer.scene = sceneComponent;
        
        //         const viewerContainer = document.getElementById("viewerContainer");
        //         const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer);
        //         viewer.renderer = rendererComponent;
        
        //         const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
        //         viewer.camera = cameraComponent;
        
        //         const raycasterComponent = new OBC.SimpleRaycaster(viewer);
        //         viewer.raycaster = raycasterComponent;
        
        //         viewer.init();
        //         cameraComponent.updateAspect();
        //         rendererComponent.postproduction.enabled = true;
        
        //         grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
        //         rendererComponent.postproduction.customEffects.excludedMeshes.push(grid.get());
        
        //         fragmentManager = new OBC.FragmentManager(viewer);
        //         ifcLoader = new OBC.FragmentIfcLoader(viewer);
        //         propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer);
        
        //         await loadFragments();
        
        //         highlighter = new OBC.FragmentHighlighter(viewer, fragmentManager);
        //         setupHighlightMaterial();
        //         setupHighlighting();
        
        //         mainToolbar = new OBC.Toolbar(viewer);
        //         mainToolbar.addChild(
        //             ifcLoader.uiElement.get("main"),
        //             propertiesProcessor.uiElement.get("main")
        //         );
        //         viewer.ui.addToolbar(mainToolbar);
        //     };
        
        //     const loadFragments = async () => {
        //         const file = await fetch("../Clinic_Architectural.frag");
        //         const data = await file.arrayBuffer();
        //         const buffer = new Uint8Array(data);
        //         await fragmentManager.load(buffer);
        //         highlighter.updateHighlight();
        //     };
        
        //     const setupHighlightMaterial = () => {
        //         const highlightMaterial = new THREE.MeshBasicMaterial({
        //             color: '#BCF124',
        //             depthTest: false,
        //             opacity: 0.8,
        //             transparent: true
        //         });
        //         highlighter.add('default', highlightMaterial);
        //         highlighter.outlineMaterial.color.set(0xf0ff7a);
        //     };
        
        //     const setupHighlighting = () => {
        //         const container = document.getElementById("viewerContainer");
        //         container.addEventListener('click', async (event) => {
        //             const result = await highlighter.highlight('default', { value: true });
        //             if (result) {
        //                 console.log("Fragments selected:", result.fragments.map(f => f.id));
        //             }
        //         });
        //     };
        
        //     initViewer();
        
        //     return () => {
        //         if (viewer) {
        //             viewer.dispose();
        //         }
        //     };
        // }, [lotes]); // Dependencias del useEffect
        //  // Include other dependencies if there are any
        
        














































    ///// respaldos ////////////////////////////////////////////////////////////////

    

// visor sencillo cubo
    // useEffect(() => {
    //     const container = document.getElementById('viewerContainer');
    //     if (!container) {
    //         console.error('Viewer container not found');
    //         return;
    //     }
    //     // Escena
    //     const components = new OBC.Components();
    //     components.scene = new OBC.SimpleScene(components);
    //     components.renderer = new OBC.SimpleRenderer(components, container);
    //     components.camera = new OBC.SimpleCamera(components);
    //     components.raycaster = new OBC.SimpleRaycaster(components);
    //     components.init();


    //     const scene = components.scene.get();
    //     components.camera.controls.setLookAt(10, 10, 10, 0, 0, 0);
    //     const grid = new OBC.SimpleGrid(components);
    //     scene.add(grid.get());


    //     // cubo
    //     const boxMaterial = new THREE.MeshStandardMaterial({ color: '#6528D7' });
    //     const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
    //     const cube = new THREE.Mesh(boxGeometry, boxMaterial);
    //     cube.position.set(0, 1.5, 0);
    //     // scene.add(cube);

    //     components.scene.setup();

    //     // fragments
    //     let fragments = new OBC.FragmentManager(components);
    //     const toolbar = new OBC.Toolbar(components);
    //     components.ui.addToolbar(toolbar);

    //     async function loadFragments() {
    //         if (fragments.groups.length) return;
    //         const file = await fetch("../Clinic_Architectural.frag");
    //         console.log(file)
    //         const data = await file.arrayBuffer();
    //         const buffer = new Uint8Array(data);
    //         const group = await fragments.load(buffer);
    //         console.log(group)
    //         // const scene = components.scene.get();
    //         // scene.add(model);
    //     }
    //     const loadButton = new OBC.Button(components);
    //     loadButton.materialIcon = "download";
    //     loadButton.tooltip = "Load model";
    //     toolbar.addChild(loadButton);
    //     loadButton.onClick.add(() => loadFragments());


    //     function exportFragments() {
    //         if (!fragments.groups.length) return;
    //         const group = fragments.groups[0];
    //         const data = fragments.export(group);
    //         const blob = new Blob([data]);
    //         const file = new File([blob], "small.frag");
    //         download(file);
    //     }
    //     const exportButton = new OBC.Button(components);
    //     exportButton.materialIcon = "exit_to_app";
    //     exportButton.tooltip = "Export model";
    //     toolbar.addChild(exportButton);
    //     exportButton.onClick.add(() => exportFragments());

    //     function download(file) {
    //         const link = document.createElement("a");
    //         link.href = URL.createObjectURL(file);
    //         link.download = file.name;
    //         document.body.appendChild(link);
    //         link.click();
    //         link.remove();
    //     }

    //     function disposeFragments() {
    //         fragments.dispose();
    //     }
    //     const disposeButton = new OBC.Button(components);
    //     disposeButton.materialIcon = "delete";
    //     disposeButton.tooltip = "Delete model";
    //     toolbar.addChild(disposeButton);
    //     disposeButton.onClick.add(() => disposeFragments());

    //     function importExternalFragment() {
    //         if (fragments.groups.length) return;
    //         const input = document.createElement("input");
    //         input.type = "file";
    //         input.onchange = async () => {
    //             const file = input.files[0];
    //             if (file.name.includes(".frag")) {
    //                 const url = URL.createObjectURL(file);
    //                 const result = await fetch(url);
    //                 const data = await result.arrayBuffer();
    //                 const buffer = new Uint8Array(data);
    //                 fragments.load(buffer);
    //             }
    //             input.remove();
    //         }
    //         input.click();
    //     }
    //     const openButton = new OBC.Button(components);
    //     openButton.materialIcon = "folder_open";
    //     openButton.tooltip = "Import model";
    //     toolbar.addChild(openButton);
    //     openButton.onClick.add(() => importExternalFragment());

    //     return () => {
    //         // Cleanup function to remove the scene and other components when the component unmounts
    //         components.dispose();
    //     };
    // }, []);


////////////////////////////////////////////////////////////////////////////// visor auto carga////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    
useEffect(() => {
        let viewer;  // Almacena la instancia principal del visor de modelos 3D.
        let grid;    // Referencia a la cuadrícula visual que aparece en el plano de fondo.
        let fragmentManager; // Gestor para manejar y organizar los fragmentos de modelos cargados.
        let ifcLoader;       // Cargador específico para modelos IFC (Industry Foundation Classes).
        let highlighter;     // Herramienta para resaltar elementos seleccionados en el visor.
        let propertiesProcessor; // Procesador para extraer propiedades de elementos IFC.

        // Función principal para inicializar el visor.
        const initViewer = async () => {
            console.log("Iniciando el visor...");

            // Inicializa los componentes básicos del visor.
            viewer = new OBC.Components();
            console.log("Componentes del visor creados.");

            // Configura la escena básica donde se visualizarán los modelos.
            const sceneComponent = new OBC.SimpleScene(viewer);
            sceneComponent.setup();
            viewer.scene = sceneComponent;
            console.log("Componente de escena configurado.");

            // Prepara el contenedor del visor en el DOM y el componente de renderizado.
            const viewerContainer = document.getElementById("viewerContainer");
            const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer);
            viewer.renderer = rendererComponent;
            console.log("Componente de renderizado configurado.");

            // Establece la cámara con perspectiva y ortográfica combinada.
            const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
            viewer.camera = cameraComponent;
            console.log("Componente de cámara configurado.");

            // Configura el raycaster para manejar la selección de elementos mediante el cursor.
            const raycasterComponent = new OBC.SimpleRaycaster(viewer);
            viewer.raycaster = raycasterComponent;

            // Inicializa el visor, actualiza aspecto de la cámara y habilita el postprocesamiento.
            viewer.init();
            cameraComponent.updateAspect();
            rendererComponent.postproduction.enabled = true;

            // Configura y agrega una cuadrícula de suelo al visor para mejorar la orientación espacial.
            grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
            rendererComponent.postproduction.customEffects.excludedMeshes.push(grid.get());

            // Inicializa el gestor de fragmentos y el cargador de IFC para cargar modelos.
            fragmentManager = new OBC.FragmentManager(viewer);
            ifcLoader = new OBC.FragmentIfcLoader(viewer);

            // Inicializar la variable fragments
            const fragments = new OBC.FragmentManager(viewer);

            // Configura el sistema de resaltado para enfocar y diferenciar elementos seleccionados.
            highlighter = new OBC.FragmentHighlighter(viewer);
            highlighter.setup();

            // Inicia el procesador de propiedades para obtener datos de elementos IFC al seleccionarlos.
            propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer);

            // Define una función callback para cuando un elemento es seleccionado.
            highlighter.events.select.onHighlight.add((selection) => {
                handleSelection(selection);
            });

            // Carga inicial de fragmentos desde un archivo externo.
            loadFragments(fragments);
        };

        // Maneja la selección de un elemento, obtiene y actualiza las propiedades relevantes.
        const handleSelection = (selection) => {
            const fragmentID = Object.keys(selection)[0];
            const expressID = Number([...selection[fragmentID]][0]);
            const properties = propertiesProcessor.getProperties(fragmentID, expressID.toString());
            if (properties) {
                updateSelection(properties);
            }
        };

        // Actualiza el estado con las propiedades del elemento seleccionado y maneja la lógica relacionada.
        const updateSelection = (properties) => {
            const globalIdProperty = properties.find(prop => prop.Name === 'GlobalId' || (prop.GlobalId && prop.GlobalId.value));
            const globalId = globalIdProperty ? globalIdProperty.GlobalId.value : 'No disponible';
            setSelectedGlobalId(globalId);
            const lote = lotes.find(l => l.idBim === globalId);

            if (lote) {
                setSelectedLote(lote);
                localStorage.setItem('loteId', lote.docId);
                obtenerInspecciones(lote.docId);
            } else {
                setSelectedLote(null);
                setInspecciones([]);
                localStorage.removeItem('loteId');
            }
        };

        //* Función para cargar los fragmentos de modelo desde un archivo, usualmente al iniciar.
        const loadFragments = async (fragments) => {
           
            if (fragments.groups.length) return;
            const file = await fetch("../Clinic_Architectural.frag");
            const data = await file.arrayBuffer();
            const buffer = new Uint8Array(data);
            const group = await fragments.load(buffer);
        };

        // Inicializa el visor cuando el componente se monta.
        initViewer();

        // Función de limpieza: se llama cuando el componente se va a desmontar.
        return () => {
            if (viewer) {
                console.log("Disposing viewer...");
                viewer.dispose();
            }
        };
    }, [lotes]);



////////////////////////////////////////////////////////////////////////////// Visor correcto actualizar inspeccion////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    


    // useEffect(() => {
    //     let viewer;
    //     let grid;
    //     let fragmentManager;
    //     let ifcLoader;
    //     let highlighter;
    //     let propertiesProcessor;
    //     let mainToolbar;

    //     const initViewer = () => {
    //         viewer = new OBC.Components();

    //         const sceneComponent = new OBC.SimpleScene(viewer);
    //         sceneComponent.setup();
    //         viewer.scene = sceneComponent;

    //         const viewerContainer = document.getElementById("viewerContainer") as HTMLDivElement;
    //         const rendererComponent = new OBC.PostproductionRenderer(viewer, viewerContainer);
    //         viewer.renderer = rendererComponent;

    //         const cameraComponent = new OBC.OrthoPerspectiveCamera(viewer);
    //         viewer.camera = cameraComponent;

    //         const raycasterComponent = new OBC.SimpleRaycaster(viewer);
    //         viewer.raycaster = raycasterComponent;

    //         viewer.init();
    //         cameraComponent.updateAspect();
    //         rendererComponent.postproduction.enabled = true;

    //         grid = new OBC.SimpleGrid(viewer, new THREE.Color(0x666666));
    //         rendererComponent.postproduction.customEffects.excludedMeshes.push(grid.get());

    //         fragmentManager = new OBC.FragmentManager(viewer);
    //         ifcLoader = new OBC.FragmentIfcLoader(viewer);

    //         highlighter = new OBC.FragmentHighlighter(viewer);
    //         highlighter.setup();

    //         propertiesProcessor = new OBC.IfcPropertiesProcessor(viewer);
    //         highlighter.events.select.onClear.add(() => {
    //             propertiesProcessor.cleanPropertiesList();
    //             setSelectedGlobalId(null);
    //         });




    //         ifcLoader.onIfcLoaded.add(model => {
    //             setModelCount(fragmentManager.groups.length);
    //             propertiesProcessor.process(model);
    //             highlighter.events.select.onHighlight.add((selection) => {
    //                 const fragmentID = Object.keys(selection)[0];
    //                 const expressID = Number([...selection[fragmentID]][0]);
    //                 const properties = propertiesProcessor.getProperties(model, expressID.toString());
    //                 if (properties) {
    //                     const globalIdProperty = properties.find(prop => prop.Name === 'GlobalId' || (prop.GlobalId && prop.GlobalId.value));
    //                     const globalId = globalIdProperty ? globalIdProperty.GlobalId.value : 'No disponible';
    //                     setSelectedGlobalId(globalId);
    //                     const lote = lotes.find(l => l.idBim === globalId);

    //                     if (lote) {
    //                         setSelectedLote(lote);
    //                         localStorage.setItem('loteId', lote.docId);
    //                         obtenerInspecciones(lote.docId);
    //                     } else {
    //                         // Aquí se maneja el caso de que no haya un lote correspondiente
    //                         setSelectedLote(null); // Asegura que no se muestren datos de un lote previo
    //                         setInspecciones([]); // Limpia las inspecciones previas
    //                         localStorage.removeItem('loteId'); // Opcional: Limpia el localStorage si es necesario
    //                     }
    //                 }
    //             });


    //             highlighter.update();
    //         });

    //         // Inicializa el visor cuando el componente se monta.
    //         initViewer();



    //         mainToolbar = new OBC.Toolbar(viewer);
    //         mainToolbar.addChild(
    //             ifcLoader.uiElement.get("main"),
    //             propertiesProcessor.uiElement.get("main")
    //         );
    //         viewer.ui.addToolbar(mainToolbar);
    //     };

    //     initViewer();

    //     return () => {
    //         if (viewer) {
    //             viewer.dispose();
    //         }
    //     };
    // }, [lotes]);
    const viewerContainerStyle: React.CSSProperties = {
        width: "100%",
        height: "700px",
        position: "relative",
        gridArea: "viewer",

    }

    const titleStyle: React.CSSProperties = {
        position: "absolute",
        top: "15px",
        left: "15px"
    }

    const imagesContainerStyle: React.CSSProperties = {
        position: 'absolute',
        top: '60px',
        left: '15px'
    };



    // Función para obtener las inspecciones de un lote
    // Asegúrate de llamar a esta función cuando se seleccione un lote
    const obtenerInspecciones = async (loteId) => {
        try {
            const inspeccionesRef = collection(db, 'lotes', loteId, 'inspecciones');
            const querySnapshot = await getDocs(inspeccionesRef);
            const inspeccionesData = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setInspecciones(inspeccionesData);
            console.log(inspeccionesData, 'inspecciones') // Actualiza el estado con las inspecciones obtenidas
        } catch (error) {
            console.error('Error al obtener las inspecciones:', error);
        }
    };

    const [ppiNombre, setPpiNombre] = useState('');
    // Manejar el cambio de lote seleccionado
    useEffect(() => {
        if (selectedLote) {
            obtenerInspecciones(selectedLote.docId);

        }
    }, [selectedLote, ppiNombre]);



    // componente copiado

 



    useEffect(() => {
        
        const obtenerInspecciones = async () => {
            try {
                const inspeccionesRef = collection(db, "lotes", idLote, "inspecciones");
                console.log(idLote)
                const querySnapshot = await getDocs(inspeccionesRef);

                const inspeccionesData = querySnapshot.docs.map(doc => ({
                    docId: doc.id, // Almacena el ID del documento generado automáticamente por Firestore
                    ...doc.data()
                }));

                // Asegúrate de que este paso esté ajustado a cómo manejas los datos en tu aplicación
                if (inspeccionesData.length > 0) {
                    setPpi(inspeccionesData[0]);
                    setPpiNombre(inspeccionesData[0].nombre) // O maneja múltiples inspecciones según sea necesario
                    console.log(inspeccionesData[0].nombre) // O maneja múltiples inspecciones según sea necesario
                } else {
                    console.log('No se encontraron inspecciones para el lote con el ID:', idLote);
                    setPpi(null);
                }
            } catch (error) {
                console.error('Error al obtener las inspecciones:', error);
            }
        };



        obtenerInspecciones();
    
    }, [idLote]); // Dependencia del efecto basada en idLote

  




    const regresar = () => {
        navigate(-1); // Regresa a la página anterior
    };





    const [seleccionApto, setSeleccionApto] = useState({});
    const [tempSeleccion, setTempSeleccion] = useState(null);
    const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
    const [modal, setModal] = useState(false);
    const [modalFormulario, setModalFormulario] = useState(false);
    const [currentSubactividadId, setCurrentSubactividadId] = useState(null);








    const handleOpenModal = (subactividadId) => {
        setCurrentSubactividadId(subactividadId);
    
        // Inicializar la selección temporal con el valor actual si existe
        const valorActual = seleccionApto[subactividadId]?.resultadoInspeccion;
        setTempSeleccion(valorActual);
        setModal(true);
    };



    const handleOpenModalFormulario = (subactividadId) => {
        setCurrentSubactividadId(subactividadId);

        // Inicializar la selección temporal con el valor actual si existe
        const valorActual = seleccionApto[subactividadId]?.resultadoInspeccion;
        setTempSeleccion(valorActual);
        // Añadir aquí el reseteo de los estados necesarios
        setComentario(''); // Resetear el comentario a un string vacío
        setObservaciones(''); // Si también necesitas resetear observaciones o cualquier otro estado, hazlo aquí
        setModalFormulario(true);
    };





    const handleCloseModal = () => {
        setModal(false)
        setModalFormulario(false)
        setFormulario(false)
        setResultadoInspeccion('Apto')


    };

    const handleGuardarTemporal = () => {
        // Solo muestra la confirmación, no aplica la selección todavía
        setMostrarConfirmacion(true);
    };

    const handleConfirmarGuardar = async () => {
        const fechaHoraActual = new Date().toLocaleString('es-ES', {
            year: 'numeric', month: '2-digit', day: '2-digit',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
        });

        const hashFirma = 'GSJDJDN5663VDHSDN';

        if (currentSubactividadId && tempSeleccion !== null) {
            // Encuentra el índice de la actividad y de la subactividad desde el ID
            const [actividadIndex, subactividadIndex] = currentSubactividadId.split('-').slice(1).map(Number);

            // Prepara la evaluación de la subactividad seleccionada
            const evaluacionSubactividad = {

                enviado: true,
                fecha: fechaHoraActual,
                responsable: nombreResponsable,
                firma: hashFirma.toString(),
                comentario: comentario,
            };

            // Actualiza siempre la subactividad seleccionada con la nueva evaluación
            let subactividadActualizada = { ...ppi.actividades[actividadIndex].subactividades[subactividadIndex], ...evaluacionSubactividad };
            ppi.actividades[actividadIndex].subactividades[subactividadIndex] = subactividadActualizada;

            // Si la evaluación es "No apto", agrega una nueva subactividad para una futura inspección
            if (tempSeleccion === "No apto") {
                let nuevaSubactividad = { ...subactividadActualizada };
                const numeroPartes = subactividadActualizada.numero.split('.');
                if (numeroPartes.length === 2) {
                    nuevaSubactividad.numero += ".1";
                } else if (numeroPartes.length > 2) {
                    let repeticion = parseInt(numeroPartes.pop(), 10) + 1;
                    numeroPartes.push(repeticion.toString());
                    nuevaSubactividad.numero = numeroPartes.join('.');
                }

                // La nueva subactividad copiada no debe incluir los datos específicos de la evaluación
                delete nuevaSubactividad.resultadoInspeccion;
                delete nuevaSubactividad.enviado;
                delete nuevaSubactividad.fecha;
                delete nuevaSubactividad.responsable;
                delete nuevaSubactividad.firma;
                delete nuevaSubactividad.comentario;

                ppi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividad);
            }

            // Actualiza Firestore con el nuevo objeto ppi
            await actualizarPpiEnFirestore(ppi);

            // Limpia el formulario y cierra el modal
            setComentario('');
            setMostrarConfirmacion(false);
            setTempSeleccion(null);
            setModal(false);
        }
    };






    const actualizarPpiEnFirestore = async (nuevoPpi) => {
        if (!nuevoPpi.docId) {
            console.error("No se proporcionó docId para la actualización.");
            return;
        }

        try {
            // Aquí, "docId" es el ID del documento de Firestore donde se almacenan los datos del PPI.
            const ppiRef = doc(db, "lotes", idLote, "inspecciones", nuevoPpi.docId);

            // Prepara los datos que se van a actualizar. En este caso, actualizamos todo el objeto de actividades.
            const updatedData = {
                actividades: nuevoPpi.actividades.map(actividad => ({
                    ...actividad,
                    subactividades: actividad.subactividades.map(subactividad => ({
                        numero: subactividad.numero,
                        nombre: subactividad.nombre,
                        criterio_aceptacion: subactividad.criterio_aceptacion,
                        documentacion_referencia: subactividad.documentacion_referencia,
                        tipo_inspeccion: subactividad.tipo_inspeccion,
                        punto: subactividad.punto,
                        responsable: subactividad.responsable || '',
                        fecha: subactividad.fecha || '',
                        firma: subactividad.firma || '',
                        comentario: subactividad.comentario || '',
                        resultadoInspeccion: subactividad.resultadoInspeccion || '',
                        formularioEnviado: subactividad.formularioEnviado || '',
                        idRegistroFormulario: subactividad.idRegistroFormulario || ''
                        // Agrega aquí más campos si son necesarios.
                    }))
                }))
            };

            // Realiza la actualización en Firestore.
            await updateDoc(ppiRef, updatedData);

           
        } catch (error) {
            console.error("Error al actualizar PPI en Firestore:", error);
        }
    };


    // agregar cometarios
    const [comentario, setComentario] = useState("");

    const [resultadoInspeccion, setResultadoInspeccion] = useState('Apto');

    // Define la fecha, el responsable y genera la firma aquí
    const fechaHoraActual = new Date().toLocaleString('es-ES', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    const nombreResponsable = "Usuario"; // Asumiendo que tienes una forma de obtener el nombre del usuario

    const firma = '9c8245e6e0b74cfccg97e8714u3234228fb4xcd2'

    const marcarFormularioComoEnviado = async (idRegistroFormulario, resultadoInspeccion,) => {
        if (!ppi || !currentSubactividadId) {
            console.error("PPI o subactividad no definida.");
            return;
        }

        // Divide el ID para obtener índices de actividad y subactividad
        const [actividadIndex, subactividadIndex] = currentSubactividadId.split('-').slice(1).map(Number);

        // Crea una copia del estado actual del PPI para modificarlo
        let nuevoPpi = { ...ppi };
        let subactividadSeleccionada = nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex];

        // Actualiza los campos con los datos necesarios
        subactividadSeleccionada.formularioEnviado = formulario;
        subactividadSeleccionada.idRegistroFormulario = idRegistroFormulario;
        subactividadSeleccionada.resultadoInspeccion = resultadoInspeccion;
        subactividadSeleccionada.fecha = fechaHoraActual;
        subactividadSeleccionada.responsable = nombreResponsable;
        subactividadSeleccionada.firma = firma;
        subactividadSeleccionada.comentario = comentario;

        // Si la inspección es "Apto", incrementa el contador de actividadesAptas en el lote
        if (resultadoInspeccion === "Apto") {
            const loteRef = doc(db, "lotes", idLote);
            await updateDoc(loteRef, {
                actividadesAptas: increment(1)
            });
        }

        // Si la inspección es No Apto, duplica la subactividad para una futura inspección
        if (resultadoInspeccion === "No apto") {
            let nuevaSubactividad = { ...subactividadSeleccionada };

            // Eliminar o reiniciar propiedades específicas de la evaluación para la nueva subactividad
            delete nuevaSubactividad.resultadoInspeccion;
            delete nuevaSubactividad.enviado;
            delete nuevaSubactividad.idRegistroFormulario;

            // Restablecer los valores de Responsable, Fecha, Comentarios e Inspección
            // Aquí asumimos que quieres restablecerlos a valores vacíos o predeterminados
            nuevaSubactividad.responsable = '';
            nuevaSubactividad.fecha = '';
            nuevaSubactividad.comentario = '';
            // Para el campo Inspección, asegúrate de restablecerlo según cómo lo manejas en tu modelo de datos
            // Si Inspección se maneja con otro campo o de otra forma, ajusta esta línea acorde a tu implementación
            // Por ejemplo, si 'inspeccion' es un campo booleano que indica si se ha realizado una inspección
            nuevaSubactividad.formularioEnviado = false; // Ajusta el nombre del campo y el valor según tu caso


            // Incrementa el número de versión de la nueva subactividad
            if (nuevaSubactividad.version) {
                nuevaSubactividad.version = String(parseInt(nuevaSubactividad.version) + 1);
            } else {
                // Si por alguna razón la subactividad original no tiene número de versión, se inicializa a 1
                nuevaSubactividad.version = "1";
            }

            // Inserta la nueva subactividad en el PPI
            nuevoPpi.actividades[actividadIndex].subactividades.splice(subactividadIndex + 1, 0, nuevaSubactividad);
        }


        // Actualiza la subactividad en el array
        nuevoPpi.actividades[actividadIndex].subactividades[subactividadIndex] = subactividadSeleccionada;

        // Llama a la función que actualiza los datos en Firestore
        await actualizarFormularioEnFirestore(nuevoPpi);
    };






    const actualizarFormularioEnFirestore = async (nuevoPpi) => {
        if (!nuevoPpi.docId) {
            console.error("No se proporcionó docId para la actualización.");
            return;
        }

        try {
            // Aquí, "docId" es el ID del documento de Firestore donde se almacenan los datos del PPI.
            const ppiRef = doc(db, "lotes", idLote, "inspecciones", nuevoPpi.docId);

            // Prepara los datos que se van a actualizar. En este caso, actualizamos todo el objeto de PPI.
            const updatedData = {
                actividades: nuevoPpi.actividades.map(actividad => ({
                    ...actividad,
                    subactividades: actividad.subactividades.map(subactividad => ({
                        ...subactividad,

                    }))
                }))
            };

            // Realiza la actualización en Firestore.
            await updateDoc(ppiRef, updatedData);

            
        } catch (error) {
            console.error("Error al actualizar PPI en Firestore:", error);
        }
    };



    const [modalInforme, setModalInforme] = useState(false)
    const [modalConfirmacionInforme, setModalConfirmacionInforme] = useState(false)

    const confirmarInforme = () => {
        setModalInforme(true)
        handleCloseModal()
    }

    const closeModalConfirmacion = () => {
        setModalInforme(false)
        setFormulario(false)
    }

    const confirmarModalInforme = () => {
        setModalConfirmacionInforme(true)
        handleCloseModal()
        setModalInforme(false)

    }











    const [loteInfo, setLoteInfo] = useState(null); // Estado para almacenar los datos del PPI
    const [sectorInfoLote, setSectorInfoLote] = useState(null); // Estado para almacenar los datos del PPI
    useEffect(() => {
        const obtenerLotePorId = async () => {
            console.log('********** id lote', idLote)
            if (!idLote) return; // Verifica si idLote está presente

            try {
                const docRef = doc(db, "lotes", idLote); // Crea una referencia al documento usando el id
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    
                    setLoteInfo({ id: docSnap.id, ...docSnap.data() });
                    
                } else {
                    console.log("No se encontró el lote con el ID:", idLote);

                }
            } catch (error) {
                console.error("Error al obtener el lote:", error);

            }
        };

        obtenerLotePorId();
    }, [idLote]);

    const [formulario, setFormulario] = useState(true)


    const enviarDatosARegistros = async () => {
        // Descomponer currentSubactividadId para obtener los índices
        const [, actividadIndex, subactividadIndex] = currentSubactividadId.split('-').map(Number);

        // Acceder a la subactividad seleccionada
        const subactividadSeleccionada = ppi.actividades[actividadIndex].subactividades[subactividadIndex];

        // Objeto que representa los datos del formulario
        const datosFormulario = {
            nombreProyecto,
            fechaHoraActual: fechaHoraActual,
            obra: obra,
            tramo: tramo,
            ppiNombre: loteInfo.ppiNombre,
            observaciones: observaciones,
            comentario: comentario,
            sector: loteInfo.sectorNombre,
            subSector: loteInfo.subSectorNombre,
            parte: loteInfo.parteNombre,
            elemento: loteInfo.elementoNombre,
            lote: loteInfo.nombre,
            firma: firma,
            pkInicial: loteInfo.pkInicial,
            pkFinal: loteInfo.pkFinal,
            nombreResponsable: nombreResponsable,
            subactividadNombre: subactividadSeleccionada.nombre, // Nombre de la subactividad seleccionada
            versionSubactividad: subactividadSeleccionada.version,
            numeroSubactividad: subactividadSeleccionada.numero,
            formulario: formulario
        };

        try {
            // Referencia a la colección 'registros' en Firestore

            const coleccionRegistros = collection(db, "registros");
            const docRef = await addDoc(coleccionRegistros, datosFormulario);
            setMensajeExitoInspeccion('Inspección completada con éxito')

            // Opcionalmente, cierra el modal o limpia el formulario aquí
            setModalFormulario(false);
            setResultadoInspeccion('')
            setObservaciones('')
            
            return docRef.id; // Devolver el ID del documento creado


        } catch (e) {
            console.error("Error al añadir documento: ", e);
        }
    };

    const handleConfirmarEnviotablaPpi = async () => {
        // Aquí llamarías a la función que realmente envía los datos del formulario
        await handelEnviarFormulario();
        setMostrarConfirmacion(false);
        setModalInforme(false);

        // Esperar un poco antes de mostrar el modal de éxito para asegurar que los modales anteriores se han cerrado
        setTimeout(() => {
            setModalExito(true);

        }, 300); // Ajusta el tiempo según sea necesario
    };

    const handleConfirmarEnvio = async () => {
        // Aquí llamarías a la función que realmente envía los datos del formulario
        await handelEnviarFormulario();
        setMostrarConfirmacion(false);
        setModalInforme(false);

        // Esperar un poco antes de mostrar el modal de éxito para asegurar que los modales anteriores se han cerrado
        setTimeout(() => {
            setModalExito(true);
            setFormulario(false)
        }, 300); // Ajusta el tiempo según sea necesario
    };

    const handleConfirmarEnvioPdf = async () => {
        // Aquí llamarías a la función que realmente envía los datos del formulario
        setMostrarConfirmacion(false);
        setModalFormulario(false);
        setModalConfirmacionInforme(false)




        // Esperar un poco antes de mostrar el modal de éxito para asegurar que los modales anteriores se han cerrado
        setTimeout(() => {
            setModalExito(true);
            setFormulario(false)
        }, 300); // Ajusta el tiempo según sea necesario
    };






    const handelEnviarFormulario = async () => {
        const idRegistroFormulario = await enviarDatosARegistros();
        if (idRegistroFormulario) {
            await marcarFormularioComoEnviado(idRegistroFormulario, resultadoInspeccion);

        }
    };

    const [mensajeExitoInspeccion, setMensajeExitoInspeccion] = useState('')
    const [modalExito, setModalExito] = useState(false)

    const [documentoFormulario, setDocumentoFormulario] = useState(null)
    const [modalRecuperarFormulario, setModalRecuperarFormulario] = useState(false)

    const handleMostrarIdRegistro = async (subactividadId) => {
        const [actividadIndex, subactividadIndex] = subactividadId.split('-').slice(1).map(Number);
        const subactividadSeleccionada = ppi.actividades[actividadIndex].subactividades[subactividadIndex];
        const idRegistroFormulario = subactividadSeleccionada.idRegistroFormulario;

        // Asegúrate de que existe un id antes de intentar recuperar el documento
        if (idRegistroFormulario) {
            try {
                // Obtener la referencia del documento en la colección de registros
                const docRef = doc(db, "registros", idRegistroFormulario);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setDocumentoFormulario(docSnap.data())
                    setModalRecuperarFormulario(true)
                  
                } else {
                    console.log("No se encontró el documento con el ID:", idRegistroFormulario);
                }
            } catch (error) {
                console.error("Error al obtener el documento:", error);
            }
        } else {
            console.log("No se proporcionó un idRegistroFormulario válido.");
        }
    };

    const cerrarModalYLimpiarDatos = () => {
        setDocumentoFormulario('')
        setModalRecuperarFormulario(false)
    }



    const generatePDF = () => {
        const doc = new jsPDF();
        // Establecer el tamaño de fuente deseado
        const fontSize = 10;

        // Tamaño y posición del recuadro
        const rectX = 10;
        const rectY = 10;
        const rectWidth = 190; // Ancho del recuadro
        const rectHeight = 20; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        doc.setFillColor(230, 230, 230); // Gris muy claro casi blanco

        // Dibujar el recuadro con fondo gris
        doc.rect(rectX, rectY, rectWidth, rectHeight, 'F'); // 'F' indica que se debe rellenar el rectángulo

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Colocar texto dentro del recuadro
        doc.text(titulo, 75, 18); // Ajusta las coordenadas según tu diseño
        doc.text(nombreProyecto, 75, 22); // Ajusta las coordenadas según tu diseño

        if (imagenPath2) {
            const imgData = imagenPath2;
            doc.addImage(imgData, 'JPEG', 12, 12, 30, 15); // Ajusta las coordenadas y dimensiones según tu diseño
        }
        if (imagenPath) {
            const imgData = imagenPath;
            doc.addImage(imgData, 'JPEG', 45, 15, 20, 10); // Ajusta las coordenadas y dimensiones según tu diseño
        }

        // Dibujar el borde después de agregar las imágenes
        doc.setDrawColor(0); // Color negro
        doc.rect(rectX, rectY, rectWidth, rectHeight); // Dibujar el borde del rectángulo


        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        // Tamaño y posición del segundo recuadro
        const rectX2 = 10;
        const rectY2 = 30;
        const rectWidth2 = 190; // Ancho del recuadro
        const rectHeight2 = 20; // Altura del recuadro

        // Establecer el ancho de la línea del borde
        const borderWidth = 0.5; // Ancho del borde en puntos

        // Establecer el color de la línea del borde
        doc.setDrawColor(0); // Color negro

        // Dibujar el borde del segundo recuadro
        doc.rect(rectX2, rectY2, rectWidth2, rectHeight2);

        // Establecer el color de fondo para el segundo recuadro
        doc.setFillColor(240, 240, 240); // Gris muy claro casi blanco

        // Dibujar el segundo recuadro con fondo gris claro y borde en todos los lados
        doc.rect(rectX2, rectY2, rectWidth2, rectHeight2, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde en todos los lados

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Colocar texto dentro del segundo recuadro
        doc.text(`Obra: ${documentoFormulario.obra}`, 15, 40);
        doc.text(`Tramo: ${documentoFormulario.tramo}`, 15, 45);
        doc.text(`Nº de registro: ${documentoFormulario.id}`, 130, 40);
        doc.text(`Fecha: ${documentoFormulario.fechaHoraActual}`, 130, 45);


        ///////////////////////////////////////////////////////////////////////////////////////////////////////
        // Tamaño y posición del recuadro
        const rectX3 = 10;
        const rectY3 = 50;
        const rectWidth3 = 190; // Ancho del recuadro
        const rectHeight3 = 20; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro
        doc.setFillColor(240, 240, 240); // Gris muy claro casi blanco

        // Dibujar el recuadro con fondo gris claro
        doc.rect(rectX3, rectY3, rectWidth3, rectHeight3, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Colocar texto dentro del recuadro
        doc.text(`PPI: ${documentoFormulario.ppiNombre}`, 15, 60);
        doc.text(`Plano que aplica: `, 15, 65);


        // Tamaño y posición del recuadro
        const rectX4 = 10;
        const rectY4 = 70;
        const rectWidth4 = 190; // Ancho del recuadro
        const rectHeight4 = 20; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro con fondo gris claro
        doc.rect(rectX4, rectY4, rectWidth4, rectHeight4, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Dibujar el borde del rectángulo
        doc.rect(rectX4, rectY4, rectWidth4, rectHeight4);

        // Texto a colocar con salto de línea
        const textoObservaciones = `Observaciones: ${documentoFormulario.observaciones}`;

        // Dividir el texto en líneas cada vez que exceda 15 palabras
        const words = textoObservaciones.split(' ');
        const maxWordsPerLine = 15;
        const lines = [];
        let currentLine = '';

        for (let i = 0; i < words.length; i++) {
            currentLine += words[i] + ' ';
            if ((i + 1) % maxWordsPerLine === 0 || i === words.length - 1) {
                lines.push(currentLine.trim());
                currentLine = '';
            }
        }

        // Colocar texto en el PDF
        let yPosition = rectY4 + fontSize + 2; // Iniciar la posición dentro del recuadro
        let xPosition = rectX4 + 5; // Ajustar posición x para evitar que el texto toque el borde del rectángulo
        lines.forEach(line => {
            doc.text(line, xPosition, yPosition, { maxWidth: rectWidth4 - 4 }); // Ajustar maxWidth para evitar que el texto exceda el ancho del rectángulo
            yPosition += fontSize + 2; // Aumentar la posición para la siguiente línea
        });

        // Tamaño y posición del recuadro 5
        const rectX5 = 10;
        const rectY5 = 90;
        const rectWidth5 = 190; // Ancho del recuadro
        const rectHeight5 = 80; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro 5
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro 5 con fondo gris claro
        doc.rect(rectX5, rectY5, rectWidth5, rectHeight5, 'FD'); // 'FD' indica que se debe rellenar el rectángulo y dibujar el borde

        // Establecer el color de texto
        doc.setTextColor(0, 0, 0); // Color negro

        // Dibujar el borde del recuadro 5
        doc.rect(rectX5, rectY5, rectWidth5, rectHeight5);

        // Colocar texto dentro del recuadro 5
        doc.text(`Sector: ${documentoFormulario.sector}`, 15, 100);
        doc.text(`Subsector: ${documentoFormulario.subSector}`, 15, 110);
        doc.text(`Parte: ${documentoFormulario.parte}`, 15, 120);
        doc.text(`Elemento: ${documentoFormulario.elemento}`, 15, 130);
        doc.text(`Lote: ${documentoFormulario.lote}`, 15, 140);
        doc.text(`Pk inicial: ${documentoFormulario.pkInicial}`, 15, 150);
        doc.text(`Pk final: ${documentoFormulario.pkFinal}`, 15, 160);

        // Tamaño y posición del recuadro 6
        const rectX6 = 10;
        const rectY6 = 170;
        const rectWidth6 = 190; // Ancho del recuadro
        const rectHeight6 = 70; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro 6
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro 6 con fondo gris claro
        doc.rect(rectX6, rectY6, rectWidth6, rectHeight6, 'FD');

        // Dibujar el borde del recuadro 6
        doc.rect(rectX6, rectY6, rectWidth6, rectHeight6);

        // Agregar imagen al PDF dentro del recuadro 6
        if (documentoFormulario.imagen) {
            doc.addImage(documentoFormulario.imagen, 'JPEG', 25, 180, 70, 50); // Ajusta las coordenadas y el tamaño según necesites
        }
        if (documentoFormulario.imagen2) {
            doc.addImage(documentoFormulario.imagen2, 'JPEG', 110, 180, 70, 50); // Ajusta las coordenadas y el tamaño según necesites
        }

        // Tamaño y posición del recuadro 7
        const rectX7 = 10;
        const rectY7 = 240;
        const rectWidth7 = 190; // Ancho del recuadro
        const rectHeight7 = 28; // Altura del recuadro

        // Establecer el tamaño de fuente
        doc.setFontSize(fontSize);

        // Establecer el color de fondo para el recuadro 7
        doc.setFillColor(240, 240, 240); // Gris claro casi blanco

        // Dibujar el recuadro 7 con fondo gris claro
        doc.rect(rectX7, rectY7, rectWidth7, rectHeight7, 'FD');

        // Dibujar el borde del recuadro 7
        doc.rect(rectX7, rectY7, rectWidth7, rectHeight7);

        // Colocar texto dentro del recuadro 7
        doc.text('Resultado de la inspección', 150, 250);
        doc.text(documentoFormulario.resultadoInspeccion, 150, 260);
        doc.text(`Firmado electronicamente con blockchain`, 15, 250);
        // Asegúrate de que la firma es una cadena y no está vacía
        doc.text(documentoFormulario.firma, 15, 260);
        doc.save('formulario.pdf');
        cerrarModalYLimpiarDatos()

    };


    return (

        <div className="min-h-screen text-gray-500 px-14 py-5">
            <div className='flex gap-2 items-center justify start bg-white px-5 py-3 rounded rounded-xl shadow-md text-base'>
                <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
                <Link to={'/'}>
                    <h1 className=' text-gray-500'>Inicio</h1>
                </Link>

                <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />

                <h1 className='cursor-pointer text-gray-500' onClick={regresar}>Elementos</h1>

                <FaArrowRight style={{ width: 15, height: 15, fill: '#d97706' }} />
                <Link to={'#'}>
                    <h1 className='font-medium text-amber-600'>Ppi: {ppiNombre}</h1>
                </Link>

            </div>


            <div className='flex pt-6'>

                <div className="w-1/2 pr-5">
                    {selectedLote ? (
                        <div className="bg-gray-100 rounded-lg">
                            <div className="bg-gray-200 p-2 font-bold text-gray-700 rounded-t-lg">Información del Lote</div>

                            <div className='px-2 py-1 text-sm flex flex-col gap-1 bg-white rounded-lg'>
                                <p className='border-b p-1 font-semibold text-sky-600'><strong>Lote: </strong>{selectedLote.nombre}</p>
                                <p className='border-b p-1  font-semibold text-sky-600'><strong>Ppi: </strong>{selectedLote.ppiNombre}</p>
                                <p className='border-b p-1 '><strong>Global id Bim: </strong>{selectedGlobalId}</p>
                                <p className='border-b p-1 '><strong>Sector: </strong>{selectedLote.sectorNombre}</p>
                                <p className='border-b p-1 '><strong>Sub sector: </strong>{selectedLote.subSectorNombre}</p>
                                <p className='border-b p-1 '><strong>Parte: </strong>{selectedLote.parteNombre}</p>
                                <p className='p-1 '><strong>Elemento: </strong>{selectedLote.elementoNombre}</p>
                            </div>

                            <div className="bg-gray-300 p-2 font-bold text-gray-700 mt-6 rounded-t-lg">Avance de la inspección</div>
                            <div className=''>
                                {
                                    inspecciones.length > 0 && inspecciones.map((inspeccion) => (
                                        <div>
                                            {ppi && ppi.actividades.map((actividad, indexActividad) => [
                                                // Row for activity name
                                                <div key={`actividad-${indexActividad}`} className="bg-gray-200 grid grid-cols-12 items-center p-2 border-b border-gray-200 text-sm font-medium">
                                                    <div className="col-span-1">

                                                        (V)

                                                    </div>
                                                    <div className="col-span-1">

                                                        {actividad.numero}

                                                    </div>
                                                    <div className="col-span-10">

                                                        {actividad.actividad}

                                                    </div>

                                                </div>,
                                                // Rows for subactividades
                                                ...actividad.subactividades.map((subactividad, indexSubactividad) => (
                                                    <div key={`subactividad-${indexActividad}-${indexSubactividad}`} className="grid grid-cols-12 p-2 items-center border-b border-gray-200 bg-white rounded-b-lg text-sm">
                                                        <div className="col-span-1 p-1 ">
                                                            V-{subactividad.version}  {/* Combina el número de actividad y el índice de subactividad */}
                                                        </div>
                                                        <div className="col-span-1 p-1 ">
                                                            {subactividad.numero} {/* Combina el número de actividad y el índice de subactividad */}
                                                        </div>

                                                        <div className="col-span-7 p-1">
                                                            {subactividad.nombre}
                                                        </div>

                                                        <div className="col-span-2 p-1 flex justify-center cursor-pointer" >
                                                            {subactividad.resultadoInspeccion ? (
                                                                subactividad.resultadoInspeccion === "Apto" ? (
                                                                    <span

                                                                        className="w-full font-bold text-xs p-2 rounded  text-center text-green-500 cursor-pointer">
                                                                        Apto

                                                                    </span>
                                                                ) : subactividad.resultadoInspeccion === "No apto" ? (
                                                                    <span

                                                                        className="w-full font-bold text-xs p-2 rounded w-full text-center text-red-600 cursor-pointer">
                                                                        No apto
                                                                    </span>
                                                                ) : (
                                                                    <span
                                                                        onClick={() => handleOpenModalFormulario(`apto-${indexActividad}-${indexSubactividad}`)}
                                                                        className="w-full font-bold text-medium text-lg p-2 rounded  w-full flex justify-center cursor-pointer">
                                                                        <IoMdAddCircle />
                                                                    </span>
                                                                )
                                                            ) : (
                                                                <span
                                                                    onClick={() => handleOpenModalFormulario(`apto-${indexActividad}-${indexSubactividad}`)}
                                                                    className="w-full font-bold text-medium text-lg p-2 rounded  w-full flex justify-center cursor-pointer">
                                                                    <IoMdAddCircle />
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="col-span-1 p-1 flex justify-start cursor-pointer" >
                                                            {subactividad.formularioEnviado ? (

                                                                <p
                                                                    onClick={() => handleMostrarIdRegistro(`apto-${indexActividad}-${indexSubactividad}`)}
                                                                    className='text-lg'><FaFilePdf /></p>
                                                            ) : null}
                                                        </div>






                                                    </div>
                                                ))
                                            ])}
                                        </div>
                                    ))
                                }

                            </div>

                        </div>
                    ) : (
                        <div>
                           
                            <div className="bg-gray-200  px-5 py-3 font-medium text-gray-700 rounded-t-lg text-gray-500">
                                
                               <p>No encontrado</p>
                               <p>Global Id: <strong className='text-amber-500'>{selectedGlobalId}</strong></p>
                            </div>
                            
                                <TrazabilidadBim actualizarLotesDesdeHijo={actualizarLotesDesdeHijo} selectedGlobalId ={selectedGlobalId} obtenerLotesBim={obtenerLotes} obtenerInspecciones={obtenerInspecciones} actualizarLotes={actualizarLotes}/>
                            
                            <p className='mt-5'><strong>Global id Bim: </strong>{selectedGlobalId}</p>


                        </div>

                    )}
                </div>
                <div className='w-1/2' id="viewerContainer" style={viewerContainerStyle}></div>

            </div>

            {modalFormulario && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-10">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[700px] h-[750px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
                    >
                        <button
                            onClick={handleCloseModal}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <div className="my-6">
                            <label htmlFor="resultadoInspeccion" className="block text-2xl font-bold text-gray-500 mb-4 flex items-center gap-2">
                                <span className='text-3xl'><SiReacthookform /></span> Resultado de la inspección:
                            </label>
                            <div className="block w-full py-2 text-base p-2 border-gray-300 focus:outline-none focus:ring-gray-500  sm:text-sm rounded-md">
                                {/* Opción Apto */}
                                <div>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="resultadoInspeccion"
                                            value="Apto"
                                            checked={resultadoInspeccion === "Apto"}
                                            onChange={(e) => setResultadoInspeccion(e.target.value)}
                                            className="form-radio"
                                        />
                                        <span className="ml-2">Apto</span>
                                    </label>
                                </div>
                                {/* Opción No apto */}
                                <div>
                                    <label className="inline-flex items-center">
                                        <input
                                            type="radio"
                                            name="resultadoInspeccion"
                                            value="No apto"
                                            checked={resultadoInspeccion === "No apto"}
                                            onChange={(e) => setResultadoInspeccion(e.target.value)}
                                            className="form-radio"
                                        />
                                        <span className="ml-2">No apto</span>
                                    </label>
                                </div>
                            </div>
                        </div>

                        <div className="mb-4">
                            <label htmlFor="comentario" className="block text-gray-500 text-sm font-bold mb-2">Comentarios de la inspección</label>
                            <textarea id="comentario" value={comentario} onChange={(e) => setComentario(e.target.value)} className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"></textarea>
                        </div>

                        {/* <div className='my-8'>
                            <label htmlFor="formularioCheckbox" className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="checkbox"
                                    id="formularioCheckbox"
                                    checked={formulario}
                                    onChange={e => setFormulario(e.target.checked)} // Actualizado para usar setFormulario directamente
                                    className="form-checkbox rounded text-sky-600"
                                />
                                <span className='flex gap-2 items-center font-medium'><p className='text-xl ms-2'><FaFilePdf/></p> Crear Informe pdf </span>
                            </label>
                        </div> */}

                        <FormularioInspeccion
                            setModalFormulario={setModalFormulario}
                            modalFormulario={modalFormulario}
                            currentSubactividadId={currentSubactividadId}
                            ppiSelected={ppi}
                            marcarFormularioComoEnviado={marcarFormularioComoEnviado}
                            actualizarFormularioEnFirestore={actualizarFormularioEnFirestore}
                            resultadoInspeccion={resultadoInspeccion}
                            comentario={comentario}
                            firma={firma}

                            fechaHoraActual={fechaHoraActual}
                            handleCloseModal={handleCloseModal}
                            ppiNombre={ppiNombre}
                            nombreResponsable={nombreResponsable}

                            setResultadoInspeccion={setResultadoInspeccion}


                            setModalConfirmacionInforme={setModalConfirmacionInforme}

                            handleConfirmarEnvioPdf={handleConfirmarEnvioPdf}
                            setMensajeExitoInspeccion={setMensajeExitoInspeccion}
                            handleConfirmarEnviotablaPpi={handleConfirmarEnviotablaPpi}


                        />







                        {/* <div className='flex gap-5 mt-8'>
                            <button className='bg-sky-600 hover:bg-sky-700 px-4 py-2 text-white font-medium rounded-lg shadow-md' onClick={confirmarInforme}>Guardar</button>
                            <button className='bg-gray-500 hover:bg-gray-600 px-4 py-2 text-white font-medium rounded-lg shadow-md' onClick={handleCloseModal}>Cancelar</button>
                        </div> */}





                    </div>

                </div>
            )}

            {modalInforme && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-10">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[700px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
                    >
                        <button
                            onClick={closeModalConfirmacion}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300 mb-5">
                            <IoCloseCircle />
                        </button>

                        <p className='text-xl font-medium flex gap-2 mb-10 items-center'><p className='text-2xl'><FaQuestionCircle /></p> ¿Quieres generar un informe en Pdf?</p>


                        <div className='flex items-center gap-5 mt-5'>
                            <button className='bg-sky-600 hover:bg-sky-700 px-4 py-3 rounded-md shadow-md text-white font-medium flex gap-2 items-center'
                                onClick={() => {
                                    confirmarModalInforme()
                                    crearVariableFormularioTrue()
                                }}><p className='text-xl'><FaFilePdf /></p>Si, generar informe</button>
                            <button
                                onClick={handleConfirmarEnvio}
                                className="bg-gray-500 hover:bg-gray-600 text-white rounded-md shadow-md font-bold py-3 px-4 rounded focus:outline-none focus:shadow-outline"
                            >
                                No, realizar únicamente la inspección
                            </button>

                        </div>





                    </div>

                </div>
            )}

            {modalConfirmacionInforme && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-10">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[700px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8"
                    >
                        <button
                            onClick={() => setModalConfirmacionInforme(false)}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <FormularioInspeccion
                            setModalFormulario={setModalFormulario}
                            modalFormulario={modalFormulario}
                            currentSubactividadId={currentSubactividadId}
                            ppiSelected={ppi}
                            marcarFormularioComoEnviado={marcarFormularioComoEnviado}
                            actualizarFormularioEnFirestore={actualizarFormularioEnFirestore}
                            resultadoInspeccion={resultadoInspeccion}
                            comentario={comentario}
                            firma={firma}

                            fechaHoraActual={fechaHoraActual}
                            handleCloseModal={handleCloseModal}
                            ppiNombre={ppiNombre}
                            nombreResponsable={nombreResponsable}

                            setResultadoInspeccion={setResultadoInspeccion}


                            setModalConfirmacionInforme={setModalConfirmacionInforme}

                            handleConfirmarEnvioPdf={handleConfirmarEnvioPdf}
                            setMensajeExitoInspeccion={setMensajeExitoInspeccion}

                        />





                    </div>

                </div>
            )}

            {modalExito && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-10">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[400px]  modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8 text-center flex flex-col gap-5 items-center"
                    >
                        <button
                            onClick={() => setModalExito(false)}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <p className='text-teal-500 font-bold text-5xl'><FaCheckCircle /></p>

                        <p className='text-xl font-bold'>{mensajeExitoInspeccion}</p>



                    </div>

                </div>
            )}

            {modalRecuperarFormulario && (
                <div className="fixed inset-0 z-50 overflow-auto flex justify-center items-center p-10">
                    <div className="modal-overlay absolute w-full h-full bg-gray-800 opacity-90"></div>

                    <div className="mx-auto w-[400px] modal-container bg-white mx-auto rounded-lg shadow-lg z-50 overflow-y-auto p-8 text-center flex flex-col gap-5 items-center"
                    >
                        <button
                            onClick={cerrarModalYLimpiarDatos}
                            className="text-3xl w-full flex justify-end items-center text-gray-500 hover:text-gray-700 transition-colors duration-300">
                            <IoCloseCircle />
                        </button>

                        <p className='text-gray-500 font-bold text-5xl'><FaFilePdf /></p>

                        <p className='text-gray-500 font-bold text-xl'>¿Imprimir el informe?</p>
                        <div className='flex gap-5'>
                            <button className='bg-sky-600 hover:bg-sky-700 px-4 py-3 rounded-md shadow-md text-white font-medium flex gap-2 items-center' onClick={generatePDF}>Si</button>
                            <button className='bg-gray-500 hover:bg-gray-600 px-4 py-3 rounded-md shadow-md text-white font-medium flex gap-2 items-center' onClick={cerrarModalYLimpiarDatos}>Cancelar</button>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
}
