import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { MdOutlineEmail, MdPersonOutline } from "react-icons/md";
import { RiLockPasswordLine } from "react-icons/ri";
import Logo_solo from '../assets/logo_solo.png';
import AlertLogin from './AlertLogin'; // Asume que este componente ya está creado
import { FaArrowAltCircleRight } from "react-icons/fa";
import RecoverPassword from './RecoverPassword';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showRecoverPassword, setShowRecoverPassword] = useState(false); 

  const handleChange = ({ target: { name, value } }) => {
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login(credentials.email, credentials.password);
      navigate('/');
    } catch (error) {
      let errorMessage = 'Email o contraseña incorrectos';
      // Aquí agregar más manejo de errores basado en error.code
      setError(errorMessage);
      setShowModal(true);
    }
  };

  const closeModal = () => {
    setShowModal(false);
  };

  const handleRecoverPassword = () => {
    setShowRecoverPassword(true);
  };

  return (
    <div className="flex h-screen bg-gray-200">
      <div className="w-full max-w-4xl mx-auto flex rounded-lg overflow-hidden pb-10">

        <div className="xl:w-1/2  bg-sky-600 text-white flex flex-col justify-center px-10 pb-10 xl:flex hidden">
          
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

        <div className="xl:w-1/2 w-full flex p-10 flex-col justify-center bg-gray-100">
          <div className="text-center mb-5">

            <h1 className="text-3xl font-semibold text-gray-500 my-4">Login</h1>
          </div>
          <form onSubmit={handleSubmit} className="max-w-xl mx-auto">
            <div className="flex flex-col mb-4">
              <div className="relative">
                <MdOutlineEmail className="absolute left-0 top-0 m-3" />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  className="w-full px-12 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500"
                  value={credentials.email}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex flex-col mb-6">
              <div className="relative">
                <RiLockPasswordLine className="absolute left-0 top-0 m-3" />
                <input
                  type="password"
                  name="password"
                  placeholder="Password"
                  className="w-full px-12 py-2 border rounded-lg text-gray-700 focus:outline-none focus:border-teal-500"
                  value={credentials.password}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex justify-center">
              <button type="submit" className="bg-amber-600 text-white w-full py-2 rounded-lg hover:bg-amber-700 focus:outline-none">
                Entrar
              </button>
            </div>

            {/* Enlace para mostrar el formulario de recuperación de contraseña */}
            <div className="flex justify-center mt-4">
              <button
                type="button"
                onClick={handleRecoverPassword}
                className="text-amber-700 hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          </form>
          {/* Mostrar componente de recuperación de contraseña solo cuando se hace clic */}
          {showRecoverPassword && <RecoverPassword />}
          {showModal && <AlertLogin message={error} closeModal={closeModal} />}
          
        </div>

      </div>
    </div>
  );
}

export default Login;
