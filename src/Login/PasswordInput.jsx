import React, { useState, useCallback } from 'react';
import { RiLockPasswordLine, RiEyeLine, RiEyeOffLine } from 'react-icons/ri';
import { MdRefresh } from 'react-icons/md';
import { validatePassword, generateSecurePassword } from '../utils/passwordValidation';
import PasswordStrengthIndicator from './PasswordStrengthIndicator';

const PasswordInput = ({ 
  name, 
  placeholder, 
  value, 
  onChange, 
  showStrengthIndicator = true,
  showGenerator = true,
  showExamples = true,
  className = "",
  error = null
}) => {
  const [showPassword, setShowPassword] = useState(false);
  
  // Validar contraseña en tiempo real
  const validation = validatePassword(value);
  
  // Manejar cambio de contraseña
  const handleChange = useCallback((e) => {
    onChange(e);
  }, [onChange]);
  
  // Generar contraseña segura
  const handleGeneratePassword = useCallback(() => {
    const newPassword = generateSecurePassword();
    const syntheticEvent = {
      target: {
        name: name,
        value: newPassword
      }
    };
    onChange(syntheticEvent);
  }, [name, onChange]);
  

  return (
    <div className="space-y-1">
      {/* Input de contraseña */}
      <div className="relative">
        <RiLockPasswordLine className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
        
        <input
          type={showPassword ? "text" : "password"}
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className={`w-full pl-12 pr-20 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500 ${
            error ? 'border-red-500' : validation.isValid ? 'border-green-500' : 'border-gray-300'
          } ${className}`}
        />
        
        {/* Botones de acción */}
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
          {/* Toggle de visibilidad */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            title={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? <RiEyeOffLine /> : <RiEyeLine />}
          </button>
          
          {/* Generador de contraseña */}
          {showGenerator && (
            <button
              type="button"
              onClick={handleGeneratePassword}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
              title="Generar contraseña segura"
            >
              <MdRefresh />
            </button>
          )}
        </div>
      </div>
      
      {/* Error message - Solo si no hay validación en tiempo real */}
      {error && !value && (
        <p className="text-red-500 text-xs flex items-center gap-1">
          <span>⚠️</span> {error}
        </p>
      )}
      
      {/* Indicador de fortaleza */}
      {showStrengthIndicator && value && (
        <PasswordStrengthIndicator validation={validation} />
      )}
      
    </div>
  );
};

export default PasswordInput;
