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
  // Explicit list of routable screen components shown in the app navbar.
  // Add new pages here as the app grows — both the base name and any
  // suffixed variants (e.g. "Home" matches Home, HomeView, HomePage).
  const PAGE_NAMES = [
    "Home", "HomeView", "HomePage",
    "About", "AboutView", "AboutPage",
    "Login", "LoginView", "LoginPage",
    "Create", "CreateView", "CreatePage",
    "DashboardPage", "Dashboard",
  ];

  // Categorise by explicit page list first, then file path, then isComponent.
  eleventyConfig.addFilter("byCategory", (arr, cat) =>
    (arr ?? []).filter((item) => {
      if (item.isHook)                                        return cat === "hook";
      if (PAGE_NAMES.includes(item.name))                     return cat === "page";
      if (item.isComponent && item.file.includes("/views/"))  return cat === "view";
      if (item.isComponent)                                   return cat === "view";
      if (item.file.includes("/controllers/"))                return cat === "controller";
      if (item.file.includes("/models/") ||
          item.name.includes("ViewModel"))                    return cat === "model";
      if (item.file.includes("/utils/"))                      return cat === "util";
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
