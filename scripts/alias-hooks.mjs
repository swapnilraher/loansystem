/**
 * Resolves the project's "@/..." TypeScript path alias for plain Node, and supplies
 * the file extension TypeScript imports leave off.
 *
 * tsconfig maps "@/*" to "src/*" and TS lets `import "@/lib/mongodb"` mean
 * `src/lib/mongodb.ts`. Node knows neither convention, so both are applied here.
 * Registered via scripts/alias-register.mjs.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const SRC = pathToFileURL(path.resolve("src") + path.sep).href;
const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];

/** Adds the extension TypeScript omitted, or resolves a directory to its index file. */
function withExtension(url) {
  let filePath;
  try {
    filePath = fileURLToPath(url);
  } catch {
    return url;
  }
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) return url;

  for (const ext of EXTENSIONS) {
    if (fs.existsSync(filePath + ext)) return pathToFileURL(filePath + ext).href;
  }
  for (const ext of EXTENSIONS) {
    const indexFile = path.join(filePath, "index" + ext);
    if (fs.existsSync(indexFile)) return pathToFileURL(indexFile).href;
  }
  return url;
}

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    return next(withExtension(SRC + specifier.slice(2)), context);
  }
  // Relative imports between src/ modules drop their extensions too.
  if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL) {
    const resolved = new URL(specifier, context.parentURL).href;
    const fixed = withExtension(resolved);
    if (fixed !== resolved) return next(fixed, context);
  }
  return next(specifier, context);
}
