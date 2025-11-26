import React, { useState } from "react";
import VoiceRecorderInput from "./VoiceRecorderInput";

const FormularioConVoz = () => {
  const [formData, setFormData] = useState({
    observacionesActividad: "",
    observacionesLocalizacion: "",
  });

  const handleInputChange = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <form>
      <div>
        <label className="block text-sm font-medium">Observaciones de Actividad</label>
        <VoiceRecorderInput
          name="observacionesActividad"
          value={formData.observacionesActividad}
          onChange={handleInputChange}
          placeholder="Escribe tus observaciones de actividad"
        />
      </div>

      <div className="mt-4">
        <label className="block text-sm font-medium">Observaciones de Localización</label>
        <VoiceRecorderInput
          name="observacionesLocalizacion"
          value={formData.observacionesLocalizacion}
          onChange={handleInputChange}
          placeholder="Escribe tus observaciones de localización"
        />
      </div>
    </form>
  );
};

export default FormularioConVoz;
