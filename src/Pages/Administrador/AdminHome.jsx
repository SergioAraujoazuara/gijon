import React, { useEffect, useState } from 'react'
import { db } from '../../../firebase_config';
import { GoHomeFill } from "react-icons/go";
import { collection, getDocs, deleteDoc, query, where, updateDoc, doc, onSnapshot } from 'firebase/firestore';
import { IoCreateOutline } from "react-icons/io5";
import { MdOutlineEditLocation } from "react-icons/md";
import { IoArrowBackCircle } from "react-icons/io5";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { FaArrowAltCircleRight } from "react-icons/fa";
import { FaRegUserCircle } from "react-icons/fa";
import { useAuth } from '../../context/authContext';
import { BsClipboardDataFill } from "react-icons/bs";
import { FaInfoCircle } from "react-icons/fa";
import { CiShare2 } from "react-icons/ci";
import { TfiWorld } from "react-icons/tfi";

/**
 * AdminHome Component
 * 
 * This component serves as the main administration panel for the application.
 * It dynamically renders sections and navigation options based on the user's role
 * (admin, user, or guest). The content includes project management, traceability,
 * forms, templates, and role assignments.
 * 
 * Key Features:
 * - Fetch user role dynamically from Firestore based on the authenticated user.
 * - Conditional rendering of content and navigation links based on user roles.
 * - Navigation to various administration pages via React Router.
 */

function AdminHome() {
    // Access the current authenticated user from context
    const { user } = useAuth();
    // State to store the user role (admin, user, or guest)
    const [userRole, setUserRole] = useState('');
    // Hook for programmatic navigation
    const navigate = useNavigate();
    const handleGoBack = () => {
        navigate('/'); // Esto navega hacia atrás en la historia
    };
    const idProyecto = localStorage.getItem('proyecto')
    /**
         * useEffect Hook
         * Fetch the user role from Firestore based on the authenticated user's UID.
         * It runs once when the user object is available or updated.
         */
    useEffect(() => {
        if (user) {
            const fetchUserData = async () => {
                try {
                    // Query Firestore for user document where uid matches the current user
                    const q = query(collection(db, "usuarios"), where("uid", "==", user.uid));
                    const querySnapshot = await getDocs(q);
                    if (!querySnapshot.empty) {
                        // Asumiendo que el uid es único y solo debería devolver un documento
                        const userData = querySnapshot.docs[0].data();
                        setUserRole(userData.role)
                        console.log(userData.role)
                    } else {
                        console.log("No se encontraron documentos con ese UID.");
                    }
                } catch (error) {
                    console.error("Error al obtener datos del usuario:", error);
                }
            };

            fetchUserData();
        }
    }, [user]);




    return (
        <div className='min-h-screen container mx-auto xl:px-14 py-2 text-gray-500 mb-10'>

            <div className='flex gap-2 items-center justify-between px-5 py-3 text-md'>

                <div className='flex gap-2 items-center'>
                    <GoHomeFill style={{ width: 15, height: 15, fill: '#d97706' }} />


                    <Link to={'#'}>
                        <h1 className='font-medium text-amber-600'>Administración</h1>
                    </Link>
                </div>


                <div className='flex items-center'>
                    <button className='text-amber-600 text-3xl' onClick={handleGoBack}><IoArrowBackCircle /></button>

                </div>

            </div>

            <div className='w-full border-b-2 border-gray-200'></div>


            <div>
                <div className='flex gap-3 flex-col items-start justify-center py-2'>




                    <div class="w-full rounded rounded-xl">


                        <div className='flex flex-col gap-16 items-start justify-start p-5 xl:px-10
     '>
                            {/* Guest Role - Restricted Access */}
                            {(userRole === 'invitado' && (

                                <div className=''>
                                    <p>No tienes permisos para administrador</p>
                                </div>


                            ))}
                            {/* Admin or User - Project Information */}
                            {(userRole === 'admin') && (
                                <Link className='w-full' to={`/project`}>
                                    <div className='flex flex-col justify-start items-center xl:flex-row gap-4  transition duration-300 ease-in-out hover:-translate-y-1  w-full'>
                                        <div className=' flex items-center text-gray-600'>
                                            <span ><FaInfoCircle className='xl:w-[80px] xl:h-[100px] w-[70px] h-[70px]' /></span>
                                        </div>
                                        <div className='sm:col-span-9 text-center  xl:text-start flex flex-col justify-center items-center xl:items-start sm:justify-center text-base font-medium ps-5'>
                                            <p className='flex items-center gap-2'>
                                                <span className='text-amber-500  transition duration-300 ease-in-out hover:translate-x-1 shadow-xl'><FaArrowAltCircleRight />
                                                </span>Gestión de proyectos
                                            </p>
                                            <p className='mt-4 font-normal text-sm xl:'>


                                                Crea, edita, elimina tus proyectos y su Información relevante.

                                            </p>

                                        </div>
                                    </div>

                                </Link>
                            )}
                            {/* Traceability Management */}
                            {(userRole === 'admin') && (
                                <Link className='w-full' to={`/trazabilidad/${idProyecto}`}>
                                    <div className='flex flex-col justify-center items-center xl:flex-row gap-4  transition duration-300 ease-in-out hover:-translate-y-1  w-full'>
                                        <div className=' flex items-center text-gray-600'>
                                            <span ><IoCreateOutline className='xl:w-[100px] xl:h-[100px] w-[70px] h-[70px]' /></span>
                                        </div>
                                        <div className='sm:col-span-9 text-center  xl:text-start flex flex-col justify-center items-center xl:items-start sm:justify-center text-base font-medium'>
                                            <p className='flex items-center gap-2'>
                                                <span className='text-amber-500  transition duration-300 ease-in-out hover:translate-x-1 shadow-xl'><FaArrowAltCircleRight />
                                                </span>Administrar proyecto
                                            </p>
                                            <p className='mt-4 font-normal text-sm xl:'>Creación y configuración del proyecto,
                                                agregar la trazabilidad completa del proyecto, establecer parámetros como el sector, sub sector, parte, elemento, lote y asignar PPI
                                                Puedes agregar los datos en 2 visualizaciones distintas:
                                                <br />
                                                - Versión web
                                                <br />
                                                - Versión BIM
                                            </p>

                                        </div>
                                    </div>

                                </Link>
                            )}

                            {/* Traceability Copy */}
                            {(userRole === 'admin') && (
                                <Link className='w-full' to={`/copiarTrazabilidad`}>
                                    <div className='flex flex-col justify-center items-center xl:flex-row gap-4  transition duration-300 ease-in-out hover:-translate-y-1  w-full'>
                                        <div className=' flex items-center text-gray-600'>
                                            <span ><CiShare2 className='xl:w-[100px] xl:h-[90px] w-[70px] h-[70px]' /></span>
                                        </div>
                                        <div className='sm:col-span-9 text-center  xl:text-start flex flex-col justify-center items-center xl:items-start sm:justify-center text-base font-medium'>
                                            <p className='flex items-center gap-2'>
                                                <span className='text-amber-500  transition duration-300 ease-in-out hover:translate-x-1 shadow-xl'><FaArrowAltCircleRight />
                                                </span>Copiar trazabilidad
                                            </p>
                                            <p className='mt-4 font-normal text-sm xl:'>Transferencia de informacion entre protectos recien dados de alta,
                                                agregar la trazabilidad completa del proyecto, establecer parámetros como el sector, sub sector, parte, elemento, lote y asignar PPI
                                               
                                            </p>

                                        </div>
                                    </div>

                                </Link>
                            )}

                            {/* Admin Role Only - Templates and Roles */}
                            {userRole === 'admin' && (
                                <Link className=' w-full' to={'/verPpis'}>
                                    <div className='flex flex-col xl:flex-row xl:text-start text-center gap-4 items-center transition duration-300 ease-in-out hover:-translate-y-1  w-full'>
                                        <div className='flex items-center justify-center text-gray-600'>
                                            <span ><MdOutlineEditLocation className='xl:w-[100px] xl:h-[100px] w-[70px] h-[70px]' /></span>
                                        </div>
                                        <div className='sm:col-span-9 xl:text-start text-center flex flex-col justify-center xl:items-start items-center sm:justify-center text-base font-medium'>
                                            <p className='flex items-center gap-2 '>  <span className='text-amber-500 text-md transition duration-300 ease-in-out hover:translate-x-1 shadow-xl'><FaArrowAltCircleRight /></span>Plantillas PPI</p>
                                            <p className='mt-4 font-normal text-sm xl:'>Creación y edición de plantillas de puntos de inspección (PPI).

                                            </p>

                                        </div>
                                    </div>

                                </Link>
                            )}
                            
                            {/* Roles Management */}
                            {
                                userRole === 'admin' && (
                                    <Link className=' w-full' to={'/roles'}>
                                        <div className='flex flex-col xl:flex-row gap-4 items-center transition duration-300 ease-in-out  hover:-translate-y-1'>
                                            <div className=' flex items-center text-gray-600'>
                                                <span ><FaRegUserCircle className='xl:w-[80px] xl:h-[100px] w-[70px] h-[70px]' /></span>
                                            </div>
                                            <div className='sm:col-span-9 flex flex-col justify-center xl:items-start items-center text-center xl:text-start sm:justify-center text-base font-medium ps-5'>
                                                <p className='flex items-center gap-2 '>  <span className='text-amber-500 text-md transition duration-300 ease-in-out hover:translate-x-1 shadow-xl'><FaArrowAltCircleRight /></span>Roles de usuarios</p>
                                                <p className='mt-4 font-normal text-sm xl:'>Asignar y editar roles a los usuarios registrados del proyecto:

                                                </p>

                                            </div>
                                        </div>

                                    </Link>
                                )
                            }

                            {/* Gestión de Dominios */}
                            {
                                userRole === 'admin' && (
                                    <Link className=' w-full' to={'/gestion-dominios'}>
                                        <div className='flex flex-col xl:flex-row gap-4 items-center transition duration-300 ease-in-out  hover:-translate-y-1'>
                                        <div className=' flex items-center text-gray-600'>
                                                <span ><TfiWorld  className='xl:w-[80px] xl:h-[100px] w-[70px] h-[70px]' /></span>
                                            </div>
                                            <div className='sm:col-span-9 flex flex-col justify-center xl:items-start items-center text-center xl:text-start sm:justify-center text-base font-medium ps-5'>
                                                <p className='flex items-center gap-2 '>  <span className='text-amber-500 text-md transition duration-300 ease-in-out hover:translate-x-1 shadow-xl'><FaArrowAltCircleRight /></span>Gestión de Dominios</p>
                                                <p className='mt-4 font-normal text-sm xl:'>Controlar qué dominios pueden registrarse en la aplicación:

                                                </p>

                                            </div>
                                        </div>

                                    </Link>
                                )
                            }








                        </div>


                    </div>

                </div>





            </div>

        </div>
    )
}

export default AdminHome