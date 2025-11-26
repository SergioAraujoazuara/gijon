// AdminRoutes.js
import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';
import AdminHome from '../Pages/Administrador/AdminHome';
import Trazabilidad from '../Pages/Administrador/Trazabilidad';
import Viewer_admin from './Viewer_admin';
import VerPpis from '../Pages/Administrador/VerPpis';
import AgregarPPi from '../Pages/Administrador/AgregarPPi';
import Roles from '../Pages/Administrador/Roles';
import GestionDominios from '../Pages/Administrador/GestionDominios/GestionDominios';

const adminRoutes = [
  { path: '/admin', element: <AdminHome />, roles: ['admin', 'usuario'] },
  { path: '/trazabilidad/:id', element: <Trazabilidad />, roles: ['admin', 'usuario'] },
  { path: '/visorAdmin', element: <Viewer_admin />, roles: ['admin', 'usuario'] },
  { path: '/verPPis', element: <VerPpis />, roles: ['admin'] },
  { path: '/agregarPpi', element: <AgregarPPi />, roles: ['admin'] },
  { path: '/roles', element: <Roles />, roles: ['admin'] },
  { path: '/gestion-dominios', element: <GestionDominios />, roles: ['admin'] },
];

const AdminRoutes = () => {
  return (
    <React.Fragment>
      {adminRoutes.map((route, index) => (
        <Route 
          key={index} 
          path={route.path} 
          element={<ProtectedRoutes allowedRoles={route.roles}>{route.element}</ProtectedRoutes>}
        />
      ))}
    </React.Fragment>
  );
};

export default AdminRoutes;
