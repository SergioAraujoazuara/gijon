import React, { useState } from "react";
import Firma from "./Firma";
/**
 * Formulario Component
 * 
 * The `Formulario` component provides a form where users can digitally sign using the `Firma` component. 
 * Once the signature is captured, it can be saved, and the form can be submitted. The component includes:
 * 
 * - A signature area provided by the `Firma` component.
 * - A button to submit the form after the signature is captured.
 * 
 * The component uses the following states:
 * 
 * - `firma`: Stores the URL of the saved signature.
 * 
 * The component interacts with the following props from the `Firma` component:
 * 
 * - `onSave`: A callback function to handle saving the signature URL.
 * 
 * Upon submitting the form, the signature URL is logged in the console.
 */

const Formulario = () => {
  const [firma, setFirma] = useState(null);

  const handleSaveFirma = (firmaURL) => {
    setFirma(firmaURL);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Firma enviada:", firma);
  };

  return (
    <div className="p-4 ">
      <h2 className="text-lg font-semibold">Registro de Firma</h2>
      <Firma onSave={handleSaveFirma} />
      <button onClick={handleSubmit} className="mt-4 bg-green-500 text-white px-4 py-2 rounded">
        Enviar
      </button>
    </div>
  );
};

export default Formulario;
