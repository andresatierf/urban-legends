// Post-build step for static hosting (GitHub Pages).
//
// TanStack Start's SPA mode prerenders the app shell to
// `.output/public/_shell.html`. A static host has no server to fall back to
// that shell, so we materialise it as the two files GitHub Pages actually
// serves:
//   - index.html : served at the site root
//   - 404.html   : served for every unknown path — GitHub Pages returns it
//                  (with a 404 status) and the SPA boots and routes from
//                  `window.location`, giving us client-side deep links.
//
// We also drop a `.nojekyll` file so Pages serves the `_*`/asset files as-is
// instead of running them through Jekyll.
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const publicDir = join(process.cwd(), ".output", "public");
const shell = join(publicDir, "_shell.html");

if (!existsSync(shell)) {
  console.error(
    `[spa-pages-fallback] Expected shell at ${shell} but it does not exist. ` +
      "Did the SPA build run (spa.enabled in vite.config.ts)?",
  );
  process.exit(1);
}

copyFileSync(shell, join(publicDir, "index.html"));
copyFileSync(shell, join(publicDir, "404.html"));
writeFileSync(join(publicDir, ".nojekyll"), "");

console.log(
  "[spa-pages-fallback] Wrote index.html, 404.html and .nojekyll to .output/public",
);
