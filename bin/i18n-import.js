// Unicode conversion
// https://r12a.github.io/app-conversion/

const fs = require("fs");
const path = require("path");

const MESSAGES_FILE = "messages.json";
const DEFAULT_LOCALE = "en";
const LOCALES_PATH = path.join(__dirname, "../public/_locales");

const defaultMessages = JSON.parse(
  fs.readFileSync(
    path.join(LOCALES_PATH, DEFAULT_LOCALE, MESSAGES_FILE),
    "utf8"
  )
);

const fileToImport = getArgValue("--file");
const locale = getArgValue("--locale");

const importMessages = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), fileToImport), "utf8")
);

const toImport = {};

for (const id in importMessages) {
  if (id in defaultMessages) {
    toImport[id] = {
      ...defaultMessages[id],
      message: importMessages[id],
    };
  }
}

const localeDir = path.join(LOCALES_PATH, locale);

if (!fs.existsSync(localeDir)) {
  fs.mkdirSync(localeDir);
}

fs.writeFileSync(
  path.join(localeDir, MESSAGES_FILE),
  JSON.stringify(toImport, null, 2),
  "utf8"
);

function getArgValue(argKey) {
  const keyIndex = process.argv.findIndex((v) => v === argKey);
  if (keyIndex === -1) throw new Error(`${argKey} required`);
  const value = process.argv[keyIndex + 1];
  if (typeof value !== "string")
    throw new Error(`Value for ${argKey} required`);
  return value;
}
