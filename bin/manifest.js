#!/usr/bin/env node

"use strict";

// Makes the script crash on unhandled rejections instead of silently
// ignoring them. In the future, promise rejections that are not handled will
// terminate the Node.js process with a non-zero exit code.
process.on("unhandledRejection", err => {
  throw err;
});

const fs = require("fs");
const path = require("path");
const sade = require("sade");
const wextManifest = require("wext-manifest");

const CWD = process.cwd();
const { NODE_ENV, TARGET_BROWSER = "chrome" } = process.env;

const prog = sade("manifest");

prog
  .command("create <template>")
  .describe(
    "Create the manifest file. Expects an `manifest.template.js` entry file."
  )
  .option("-o, --output", "Change the name of the output file", "bundle.js")
  .example("create -o build/manifest.json src/manifest.template.js")
  .action((template, opts) => {
    const mnfst = wextManifest[TARGET_BROWSER](
      require(path.join(CWD, template))
    );

    const outputDir = path.dirname(opts.output);
    fs.writeFileSync(
      path.join(outputDir, mnfst.name),
      NODE_ENV === "production"
        ? JSON.stringify(JSON.parse(mnfst.content))
        : mnfst.content
    );
  });

prog.parse(process.argv);
