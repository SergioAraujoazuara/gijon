import React, { useState } from 'react';
import { 
  MdCheckCircle, 
  MdError, 
  MdLock, 
  MdLockOpen,
  MdSecurity,
  MdWarning
} from 'react-icons/md';

const PasswordStrengthIndicator = ({ validation, showDetails = false }) => {
  const { requirements, strength, score } = validation;
  
  // Estado para mostrar/ocultar detalles
  const [showDetailsPanel, setShowDetailsPanel] = useState(false);
  
  // Lógica progresiva: mostrar detalles solo cuando sea necesario
  const shouldShowDetails = showDetails || showDetailsPanel;
  
  // Configuración de colores según fortaleza
  const getStrengthColor = (strength) => {
    switch (strength) {
      case 'muy-débil': return 'bg-red-500';
      case 'débil': return 'bg-orange-500';
      case 'medio': return 'bg-yellow-500';
      case 'fuerte': return 'bg-blue-500';
      case 'muy-fuerte': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  const getStrengthText = (strength) => {
    switch (strength) {
      case 'muy-débil': return 'Muy débil';
      case 'débil': return 'Débil';
      case 'medio': return 'Medio';
      case 'fuerte': return 'Fuerte';
      case 'muy-fuerte': return 'Muy fuerte';
      default: return 'Sin evaluar';
    }
  };

  const getStrengthIcon = (strength) => {
    switch (strength) {
      case 'muy-débil': return <MdError className="text-red-500" />;
      case 'débil': return <MdWarning className="text-orange-500" />;
      case 'medio': return <MdLock className="text-yellow-500" />;
      case 'fuerte': return <MdSecurity className="text-blue-500" />;
      case 'muy-fuerte': return <MdLockOpen className="text-green-500" />;
      default: return <MdLock className="text-gray-400" />;
    }
  };

  // Calcular porcentaje de progreso
  const totalRequirements = Object.keys(requirements).length;
  const progressPercentage = (score / totalRequirements) * 100;

  return (
    <div className="p-4 space-y-1">
      {/* Barra de progreso de fortaleza - COMPACTA */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {getStrengthIcon(strength)}
          <span className="text-xs text-gray-600">{getStrengthText(strength)}</span>
        </div>
        <span className="text-xs text-gray-500">{score}/{totalRequirements}</span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-300 ${getStrengthColor(strength)}`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Botón para ver detalles - SOLO si hay errores */}
      {!validation.isValid && !shouldShowDetails && (
        <button
          type="button"
          onClick={() => setShowDetailsPanel(true)}
          className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          Ver requisitos
        </button>
      )}

      {/* Lista de requisitos - SOLO cuando se solicite Y haya errores */}
      {shouldShowDetails && !validation.isValid && (
        <div className="space-y-1">
          <div className="flex items-center justify-between mt-4">
            <h4 className="text-xs font-medium text-gray-600">Requisitos faltantes:</h4>
            <button
              type="button"
              onClick={() => setShowDetailsPanel(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(requirements)
              .filter(([key, requirement]) => !requirement.isValid)
              .map(([key, requirement]) => (
                <div 
                  key={key}
                  className="flex items-center gap-1 text-xs text-red-500"
                >
                  <MdError className="text-red-500 flex-shrink-0" size={12} />
                  <span>{requirement.message}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Mensaje de éxito cuando todos los requisitos están cumplidos */}
      {shouldShowDetails && validation.isValid && (
        <div className="space-y-1">
          <div className="flex items-center justify-between mt-4">
            <h4 className="text-xs font-medium text-green-600">¡Contraseña válida!</h4>
            <button
              type="button"
              onClick={() => setShowDetailsPanel(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-1 gap-1">
            {Object.entries(requirements).map(([key, requirement]) => (
              <div 
                key={key}
                className="flex items-center gap-1 text-xs text-green-600"
              >
                <MdCheckCircle className="text-green-500 flex-shrink-0" size={12} />
                <span>{requirement.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
