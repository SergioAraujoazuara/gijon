import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/authContext';
import { getFirestore, collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { GoHomeFill } from "react-icons/go";
import { MdErrorOutline } from "react-icons/md";
import { IoFolderOpen } from "react-icons/io5";
import { FaArrowRight } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { FaBuilding, FaUserTie, FaTools, FaMapMarkerAlt, FaFileContract, FaClock, FaMoneyBillWave, FaShieldAlt, FaUser } from "react-icons/fa";
import ListaProyectos from './Administrador/ShareTrazabilidadProyectos/ListaProyectos ';
import PhotoUpload from './ParteObra/PhotoUpload';

function Home() {
  const { user, loading } = useAuth(); // Obtén el usuario y su estado de cargas
  const [userProjects, setUserProjects] = useState([]); // Proyectos del usuario
  const [userName, setUserName] = useState(''); // Nombre del usuario
  const [selectedProject, setSelectedProject] = useState(localStorage.getItem('selectedProjectId') || null); // Inicializa desde localStorage
  const [projectData, setProjectData] = useState(null); // Datos del proyecto seleccionado
  const [projectLoading, setProjectLoading] = useState(false); // Estado de carga para el proyecto seleccionado
  const [role, setRole] = useState('')
  const [isSelected, setIsSelected] = useState(false);
  const selectedProjectName = localStorage.getItem("selectedProjectName");

  // Obtener los proyectos asignados al usuario
  useEffect(() => {
    if (user) {
      const fetchUserDetails = async () => {
        const db = getFirestore();
        const usersRef = collection(db, 'usuarios');
        const q = query(usersRef, where("uid", "==", user.uid));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          setUserName(data.nombre);
          setUserProjects(data.proyectos || []);
          setRole(data.role);
          // Verifica si el proyecto guardado sigue siendo válido
          const storedProjectId = localStorage.getItem('selectedProjectId');
          if (storedProjectId && !(data.proyectos || []).some(p => p.id === storedProjectId)) {
            localStorage.removeItem('selectedProjectId');
            localStorage.removeItem('selectedProjectName');
            localStorage.removeItem('obra');
            localStorage.removeItem('tramo');
            setSelectedProject(null);
            setProjectData(null);
          }
        });
      };
      fetchUserDetails();
    }
  }, [user]);

  // Cargar datos del proyecto seleccionado al inicializar
  useEffect(() => {
    if (selectedProject) {
      handleProjectChange(selectedProject); // Carga los datos del proyecto al inicio
    }
  }, [selectedProject]);

  // Manejar la selección de un proyecto
  const handleProjectChange = async (id) => {
    setSelectedProject(id); // Establece el ID del proyecto seleccionado

    // Consulta la información del proyecto seleccionado
    setProjectLoading(true);
    const db = getFirestore();
    const projectRef = doc(db, "proyectos", id);

    try {
      const projectSnap = await getDoc(projectRef);
      if (projectSnap.exists()) {
        let infoProject = projectSnap.data();
        localStorage.setItem('selectedProjectId', id);
        localStorage.setItem('selectedProjectName', infoProject.obra);
        localStorage.setItem('obra', infoProject.contrato);
        localStorage.setItem('tramo', infoProject.descripcion);
        setProjectData(infoProject);
      } else {
        console.error("No se encontró el proyecto en la base de datos.");
        setProjectData(null);
      }
    } catch (error) {
      console.error("Error al obtener el proyecto:", error);
      setProjectData(null);
    } finally {
      setProjectLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-start mt-40 min-h-screen">
        {/* Spinner animado */}
        <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>

        {/* Mensaje de carga */}
        <h2 className="text-lg font-semibold text-gray-700 mt-4">
          Cargando información...
        </h2>

        {/* Subtítulo con mensaje amigable */}
        <p className="text-gray-500 text-sm mt-2">
          Estamos obteniendo los datos, por favor espera un momento.
        </p>
      </div>
    )
      ; // Muestra mientras se carga la autenticación
  }

  return (
    <div className="container mx-auto xl:px-14 py-2 text-gray-500 mb-10 min-h-screen">

      {/* Hero Section */}

      {role === 'invitado' && (
        <div className="flex flex-col items-center justify-center bg-white shadow-lg border border-amber-600 rounded-lg p-6 max-w-md mx-auto mt-20 text-center">
          <MdErrorOutline className="text-amber-600 text-5xl mb-4" />
          <h2 className="text-xl font-semibold text-amber-700">Acceso Restringido</h2>
          <p className="text-gray-600 mt-2">
            Contacta al administrador para obtener un rol asignado.
            <br />
            <span className="font-medium text-amber-600">Sin un rol, no tienes acceso a la aplicación.</span>
          </p>
        </div>
      )}
      {userProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center bg-white shadow-lg border border-gray-300 rounded-lg p-8 max-w-md mx-auto mt-20 text-center">
          {/* Icono de error */}
          <MdErrorOutline className="text-gray-600 text-6xl mb-4" />

          {/* Mensaje principal */}
          <h2 className="text-2xl font-bold text-gray-600">No tienes proyectos asignados</h2>

          {/* Mensaje secundario */}
          <p className="text-gray-600 mt-2 text-sm">
            Contacta al administrador para que te asigne acceso a los proyectos y puedas continuar con tu trabajo.
          </p>


        </div>
      )}


      {(role === 'admin' || role === 'usuario') && userProjects.length > 0 && (
        <div>


          {/* Sección de Proyectos */}
          <div className='px-6 mt-6'>
            <h2 className="text-md font-semibold text-start mb-4 px-6">
              <span className='text-amber-700'>*</span>Selecciona un proyecto para comenzar
            </h2>

            <div className="relative">
              <select
                onChange={(e) => handleProjectChange(e.target.value)}
                value={selectedProject || ""}
                className={`block w-full px-6 py-3 rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-300 ease-in-out 
        ${selectedProject ? "bg-indigo-100 border-indigo-500 text-indigo-700 font-semibold" : "bg-white border-gray-300 text-gray-700"} 
        hover:border-indigo-400 cursor-pointer`}
              >
                <option value="" disabled>Selecciona un proyecto...</option>
                {userProjects.length > 0 ? (
                  userProjects.map((proj) => (
                    <option key={proj.id} value={proj.id}>
                      {selectedProject === proj.id ? `✔ ${proj.name} (Seleccionado)` : proj.name}
                    </option>
                  ))
                ) : (
                  <option disabled>No tienes proyectos asignados</option>
                )}
              </select>
            </div>
          </div>



        </div>
      )}


      {/* Detalles del Proyecto Seleccionado */}


      {selectedProject && projectData && (role === 'admin' || role === 'usuario') && userProjects.length > 0 && (
        <div className="flex justify-center text-gray-500 mt-6 px-6">
          <div className="bg-white shadow-2xl rounded-3xl overflow-hidden border border-gray-200 w-full px-6 py-6">
            {/* 🔹 Columna Izquierda - Información del Proyecto */}
            <div className="flex flex-col justify-center">
              <div>
                <p className='px-6 font-bold text-lg'>{projectData.obra}</p>
                <div className='w-full border-b-2 pb-2 mb-4'></div>
              </div>

              <div className="grid grid-cols-1 gap-3 text-sm px-6">
                <h3 className="flex gap-3 items-center">
                  <FaBuilding className='text-sky-700' /><span className='font-medium'>Empresa: </span> {projectData.empresa}
                </h3>
                <p className="flex gap-3 items-center "><FaUserTie className='text-sky-700' /> <span className="font-semibold">Promotor:</span> {projectData.promotor}</p>
                <p className="flex gap-3 items-center"><FaTools className='text-sky-700' /> <span className="font-semibold">Contratista:</span> {projectData.descripcion}</p>
              </div>

              <div className='w-full border-t-2 my-2'></div>

              {/* 📌 Datos Principales con Iconos */}
              <div className="mt-6 grid grid-cols-1 gap-4 text-sm text-gray-700 px-6">
                <p className="flex items-start gap-2"><FaMapMarkerAlt className="text-xl text-sky-700" /> <span className="font-semibold">Obra:</span> {projectData.obra}</p>
                <p className="flex items-center gap-2"><FaFileContract className="text-sky-700" /> <span className="font-semibold">Contrato de la obra:</span> {projectData.contrato}</p>
                <p className="flex items-center gap-2"><FaClock className="text-sky-700" /> <span className="font-semibold">Plazo de la obra:</span> {projectData.plazo}</p>
                <p className="flex items-center gap-2"><FaMoneyBillWave className="text-sky-700" /> <span className="font-semibold">Presupuesto de la obra:</span> {projectData.presupuesto}</p>
                <div className='w-full border-t-2 my-2'></div>
                <p className="flex items-center gap-2"><FaShieldAlt className="text-sky-700" /> <span className="font-semibold">Coordinador:</span> {projectData.coordinador}</p>
                <p className="flex items-center gap-2"><FaUser className="text-sky-700" /> <span className="font-semibold">Director de la obra:</span> {projectData.director}</p>
              </div>
            </div>

            {/* 🔹 Columna Derecha - Imágenes en Grid */}
            <div className="relative flex gap-4">

              <img src={projectData.logo || "https://via.placeholder.com/150"} alt="Logo Empresa" className="w-44 h-46 object-contain rounded-lg  bg-white p-2" />
              <img src={projectData.logoCliente || "https://via.placeholder.com/150"} alt="Logo Cliente" className="w-36 h-20 object-contain rounded-lg bg-white p-2" />

            </div>

          </div>
          
        </div>
      )}





    </div>
  );
}

export default Home;
