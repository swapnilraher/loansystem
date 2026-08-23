import { fileURLToPath } from "node:url";

const stripBootstrapPlugin = fileURLToPath(
  new URL("./postcss-plugins/strip-bootstrap-important.cjs", import.meta.url)
);

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Must run AFTER Tailwind: Tailwind inlines the bootstrap @import into its
    // `@layer bootstrap`, and this strips the `!important` off those rules so
    // they stop overriding same-named Tailwind utilities. See the plugin file.
    [stripBootstrapPlugin]: {},
  },
};

export default config;

