import React from 'react';
/**
 * `AddProjectForm` Component
 * 
 * The `AddProjectForm` component provides a user interface to add a new construction project. It allows users to enter 
 * various details about the project, including information about the company, work, contractor, promoter, contract number, 
 * project timeline, budget, and the main coordinator. The form also allows the user to upload logos for both the company and 
 * the client, and preview them before submitting.
 * 
 * **Features:**
 * - Form fields for project details: Company, Work, Description, Promoter, Contract Number, Project Timeline, Budget, 
 *   Safety Coordinator, and Director.
 * - File input for uploading company and client logos with preview functionality.
 * - Input validation and user-friendly placeholders.
 * - Actions for saving the project (`onSave`) and closing the form (`onClose`).
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
 * - `logo`: Stores the selected company logo file.
 * - `clientLogo`: Stores the selected client logo file.
 * 
 * **Methods:**
 * - `onSave`: Triggered when the user submits the form to save the project.
 * - `onClose`: Triggered when the user cancels the form or closes the modal.
 * 
 * **Example:**
 * ```javascript
 * // AddProjectForm component usage example:
 * <AddProjectForm 
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
 *    onSave={handleSave} 
 *    onClose={handleClose} 
 * />
 * ```
 */

const AddProjectForm = ({
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
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex justify-center items-center bg-black bg-opacity-50 text-gray-500">
      <div className="bg-white p-8 rounded-lg w-full max-w-lg overflow-y-auto max-h-[80vh]"> {/* Add scroll and max-height */}
        <h2 className="text-lg font-bold mb-4">Agregar Proyecto</h2>
        <div className="border-b-2 mb-6"></div>

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
            placeholder="Coordinador de seguridad y salud"
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
        {/* Logo Proyecto */}
        <div className="mb-6">
          <label className="block font-semibold mb-2" htmlFor="logo">
            Logo de empresa:
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
              <p className="text-sm">Vista previa de la nueva imagen</p>
            </div>
          )}
        </div>

        {/* Logo Cliente */}
        <div className="mb-6">
          <label className="block font-semibold mb-2" htmlFor="clientLogo">
            Logo cliente:
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
              <p className="text-sm">Vista previa de la nueva imagen</p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <button
            onClick={onSave}
            className="bg-amber-600 text-white px-4 py-2 rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-300"
          >
            Agregar
          </button>
          <button
            onClick={onClose} // close modal action
            className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProjectForm;
