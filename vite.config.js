import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  // Cargar variables de entorno de acuerdo al modo (development, production)
  const env = loadEnv(mode, process.cwd());

  return {
    plugins: [react()],
    define: {
      'process.env': env // Asegúrate de pasar las variables de entorno al build
    },
  };
});
