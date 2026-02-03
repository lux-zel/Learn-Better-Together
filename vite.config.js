import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  define: {
    __VITE_FIREBASE_API_KEY__: JSON.stringify(process.env.VITE_FIREBASE_API_KEY),
    __VITE_FIREBASE_AUTH_DOMAIN__: JSON.stringify(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    __VITE_FIREBASE_PROJECT_ID__: JSON.stringify(process.env.VITE_FIREBASE_PROJECT_ID),
    __VITE_FIREBASE_STORAGE_BUCKET__: JSON.stringify(process.env.VITE_FIREBASE_STORAGE_BUCKET),
    __VITE_FIREBASE_MESSAGING_SENDER_ID__: JSON.stringify(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    __VITE_FIREBASE_APP_ID__: JSON.stringify(process.env.VITE_FIREBASE_APP_ID),
    __VITE_FIREBASE_MEASUREMENT_ID__: JSON.stringify(process.env.VITE_FIREBASE_MEASUREMENT_ID),
  }
})