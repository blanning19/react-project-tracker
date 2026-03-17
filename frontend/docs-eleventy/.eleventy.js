const path = require("path");

module.exports = function (eleventyConfig) {

  eleventyConfig.addPassthroughCopy("src/css");

  eleventyConfig.addFilter("values", (obj) => Object.values(obj ?? {}));

  eleventyConfig.addFilter("where", (arr, key, val) =>
    (arr ?? []).filter((item) => {
      const parts = key.split(".");
      let v = item;
      for (const p of parts) v = v?.[p];
      return v === val;
    })
  );

  eleventyConfig.addFilter("contains", (arr, key, substr) =>
    (arr ?? []).filter((item) => {
      const parts = key.split(".");
      let v = item;
      for (const p of parts) v = v?.[p];
      return typeof v === "string" && v.includes(substr);
    })
  );

  eleventyConfig.addFilter("rejectContains", (arr, key, substr) =>
    (arr ?? []).filter((item) => {
      const parts = key.split(".");
      let v = item;
      for (const p of parts) v = v?.[p];
      return !(typeof v === "string" && v.includes(substr));
    })
  );

  eleventyConfig.addFilter("truncate", (str, len = 100) =>
    !str ? "" : str.length > len ? str.slice(0, len) + "…" : str
  );

  eleventyConfig.addFilter("startsWith", (str, prefix) =>
    typeof str === "string" && str.startsWith(prefix)
  );

  eleventyConfig.addFilter("sumBy", (arr, key) =>
    (arr ?? []).reduce((n, item) => {
      const parts = key.split(".");
      let v = item;
      for (const p of parts) v = v?.[p];
      return n + (Number(v) || 0);
    }, 0)
  );

  eleventyConfig.addFilter("dateFormat", (str) =>
    new Date(str).toLocaleString()
  );

  // ── Page registry ──────────────────────────────────────────────────────────
  // Routable screens only — components the router renders at a URL.
  // HomeView/LoginView are Views, not Pages, so excluded here.
  const PAGE_NAMES = new Set([
    "Home", "About", "Login", "Create", "DashboardPage",
  ]);

  // Layout components — app structure, not feature screens or views.
  const LAYOUT_NAMES = new Set([
    "App", "Navbar", "AuthProvider", "RequireAuth", "ThemeToggle",
  ]);

  // View suffix — components ending in View are presentation layers.
  const isViewName = (name) => name.endsWith("View") || name.endsWith("PageView");

  eleventyConfig.addFilter("byCategory", (arr, cat) =>
    (arr ?? []).filter((item) => {
      if (item.isHook)                          return cat === "hook";
      if (PAGE_NAMES.has(item.name))            return cat === "page";
      if (LAYOUT_NAMES.has(item.name))          return cat === "layout";
      if (isViewName(item.name) && item.isComponent) return cat === "view";
      if (item.isComponent && item.file.includes("/views/")) return cat === "view";
      if (item.isComponent)                     return cat === "view";
      if (item.file.includes("/controllers/"))  return cat === "controller";
      if (item.file.includes("/models/") ||
          item.name.includes("ViewModel"))      return cat === "model";
      if (item.file.includes("/utils/"))        return cat === "util";
      return cat === "other";
    })
  );

  eleventyConfig.addCollection("components", function () {
    try {
      const dataPath = path.join(__dirname, "src/_data/components.json");
      const raw = require("fs").readFileSync(dataPath, "utf8");
      const data = JSON.parse(raw);
      return Object.entries(data.components).map(([name, comp]) => ({
        name,
        ...comp,
        url: `/components/${name}/`,
      }));
    } catch {
      return [];
    }
  });

  return {
    dir: {
      input:    "src",
      output:   "dist",
      includes: "_includes",
      data:     "_data",
    },
    templateFormats: ["njk", "html"],
    htmlTemplateEngine: "njk",
  };
};
