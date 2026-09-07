/**
 * Installs the "@/..." resolver hook. Use with --import:
 *
 *   node --env-file=.env --import ./scripts/alias-register.mjs scripts/<script>.mjs
 */
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./alias-hooks.mjs", pathToFileURL("./scripts/").href);
