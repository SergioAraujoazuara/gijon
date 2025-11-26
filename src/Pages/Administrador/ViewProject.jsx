import React, { useState, useEffect } from "react";
import { db, storage } from "../../../firebase_config";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Link, useNavigate } from "react-router-dom";
import { GoHomeFill } from "react-icons/go";
import { FaArrowRight } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";

// Modal Component to show success or error messages
const Modal = ({ message, type, onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full relative">
        <div className={`text-center font-bold text-lg mb-4 ${type === "success" ? "text-green-600" : "text-red-600"}`}>
          {type === "success" ? "Éxito" : "Error"}
        </div>
        <p className="text-gray-700 text-center mb-6">{message}</p>
        <div className="flex justify-center">
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

function Projects() {
  // State for storing multiple projects
  const [projects, setProjects] = useState([]); // Store all projects
  const [isEditing, setIsEditing] = useState(false); // Flag to toggle edit mode
  const [isAdding, setIsAdding] = useState(false); // Flag to toggle add project form
  const [modalVisible, setModalVisible] = useState(false); // Flag to control modal visibility
  const [modalMessage, setModalMessage] = useState(""); // Modal message
  const [modalType, setModalType] = useState("success"); // Modal type (success/error)

  // Fields for project data
  const [name, setName] = useState(""); 
  const [work, setWork] = useState(""); 
  const [section, setSection] = useState(""); 
  const [contract, setContract] = useState(""); 
  const [logo, setLogo] = useState(null); 
  const [clientLogo, setClientLogo] = useState(null);

  // Function to show success/error modal
  const showModal = (message, type) => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  // Fetch all projects from Firestore
  const fetchProjects = async () => {
    const projectsCollection = collection(db, "proyectos");
    const projectsSnapshot = await getDocs(projectsCollection);

    if (!projectsSnapshot.empty) {
      const projectsList = projectsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectsList); // Store all fetched projects
    }
  };

  // Fetch projects when the component mounts
  useEffect(() => {
    fetchProjects();
  }, []);

  // Open the edit modal with selected project data
  const openEditModal = (proj) => {
    setIsEditing(true);
    setName(proj.nombre);
    setWork(proj.obra);
    setSection(proj.tramo);
    setContract(proj.contrato);
    setLogo(null);
    setClientLogo(null);
  };

  // Update existing project
  const updateProject = async (proj) => {
    if (!name || !work || !contract) {
      showModal("Por favor, completa todos los campos.", "error");
      return;
    }

    try {
      const projectRef = doc(db, "proyectos", proj.id);

      // Upload new logo if provided
      let updatedLogoURL = proj.logo;
      if (logo) {
        const logoRef = ref(storage, `logos/${logo.name}`);
        await uploadBytes(logoRef, logo);
        updatedLogoURL = await getDownloadURL(logoRef);
      }

      // Upload new client logo if provided
      let updatedClientLogoURL = proj.logoCliente;
      if (clientLogo) {
        const clientLogoRef = ref(storage, `logos_clientes/${clientLogo.name}`);
        await uploadBytes(clientLogoRef, clientLogo);
        updatedClientLogoURL = await getDownloadURL(clientLogoRef);
      }

      // Update project in Firestore
      await updateDoc(projectRef, {
        nombre: name,
        obra: work,
        tramo: section,
        contrato: contract,
        logo: updatedLogoURL,
        logoCliente: updatedClientLogoURL,
      });

      // Update local state with new project data
      setProjects(projects.map((p) => (p.id === proj.id ? { ...p, nombre: name, obra: work, tramo: section, contrato: contract, logo: updatedLogoURL, logoCliente: updatedClientLogoURL } : p)));
      setIsEditing(false);
      showModal("Proyecto actualizado exitosamente.", "success");
    } catch (error) {
      console.error("Error al actualizar el proyecto:", error);
      showModal("Error al actualizar el proyecto.", "error");
    }
  };

  // Delete a project
  const deleteProject = async (id) => {
    try {
      const projectRef = doc(db, "proyectos", id);
      await deleteDoc(projectRef);
      setProjects(projects.filter((proj) => proj.id !== id)); // Remove from local state
      showModal("Proyecto eliminado exitosamente.", "success");
    } catch (error) {
      console.error("Error al eliminar el proyecto:", error);
      showModal("Error al eliminar el proyecto.", "error");
    }
  };

  // Add a new project
  const addProject = async () => {
    if (!name || !work || !contract) {
      showModal("Por favor, completa todos los campos.", "error");
      return;
    }

    try {
      let logoURL = null;
      if (logo) {
        const logoRef = ref(storage, `logos/${logo.name}`);
        await uploadBytes(logoRef, logo);
        logoURL = await getDownloadURL(logoRef);
      }

      let clientLogoURL = null;
      if (clientLogo) {
        const clientLogoRef = ref(storage, `logos_clientes/${clientLogo.name}`);
        await uploadBytes(clientLogoRef, clientLogo);
        clientLogoURL = await getDownloadURL(clientLogoRef);
      }

      const projectsCollection = collection(db, "proyectos");
      await addDoc(projectsCollection, {
        nombre: name,
        obra: work,
        tramo: section,
        contrato: contract,
        logo: logoURL,
        logoCliente: clientLogoURL,
      });

      // Fetch projects after adding a new one
      
      setIsAdding(false);
      setName("");
      setWork("");
      setSection("");
      setContract("");
      setLogo(null);
      setClientLogo(null);
      showModal("Proyecto agregado exitosamente.", "success");
      fetchProjects();
    } catch (error) {
      console.error("Error al agregar el proyecto:", error);
      showModal("Error al agregar el proyecto.", "error");
    }
  };

  // Navigate back to previous page
  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto p-8 min-h-screen">
      <div className="flex gap-2 items-center justify-between px-4 py-3 text-base">
        <div className="flex gap-2 items-center">
          <GoHomeFill style={{ width: 15, height: 15, fill: "#d97706" }} />
          <Link to={"/admin"}>
            <h1 className="text-gray-500">Administración</h1>
          </Link>
          <FaArrowRight style={{ width: 12, height: 12, fill: "#d97706" }} />
          <Link to={"#"}>
            <h1 className="text-amber-500 font-medium">Información de proyectos</h1>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Agregar Proyecto
          </button>
          <button className="text-amber-600 text-3xl">
            <IoArrowBackCircle onClick={handleGoBack} />
          </button>
        </div>
      </div>

      {modalVisible && <Modal message={modalMessage} type={modalType} onClose={() => setModalVisible(false)} />}

      {/* Render the list of projects */}
      {projects.length > 0 ? (
        <div className="overflow-x-auto text-gray-500">
          <h2 className="text-lg font-bold text-gray-500 mb-4 mt-4">Proyectos</h2>
          <table className="table-auto w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Obra</th>
                <th className="px-4 py-2">Tramo</th>
                <th className="px-4 py-2">Contrato</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr key={proj.id} className="border-b">
                  <td className="px-4 py-2">{proj.nombre}</td>
                  <td className="px-4 py-2">{proj.obra}</td>
                  <td className="px-4 py-2">{proj.tramo}</td>
                  <td className="px-4 py-2">{proj.contrato}</td>
                  <td className="px-4 py-2 flex gap-2">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="bg-blue-500 text-white px-4 py-2 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => deleteProject(proj.id)}
                      className="bg-red-500 text-white px-4 py-2 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Cargando proyectos...</p>
      )}

      {/* Add Project Form */}
      {isAdding && (
        <div className="fixed inset-0 z-10 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Agregar Proyecto</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="text"
              value={work}
              onChange={(e) => setWork(e.target.value)}
              placeholder="Obra"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Tramo"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="text"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="Contrato"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="file"
              onChange={(e) => setLogo(e.target.files[0])}
              className="block w-full mb-4"
            />
            {logo && (
              <div className="mb-4">
                <h3>Vista previa Logo Proyecto:</h3>
                <img src={URL.createObjectURL(logo)} alt="Vista previa Logo" className="mt-2" width="100" />
              </div>
            )}
            <input
              type="file"
              onChange={(e) => setClientLogo(e.target.files[0])}
              className="block w-full mb-4"
            />
            {clientLogo && (
              <div className="mb-4">
                <h3>Vista previa Logo Cliente:</h3>
                <img src={URL.createObjectURL(clientLogo)} alt="Vista previa Logo Cliente" className="mt-2" width="100" />
              </div>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={addProject}
                className="bg-green-500 text-white px-4 py-2 rounded"
              >
                Agregar
              </button>
              <button
                onClick={() => setIsAdding(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-10 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-8 rounded-lg w-full max-w-lg">
            <h2 className="text-lg font-bold mb-4">Editar Proyecto</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="text"
              value={work}
              onChange={(e) => setWork(e.target.value)}
              placeholder="Obra"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="text"
              value={section}
              onChange={(e) => setSection(e.target.value)}
              placeholder="Tramo"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="text"
              value={contract}
              onChange={(e) => setContract(e.target.value)}
              placeholder="Contrato"
              className="block w-full mb-4 px-4 py-2 border rounded"
            />
            <input
              type="file"
              onChange={(e) => setLogo(e.target.files[0])}
              className="block w-full mb-4"
            />
            {logo && (
              <div className="mb-4">
                <h3>Vista previa Logo Proyecto:</h3>
                <img src={URL.createObjectURL(logo)} alt="Vista previa Logo" className="mt-2" width="100" />
              </div>
            )}
            <input
              type="file"
              onChange={(e) => setClientLogo(e.target.files[0])}
              className="block w-full mb-4"
            />
            {clientLogo && (
              <div className="mb-4">
                <h3>Vista previa Logo Cliente:</h3>
                <img src={URL.createObjectURL(clientLogo)} alt="Vista previa Logo Cliente" className="mt-2" width="100" />
              </div>
            )}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => updateProject({ id: "" })}
                className="bg-blue-500 text-white px-4 py-2 rounded"
              >
                Guardar
              </button>
              <button
                onClick={() => setIsEditing(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Projects;
