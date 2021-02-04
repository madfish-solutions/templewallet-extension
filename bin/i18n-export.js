const fs = require("fs");
const path = require("path");

const MESSAGES_FILE = "messages.json";
const DEFAULT_LOCALE = "en";
const LOCALES_PATH = path.join(__dirname, "../public/_locales");

const messages = JSON.parse(
  fs.readFileSync(
    path.join(LOCALES_PATH, DEFAULT_LOCALE, MESSAGES_FILE),
    "utf8"
  )
);

const toExport = {};

for (const id in messages) {
  toExport[id] = messages[id].message;
}

fs.writeFileSync(
  path.join(process.cwd(), `messages-to-export.${DEFAULT_LOCALE}.json`),
  JSON.stringify(toExport, null, 2),
  "utf8"
);
