import React, { useState } from "react";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition";
import { FaMicrophoneLines } from "react-icons/fa6";
import { FaStopCircle } from "react-icons/fa";

const VoiceRecorderInput = ({ name, value, onChange, placeholder, maxLength, disabled }) => {
  const [isRecording, setIsRecording] = useState(false); // Estado para manejar el mensaje "Grabando..."
  const { transcript, resetTranscript, listening, browserSupportsSpeechRecognition } = useSpeechRecognition();

  const handleStartListening = () => {
    resetTranscript(); // Reseteamos la transcripción antes de empezar a escuchar
    SpeechRecognition.startListening({ continuous: false, language: "es-ES" });
    setIsRecording(true); // Cambiar el estado a "grabando"
  };

  const handleStopListening = () => {
    SpeechRecognition.stopListening();
    setIsRecording(false); // Cambiar el estado a "detenido"
    onChange(name, capitalizeFirstLetter(transcript)); // Pasamos la transcripción con la primera letra en mayúscula
  };

  const capitalizeFirstLetter = (text) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1); // Capitaliza la primera letra
  };

  if (!browserSupportsSpeechRecognition) {
    return <p>Tu navegador no soporta reconocimiento de voz.</p>;
  }

  return (
    <div className="relative">
      {/* Muestra el mensaje de "Grabando..." si el estado es true */}
      <textarea
        name={name}
        value={value}
        onChange={(e) => onChange(name, e.target.value)} // Actualizamos el estado cuando el usuario edita el texto manualmente
        placeholder={isRecording ? "Grabando..." : placeholder} // Cambiar el placeholder mientras se graba
        className={`mt-2 block w-full px-4 py-2 border border-gray-300 rounded-lg shadow-sm pr-14 ${disabled ? "bg-gray-200 cursor-not-allowed" : ""}`} // Asegúrate de dejar espacio para los botones a la derecha
        maxLength={maxLength} // Pasar maxLength al textarea
        disabled={disabled} // Se desactiva si está en modo "No Aplica"
      />

      {/* Contenedor para los botones dentro del textarea */}
      <div className="absolute top-2 right-2 flex gap-3">
        {!isRecording && (
          <button
            type="button"
            onClick={handleStartListening}
            className="px-2 py-2 bg-gray-200 border-2 rounded-md transition-colors duration-200 text-gray-600 border-gray-400"
            disabled={disabled}
          >
            <FaMicrophoneLines className="text-xs"/>
          </button>
        )}

        {isRecording && (
          <button
            type="button"
            onClick={handleStopListening}
            className="px-2 py-2 border-2 rounded-md transition-colors duration-200 bg-red-500 text-white border-red-600 active:bg-red-700"
            disabled={disabled}
          >
            <FaStopCircle className="text-xs"/>
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorderInput;
