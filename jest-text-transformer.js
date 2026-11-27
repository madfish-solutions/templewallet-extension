module.exports = {
  process: sourceText => ({ code: `module.exports = ${JSON.stringify(sourceText)};` })
};
