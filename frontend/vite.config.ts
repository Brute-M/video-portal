import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") && !id.includes("react-") || id.includes("react-dom") || id.includes("react-router")) return "vendor-react";
            if (id.includes("@tanstack/react-query")) return "vendor-query";
            if (id.includes("@radix-ui")) return "vendor-radix";
            if (id.includes("react-hook-form") || id.includes("@hookform") || id.includes("zod")) return "vendor-forms";
            if (id.includes("lucide-react")) return "vendor-lucide";
            if (id.includes("recharts")) return "vendor-recharts";
            if (id.includes("embla-carousel")) return "vendor-embla";
            if (id.includes("slick-carousel") || id.includes("react-slick")) return "vendor-slick";
            // Don't chunk i18n separately - react-i18next needs React in scope (createContext)
            if (id.includes("react-helmet") || id.includes("aos")) return "vendor-misc";
          }
        },
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    cssCodeSplit: true,
    minify: "esbuild",
    sourcemap: mode !== "production",
  },
}));
