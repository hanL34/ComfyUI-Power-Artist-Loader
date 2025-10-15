import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rewriteComfyImports = ({ isDev }) => {
  return {
    name: "rewrite-comfy-imports",
    resolveId(source) {
      if (!isDev) return;
      if (source === "/scripts/app.js") {
        return "http://127.0.0.1:8188/scripts/app.js";
      }
      if (source === "/scripts/api.js") {
        return "http://127.0.0.1:8188/scripts/api.js";
      }
      return null;
    },
  };
};

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    rewriteComfyImports({ isDev: mode === "development" })
  ],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      external: ['/scripts/app.js', '/scripts/api.js'],
      input: {
        main: path.resolve(__dirname, 'src/main.tsx'),
      },
      output: {
        dir: '../web/dist',
        entryFileNames: 'artist-manager.js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: '[name][extname]',
      }
    }
  }
}));
