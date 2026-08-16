const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Must run AFTER Tailwind: Tailwind inlines the bootstrap @import into its
    // `@layer bootstrap`, and this strips the `!important` off those rules so
    // they stop overriding same-named Tailwind utilities. See the plugin file.
    "./postcss-plugins/strip-bootstrap-important.cjs": {},
  },
}

export default config
