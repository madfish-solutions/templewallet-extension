"use strict";

const { NODE_ENV } = process.env;

module.exports = {
  plugins: [
    require("postcss-import"),
    require("tailwindcss"),
    NODE_ENV === "production" &&
      require("@fullhuman/postcss-purgecss")({
        content: ["./static/**/*.{html,js}", "./ts/**/*.{js,jsx,ts,tsx}"],
        // Include any special characters you're using in this regular expression
        defaultExtractor: content => content.match(/[A-Za-z0-9-_:/]+/g) || []
      }),
    require("autoprefixer"),
    NODE_ENV === "production" &&
      require("cssnano")({
        preset: "default"
      })
  ].filter(Boolean)
};
