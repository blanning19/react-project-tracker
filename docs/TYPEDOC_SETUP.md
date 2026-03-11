# TypeDoc — Setup and Installation Guide

## 1. Install TypeDoc

Run this from your `frontend/` directory (same level as `package.json`):

```bash
npm install --save-dev typedoc
```

TypeDoc reads your `tsconfig.app.json` by default, so no separate TypeScript
install is needed. Check what you have after install:

```bash
npx typedoc --version
```

You should see `TypeDoc 0.26.x` or higher.

---

## 2. Add the config file

Place the `typedoc.json` file provided with this guide in your `frontend/` root
(next to `package.json`). It is already configured for this project's folder
structure. The most important settings are:

| Setting | Value | Purpose |
|---|---|---|
| `entryPoints` | `src/...` paths | Files TypeDoc will document |
| `out` | `"docs"` | Output folder (relative to `frontend/`) |
| `tsconfig` | `"tsconfig.app.json"` | The Vite app tsconfig (not `tsconfig.node.json`) |
| `excludePrivate` | `true` | Hides internal helpers tagged `@internal` |
| `excludeInternal` | `true` | Hides items tagged `@internal` |
| `excludeExternals` | `true` | Skips types imported from `node_modules` |

### Adjust entry points to match your actual paths

The paths in `typedoc.json` assume the standard structure from this project.
If your files sit at different locations, update `entryPoints` to match:

```jsonc
// typedoc.json
{
  "entryPoints": [
    "src/shared/auth/tokens.ts",   // ← adjust if your path differs
    "src/features/home/Home.tsx",  // ← adjust if your path differs
    // ...
  ]
}
```

---

## 3. Add npm scripts

In your `frontend/package.json`, add these two scripts:

```json
{
  "scripts": {
    "docs": "typedoc",
    "docs:watch": "typedoc --watch"
  }
}
```

- `npm run docs` — build once
- `npm run docs:watch` — rebuild on every file save (useful while writing comments)

---

## 4. Add `docs/` to `.gitignore`

The generated HTML is not typically committed to source control:

```
# .gitignore (frontend/)
docs/
```

If you want docs to be served from GitHub Pages, keep `docs/` committed and
configure Pages to serve from `/frontend/docs`.

---

## 5. Verify the tsconfig is correct

TypeDoc needs to see your source files. Open `tsconfig.app.json` and confirm:

```json
{
  "include": ["src"]
}
```

If it says `"include": ["src/**/*"]` that is fine too. The important thing is
that `src/` is included and that the `jsx` option is set to `"react-jsx"` or
`"preserve"` (Vite sets this automatically).

---

## 6. Test with a single file first

Before running the full build, test against one file to confirm everything is
wired up:

```bash
npx typedoc --entryPoints src/shared/auth/tokens.ts --out docs-test
```

Open `docs-test/index.html` in a browser. You should see the `tokenStore`
constant with all its method docs. If it works, delete `docs-test/` and run
the full build.

---

## 7. Build the full docs

```bash
npm run docs
```

This writes the HTML site to `frontend/docs/`. Open
`frontend/docs/index.html` in your browser to review it.

---

## 8. Optional: TypeDoc plugins

These are optional but commonly useful:

### typedoc-plugin-markdown
Generates Markdown instead of HTML (useful for GitHub wikis):

```bash
npm install --save-dev typedoc-plugin-markdown
```

Add to `typedoc.json`:

```json
{
  "plugin": ["typedoc-plugin-markdown"],
  "out": "docs-md"
}
```

### typedoc-plugin-mdn-links
Adds MDN links to built-in types like `string`, `Promise`, `Response`:

```bash
npm install --save-dev typedoc-plugin-mdn-links
```

```json
{
  "plugin": ["typedoc-plugin-mdn-links"]
}
```
