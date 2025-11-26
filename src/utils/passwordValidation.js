// Configuración de requisitos de contraseña
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL_CHARS: true,
  SPECIAL_CHARS_REGEX: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/
};

// Función para validar contraseña
export const validatePassword = (password) => {
  const requirements = {
    length: {
      isValid: password.length >= PASSWORD_CONFIG.MIN_LENGTH,
      message: `Mínimo ${PASSWORD_CONFIG.MIN_LENGTH} caracteres`,
      current: password.length
    },
    uppercase: {
      isValid: PASSWORD_CONFIG.REQUIRE_UPPERCASE ? /[A-Z]/.test(password) : true,
      message: 'Al menos una mayúscula',
      current: (password.match(/[A-Z]/g) || []).length
    },
    lowercase: {
      isValid: PASSWORD_CONFIG.REQUIRE_LOWERCASE ? /[a-z]/.test(password) : true,
      message: 'Al menos una minúscula',
      current: (password.match(/[a-z]/g) || []).length
    },
    numbers: {
      isValid: PASSWORD_CONFIG.REQUIRE_NUMBERS ? /\d/.test(password) : true,
      message: 'Al menos un número',
      current: (password.match(/\d/g) || []).length
    },
    specialChars: {
      isValid: PASSWORD_CONFIG.REQUIRE_SPECIAL_CHARS ? PASSWORD_CONFIG.SPECIAL_CHARS_REGEX.test(password) : true,
      message: 'Al menos un carácter especial',
      current: (password.match(PASSWORD_CONFIG.SPECIAL_CHARS_REGEX) || []).length
    }
  };

  const isValid = Object.values(requirements).every(req => req.isValid);
  
  // Calcular fortaleza de la contraseña
  const strength = calculatePasswordStrength(password, requirements);
  
  return {
    isValid,
    requirements,
    strength,
    score: getPasswordScore(requirements)
  };
};

// Calcular fortaleza de la contraseña
const calculatePasswordStrength = (password, requirements) => {
  const validRequirements = Object.values(requirements).filter(req => req.isValid).length;
  const totalRequirements = Object.keys(requirements).length;
  const percentage = (validRequirements / totalRequirements) * 100;
  
  if (percentage < 40) return 'muy-débil';
  if (percentage < 60) return 'débil';
  if (percentage < 80) return 'medio';
  if (percentage < 100) return 'fuerte';
  return 'muy-fuerte';
};

// Obtener puntuación numérica
const getPasswordScore = (requirements) => {
  return Object.values(requirements).filter(req => req.isValid).length;
};

// Generar contraseña segura
export const generateSecurePassword = () => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let password = '';
  
  // Asegurar al menos un carácter de cada tipo
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += specialChars[Math.floor(Math.random() * specialChars.length)];
  
  // Completar hasta 12 caracteres
  const allChars = uppercase + lowercase + numbers + specialChars;
  for (let i = 4; i < PASSWORD_CONFIG.MIN_LENGTH; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Mezclar la contraseña
  return password.split('').sort(() => Math.random() - 0.5).join('');
};

// Ejemplos de contraseñas válidas
export const getPasswordExamples = () => [
  'MiContraseña123!',
  'Seguro2024@#',
  'TpfIngenieria$9',
  'BuildingWorld2024!'
];
