module.exports = {
  content: ["./static/**/*.{html,js,mjs}", "./ts/**/*.{js,jsx,ts,tsx}"],
  // Include any special characters you're using in this regular expression
  defaultExtractor: content => content.match(/[\w-/:]+(?<!:)/g) || []
};
