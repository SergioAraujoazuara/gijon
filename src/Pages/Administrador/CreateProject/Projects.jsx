import React, { useState } from "react";
import useProjects from "../../../Hooks/useProjects"; // Usamos el hook useProjects
import useAddProject from "../../../Hooks/useAddProject"; // Importamos el hook useAddProject
import useUpdateProject from "../../../Hooks/useUpdateProject"; // Importamos el hook useUpdateProject
import useDeleteProject from "../../../Hooks/useDeleteProject"; // Importamos el hook useDeleteProject
import { db, storage } from "../../../../firebase_config";
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Modal from "./Modal";
import AddProjectForm from "./AddProjectForm";
import EditProjectForm from "./EditProjectForm";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { GoHomeFill } from "react-icons/go";
import { FaArrowRight } from "react-icons/fa";
import { IoArrowBackCircle } from "react-icons/io5";
/**
 * `Projects` Component
 * 
 * The `Projects` component is responsible for managing construction projects, including adding, editing, deleting, and listing the projects. 
 * It utilizes several custom hooks (`useProjects`, `useAddProject`, `useUpdateProject`, and `useDeleteProject`) to interact with Firebase Firestore.
 * The component displays a table of projects, allows users to perform CRUD operations, and shows modals for success, error messages, 
 * and project deletion confirmation.
 * 
 * **Features:**
 * - Displays a list of construction projects with options to edit, delete, or view project details.
 * - Allows adding new projects by filling out a form with relevant project data (company, work, description, etc.).
 * - Supports editing existing project data, including updating project details and logos.
 * - Handles the deletion of projects with a confirmation modal.
 * - Uses Firebase Firestore to manage project data and updates the project list dynamically.
 * - Includes form validation to ensure that required fields are filled out before adding or updating a project.
 * - Utilizes modals to show feedback messages (success or error) and confirm project deletions.
 * 
 * **State Variables:**
 * - `projects`: Stores the list of projects fetched from Firebase.
 * - `loading`: Flag indicating whether the project list is still loading.
 * - `isEditing`: Flag indicating whether the edit form is open.
 * - `isAdding`: Flag indicating whether the add form is open.
 * - `modalVisible`: Flag indicating whether the feedback modal is visible.
 * - `modalMessage`: Stores the message displayed in the modal.
 * - `modalType`: Stores the type of the modal (`success` or `error`).
 * - `empresa`: Stores the name of the company.
 * - `work`: Stores the name of the work/project.
 * - `descripcion`: Stores the description of the contractor.
 * - `promotor`: Stores the name of the promoter.
 * - `contract`: Stores the contract number.
 * - `plazo`: Stores the project timeline.
 * - `presupuesto`: Stores the project budget.
 * - `coordinador`: Stores the name of the safety and health coordinator.
 * - `director`: Stores the name of the project director.
 * - `logo`: Stores the selected logo file for the project.
 * - `clientLogo`: Stores the selected logo file for the client.
 * - `existingLogoURL`: Stores the URL of the current project logo for preview.
 * - `existingClientLogoURL`: Stores the URL of the current client logo for preview.
 * - `selectedProject`: Stores the selected project for editing.
 * - `projectIdToEdit`: Stores the ID of the project being edited.
 * - `isDeleteModalOpen`: Flag indicating whether the delete confirmation modal is open.
 * - `projectIdToDelete`: Stores the ID of the project to be deleted.

 * **Methods:**
 * - `showModal`: Displays the modal with the success/error message.
 * - `closeModal`: Closes the modal and resets the form.
 * - `openEditModal`: Opens the edit form and loads the selected project's data.
 * - `handleUpdateProject`: Handles the project update process and updates project data in Firestore.
 * - `handleDeleteProject`: Handles the deletion of a project.
 * - `validateFields`: Validates the fields before adding a new project to ensure all necessary data is provided.
 * - `addNewProject`: Handles the process of adding a new project after validating the fields.
 * - `fetchUsersWithProject`: Fetches the users assigned to a project.
 * - `updateUsersWithProject`: Updates the project data for users assigned to the project.

 * **Example:**
 * ```javascript
 * // Projects component usage example:
 * <Projects />
 * ```
 */

function Projects() {
  const { projects, loading, refreshProjects } = useProjects(); 
  const { addProject, loading: addingLoading, error: addProjectError } = useAddProject(); 
  const { updateProject, loading: updatingLoading, error: updateProjectError } = useUpdateProject(); 
  const { deleteProject, loading: deletingLoading, error: deleteProjectError } = useDeleteProject(); 
  const [isEditing, setIsEditing] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [modalType, setModalType] = useState("success");

  // Fields for project data
  const [empresa, setEmpresa] = useState("TPF INGENIERÍA");
  const [work, setWork] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [promotor, setPromotor] = useState("");
  const [contract, setContract] = useState("");
  const [plazo, setPlazo] = useState("");
  const [presupuesto, setPresupuesto] = useState("");
  const [coordinador, setCoordinador] = useState("");
  const [director, setDirector] = useState("");
  const [logo, setLogo] = useState(null);
  const [clientLogo, setClientLogo] = useState(null);

  const [existingLogoURL, setExistingLogoURL] = useState("");
  const [existingClientLogoURL, setExistingClientLogoURL] = useState("");

  const [selectedProject, setSelectedProject] = useState(null);
  const [projectIdToEdit, setProjectIdToEdit] = useState('')

  // Function to show success/error modal
  const showModal = (message, type) => {
    setModalMessage(message);
    setModalType(type);
    setModalVisible(true);
  };

  // Function to handle modal close and reset form
  const closeModal = () => {
    setIsAdding(false); // Hide the modal
    setEmpresa(""); // Reset form fields
    setWork("");
    setDescripcion("");
    setPromotor("")
    setContract("");
    setCoordinador("");
    setDirector("");
    setLogo(null);
    setClientLogo(null);
  };



  // Open the edit modal with selected project data
  const openEditModal = (proj) => {
    setIsEditing(true);
    setEmpresa(proj.empresa);
    setWork(proj.obra);
    setDescripcion(proj.descripcion);
    setPromotor(proj.promotor);
    setContract(proj.contrato);
    setPlazo(proj.plazo);
    setPresupuesto(proj.presupuesto);
    setCoordinador(proj.coordinador);
    setDirector(proj.director);
    setLogo(null);
    setClientLogo(null);
    setSelectedProject(proj);
    setExistingLogoURL(proj.logo);
    setExistingClientLogoURL(proj.logoCliente);
    setProjectIdToEdit(proj.id)
  };

  // Handle updating the project
  const handleUpdateProject = async () => {
    try {
      const updatedProjectData = {
        empresa,
        obra: work,
        descripcion,
        promotor,
        contrato: contract,
        plazo: plazo,
        presupuesto: presupuesto,
        director: director,
        coordinador: coordinador
      };

      const result = await updateProject(selectedProject.id, empresa, work, descripcion, contract, logo, clientLogo, promotor, plazo, presupuesto, coordinador, director);

      await updateUsersWithProject(selectedProject.id, updatedProjectData);

      showModal(result, "success");

      setIsEditing(false);
      refreshProjects();
    } catch (error) {
      showModal("Error actualizando el proyecto: " + error.message, "error");
    }
  };

  // Handle deleting the project
  const handleDeleteProject = async (id) => {
    const result = await deleteProject(id);
    showModal(result, "success");
    refreshProjects(); // Refresh the project list
  };

  // Validate fields before adding a new project
  const validateFields = (empresa, work, contract) => {
    if (!empresa && !work && !contract) {
      return "Por favor, completa al menos un campo antes de agregar el proyecto.";
    }
    return null;
  };

  const addNewProject = async () => {
    // Validación: Verificar campos vacíos
    const validationError = validateFields(empresa, work, contract);
    if (validationError) {
      showModal(validationError, "error");
      return; // Detener la ejecución si hay un error de validación
    }

    try {
      const result = await addProject(empresa, work, descripcion, contract, logo, clientLogo, promotor, plazo, presupuesto, coordinador, director);
      showModal(result, "success");
      setIsAdding(false); // Close modal after adding project
      refreshProjects(); // Refresh the project list
    } catch (error) {
      showModal(error.message, "error");
    }
  };

  // Navigate back to previous page
  const navigate = useNavigate();
  const handleGoBack = () => {
    navigate(-1);
  };

  // Función para obtener los usuarios con el proyecto asignado
  const fetchUsersWithProject = async () => {
    const usersRef = collection(db, "usuarios");

    try {
      const querySnapshot = await getDocs(usersRef);
      const users = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(user =>
          user.proyectos?.some(proj => proj.id === projectIdToEdit) // Filtramos los que tienen el proyecto
        );
      return users;
    } catch (error) {
      console.error("Error obteniendo los usuarios con el proyecto asignado:", error);
      return [];
    }
  };


  fetchUsersWithProject()




  const updateUsersWithProject = async (projectId, updatedProjectData) => {
    try {
      const users = await fetchUsersWithProject(projectId); // Obtenemos los usuarios con el proyecto asignado

      const batch = writeBatch(db); // Creamos una batch para optimizar la actualización

      users.forEach((user) => {
        const userRef = doc(db, "usuarios", user.id); // Referencia al documento del usuario

        // Mapeamos el array de proyectos del usuario y actualizamos solo el name (obra)
        const updatedProjects = user.proyectos.map(proj =>
          proj.id === projectId ? { ...proj, name: updatedProjectData.obra } : proj
        );

        batch.update(userRef, { proyectos: updatedProjects }); // Agregamos la actualización a la batch
      });

      await batch.commit(); // Ejecutamos todas las actualizaciones de una vez
    } catch (error) {
      console.error("Error actualizando los usuarios:", error);
    }
  };

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false); // Modal de confirmación
  const [projectIdToDelete, setProjectIdToDelete] = useState(null); // ID del proyecto a eliminar
  const openDeleteConfirmationModal = (id) => {
    setProjectIdToDelete(id);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteConfirmationModal = () => {
    setIsDeleteModalOpen(false);
    setProjectIdToDelete(null);
  };

  const confirmDeleteProject = async () => {
    await handleDeleteProject(projectIdToDelete); // Eliminar el proyecto
    closeDeleteConfirmationModal(); // Cerrar el modal de confirmación
  };



  return (
    <div className="container mx-auto p-8 min-h-screen text-gray-500">
      <div className="flex flex-col md:flex-row gap-2 items-center justify-between px-4 py-3 text-base">
        <div className="flex gap-2 items-center flex-wrap justify-center md:justify-start">
          <GoHomeFill style={{ width: 15, height: 15, fill: "#d97706" }} />
          <Link to={"/admin"}>
            <h1 className="text-sm md:text-base">Administración</h1>
          </Link>
          <FaArrowRight style={{ width: 12, height: 12, fill: "#d97706" }} />
          <Link to={"#"}>
            <h1 className="text-sm md:text-base text-amber-600 font-medium">Información de proyectos</h1>
          </Link>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0 justify-center md:justify-end w-full md:w-auto">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-amber-600 text-white px-4 py-2 rounded text-sm md:text-base"
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
      {loading ? (
        <p>Cargando proyectos...</p>
      ) : (
        <div className="overflow-x-auto ">
          <h2 className="text-lg font-bold mb-4 mt-4 ps-4">Proyectos</h2>
          <div className="border-b-2 mb-6"></div>
          <table className="table-auto w-full text-left border-collapse">
            <thead>
              <tr className="border-b">
                <th className="px-4 py-2">Empresa</th>
                <th className="px-4 py-2">Obra</th>
                <th className="px-4 py-2">Número de contrato</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((proj) => (
                <tr key={proj.id} className="border-b">
                  <td className="px-4 py-6">{proj.empresa}</td>
                  <td className="px-4 py-6">{proj.obra}</td>
                  <td className="px-4 py-6">{proj.contrato}</td>
                  <td className="px-4 py-6 flex gap-2">
                    <button
                      onClick={() => openEditModal(proj)}
                      className="bg-gray-500 text-white px-4 py-2 rounded"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => openDeleteConfirmationModal(proj.id)}
                      className="bg-red-700 text-white px-4 py-2 rounded"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal de Confirmación */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-12 rounded-lg w-md text-center">
          <h3 className="text-xl mb-4 flex items-center justify-center">
            {/* Icono de advertencia */}
            <span className="mr-2 text-red-600">⚠️</span> 
            ¿Estás seguro de eliminar este proyecto?
          </h3>
          <p className="mb-4 flex items-center justify-center gap-2"> <span className="text-amber-600 text-2xl">*</span>Esta acción es irreversible.</p>
      
          {/* Botones para confirmar o cancelar */}
          <div className="flex justify-center gap-5 mt-10">
            <button
              onClick={confirmDeleteProject}
              className="px-4 py-2 bg-red-600 text-white rounded-md flex items-center"
            >
              {/* Icono de check */}
             Confirmar
            </button>
            <button
              onClick={closeDeleteConfirmationModal}
              className="px-4 py-2 bg-gray-400 text-white rounded-md flex items-center"
            >
              {/* Icono de cancelar */}
               Cancelar
            </button>
          </div>
        </div>
      </div>
      
      )}

      {/* Add Project Form */}
      {isAdding && (
        <AddProjectForm
          empresa={empresa}
          setEmpresa={setEmpresa}
          work={work}
          setWork={setWork}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          promotor={promotor}
          setPromotor={setPromotor}
          contract={contract}
          setContract={setContract}
          plazo={plazo}
          setPlazo={setPlazo}
          presupuesto={presupuesto}
          setPresupuesto={setPresupuesto}
          coordinador={coordinador}
          director={director}
          setCoordinador={setCoordinador}
          setDirector={setDirector}
          logo={logo}
          setLogo={setLogo}
          clientLogo={clientLogo}
          setClientLogo={setClientLogo}
          onSave={addNewProject}
          onClose={closeModal}
        />
      )}

      {/* Edit Project Form */}
      {isEditing && (
        <EditProjectForm
          empresa={empresa}
          setEmpresa={setEmpresa}
          work={work}
          setWork={setWork}
          descripcion={descripcion}
          setDescripcion={setDescripcion}
          promotor={promotor}
          setPromotor={setPromotor}
          contract={contract}
          setContract={setContract}
          plazo={plazo}
          setPlazo={setPlazo}
          presupuesto={presupuesto}
          setPresupuesto={setPresupuesto}
          coordinador={coordinador}
          director={director}
          setCoordinador={setCoordinador}
          setDirector={setDirector}
          logo={logo}
          setLogo={setLogo}
          clientLogo={clientLogo}
          setClientLogo={setClientLogo}
          onSave={handleUpdateProject}
          existingLogoURL={existingLogoURL}
          existingClientLogoURL={existingClientLogoURL}
          setIsEditing={setIsEditing}
          projectIdToEdit={projectIdToEdit}
        />
      )}
    </div>
  );
}

export default Projects;
