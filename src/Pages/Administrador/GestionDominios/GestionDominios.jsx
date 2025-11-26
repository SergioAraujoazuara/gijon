import React, { useState, useEffect } from 'react';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../../../firebase_config';
import { useAuth } from '../../../context/authContext';
import { GoHomeFill } from "react-icons/go";
import { IoArrowBackCircle } from "react-icons/io5";
import { Link, useNavigate } from 'react-router-dom';
import { FaArrowRight } from "react-icons/fa";
import { FaTrashAlt } from "react-icons/fa";
import { FaPlus } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import { FaSave } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";
import { FaHistory } from "react-icons/fa";

const GestionDominios = () => {
  const [dominios, setDominios] = useState([]);
  const [nuevoDominio, setNuevoDominio] = useState('');
  const [loading, setLoading] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editandoDominio, setEditandoDominio] = useState('');
  const [mostrarHistorial, setMostrarHistorial] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  // Cargar dominios existentes
  useEffect(() => {
    cargarDominios();
  }, []);

  const cargarDominios = async () => {
    try {
      const dominiosRef = collection(db, 'dominiosPermitidos');
      const snapshot = await getDocs(dominiosRef);
      const dominiosData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setDominios(dominiosData);
    } catch (error) {
      console.error('Error al cargar dominios:', error);
    }
  };

  const agregarDominio = async (e) => {
    e.preventDefault();
    if (!nuevoDominio.trim()) return;

    setLoading(true);
    try {
      const dominioData = {
        dominio: nuevoDominio.trim().toLowerCase(),
        fechaCreacion: new Date(),
        activo: true,
        usuarioCreacion: user.email
      };

      await addDoc(collection(db, 'dominiosPermitidos'), dominioData);
      setNuevoDominio('');
      await cargarDominios(); // Recargar la lista
    } catch (error) {
      console.error('Error al agregar dominio:', error);
    }
    setLoading(false);
  };

  const eliminarDominio = async (id) => {
    try {
      await deleteDoc(doc(db, 'dominiosPermitidos', id));
      await cargarDominios(); // Recargar la lista
    } catch (error) {
      console.error('Error al eliminar dominio:', error);
    }
  };

  const iniciarEdicion = (dominio) => {
    setEditandoId(dominio.id);
    setEditandoDominio(dominio.dominio);
  };

  const cancelarEdicion = () => {
    setEditandoId(null);
    setEditandoDominio('');
  };

  const guardarEdicion = async (id) => {
    if (!editandoDominio.trim()) return;

    setLoading(true);
    try {
      const dominioRef = doc(db, 'dominiosPermitidos', id);
      
      // Obtener el dominio actual para acceder al historial existente
      const dominioActual = dominios.find(d => d.id === id);
      const historialModificaciones = dominioActual.historialModificaciones || [];
      
      // Crear nueva entrada en el historial
      const nuevaModificacion = {
        fecha: new Date(),
        usuario: user.email,
        dominioAnterior: dominioActual.dominio,
        dominioNuevo: editandoDominio.trim().toLowerCase()
      };
      
      // Agregar la nueva modificación al historial
      historialModificaciones.push(nuevaModificacion);
      
      await updateDoc(dominioRef, {
        dominio: editandoDominio.trim().toLowerCase(),
        historialModificaciones: historialModificaciones
      });
      
      setEditandoId(null);
      setEditandoDominio('');
      await cargarDominios(); // Recargar la lista
    } catch (error) {
      console.error('Error al actualizar dominio:', error);
    }
    setLoading(false);
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="container mx-auto xl:px-14 py-2 text-gray-500 mb-10 min-h-screen">
      {/* Header */}
      <div className="flex gap-2 items-center justify-between px-5 py-3 text-md">
        <div className="flex gap-2 items-center">
          <GoHomeFill className="hidden md:block" style={{ width: 15, height: 15, fill: "#d97706" }} />
          <Link to="#" className="hidden md:block font-medium text-gray-600">
            Home
          </Link>
          <FaArrowRight className="hidden md:block" style={{ width: 12, height: 12, fill: "#d97706" }} />
          <Link to="/admin" className="hidden md:block font-medium text-gray-600">
            Administración
          </Link>
          <FaArrowRight className="hidden md:block" style={{ width: 12, height: 12, fill: "#d97706" }} />
          <h1 className="font-medium">Gestión de Dominios</h1>
        </div>

        <div className="flex items-center">
          <button className="text-amber-600 text-3xl" onClick={handleGoBack}>
            <IoArrowBackCircle />
          </button>
        </div>
      </div>

      <div className="w-full border-b-2"></div>

      {/* Contenido */}
      <div className="p-6">
        <div className="">
          <h2 className="text-md font-semibold text-gray-800 mb-6">Gestión de Dominios Permitidos</h2>
          
          {/* Formulario para agregar dominio */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h3 className="text font-semibold text-gray-700 mb-4">Agregar Nuevo Dominio</h3>
            <form onSubmit={agregarDominio} className="flex gap-4">
              <input
                type="text"
                value={nuevoDominio}
                onChange={(e) => setNuevoDominio(e.target.value)}
                placeholder="ejemplo.com"
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-amber-500"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !nuevoDominio.trim()}
                className="px-6 py-2 bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FaPlus />
                {loading ? 'Agregando...' : 'Agregar'}
              </button>
            </form>
          </div>

          {/* Lista de dominios */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Dominios Permitidos</h3>
            {dominios.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No hay dominios registrados</p>
            ) : (
              <div className="space-y-3">
                {dominios.map((dominio) => (
                  <div key={dominio.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-md">
                    {editandoId === dominio.id ? (
                      // Modo edición
                      <div className="flex-1 flex gap-2">
                        <input
                          type="text"
                          value={editandoDominio}
                          onChange={(e) => setEditandoDominio(e.target.value)}
                          className="flex-1 px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:border-amber-500"
                          disabled={loading}
                        />
                        <button
                          onClick={() => guardarEdicion(dominio.id)}
                          disabled={loading || !editandoDominio.trim()}
                          className="text-green-600 hover:text-green-800 p-2 disabled:text-gray-400"
                          title="Guardar cambios"
                        >
                          <FaSave />
                        </button>
                        <button
                          onClick={cancelarEdicion}
                          disabled={loading}
                          className="text-gray-600 hover:text-gray-800 p-2 disabled:text-gray-400"
                          title="Cancelar edición"
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      // Modo visualización
                      <>
                        <div className="flex-1">
                          <span className="font-medium text-gray-800">{dominio.dominio}</span>
                          <p className="text-sm text-gray-500">
                            Agregado: {dominio.fechaCreacion?.toDate?.()?.toLocaleDateString() || 'N/A'}
                            {dominio.usuarioCreacion && (
                              <span className="ml-2">por {dominio.usuarioCreacion}</span>
                            )}
                            {dominio.historialModificaciones && dominio.historialModificaciones.length > 0 && (
                              <span className="ml-2">
                                | Modificado {dominio.historialModificaciones.length} vez{dominio.historialModificaciones.length > 1 ? 'es' : ''}
                                {dominio.historialModificaciones.length > 0 && (
                                  <span> (última: {dominio.historialModificaciones[dominio.historialModificaciones.length - 1].fecha?.toDate?.()?.toLocaleDateString()} por {dominio.historialModificaciones[dominio.historialModificaciones.length - 1].usuario})</span>
                                )}
                              </span>
                            )}
                          </p>
                          
                          {/* Historial expandido */}
                          {mostrarHistorial === dominio.id && dominio.historialModificaciones && dominio.historialModificaciones.length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-md">
                              <h4 className="text-sm font-semibold text-gray-700 mb-2">Historial de modificaciones:</h4>
                              <div className="space-y-2">
                                {dominio.historialModificaciones.map((mod, index) => (
                                  <div key={index} className="text-xs text-gray-600 border-l-2 border-amber-500 pl-2">
                                    <div>
                                      <strong>{mod.fecha?.toDate?.()?.toLocaleDateString()} {mod.fecha?.toDate?.()?.toLocaleTimeString()}</strong> - {mod.usuario}
                                    </div>
                                    <div className="text-gray-500">
                                      Cambió de "{mod.dominioAnterior}" a "{mod.dominioNuevo}"
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {dominio.historialModificaciones && dominio.historialModificaciones.length > 0 && (
                            <button
                              onClick={() => setMostrarHistorial(mostrarHistorial === dominio.id ? null : dominio.id)}
                              className="text-purple-600 hover:text-purple-800 p-2"
                              title="Ver historial de modificaciones"
                            >
                              <FaHistory />
                            </button>
                          )}
                          <button
                            onClick={() => iniciarEdicion(dominio)}
                            className="text-blue-600 hover:text-blue-800 p-2"
                            title="Editar dominio"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => eliminarDominio(dominio.id)}
                            className="text-red-600 hover:text-red-800 p-2"
                            title="Eliminar dominio"
                          >
                            <FaTrashAlt />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GestionDominios; 