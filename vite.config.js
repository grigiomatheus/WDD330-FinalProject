import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "src",
  envDir: "..",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        browse: resolve(__dirname, "src/pages/browse/index.html"),
        book: resolve(__dirname, "src/pages/book/index.html"),
        readingList: resolve(__dirname, "src/pages/reading-list/index.html"),
      },
    },
  },
});
