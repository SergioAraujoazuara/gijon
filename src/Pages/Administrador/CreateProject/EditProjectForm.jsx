import React from "react";
import { getDocs, collection, query, where, getFirestore, updateDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase_config";
/**
 * `EditProjectForm` Component
 * 
 * The `EditProjectForm` component provides a user interface to edit the details of an existing construction project.
 * It allows users to modify the project information such as the company, work/project name, description, contractor, 
 * promoter, contract number, project timeline, budget, and the safety coordinator. The form also allows the user to 
 * update logos for both the project and the client, and preview them before saving the changes.
 * 
 * **Features:**
 * - Form fields for editing project details: Company, Work, Description, Promoter, Contract Number, Project Timeline, Budget, 
 *   Safety Coordinator, and Director.
 * - Preview of current project and client logos before updating.
 * - Ability to upload new logos and preview the selected files.
 * - Reset functionality for clearing the form.
 * - Actions for saving the updated project (`onSave`) and canceling the edit (`setIsEditing`).
 * 
 * **State Variables:**
 * - `empresa`: Stores the name of the company.
 * - `work`: Stores the name of the work/project.
 * - `descripcion`: Stores the description of the contractor.
 * - `promotor`: Stores the name of the promoter.
 * - `contract`: Stores the contract number.
 * - `plazo`: Stores the project timeline.
 * - `presupuesto`: Stores the project budget.
 * - `coordinador`: Stores the name of the safety and health coordinator.
 * - `director`: Stores the name of the project director.
 * - `logo`: Stores the selected company logo file for upload.
 * - `clientLogo`: Stores the selected client logo file for upload.
 * - `existingLogoURL`: Stores the URL of the current project logo for preview.
 * - `existingClientLogoURL`: Stores the URL of the current client logo for preview.
 * - `setIsEditing`: A function to toggle the editing state of the form.
 * 
 * **Methods:**
 * - `onSave`: Triggered when the user submits the form to save the edited project.
 * - `resetForm`: Clears all form fields.
 * - `setIsEditing`: Closes the form without saving any changes when the user cancels.
 * 
 * **Example:**
 * ```javascript
 * // EditProjectForm component usage example:
 * <EditProjectForm 
 *    empresa={empresa} 
 *    setEmpresa={setEmpresa} 
 *    work={work} 
 *    setWork={setWork} 
 *    descripcion={descripcion} 
 *    setDescripcion={setDescripcion} 
 *    promotor={promotor} 
 *    setPromotor={setPromotor} 
 *    contract={contract} 
 *    setContract={setContract} 
 *    plazo={plazo} 
 *    setPlazo={setPlazo} 
 *    presupuesto={presupuesto} 
 *    setPresupuesto={setPresupuesto} 
 *    coordinador={coordinador} 
 *    setCoordinador={setCoordinador} 
 *    director={director} 
 *    setDirector={setDirector} 
 *    logo={logo} 
 *    setLogo={setLogo} 
 *    clientLogo={clientLogo} 
 *    setClientLogo={setClientLogo} 
 *    existingLogoURL={existingLogoURL} 
 *    existingClientLogoURL={existingClientLogoURL} 
 *    onSave={handleSave} 
 *    setIsEditing={setIsEditing} 
 * />
 * ```
 */

const EditProjectForm = ({
  empresa,
  setEmpresa,
  work,
  setWork,
  descripcion,
  setDescripcion,
  promotor,
  setPromotor,
  contract,
  setContract,
  plazo,
  setPlazo,
  presupuesto,
  setPresupuesto,
  coordinador,
  setCoordinador,
  director,
  setDirector,
  logo,
  setLogo,
  clientLogo,
  setClientLogo,
  onSave,
  existingLogoURL,
  existingClientLogoURL,
  setIsEditing,
}) => {

  const resetForm = () => {
    setEmpresa("");
    setWork("");
    setDescripcion("");
    setPromotor("");
    setPlazo("");
    setPresupuesto("");
    setCoordinador("");
    setDirector("");
    setContract("");
    setLogo(null);
    setClientLogo(null);
  };

  return (
    <div className="fixed inset-0 z-10 flex justify-center items-center bg-black bg-opacity-50 text-gray-500">
      <div className="bg-white p-8 rounded-lg w-full max-w-lg overflow-y-auto max-h-[80vh] shadow-xl">
        <h2 className="text-lg font-semibold  mb-4">Editar Proyecto</h2>

        {/* Empresa */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="empresa">
            Empresa
          </label>
          <input
            type="text"
            id="empresa"
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            placeholder="Nombre de la empresa"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Obra */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="work">
            Obra
          </label>
          <input
            type="text"
            id="work"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            placeholder="Nombre de la obra"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Descripción */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="descripcion">
            Contratista
          </label>
          <textarea
            id="descripcion"
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Nombre del contratista"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Promotor */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="promotor">
            Promotor
          </label>
          <textarea
            id="promotor"
            value={promotor}
            onChange={(e) => setPromotor(e.target.value)}
            placeholder="Nombre del promotor"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Contrato */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="contract">
            Número de contrato
          </label>
          <input
            type="text"
            id="contract"
            value={contract}
            onChange={(e) => setContract(e.target.value)}
            placeholder="Número de contrato"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Plazo de la obra */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="plazo">
            Plazo de la obra
          </label>
          <input
            type="text"
            id="plazo"
            value={plazo}
            onChange={(e) => setPlazo(e.target.value)}
            placeholder="Plazo de la obra"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Presupuesto */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="presupuesto">
            Presupuesto de la obra
          </label>
          <input
            type="text"
            id="presupuesto"
            value={presupuesto}
            onChange={(e) => setPresupuesto(e.target.value)}
            placeholder="Presupuesto de la obra"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Coordinador */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="coordinador">
            Coordinador
          </label>
          <input
            type="text"
            id="coordinador"
            value={coordinador}
            onChange={(e) => setCoordinador(e.target.value)}
            placeholder="Coordinador"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Director de la obra */}
        <div className="mb-4">
          <label className="block font-semibold mb-2" htmlFor="director">
            Director de la obra
          </label>
          <input
            type="text"
            id="director"
            value={director}
            onChange={(e) => setDirector(e.target.value)}
            placeholder="Director de la obra"
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        {/* Logo Proyecto Actual */}
        <div className="mb-6">
          <label className="block  font-semibold mb-2" htmlFor="existingLogo">
            Logo Proyecto Actual
          </label>
          {existingLogoURL && (
            <div className="flex flex-col items-center bg-gray-100 p-4 rounded-md shadow-md mb-4">
              <img
                src={existingLogoURL}
                alt="Vista previa Logo Proyecto"
                className="mb-2"
                width="150"
              />
              <p className="text-sm ">Imagen Actual</p>
            </div>
          )}

          {/* Subir Nuevo Logo */}
          <label className="block  font-semibold mb-2" htmlFor="logo">
            Subir Nuevo Logo Proyecto:
          </label>
          <input
            type="file"
            id="logo"
            onChange={(e) => setLogo(e.target.files[0])}
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md"
          />
          {logo && (
            <div className="flex flex-col items-center bg-blue-50 p-4 rounded-md shadow-md mb-4">
              <img
                src={URL.createObjectURL(logo)}
                alt="Vista previa Logo Proyecto"
                className="mb-2"
                width="150"
              />
              <p className="text-sm ">Vista previa de la nueva imagen</p>
            </div>
          )}
        </div>

        {/* Logo Cliente Actual */}
        <div className="mb-6">
          <label className="block  font-semibold mb-2" htmlFor="existingClientLogo">
            Logo Cliente Actual
          </label>
          {existingClientLogoURL && (
            <div className="flex flex-col items-center bg-gray-100 p-4 rounded-md shadow-md mb-4">
              <img
                src={existingClientLogoURL}
                alt="Vista previa Logo Cliente"
                className="mb-2"
                width="150"
              />
              <p className="text-sm ">Imagen Actual</p>
            </div>
          )}

          {/* Subir Nuevo Logo Cliente */}
          <label className="block  font-semibold mb-2" htmlFor="clientLogo">
            Subir Nuevo Logo Cliente:
          </label>
          <input
            type="file"
            id="clientLogo"
            onChange={(e) => setClientLogo(e.target.files[0])}
            className="block w-full mb-4 px-4 py-2 border border-gray-300 rounded-md"
          />
          {clientLogo && (
            <div className="flex flex-col items-center bg-blue-50 p-4 rounded-md shadow-md mb-4">
              <img
                src={URL.createObjectURL(clientLogo)}
                alt="Vista previa Logo Cliente"
                className="mb-2"
                width="150"
              />
              <p className="text-sm ">Vista previa de la nueva imagen</p>
            </div>
          )}
        </div>

        {/* Botones de guardar y cancelar */}
        <div className="flex justify-end gap-4">
          <button
            onClick={onSave}
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-300"
          >
            Guardar
          </button>
          <button
            onClick={() => { setIsEditing(false); resetForm(); }} // Llamamos a resetForm en el click de cancelar
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditProjectForm;
