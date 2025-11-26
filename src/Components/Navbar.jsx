import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { getDoc, doc } from 'firebase/firestore';
import Imagen from '../assets/tpf_marca.png'; // Asegúrate de que la ruta de la imagen está correcta
import { db } from '../../firebase_config';
import { HiFolderOpen } from "react-icons/hi2";

import { FaUserAlt, FaDoorOpen, FaBars, FaCaretDown } from "react-icons/fa";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const proyecto = 'i8l2VQeDIIB7fs3kUQxA';
  const [showLogoutConfirmation, setShowLogoutConfirmation] = useState(false);
  const [userNombre, setUserNombre] = useState('');
  const [userRol, setUserRol] = useState('');
  const [menuOpen, setMenuOpen] = useState(false); // Menú móvil
  const [dropdownOpen, setDropdownOpen] = useState(false); // Parte de obra
  const [dropdownInspectionOpen, setDropdownInspectionOpen] = useState(false); // Inspección
  const [dropdownAuscultationOpen, setDropdownAuscultationOpen] = useState(false); // Auscultación


  // Referencias para detectar clics fuera de los menús
  const dropdownRef = useRef(null);
  const inspectionRef = useRef(null);
  const auscultationRef = useRef(null);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'usuarios', user.uid);
      getDoc(userDocRef).then(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setUserNombre(userData.nombre);
          setUserRol(userData.role);
        }
      });
    } else {
      setUserNombre('');
      setUserRol('');
    }
  }, [user]);

  const handleLogout = async () => {
    // Limpiar variables de proyecto del localStorage
    localStorage.removeItem('selectedProjectId');
    localStorage.removeItem('selectedProjectName');
    localStorage.removeItem('obra');
    localStorage.removeItem('tramo');
    await logout();
    navigate('/authTabs');
    setShowLogoutConfirmation(false);
  };

  const toggleLogoutConfirmation = () => {
    setShowLogoutConfirmation(!showLogoutConfirmation);
    setMenuOpen(false)
  };

  const closeAllDropdowns = () => {
    setDropdownOpen(false);
    setDropdownInspectionOpen(false);
    setDropdownAuscultationOpen(false);
  };

  const handleDropdownClick = (dropdownSetter, currentState) => {
    dropdownSetter(!currentState);
  };



  const handleLinkClick = () => {
    closeAllDropdowns();
    setMenuOpen(false) // Cierra todos los menús al hacer clic en cualquier enlace
  };






  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    closeAllDropdowns();
  };

  return (
    <nav className="bg-gray-100 shadow">
      <div className="container mx-auto ps-0 pr-4 xl:px-10">
        <div className="flex justify-between items-center h-24">
          {/* Logo */}
          <div className="flex items-center gap-10">
            <div className="flex-shrink-0 flex items-center">
              <img className="h-auto" src={Imagen} width={150} alt="logo" />
            </div>



            {menuOpen && (
              <div className="xl:hidden bg-white shadow-md absolute top-24 left-0 w-full z-50">
                <div className="flex flex-col space-y-4 p-4">

                  <NavLink to="/" linkName="Home" onClick={handleLinkClick} />

                  
                  {/* {(userRol === 'usuario' || userRol === 'admin') && (
                    <div>
                      <button
                        onClick={() => handleDropdownClick(setDropdownInspectionOpen, dropdownInspectionOpen)}
                        className="font-medium flex justify-between items-center w-full text-left px-6 py-2 text-gray-600 hover:bg-gray-100"
                      >
                        Inspección <FaCaretDown />
                      </button>
                      {dropdownInspectionOpen && (
                        <div className="pl-6">
                          <Link
                            to={`/elemento/${proyecto}`}
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            Iniciar Inspección
                          </Link>
                          <Link
                            to="/dashboard"
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            Dashboard
                          </Link>
                          <Link
                            to="/visor_inspeccion"
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            BIM
                          </Link>
                        </div>
                      )}
                    </div>
                  )} */}
 
                  {(userRol === 'usuario' || userRol === 'admin') && (
                    <div>
                      <button
                        onClick={() => handleDropdownClick(setDropdownOpen, dropdownOpen)}
                        className="font-medium flex justify-between items-center w-full text-left px-6 py-2 text-gray-600 hover:bg-gray-100"
                      >
                         Parte de obra<FaCaretDown />
                      </button>
                      {dropdownOpen && (
                        <div className="pl-6">
                          <Link
                            to="/formularios"
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            Formulario
                          </Link>
                          <Link
                            to="/verRegistros"
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            Informes
                          </Link>
                        </div>
                      )}
                    </div>
                  )}

                  {/* {(userRol === 'usuario' || userRol === 'admin') && (
                    <div>
                      <button
                        onClick={() => handleDropdownClick(setDropdownAuscultationOpen, dropdownAuscultationOpen)}
                        className="flex justify-between items-center w-full text-left px-4 py-2 text-gray-600 hover:bg-gray-100"
                      >
                        Auscultación <FaCaretDown />
                      </button>
                      {dropdownAuscultationOpen && (
                        <div className="pl-6">
                          <Link
                            to="/auscultacion/llacuna"
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            Llacuna
                          </Link>
                          <Link
                            to="/auscultacion/glorias"
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            Glorias
                          </Link>
                          <Link
                            to="/auscultacion/horta"
                            className="block px-4 py-2 text-gray-600 hover:bg-gray-100"
                            onClick={handleLinkClick}
                          >
                            Horta
                          </Link>
                        </div>
                      )}
                    </div>
                  )} */}

                  {/* Administración */}
                  {(userRol === 'admin') && (
                    <NavLink to="/admin" linkName="Administración" onClick={handleLinkClick} />
                  )}


                  {user && (
                    <div className='px-6 font-medium text-amber-600'>
                      <p className=''>Usuario: {userNombre}</p>
                      <button
                        onClick={toggleLogoutConfirmation}
                        className="bg-sky-600 text-white px-4 py-2 rounded-md text-left mt-5"
                      >
                        Salir
                      </button>
                    </div>

                  )}
                </div>
              </div>
            )}


            {/* Menú principal */}
            {user && (
              <div className="hidden xl:ml-6 xl:flex xl:space-x-8 items-center">
                <NavLink to="/" linkName="Home" onClick={handleLinkClick} />

                {/* Inspección */}
                
                {/* {(userRol === 'usuario' || userRol === 'admin') && (
                  <div className="relative" ref={inspectionRef}>
                    <button
                      onClick={() => {
                        closeAllDropdowns(); // Cierra los otros dropdowns
                        setDropdownInspectionOpen(!dropdownInspectionOpen); // Alterna el estado del actual
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-md font-medium text-gray-500 hover:text-sky-600"
                    >
                      Inspección <FaCaretDown />
                    </button>
                    {dropdownInspectionOpen && (
                      <div className="absolute bg-white shadow-lg rounded-md mt-2 py-2 w-48 z-50">
                        <Link
                          to={`/elemento/${proyecto}`}
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Iniciar Inspección
                        </Link>
                        <Link
                          to="/dashboard"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Dashboard
                        </Link>
                        <Link
                          to="/visor_inspeccion"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          BIM
                        </Link>
                      </div>
                    )}
                  </div>
                )} */}

                {/* Parte de obra */}
                {(userRol === 'usuario' || userRol === 'admin') && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => {
                        closeAllDropdowns(); // Cierra los otros dropdowns
                        setDropdownOpen(!dropdownOpen); // Alterna el estado del actual
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-md font-medium text-gray-500 hover:text-sky-600"
                    >
                      Parte de obra <FaCaretDown />
                    </button>
                    {dropdownOpen && (
                      <div className="absolute bg-white shadow-lg rounded-md mt-2 py-2 w-48 z-50">
                        <Link
                          to="/formularios"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Formularios
                        </Link>
                        <Link
                          to="/verRegistros"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Informes de visita 
                        </Link>
                        {/* <Link
                          to="/verRegistrosActasReunion"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Actas de reunión
                        </Link> */}
                      </div>
                    )}
                  </div>
                )}

                {/* Auscultación */}
                {/* {(userRol === 'usuario' || userRol === 'admin') && (
                  <div className="relative" ref={auscultationRef}>
                    <button
                      onClick={() => {
                        closeAllDropdowns(); // Cierra los otros dropdowns
                        setDropdownAuscultationOpen(!dropdownAuscultationOpen); // Alterna el estado del actual
                      }}
                      className="flex items-center gap-1 px-3 py-2 rounded-md text-md font-medium text-gray-500 hover:text-sky-600"
                    >
                      Auscultación <FaCaretDown />
                    </button>
                    {dropdownAuscultationOpen && (
                      <div className="absolute bg-white shadow-lg rounded-md mt-2 py-2 w-48 z-50">
                        <Link
                          to="/auscultacion/llacuna"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Llacuna
                        </Link>
                        <Link
                          to="/auscultacion/glorias"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Glorias
                        </Link>
                        <Link
                          to="/auscultacion/horta"
                          className="block px-4 py-2 text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                          onClick={handleLinkClick}
                        >
                          Horta
                        </Link>
                      </div>
                    )}
                  </div>
                )} */}

                {/* Administración */}
                {(userRol === 'admin') && (
                  <NavLink to="/admin" linkName="Administración" onClick={handleLinkClick} />
                )}
              </div>
            )}

          </div>

          <div className='flex items-center gap-8'>
            

            {/* Botón de usuario */}
            <div className="flex items-center">
              {user ? (
                <>
                  <div className="hidden xl:flex items-center font-medium text-gray-500 pr-5 gap-5 text-base">
                    <div className="flex gap-2 items-center text-gray-500">
                      <FaUserAlt className="hidden xl:block" />
                      <p className="hidden xl:block">{userNombre || 'Usuario'}</p>
                    </div>
                    <div className="relative bg-sky-600 text-white px-4 py-2 rounded-lg">
                      <button className="flex items-center text-md" onClick={toggleLogoutConfirmation}>
                        Salir
                      </button>
                    </div>
                  </div>
                  <div className="xl:hidden">
                    <button onClick={toggleMenu} className="text-gray-500 focus:outline-none">
                      <FaBars className="text-2xl" />
                    </button>
                  </div>
                </>
              ) : (
                <button
                  onClick={() => navigate('/authTabs')}
                  className="bg-sky-600 text-white font-medium py-2 px-4 h-12 rounded-lg"
                >
                  Iniciar sesión | Registrarse
                </button>
              )}
            </div>
          </div>

        </div>

        {/* Modal de confirmación de logout */}
        {showLogoutConfirmation && (
          <div className="fixed inset-0 bg-black bg-opacity-80 z-10 flex justify-center items-center">
            <div className="bg-white p-10 rounded-md flex flex-col gap-2 items-center">
              <p className="text-gray-500 text-7xl"><FaDoorOpen /></p>
              <p className="text-gray-500 font-bold">¿Estás seguro que quieres cerrar sesión?</p>
              <div className="flex justify-around gap-5 mt-4 p-1">
                <button onClick={handleLogout} className="bg-amber-600 text-white font-medium px-4 py-2 rounded-lg">Confirmar</button>
                <button onClick={() => setShowLogoutConfirmation(false)} className="bg-gray-300 text-black px-10 py-2 rounded-lg">Cancelar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

const NavLink = ({ to, linkName, onClick }) => (
  <Link to={to} onClick={onClick} className="xl:px-4 px-6 py-2 font-medium rounded-md text-gray-500 hover:text-sky-600">
    {linkName}
  </Link>
);

export default Navbar;
