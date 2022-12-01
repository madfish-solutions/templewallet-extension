const fs = require('fs');
const path = require('path');

const MESSAGES_FILE = 'messages.json';
const LOCALES_PATH = path.join(__dirname, '../public/_locales');

const localeToExport = getArgValue('--locale');

const enMessages = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, 'en', MESSAGES_FILE), 'utf8'));
const localeMessages = JSON.parse(fs.readFileSync(path.join(LOCALES_PATH, localeToExport, MESSAGES_FILE), 'utf8'));

const mergedMessages = {};

for (const id in enMessages) {
  if (localeMessages[id]) {
    mergedMessages[id] = localeMessages[id]
  } else {
    mergedMessages[id] = enMessages[id]
  }
}

fs.writeFileSync(
  path.join(LOCALES_PATH, localeToExport, MESSAGES_FILE),
  JSON.stringify(mergedMessages, null, 2),
  'utf8'
);

function getArgValue(argKey) {
  const keyIndex = process.argv.findIndex(v => v === argKey);
  if (keyIndex === -1) throw new Error(`${argKey} required`);
  const value = process.argv[keyIndex + 1];
  if (typeof value !== 'string') throw new Error(`Value for ${argKey} required`);
  return value;
}
