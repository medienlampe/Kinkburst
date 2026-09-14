import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/Smorkinkboard/",
  plugins: [react()],
  server: {
    port: 3000,
  },
  css: {
    preprocessorOptions: {
      scss: {
        // bulma@1.0.4 (the latest release) still calls the deprecated Sass if()
        // function in its own utilities (functions.scss, mixins.scss).
        // Silence that single deprecation for third-party code; our own styles
        // keep all warnings enabled. Remove once bulma ships a fix.
        // See https://sass-lang.com/d/if-function
        silenceDeprecations: ["if-function"],
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/setupTests.ts"],
  },
});
