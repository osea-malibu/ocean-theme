import esbuild from "esbuild";

const entryPoints = [
  "src/js/main.js",
  "src/js/customer.js",
  "src/js/ingredient-glossary.js",
  "src/js/share.js",
  "src/js/facets.js",
  "src/js/password-modal.js",
  // Add other individual entry files here
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
