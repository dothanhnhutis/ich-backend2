import { defineConfig } from "tsup";
import * as glob from "glob";
const entries = glob.sync("src/**/*.{ts,ejs}", {
  ignore: "src/**/*.test.ts",
  dotRelative: true,
  posix: true,
});

export default defineConfig((opts) => ({
  entry: entries,
  entryPoints: ["src/index.ts"],
  format: ["cjs", "esm"],
  minify: true,
  bundle: !opts.watch || true,
  watch: opts.watch || false,
  skipNodeModulesBundle: true,
  dts: true,
  // outDir: configs.NODE_ENV === "production" ? "dist" : "lib",
  target: "es2020",
  splitting: true,
  sourcemap: false,
  clean: true,
}));
