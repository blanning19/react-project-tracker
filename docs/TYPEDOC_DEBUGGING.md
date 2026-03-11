# TypeDoc — Generating HTML Docs and Debugging

## Generating the docs

### One-time build
```bash
# From your frontend/ directory
npm run docs
```

Output lands in `frontend/docs/`. Open `frontend/docs/index.html` in any
browser — no server required; it is a self-contained static site.

### Watch mode (while writing comments)
```bash
npm run docs:watch
```

TypeDoc rebuilds on every file save. Reload the browser tab to see changes.
Combine with a browser extension like "Auto Refresh" or the Live Server VS Code
extension pointed at `frontend/docs/` to auto-reload.

---

## Reading the output

TypeDoc generates one HTML page per module. The sidebar on the left lists all
documented modules. Within each page:

- **Interfaces and types** — listed with all properties and their JSDoc descriptions.
- **Functions and hooks** — listed with parameter tables and return type.
- **Constants** — listed with their type and description.
- **`@example` blocks** — rendered as syntax-highlighted code snippets.
- **`@param` / `@returns`** — rendered as a table below the function signature.

---

## Common warnings and how to fix them

Run the build and read the console output carefully. TypeDoc prints a warning
for every undocumented export.

### "0 out of N exports have documentation"
TypeDoc found exported items with no JSDoc comment. Add a `/** ... */` block
directly above the export. The minimum useful comment is one sentence:

```ts
/** Sends a logout request and clears all local auth state. */
export const logout = async (...) => { ... };
```

### "Cannot find module 'X' or its corresponding type declarations"
TypeDoc couldn't resolve an import. This usually means:
- The path is wrong in `entryPoints` in `typedoc.json`.
- A `tsconfig.app.json` path alias isn't resolving.

Fix: check `tsconfig.app.json` for `paths` aliases and add matching
`compilerOptions.paths` entries if needed.

### "Duplicate identifier 'X'"
Two files export the same name. Use the `@module` tag to scope them:

```ts
/**
 * @module auth/tokens
 */
```

Add a `@module` tag to the top-level `@file` block of every file (the
annotated files provided already have this).

### Missing pages in the sidebar
TypeDoc only documents items that are **exported**. If a function or interface
is not in the sidebar:
1. Check it has a `/** ... */` comment.
2. Check it is exported with `export`.
3. Check it is listed in `entryPoints` in `typedoc.json`.
4. Check it is not tagged `@internal` (which hides it when `excludeInternal: true`).

### Internal helpers are showing in the docs
Add `@internal` to the JSDoc block:

```ts
/**
 * Internal helper — not part of the public API.
 * @internal
 */
function parseBody(...) { ... }
```

---

## Debugging the build

### Verbose output
```bash
npx typedoc --logLevel Verbose
```

Prints every file TypeDoc processes. Useful for confirming which files are
being included and which are being skipped.

### Validate your tsconfig path
```bash
npx typedoc --tsconfig tsconfig.app.json --entryPoints src/shared/auth/tokens.ts --out tmp-docs
```

If this works but the full build doesn't, the problem is in `entryPoints` or
a path alias.

### Check for TSX errors
TypeDoc will refuse to document files with TypeScript errors. Run the compiler
first to catch any:

```bash
npx tsc --noEmit
```

Fix all errors before running TypeDoc.

---

## CI integration (optional)

To keep docs always up to date, add a step to your CI pipeline:

```yaml
# .github/workflows/docs.yml
name: Build Docs
on:
  push:
    branches: [main]
jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
        working-directory: frontend
      - run: npm run docs
        working-directory: frontend
      - uses: actions/upload-artifact@v4
        with:
          name: typedoc-html
          path: frontend/docs/
```

This uploads the generated HTML as a CI artifact that you can download and
browse from the GitHub Actions run.

---

## Quick reference — JSDoc tags used in this project

| Tag | Where to put it | What it does |
|---|---|---|
| `@file` | Top of file, inside `/** */` | Describes the module; shown on the module page |
| `@module` | Same block as `@file` | Sets the page title in TypeDoc |
| `@param name` | Function JSDoc | Documents a parameter |
| `@returns` | Function JSDoc | Documents the return value |
| `@throws` | Function JSDoc | Documents an error the function may throw |
| `@example` | Function or constant JSDoc | Adds a fenced code example |
| `@remarks` | Anywhere | Adds a secondary paragraph after the main description |
| `@internal` | Any export | Hides the item when `excludeInternal: true` |
| `@typeParam T` | Generic function JSDoc | Documents a type parameter |
| `@deprecated` | Any export | Marks the item as deprecated with a strikethrough |

### Minimal file template

```ts
/**
 * @file One-line description of what this file contains.
 *
 * Longer description if needed.
 *
 * @module feature/fileName
 */
```

### Minimal function template

```ts
/**
 * One-line description of what this function does.
 *
 * @param foo - Description of the first parameter.
 * @param bar - Description of the second parameter.
 * @returns Description of what is returned.
 * @throws `ApiError` when the request fails with a non-2xx status.
 *
 * @example
 * ```ts
 * const result = myFunction("hello", 42);
 * ```
 */
export function myFunction(foo: string, bar: number): string { ... }
```
