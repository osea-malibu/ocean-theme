import esbuild from "esbuild";

const entryPoints = [
  "src/scripts/main.js",
  "src/scripts/customer.js",
  "src/scripts/ingredient-glossary.js",
  "src/scripts/share.js",
  "src/scripts/facets.js",
  "src/scripts/password-modal.js",
];

const sharedConfig = {
  entryPoints,
  outdir: "assets",
  entryNames: "[name].min",
  bundle: true,
  minify: true,
  target: ["es2017"],
};

const run = async () => {
  if (process.argv.includes("--watch")) {
    const ctx = await esbuild.context(sharedConfig);
    await ctx.watch();
    console.log("👀 Watching for changes...");
  } else {
    await esbuild.build(sharedConfig);
    console.log("✨ Build complete.");
  }
};

run();
