import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        // Pustaka besar dipisah agar tidak ikut termuat di halaman yang tidak
        // memakainya. Peta hanya dipakai di formulir alamat, grafik hanya di
        // dashboard, dan pembuat PDF hanya saat laporan diunduh.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          grafik: ['recharts'],
          peta: ['leaflet', 'react-leaflet'],
        },
      },
    },
    chunkSizeWarningLimit: 700,
  },
})
