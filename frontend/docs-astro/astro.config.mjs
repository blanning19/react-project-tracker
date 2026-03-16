import { defineConfig } from "astro/config";

export default defineConfig({
  // Output static HTML — no server required
  output: "static",

  // Where the built site lands
  outDir: "./dist",

  // Base path if you host at e.g. /docs/ on your server.
  // Change to "/" if serving from root.
  base: "/",

  build: {
    // Each page becomes its own folder with an index.html
    // so URLs are clean: /DashboardPage/ not /DashboardPage.html
    format: "directory",
  },
});
