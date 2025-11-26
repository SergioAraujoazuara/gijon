import React, { useState, useEffect } from "react";
import { db } from "../../../../firebase_config";
import { collection, getDocs, doc, setDoc, query, where, getDoc } from "firebase/firestore"; // Importar funciones necesarias
import { GoHomeFill } from "react-icons/go";
import { IoCreateOutline } from "react-icons/io5";
import { MdOutlineEditLocation } from "react-icons/md";
import { IoArrowBackCircle } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaArrowAltCircleRight } from "react-icons/fa";
import { FaRegUserCircle } from "react-icons/fa";
import { BsClipboardDataFill } from "react-icons/bs";
import { FaInfoCircle } from "react-icons/fa";
import { CiShare2 } from "react-icons/ci";
import { FaArrowRight } from "react-icons/fa";
/**
 * `ListaProyectos` Component
 * 
 * The `ListaProyectos` component is responsible for displaying the list of construction projects, allowing the user to select 
 * an "origin" project and a "destination" project to copy the traceability data from the origin project to the destination project.
 * 
 * **Features:**
 * - Displays a list of available projects for the user to choose from.
 * - Allows the user to select a "Project of Origin" and a "Project of Destination" from dropdown menus.
 * - Filters projects to show only those without associated sectors, making them eligible as destination projects.
 * - Provides a button to trigger the traceability copying process between selected projects.
 * - Includes a modal to confirm success when traceability is successfully copied.
 * - Uses Firebase Firestore to interact with the data, including checking if the destination project already has traceability data.
 * - Validates and ensures that traceability is not overwritten in the destination project.
 * 
 * **State Variables:**
 * - `proyectos`: List of all projects available in the Firestore collection.
 * - `loading`: Boolean flag to indicate if data is still loading.
 * - `proyectoDestino`: The destination project selected by the user.
 * - `proyectoOrigen`: The origin project selected by the user.
 * - `error`: Stores any error messages related to fetching data or operations.
 * - `showModal`: Boolean flag to show or hide the modal for success confirmation.
 * - `proyectosDisponibles`: List of available projects that do not have traceability data associated with them.
 * 
 * **Methods:**
 * - `filtrarProyectosVacios`: Filters and returns projects that do not have associated sectors.
 * - `obtenerProyectos`: Fetches projects from Firestore and sets the state accordingly.
 * - `handleGoBack`: Navigates the user back to the previous page.
 * - `documentoExiste`: Checks if a document already exists in Firestore based on a specific field and value.
 * - `verificarExistenciaEnDestino`: Verifies if the destination project already has traceability data.
 * - `copiarTrazabilidad`: Copies the traceability data (sectors, subsectors, parts, elements, lots) from the origin project to the destination project.
 * - `closeModal`: Closes the modal window after the traceability copy is successful.
 * 
 * **UI/UX:**
 * - Dropdown menus are provided for selecting origin and destination projects.
 * - Error messages are displayed if there is an issue, such as selecting a project that already contains traceability data.
 * - A success modal is shown when traceability is successfully copied.
 * - The user can click on the "Copiar Trazabilidad" button to start the copying process.
 * 
 * **Example Usage:**
 * ```javascript
 * // To use this component, include it in your routing structure or as part of the admin interface
 * <ListaProyectos />
 * ```
 */

const ListaProyectos = () => {
  const [proyectos, setProyectos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [proyectoDestino, setProyectoDestino] = useState(null); 
  const [proyectoOrigen, setProyectoOrigen] = useState(null); 
  const [error, setError] = useState(null); 
  const [showModal, setShowModal] = useState(false); 

  const [proyectosDisponibles, setProyectosDisponibles] = useState([]);
  const filtrarProyectosVacios = async (listaProyectos) => {
    const disponibles = [];

    for (const proyecto of listaProyectos) {
      const sectorSnapshot = await getDocs(collection(proyecto.ref, "sector"));
      if (sectorSnapshot.empty) {
        disponibles.push(proyecto);
      }
    }

    setProyectosDisponibles(disponibles);
  };

  useEffect(() => {
    const cargarProyectos = async () => {
      await obtenerProyectos();
    };

    cargarProyectos();
  }, []);

  const obtenerProyectos = async () => {
    try {
      const proyectosRef = collection(db, "proyectos");
      const proyectosSnapshot = await getDocs(proyectosRef);
      const proyectosData = proyectosSnapshot.docs.map((doc) => ({
        id: doc.id,
        obra: doc.data().obra,
        ref: doc.ref,
      }));
      setProyectos(proyectosData);
      setLoading(false);
      await filtrarProyectosVacios(proyectosData);
    } catch (error) {
      console.error("Error al obtener los proyectos:", error);
      setLoading(false);
    }
  };



  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate('/'); 
  };



  const documentoExiste = async (collectionRef, field, value) => {
    const q = query(collectionRef, where(field, "==", value));
    const snapshot = await getDocs(q);
    return !snapshot.empty; 
  };


  const verificarExistenciaEnDestino = async (proyectoDestino) => {
    try {
      const sectorRef = collection(proyectoDestino.ref, "sector");
      const sectorSnapshot = await getDocs(sectorRef);

      return !sectorSnapshot.empty;
    } catch (error) {
      console.error("Error al verificar la existencia de datos:", error);
      return false;
    }
  };



  const copiarTrazabilidad = async (proyectoOrigen) => {


    const existeInfo = await verificarExistenciaEnDestino(proyectoDestino);
    if (existeInfo) {
      console.error("El proyecto de destino ya contiene información.");
      setError("El proyecto de destino ya contiene información. No se puede sobrescribir.");
      return; 
    }
    try {
      if (!proyectoDestino) {
        console.error("Error: No se ha seleccionado un proyecto de destino.");
        setError("Debe seleccionar un proyecto de destino.");
        return;
      }


      const sectorRef = collection(proyectoOrigen.ref, "sector");
      const sectorSnapshot = await getDocs(sectorRef);

      for (const sectorDoc of sectorSnapshot.docs) {
        const sectorData = sectorDoc.data();


        const nuevoSectorRef = doc(collection(proyectoDestino.ref, "sector"));
        const sectorDataConIdActualizado = {
          ...sectorData,
          id: nuevoSectorRef.id,  
        };
        await setDoc(nuevoSectorRef, sectorDataConIdActualizado);
        const subSectorRef = collection(sectorDoc.ref, "subsector");
        const subSectorSnapshot = await getDocs(subSectorRef);

        for (const subSectorDoc of subSectorSnapshot.docs) {
          const subSectorData = subSectorDoc.data();

          const nuevoSubSectorRef = doc(collection(nuevoSectorRef, "subsector"));
          const subSectorDataConIdActualizado = {
            ...subSectorData,
            sectorId: nuevoSectorRef.id, 
          };
          await setDoc(nuevoSubSectorRef, subSectorDataConIdActualizado);
        

          const parteRef = collection(subSectorDoc.ref, "parte");
          const parteSnapshot = await getDocs(parteRef);

          for (const parteDoc of parteSnapshot.docs) {
            const parteData = parteDoc.data();

            const nuevoParteRef = doc(collection(nuevoSubSectorRef, "parte"));
            const parteDataConIdActualizado = {
              ...parteData,
              sectorId: nuevoSectorRef.id, 
              subSectorId: nuevoSubSectorRef.id, 
            };
            await setDoc(nuevoParteRef, parteDataConIdActualizado);
           
            const elementoRef = collection(parteDoc.ref, "elemento");
            const elementoSnapshot = await getDocs(elementoRef);

            for (const elementoDoc of elementoSnapshot.docs) {
              const elementoData = elementoDoc.data();

           
              const nuevoElementoRef = doc(collection(nuevoParteRef, "elemento"));
              const elementoDataConIdActualizado = {
                ...elementoData,
                sectorId: nuevoSectorRef.id, 
                subSectorId: nuevoSubSectorRef.id, 
                parteId: nuevoParteRef.id, 
              };

             
              await setDoc(nuevoElementoRef, elementoDataConIdActualizado);
            
              const loteRef = collection(elementoDoc.ref, "lote");
              const loteSnapshot = await getDocs(loteRef);

              for (const loteDoc of loteSnapshot.docs) {
                const loteData = loteDoc.data();

                const loteDataConIdActualizado = {
                  ...loteData,
                  sectorId: nuevoSectorRef.id, 
                  subSectorId: nuevoSubSectorRef.id, 
                  parteId: nuevoParteRef.id, 
                  idProyecto: proyectoDestino.id, 
                  nombreProyecto: proyectoDestino.obra,
                };

              
                const nuevoLoteRef = doc(collection(nuevoElementoRef, "lote"));
                await setDoc(nuevoLoteRef, loteDataConIdActualizado);
              

               
                const lotePrincipalRef = doc(db, `lotes/${nuevoLoteRef.id}`);
                await setDoc(lotePrincipalRef, loteDataConIdActualizado);
             
              }
            }
          }
        }
      }

     
      setShowModal(true);
    } catch (error) {
      console.error("Error al copiar la trazabilidad:", error);
      setError("Error al copiar la trazabilidad.");
    }
  };


  const closeModal = () => {
    setShowModal(false);
  };


  if (loading) return <p>Cargando proyectos...</p>;

  return (
    <div className='min-h-screen container mx-auto xl:px-14 py-2 text-gray-500 mb-10'>
      <div className='flex gap-2 items-center justify-between bg-white px-5 py-3 text-base'>
        <div className='flex gap-2 items-center'>
          <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />
          <Link to={'/admin'}>
            <h1 className='text-gray-500'>Administración</h1>
          </Link>

          <FaArrowRight style={{ width: 12, height: 12, fill: '#d97706' }} />
          <Link to={'#'}>
            <h1 className='font-medium text-amber-600'>Copiar trazabilidad</h1>
          </Link>
        </div>
        <div className='flex items-center'>
          <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>
        </div>
      </div>

      <div className='w-full border-b-2 border-gray-200'></div>

      <div>
        <h1 className="font-bold text-lg text-gray-500 px-8 pt-6 pb-4">Lista de Proyectos</h1>

        <div className="w-full border-b-2"></div>

        {/* Mostrar error si existe */}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        {/* Dropdown para seleccionar el Proyecto de Destino y Origen */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 my-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Proyecto de Origen
            </label>
            <select
              onChange={(e) => {
                const selectedProject = proyectos.find((proyecto) => proyecto.id === e.target.value);
                setProyectoOrigen(selectedProject);
              }}
              className="w-full border border-gray-300 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-gray-700"
            >
              <option value="">Seleccione un Proyecto de Origen</option>
              {proyectos.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.obra}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl shadow-md p-4">
            <label className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Proyecto de Destino
            </label>
            <select
              onChange={(e) => {
                const selectedProject = proyectos.find((proyecto) => proyecto.id === e.target.value);
                setProyectoDestino(selectedProject);
              }}
              className="w-full border border-gray-300 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-gray-700"
            >
              <option value="">Seleccione un Proyecto de Destino</option>
              {proyectosDisponibles.map((proyecto) => (
                <option key={proyecto.id} value={proyecto.id}>
                  {proyecto.obra} (disponible)
                </option>
              ))}

            </select>
          </div>
        </div>


        {/* Botón para copiar la trazabilidad */}
        <div className="text-start">
          <button
            onClick={() => copiarTrazabilidad(proyectoOrigen)}
            className="bg-sky-600 text-white px-6 py-3 rounded-lg shadow-md hover:bg-sky-700 transition duration-300"
          >
            Copiar Trazabilidad
          </button>
        </div>

        {/* Modal de alerta de éxito */}
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50 transition-opacity duration-300">
            <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-green-600">¡Trazabilidad copiada con éxito!</h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="text-center">
                <button
                  onClick={closeModal}
                  className="bg-green-600 text-white px-8 py-3 rounded-lg shadow-md w-full"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

      </div>



    </div>
  );
};

export default ListaProyectos;
