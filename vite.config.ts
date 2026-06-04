import { defineConfig } from "vite";

export default defineConfig({
  base: "/car-roullete-v1/",
  build: {
    rollupOptions: {
      input: "./src/index.html",},
  },
});
