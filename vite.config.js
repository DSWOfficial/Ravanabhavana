import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'react-vendor', test: /node_modules[\\/](react|react-dom|react-router-dom)[\\/]/ },
            { name: 'firebase-vendor', test: /node_modules[\\/](@firebase|firebase)[\\/]/ },
            { name: 'ui-vendor', test: /node_modules[\\/](lucide-react)[\\/]/ },
          ],
        },
      },
    },
  },
});
