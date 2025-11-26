import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../firebase_config';
import { useAuth } from '../context/authContext';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { MdOutlineEmail, MdDriveFileRenameOutline } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import Logo_solo from '../assets/logo_solo.png';
import AlertaRegister from '../Alertas/AlertaRegister';
import PasswordInput from './PasswordInput';
import { validatePassword } from '../utils/passwordValidation';


const Register = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [dominiosPermitidos, setDominiosPermitidos] = useState([]);
  const [emailError, setEmailError] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Cargar dominios permitidos al montar el componente
  useEffect(() => {
    cargarDominiosPermitidos();
  }, []);

  const cargarDominiosPermitidos = async () => {
    try {
      const dominiosRef = collection(db, 'dominiosPermitidos');
      const snapshot = await getDocs(dominiosRef);
      const dominiosData = snapshot.docs.map(doc => doc.data().dominio);
      setDominiosPermitidos(dominiosData);
    } catch (error) {
      console.error('Error al cargar dominios permitidos:', error);
    }
  };

  const validarEmail = (email) => {
    // Validación básica de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Formato de email inválido';
    }

    // Validar dominio permitido
    const dominio = email.split('@')[1]?.toLowerCase();
    if (!dominio) {
      return 'Email inválido';
    }

          if (dominiosPermitidos.length > 0 && !dominiosPermitidos.includes(dominio)) {
        return `🌐 El dominio ${dominio} no está permitido`;
      }

    return '';
  };

  const handleChange = ({ target: { name, value } }) => {
    setNewUser({ ...newUser, [name]: value });
    
    // Validar email en tiempo real
    if (name === 'email') {
      setEmailError('');
      if (value.trim()) {
        const error = validarEmail(value);
        setEmailError(error);
      }
    }
    
    // Validar contraseña en tiempo real
    if (name === 'password') {
      setPasswordError('');
      if (value.trim()) {
        const validation = validatePassword(value);
        if (!validation.isValid) {
          setPasswordError('La contraseña no cumple con los requisitos de seguridad');
        }
      }
    }
    
    // Validar confirmación de contraseña
    if (name === 'confirmPassword') {
      setConfirmPasswordError('');
      if (value.trim() && newUser.password !== value) {
        setConfirmPasswordError('Las contraseñas no coinciden');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');

    // Validar campos requeridos
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password || !newUser.confirmPassword) {
      setError('Todos los campos son requeridos.');
      setShowModal(true);
      return;
    }

    // Validar email
    const emailValidationError = validarEmail(newUser.email);
    if (emailValidationError) {
      setEmailError(emailValidationError);
      return;
    }

    // Validar contraseña con nuevos requisitos
    const passwordValidation = validatePassword(newUser.password);
    if (!passwordValidation.isValid) {
      setPasswordError('La contraseña no cumple con los requisitos de seguridad');
      setError('La contraseña debe cumplir con todos los requisitos de seguridad.');
      setShowModal(true);
      return;
    }

    // Validar que las contraseñas coincidan
    if (newUser.password !== newUser.confirmPassword) {
      setConfirmPasswordError('Las contraseñas no coinciden');
      setError('Las contraseñas no coinciden.');
      setShowModal(true);
      return;
    }

    setIsValidating(true);

    try {
      const authResult = await signup(newUser.email, newUser.password);
      const userId = authResult.user.uid;

      const userData = {
        uid: userId,
        nombre: newUser.name,
        email: newUser.email,
        proyectos: [],
        role: 'invitado',
      };

      await setDoc(doc(db, 'usuarios', userId), userData);

      navigate('/'); // Navegar a la página de inicio después del registro
    } catch (error) {
      let errorMessage = 'Error al registrar la cuenta';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Este email ya está registrado.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña es demasiado débil.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'El formato del email es inválido.';
      }
      setError(errorMessage);
      setShowModal(true);
    } finally {
      setIsValidating(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };



  return (
    <div className="flex h-screen bg-gray-200">
      <div className="w-full max-w-4xl mx-auto flex rounded-lg overflow-hidden pb-10">

        <div className="xl:w-1/2 w-full flex p-10 flex-col justify-center bg-gray-100">
          <div className="text-center mb-5">

            <h1 className="text-3xl font-semibold text-gray-500 my-4">Registro</h1>
          </div>
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto p-5 overflow-y-auto">
            <div className="flex flex-col mb-4 ">
              <div className="relative">
                <MdDriveFileRenameOutline className="absolute left-0 top-0 m-3" />
                <input
                  type="text"
                  name="name"
                  placeholder="Tu nombre"
                  className="w-full px-12 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500"
                  value={newUser.name}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex flex-col mb-6">
              <div className="relative">
                <MdOutlineEmail className="absolute left-0 top-0 m-3" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className={`w-full px-12 py-2 border rounded-lg text-gray-700 focus:outline-none ${
                    emailError ? 'border-red-500' : 'focus:border-teal-500'
                  }`}
                  value={newUser.email}
                  onChange={handleChange}
                />
                {emailError && (
                  <p className="text-red-500 text-xs">
                    <span className='text-gray-400'>🌐</span> {emailError}
                  </p>
                )}
              </div>
            </div>
            <div className="flex flex-col mb-3">
              <PasswordInput
                name="password"
                placeholder="Contraseña"
                value={newUser.password}
                onChange={handleChange}
                showStrengthIndicator={true}
                showGenerator={true}
                showExamples={false}
                error={passwordError}
              />
            </div>
            <div className="flex flex-col mb-6">
              <PasswordInput
                name="confirmPassword"
                placeholder="Confirmar Contraseña"
                value={newUser.confirmPassword}
                onChange={handleChange}
                showStrengthIndicator={false}
                showGenerator={false}
                showExamples={false}
                error={confirmPasswordError}
              />
            </div>

            <div className="flex justify-center">
              <button 
                type="submit" 
                disabled={isValidating || !!emailError || !!passwordError || !!confirmPasswordError}
                className={`w-full py-2 rounded-lg focus:outline-none ${
                  isValidating || emailError || passwordError || confirmPasswordError
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                {isValidating ? 'Registrando...' : 'Register'}
              </button>
            </div>
          </form>
          {showModal && <AlertaRegister message={error} closeModal={closeModal} />}
        </div>

        <div className="xl:w-1/2 bg-sky-600 text-white flex flex-col justify-center px-10 pb-10 xl:flex hidden">
          
          <div className='flex justify-center'>
          <img src={Logo_solo} width={150} alt="logo" className="mb-5" />
          </div>
          
          <h2 className="text-5xl font-bold text-center">Tpf ingeniería</h2>
          
         
          <p className="mb-4 text-center text-xl my-6">Building the world, better</p>
          <div className='flex justify-center mt-2'>
          {/* <button onClick={() => navigate('/signin')} className="flex items-center gap-3 text-sky-600 font-semibold bg-white py-2 px-4 rounded-full shadow-md">
            <span className='text-amber-500'><FaArrowAltCircleRight /></span>
            Área inspección
          </button> */}
          </div>
          
        </div>

      </div>
    </div>
  );
}

export default Register;
