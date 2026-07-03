import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuration Vite : plugin React + chemins relatifs pour la version démo
export default defineConfig({
  plugins: [react()],
  base: './',
});
