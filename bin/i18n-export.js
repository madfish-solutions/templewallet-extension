const fs = require('fs');
const path = require('path');

const MESSAGES_FILE = 'messages.json';
const LOCALES_PATH = path.join(__dirname, '../public/_locales');

const localeToExport = getArgValue('--locale');

const messages = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, localeToExport, MESSAGES_FILE), 'utf8'));

const toExport = {};

for (const id in messages) {
  toExport[id] = messages[id].message;
}

fs.writeFileSync(
  path.join(process.cwd(), `messages-to-export.${localeToExport}.json`),
  JSON.stringify(toExport, null, 2),
  'utf8'
);

function getArgValue(argKey) {
  const keyIndex = process.argv.findIndex(v => v === argKey);
  if (keyIndex === -1) throw new Error(`${argKey} required`);
  const value = process.argv[keyIndex + 1];
  if (typeof value !== 'string') throw new Error(`Value for ${argKey} required`);
  return value;
}
