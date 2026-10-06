import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tailwindcss from '@tailwindcss/vite';
import path from "path"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      global: 'window'
    },
    optimizeDeps: {
      include: ['sockjs-client']
    },
    plugins: [react(), tailwindcss()],
    server: {
      port: 4200,
      
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET || 'http://localhost:8088',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        // "@components": path.resolve(__dirname, "./src/components"),
      },
    },
  };
});
