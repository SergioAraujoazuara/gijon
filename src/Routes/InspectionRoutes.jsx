// InspectionRoutes.js
import React from 'react';
import { Route } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';
import Viewer_inspeccion from './Viewer_inspeccion';
import Elemento from './Pages/Elemento';
import TablaPpi from './Pages/TablaPpi';
import EditarPpi from '../Pages/Administrador/EditarPpi';
import FormularioInspeccion from '../Components/FormularioInspeccion';
import Pdf_final from '../Components/Pdf_final';

const inspectionRoutes = [
  { path: '/visor_inspeccion', element: <Viewer_inspeccion />, roles: ['admin', 'usuario'] },
  { path: '/elemento/:id', element: <Elemento />, roles: ['admin', 'usuario'] },
  { path: '/tablaPpi', element: <TablaPpi />, roles: ['admin', 'usuario'] },
  { path: '/tablaPpi/:idLote/:ppiNombre', element: <TablaPpi />, roles: ['admin', 'usuario'] },
  { path: '/editarPpi/:id', element: <EditarPpi />, roles: ['admin', 'usuario'] },
  { path: '/formularioInspeccion/:idLote/:id', element: <FormularioInspeccion />, roles: ['admin', 'usuario'] },
  { path: '/pdf_final', element: <Pdf_final />, roles: ['admin', 'usuario'] },
];

const InspectionRoutes = () => {
  return (
    <React.Fragment>
      {inspectionRoutes.map((route, index) => (
        <Route 
          key={index} 
          path={route.path} 
          element={<ProtectedRoutes allowedRoles={route.roles}>{route.element}</ProtectedRoutes>}
        />
      ))}
    </React.Fragment>
  );
};

export default InspectionRoutes;
