import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";

// Base path for the app. GitHub Pages *project* sites are served from a
// subpath (e.g. https://<user>.github.io/<repo>/), so set VITE_BASE_PATH to
// "/<repo>/" for those. Leave unset (defaults to "/") for a user/org page or a
// custom domain.
const base = process.env.VITE_BASE_PATH ?? "/";

export default defineConfig({
  base,
  server: { port: 3000 },
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  plugins: [
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
      router: { routesDirectory: "routes" },
      // Render the app as a client-only SPA: the build prerenders a static
      // shell that hydrates in the browser. Required for static hosting
      // (GitHub Pages) where there is no Node server to run SSR.
      spa: { enabled: true },
    }),
    viteReact(),
    nitro(),
  ],
});
