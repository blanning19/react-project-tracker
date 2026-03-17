/**
 * parse-source.mjs
 *
 * Walks your src/ directory, parses every .tsx file with Babel,
 * and extracts component metadata including:
 *   - JSDoc comments above the function
 *   - Internal helper functions defined inside the component
 *   - useEffect calls and their dependency arrays
 *   - ViewPanel markers and their child JSX components
 *   - Import graph (what each file depends on)
 *
 * Output: docs-astro/src/data/components.json
 *
 * Run: node docs-astro/parse-source.mjs
 */

import { parse } from "@babel/parser";
import _traverse from "@babel/traverse";
const traverse = _traverse.default ?? _traverse;
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "fs";
import { join, relative, extname, basename } from "path";

// ─── Configuration ────────────────────────────────────────────────────────────

const SRC_DIR = "./src";                          // your source root
const OUT_FILE = "./docs-eleventy/src/_data/components.json";
const COMPONENT_EXTENSIONS = [".tsx", ".ts"];
const IGNORE_DIRS = ["node_modules", ".next", "dist", "build", ".git"];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAllFiles(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORE_DIRS.includes(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      getAllFiles(full, files);
    } else if (COMPONENT_EXTENSIONS.includes(extname(entry))) {
      files.push(full);
    }
  }
  return files;
}

function parseFile(filePath) {
  const src = readFileSync(filePath, "utf8");
  try {
    return parse(src, {
      sourceType: "module",
      plugins: ["typescript", "jsx"],
      attachComment: true,
    });
  } catch (e) {
    console.warn(`  ⚠ Could not parse ${filePath}: ${e.message}`);
    return null;
  }
}

/**
 * Extract the leading JSDoc block comment from a node.
 * Handles both /** ... *\/ and /* ... *\/ styles.
 */
function extractJsDoc(node) {
  const comments = node.leadingComments ?? [];
  const block = [...comments].reverse().find((c) => c.type === "CommentBlock");
  if (!block) return null;

  const raw = block.value
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").trim())
    .filter(Boolean);

  const tags = {};
  const descLines = [];
  let currentTag = null;

  for (const line of raw) {
    const tagMatch = line.match(/^@(\w+)\s*(.*)/);
    if (tagMatch) {
      currentTag = tagMatch[1];
      tags[currentTag] = tags[currentTag] ?? [];
      if (tagMatch[2]) tags[currentTag].push(tagMatch[2]);
    } else if (currentTag) {
      tags[currentTag].push(line);
    } else {
      descLines.push(line);
    }
  }

  return {
    description: descLines.join(" ").trim() || null,
    tags,
  };
}

/**
 * Collect all JSX component names (PascalCase) used inside a JSX tree node.
 */
function collectJsxChildren(node) {
  const found = [];
  function walk(n) {
    if (!n || typeof n !== "object") return;
    if (n.type === "JSXOpeningElement") {
      const name = n.name?.name;
      if (name && /^[A-Z]/.test(name)) found.push(name);
    }
    for (const val of Object.values(n)) {
      if (Array.isArray(val)) val.forEach(walk);
      else if (val && typeof val === "object" && val.type) walk(val);
    }
  }
  walk(node);
  return [...new Set(found)];
}

// ─── Per-file extraction ───────────────────────────────────────────────────────

function extractFromFile(filePath) {
  const ast = parseFile(filePath);
  if (!ast) return null;

  const relativePath = relative(process.cwd(), filePath).replace(/\\/g, "/");
  const fileName = basename(filePath);

  const result = {
    file: relativePath,
    fileName,
    components: [],
    imports: [],
  };

  // ── Collect imports ──────────────────────────────────────────────────────────
  traverse(ast, {
    ImportDeclaration(path) {
      result.imports.push({
        source: path.node.source.value,
        specifiers: path.node.specifiers.map((s) => s.local.name),
      });
    },
  });

  // ── Collect exported components / functions ──────────────────────────────────

  // First pass: collect ALL top-level function declarations by name
  // so we can resolve split export patterns like:
  //   function Foo() {}   +   export default Foo
  //   function Foo() {}   +   export { Foo }
  const topLevelFunctions = new Map();
  traverse(ast, {
    FunctionDeclaration(path) {
      const isTopLevel =
        path.parent.type === "Program" ||
        path.parent.type === "ExportNamedDeclaration" ||
        path.parent.type === "ExportDefaultDeclaration";
      if (isTopLevel && path.node.id?.name) {
        topLevelFunctions.set(path.node.id.name, path.node);
      }
    },
    VariableDeclaration(path) {
      if (path.parent.type !== "Program") return;
      for (const decl of path.node.declarations) {
        const init = decl.init;
        if (
          init &&
          (init.type === "ArrowFunctionExpression" ||
            init.type === "FunctionExpression") &&
          decl.id?.name
        ) {
          topLevelFunctions.set(decl.id.name, { ...init, id: decl.id });
        }
      }
    },
  });

  // Track which names we have already registered to avoid duplicates
  const registered = new Set();

  traverse(ast, {
    // export function Foo(): JSX.Element {}
    ExportNamedDeclaration(path) {
      const decl = path.node.declaration;
      if (!decl) {
        // export { Foo } or export { Foo as Bar }
        // Resolve each specifier back to its top-level function
        for (const spec of path.node.specifiers ?? []) {
          const localName = spec.local?.name;
          if (!localName || registered.has(localName)) continue;
          const fn = topLevelFunctions.get(localName);
          if (!fn) continue;
          const comp = extractComponent(fn, path.node, result.imports, filePath, localName, topLevelFunctions, registered);
          if (comp) { registered.add(localName); result.components.push(comp); }
        }
        return;
      }

      if (decl.type === "FunctionDeclaration") {
        const name = decl.id?.name;
        if (name && !registered.has(name)) {
          const comp = extractComponent(decl, path.node, result.imports, filePath, undefined, topLevelFunctions, registered);
          if (comp) { registered.add(name); result.components.push(comp); }
        }
      }

      // export const Foo = (): JSX.Element => {}
      if (decl.type === "VariableDeclaration") {
        for (const declarator of decl.declarations) {
          const init = declarator.init;
          const name = declarator.id?.name;
          if (
            name && !registered.has(name) &&
            init &&
            (init.type === "ArrowFunctionExpression" ||
              init.type === "FunctionExpression")
          ) {
            const comp = extractComponent(init, path.node, result.imports, filePath, name, topLevelFunctions, registered);
            if (comp) { registered.add(name); result.components.push(comp); }
          }
        }
      }
    },

    // export default function Foo() {}
    // export default Foo   (identifier — resolved via topLevelFunctions)
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration;

      // export default Foo — identifier pointing at a top-level function
      if (decl.type === "Identifier") {
        const name = decl.name;
        if (registered.has(name)) return;
        const fn = topLevelFunctions.get(name);
        if (!fn) return;
        const comp = extractComponent(fn, path.node, result.imports, filePath, name, topLevelFunctions, registered);
        if (comp) {
          comp.isDefault = true;
          registered.add(name);
          result.components.push(comp);
        }
        return;
      }

      // export default function Foo() {} or export default () => {}
      if (
        decl.type === "FunctionDeclaration" ||
        decl.type === "ArrowFunctionExpression"
      ) {
        const name = decl.id?.name;
        if (name && registered.has(name)) return;
        const comp = extractComponent(decl, path.node, result.imports, filePath, undefined, topLevelFunctions, registered);
        if (comp) {
          comp.isDefault = true;
          if (name) registered.add(name);
          result.components.push(comp);
        }
      }
    },
  });

  return result;
}

function extractComponent(funcNode, exportNode, imports, filePath, nameOverride, topLevelFunctions = new Map(), registered = new Set()) {
  const name = nameOverride ?? funcNode.id?.name;
  if (!name) return null;

  // Only include if it returns JSX (heuristic: name starts with capital letter)
  const isComponent = /^[A-Z]/.test(name);
  const isHook = /^use[A-Z]/.test(name);

  const jsDoc = extractJsDoc(exportNode) ?? extractJsDoc(funcNode);

  const body = funcNode.body;
  if (!body || body.type !== "BlockStatement") return null;

  // ── Internal helpers ─────────────────────────────────────────────────────────
  const internalHelpers = [];
  for (const stmt of body.body) {
    if (
      stmt.type === "FunctionDeclaration" ||
      (stmt.type === "VariableDeclaration" &&
        stmt.declarations[0]?.init?.type === "ArrowFunctionExpression")
    ) {
      const helperName =
        stmt.id?.name ?? stmt.declarations?.[0]?.id?.name;
      if (!helperName) continue;

      const helperFunc =
        stmt.type === "FunctionDeclaration"
          ? stmt
          : stmt.declarations[0].init;

      const returnTypes = [];
      traverse({ type: "File", program: { type: "Program", body: [stmt] } }, {
        ReturnStatement(p) {
          const arg = p.node.argument;
          if (!arg) returnTypes.push("void");
          else if (arg.type === "StringLiteral" || arg.type?.includes("Template"))
            returnTypes.push("string");
          else if (arg.type === "ArrayExpression") returnTypes.push("Array");
          else if (arg.type === "ObjectExpression") returnTypes.push("object");
          else returnTypes.push(arg.type);
        },
      });

      internalHelpers.push({
        name: helperName,
        returnType: returnTypes[0] ?? "unknown",
        jsDoc: extractJsDoc(stmt) ?? null,
      });
    }
  }

  // ── useEffect calls ──────────────────────────────────────────────────────────
  const effects = [];
  traverse({ type: "File", program: { type: "Program", body: body.body } }, {
    CallExpression(p) {
      const callee = p.node.callee;
      if (callee.type !== "Identifier" || callee.name !== "useEffect") return;

      const args = p.node.arguments;
      const depsNode = args[1];
      let deps = null;
      if (depsNode?.type === "ArrayExpression") {
        deps = depsNode.elements.map((el) => el?.name ?? "?");
      }

      effects.push({
        deps,
        isMount: Array.isArray(deps) && deps.length === 0,
      });
    },
  });

  // ── ViewPanel detection (marker OR auto-detect) ──────────────────────────────
  const viewPanels = [];

  function resolveChildren(names) {
    return names.map((childName) => ({
      name: childName,
      importPath: imports.find((i) => i.specifiers.includes(childName))?.source ?? null,
    }));
  }

  // Known third-party PascalCase components that should never be treated
  // as ViewPanel children. Add to this list as needed.
  const LIBRARY_COMPONENTS = new Set([
    // React Bootstrap
    "Container", "Row", "Col", "Card", "Badge", "Button", "Form",
    "ListGroup", "Modal", "Nav", "Navbar", "Offcanvas", "Table",
    "Alert", "Spinner", "Stack", "Image", "Figure", "Accordion",
    "Breadcrumb", "Dropdown", "InputGroup", "Pagination", "Tab",
    "Tabs", "Toast", "Tooltip", "Popover", "ProgressBar",
    // React Router
    "BrowserRouter", "Route", "Routes", "Link", "NavLink", "Outlet",
    "Navigate", "Router",
    // React Hook Form
    "FormProvider", "Controller",
    // TanStack Query
    "QueryClientProvider", "QueryClient",
    // Generic React
    "Fragment", "StrictMode", "Suspense", "ErrorBoundary",
    // HTML-like wrappers that are often PascalCase in component libs
    "ThemeToggle",
  ]);

  // ── Internal sub-components (PascalCase functions in same file, not the main export) ──
  const internalSubComponents = [];
  for (const [fnName, fnNode] of topLevelFunctions.entries()) {
    if (fnName === name) continue;                    // skip the main export itself
    if (!registered.has(fnName) && /^[A-Z]/.test(fnName)) {
      // It's a PascalCase function in this file that wasn't exported — treat as sub-component
      const jsDocAbove = extractJsDoc(fnNode) ?? null;
      internalSubComponents.push({
        name: fnName,
        jsDoc: jsDocAbove,
      });
    }
  }

  // Strategy 1: explicit {/*ViewPanel*/} comment marker
  traverse({ type: "File", program: { type: "Program", body: body.body } }, {
    JSXExpressionContainer(p) {
      const expr = p.node.expression;
      if (expr.type !== "JSXEmptyExpression") return;

      const comment = expr.innerComments?.[0];
      if (!comment?.value.trim().startsWith("ViewPanel")) return;

      const siblings = p.parent?.children ?? [];
      const idx = siblings.indexOf(p.node);
      const nextEl = siblings.slice(idx + 1).find((n) => n.type === "JSXElement");
      const children = nextEl ? collectJsxChildren(nextEl) : [];

      // Filter out known library components
      const ownChildren = children.filter(n => !LIBRARY_COMPONENTS.has(n));

      viewPanels.push({
        marker: comment.value.trim(),
        line: p.node.loc?.start.line ?? null,
        autoDetected: false,
        children: resolveChildren(ownChildren),
      });
    },
  });

  // Strategy 2: auto-detect — any JSX element whose direct children
  // are exclusively PascalCase components that are NOT library components.
  // Only runs if no explicit marker was found in this component.
  if (viewPanels.length === 0) {
    traverse({ type: "File", program: { type: "Program", body: body.body } }, {
      JSXElement(p) {
        // Only look at direct JSXElement children (skip text nodes, expressions)
        const directChildren = (p.node.children ?? []).filter(
          (n) => n.type === "JSXElement"
        );

        if (directChildren.length < 2) return;

        const names = directChildren
          .map((n) => n.openingElement?.name?.name)
          .filter(Boolean);

        if (names.length !== directChildren.length) return;

        // All must be PascalCase
        if (!names.every((n) => /^[A-Z]/.test(n))) return;

        // All must NOT be known library components
        if (names.every((n) => LIBRARY_COMPONENTS.has(n))) return;
        if (names.some((n) => LIBRARY_COMPONENTS.has(n))) return;

        // Avoid double-registering the exact same set of names
        const alreadyCaptured = viewPanels.some(
          (vp) =>
            vp.children.length === names.length &&
            vp.children.every((c, i) => c.name === names[i])
        );
        if (alreadyCaptured) return;

        viewPanels.push({
          marker: "ViewPanel (auto-detected)",
          line: p.node.loc?.start.line ?? null,
          autoDetected: true,
          children: resolveChildren(names),
        });
      },
    });
  }

  // ── JSX root structure (top-level elements in return) ───────────────────────
  let jsxRootElements = [];
  traverse({ type: "File", program: { type: "Program", body: body.body } }, {
    ReturnStatement(p) {
      const arg = p.node.argument;
      if (!arg) return;
      if (arg.type === "JSXElement" || arg.type === "JSXFragment") {
        jsxRootElements = collectJsxChildren(arg);
      }
    },
  });

  // ── Hooks used ───────────────────────────────────────────────────────────────
  const hooksUsed = [];
  traverse({ type: "File", program: { type: "Program", body: body.body } }, {
    CallExpression(p) {
      const callee = p.node.callee;
      if (callee.type === "Identifier" && /^use[A-Z]/.test(callee.name)) {
        if (!hooksUsed.includes(callee.name)) hooksUsed.push(callee.name);
      }
    },
  });

  // ── Return shape extraction ───────────────────────────────────────────────────
  // Walks the final return statement looking for an ObjectExpression.
  // Extracts top-level keys and any nested keys one level deep.
  // Works for both components (returns JSX — skipped) and hooks/utils (returns objects).
  let returnShape = null;

  traverse({ type: "File", program: { type: "Program", body: body.body } }, {
    ReturnStatement(p) {
      const arg = p.node.argument;
      if (!arg || arg.type !== "ObjectExpression") return;

      // Skip if it looks like a JSX wrapper object (has a type/props/children shape)
      const keys = arg.properties
        .filter(prop => prop.type === "ObjectProperty" || prop.type === "Property")
        .map(prop => prop.key?.name ?? prop.key?.value)
        .filter(Boolean);

      if (keys.length === 0) return;

      // Build the shape — top-level keys with optional nested keys
      const shape = keys.map(key => {
        const prop = arg.properties.find(
          p => (p.key?.name ?? p.key?.value) === key
        );

        let nested = [];
        if (prop?.value?.type === "ObjectExpression") {
          nested = prop.value.properties
            .filter(np => np.type === "ObjectProperty" || np.type === "Property")
            .map(np => np.key?.name ?? np.key?.value)
            .filter(Boolean);
        }

        // Detect value kind: function, async function, primitive, object, array
        let kind = "value";
        const val = prop?.value;
        if (val) {
          if (val.type === "ArrowFunctionExpression" || val.type === "FunctionExpression") {
            kind = val.async ? "async function" : "function";
          } else if (val.type === "ObjectExpression") {
            kind = "object";
          } else if (val.type === "ArrayExpression") {
            kind = "array";
          } else if (val.type === "StringLiteral" || val.type === "TemplateLiteral") {
            kind = "string";
          } else if (val.type === "BooleanLiteral") {
            kind = "boolean";
          } else if (val.type === "NumericLiteral") {
            kind = "number";
          } else if (val.type === "NullLiteral") {
            kind = "null";
          } else if (val.type === "Identifier") {
            kind = "ref";   // points at another variable
          } else if (val.type === "ConditionalExpression" || val.type === "LogicalExpression") {
            kind = "derived";
          }
        }

        return { key, kind, nested };
      });

      // Only store if we found a meaningful object (at least 2 keys)
      if (shape.length >= 2) {
        returnShape = shape;
      }
    },
  });

  // ── Debug: log ViewPanel results for every component ────────────────────────
  if (isComponent) {
    if (viewPanels.length > 0) {
      console.log(`\n  ✅ [${name}] ViewPanels found: ${viewPanels.length}`);
      viewPanels.forEach((vp, i) => {
        console.log(`     Panel ${i + 1} (${vp.autoDetected ? "auto" : "marker"}) — ${vp.children.length} children: ${vp.children.map(c => c.name).join(", ")}`);
      });
    } else {
      const seen = [];
      traverse({ type: "File", program: { type: "Program", body: body.body } }, {
        JSXElement(p) {
          const directJsx = (p.node.children ?? []).filter(n => n.type === "JSXElement");
          if (directJsx.length >= 2) {
            const childNames = directJsx.map(n => n.openingElement?.name?.name ?? "?");
            seen.push({ tag: p.node.openingElement?.name?.name ?? "?", children: childNames });
          }
        },
      });
      if (seen.length > 0) {
        console.log(`\n  ⚠ [${name}] No ViewPanels detected. JSX containers with 2+ children:`);
        seen.forEach(s => console.log(`     <${s.tag}> → [${s.children.join(", ")}]`));
      }
    }
  }

  return {
    name,
    isComponent,
    isHook,
    isDefault: false,
    jsDoc: jsDoc ?? null,
    internalHelpers,
    internalSubComponents,
    effects,
    viewPanels,
    jsxRootElements,
    hooksUsed,
    returnShape,
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

console.log("🔍 Scanning source files…");
const files = getAllFiles(SRC_DIR);
console.log(`   Found ${files.length} TypeScript/TSX files`);

const output = [];

for (const file of files) {
  process.stdout.write(`   Parsing ${relative(process.cwd(), file)}… `);
  const result = extractFromFile(file);
  if (result && result.components.length > 0) {
    output.push(result);
    console.log(`✓ (${result.components.length} component${result.components.length > 1 ? "s" : ""})`);
  } else {
    console.log("skipped (no exports)");
  }
}

// Flatten to a components map keyed by name for easy lookup in templates
const componentMap = {};
for (const fileResult of output) {
  for (const comp of fileResult.components) {
    componentMap[comp.name] = {
      ...comp,
      file: fileResult.file,
      fileName: fileResult.fileName,
      imports: fileResult.imports,
    };
  }
}

const finalOutput = {
  generatedAt: new Date().toISOString(),
  totalFiles: files.length,
  totalComponents: Object.keys(componentMap).length,
  components: componentMap,
};

mkdirSync("./docs-eleventy/src/_data", { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(finalOutput, null, 2));

console.log(`\n✅ Done. ${Object.keys(componentMap).length} components written to ${OUT_FILE}`);
