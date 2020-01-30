const { NODE_ENV } = process.env;

module.exports = {
  plugins: [
    require("postcss-import"),
    require("tailwindcss"),
    NODE_ENV === "production" && require("@fullhuman/postcss-purgecss")(),
    require("autoprefixer"),
    NODE_ENV === "production" && require("cssnano")({ preset: "default" })
  ].filter(Boolean)
};
