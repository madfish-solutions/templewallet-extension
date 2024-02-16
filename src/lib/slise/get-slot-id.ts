const hostnameRegex =
  /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9])\.)+([A-Za-z]|[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9])$/;
const addressRegex = /^(0x)?[0-9a-z]{30,}$/i;
const decimalIdRegex = /^\d+$/;
const startsWithAtRegex = /^@/;
const pathPartsToTruncateRegexes = [hostnameRegex, addressRegex, decimalIdRegex, startsWithAtRegex];

const SLOT_ID_LENGTH_THRESHOLD = 40;

export const getSlotId = () => {
  const { hostname, pathname, hash } = window.parent.location;
  const hostnameParts = hostname.split('.').filter(part => part !== 'www');
  const serviceId = hostnameParts[0];

  const rawRestSlotIdParts = `${pathname}/${hash.replace('#', '')}`;
  const restSlotIdParts = rawRestSlotIdParts
    .split('/')
    .filter(part => part !== '' && !pathPartsToTruncateRegexes.some(regex => regex.test(part)));

  const longSlotId = [serviceId, ...restSlotIdParts].join('-');

  return longSlotId.length > SLOT_ID_LENGTH_THRESHOLD ? serviceId : longSlotId;
};
