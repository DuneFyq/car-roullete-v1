import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src', 
  base: '/car-roullete-v1/', 
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'index.html', 
    },
  }
});
