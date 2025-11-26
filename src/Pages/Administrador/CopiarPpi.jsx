import React, { useEffect, useState } from 'react';
import { db } from '../../../firebase_config';
import { getDocs, collection, doc, setDoc } from 'firebase/firestore';
/**
 * `CopiarPpi` Component
 * 
 * The `CopiarPpi` component is responsible for allowing users to copy an existing PPI (Point of Inspection) from Firestore, 
 * assigning it a new name and storing it back to the Firestore database. This feature enables easy duplication of existing 
 * inspection templates for reuse or modification.
 * 
 * **Features:**
 * - Retrieves the list of existing PPIs from Firestore.
 * - Allows the user to select an existing PPI to copy.
 * - Takes a new name for the copied PPI.
 * - Copies the selected PPI's data and saves it as a new document in Firestore with the new name.
 * - Provides feedback messages for success or error during the copy operation.
 * 
 * **State Variables:**
 * - `ppis`: Stores the list of PPIs fetched from Firestore.
 * - `selectedPpi`: Stores the ID of the selected PPI to be copied.
 * - `newPpiName`: Stores the new name for the copied PPI.
 * - `errorMessage`: Stores any error message encountered during the process.
 * - `successMessage`: Stores a success message once the PPI is copied.
 * 
 * **Methods:**
 * - `cargarPpis`: Fetches the list of PPIs from Firestore and updates the state.
 * - `copiarPpi`: Copies the selected PPI data to Firestore with a new name.
 * 
 * **Return Values:**
 * - Renders a form that includes a dropdown to select a PPI to copy, an input field for the new name, 
 *   and a button to trigger the copy action.
 * 
 * **Example:**
 * ```javascript
 * // CopiarPpi component will be rendered in a parent component:
 * <CopiarPpi />
 * ```
 */

function CopiarPpi() {
    const [ppis, setPpis] = useState([]);
    const [selectedPpi, setSelectedPpi] = useState("");
    const [newPpiName, setNewPpiName] = useState("");
    const [errorMessage, setErrorMessage] = useState("");
    const [successMessage, setSuccessMessage] = useState("");

    // Load PPIs from Firestore
    const cargarPpis = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "ppis"));
            const ppisList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            setPpis(ppisList);
        } catch (error) {
            console.error("Error al cargar los PPIs:", error);
            setErrorMessage("Hubo un error al cargar los PPIs");
        }
    };

    useEffect(() => {
        cargarPpis();
    }, []);

    // Function to copy a PPI with a new name
    const copiarPpi = async () => {
        if (!selectedPpi || !newPpiName.trim()) {
            setErrorMessage("Por favor, selecciona un PPI y proporciona un nombre para la copia.");
            return;
        }
    
        try {
            // Obtener el PPI original
            const ppiToCopy = ppis.find(ppi => ppi.id === selectedPpi);
    
            if (!ppiToCopy) {
                setErrorMessage("PPI no encontrado.");
                return;
            }
    
            // Eliminar el campo 'id' del objeto copiado
            const { id, ...resto } = ppiToCopy;
    
            // Crear nuevo PPI con el nuevo nombre
            const newPpiData = { ...resto, nombre: newPpiName };
    
            // Generar nuevo documento en Firestore
            const newDocRef = doc(collection(db, "ppis"));
            await setDoc(newDocRef, newPpiData);
    
            setSuccessMessage("El PPI ha sido copiado exitosamente.");
            setNewPpiName("");
            setSelectedPpi("");
        } catch (error) {
            console.error("Error al copiar el PPI:", error);
            setErrorMessage("Hubo un problema al intentar copiar el PPI.");
        }
    };
    

    return (
        <div className='container mx-auto min-h-screen px-6 py-2 text-gray-500 mt-5'>
            <div className='flex flex-col gap-4'>
      

                {/* Error Message */}
                {errorMessage && (
                    <div className="bg-red-100 text-red-700 p-3 rounded-lg">{errorMessage}</div>
                )}

                {/* Success Message */}
                {successMessage && (
                    <div className="bg-green-100 text-green-700 p-3 rounded-lg">{successMessage}</div>
                )}

                {/* PPI Selection */}
                <div>
                    <label htmlFor="ppiSelect" className="block text-sm font-medium text-gray-700">
                        Selecciona un PPI a copiar
                    </label>
                    <select
                        id="ppiSelect"
                        value={selectedPpi}
                        onChange={(e) => setSelectedPpi(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                    >
                        <option value="">Selecciona un PPI</option>
                        {ppis.map((ppi) => (
                            <option key={ppi.id} value={ppi.id}>
                                {ppi.nombre} (V-{ppi.version})
                            </option>
                        ))}
                    </select>
                </div>

                {/* New Name Input */}
                <div className="mt-4">
                    <label htmlFor="newPpiName" className="block text-sm font-medium text-gray-700">
                        Nuevo nombre para la copia
                    </label>
                    <input
                        type="text"
                        id="newPpiName"
                        value={newPpiName}
                        onChange={(e) => setNewPpiName(e.target.value)}
                        className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
                        placeholder="Introduce un nuevo nombre para el PPI"
                    />
                </div>

                {/* Copy Button */}
                <div className="mt-4">
                    <button
                        onClick={copiarPpi}
                        className="bg-sky-600 text-white px-4 py-2 rounded-lg hover:bg-sky-700"
                    >
                        Copiar PPI
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CopiarPpi;
