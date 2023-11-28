export const getSlotId = () => {
  const hostnameParts = window.parent.location.hostname.split('.').filter(part => part !== 'www');
  const serviceId = hostnameParts[0];
  const pathnameParts = window.parent.location.pathname
    .split('/')
    .filter(part => part !== '' && !/(0x)?[0-9a-f]+/i.test(part) && !/[0-9a-z]{30,}/i.test(part));

  return [serviceId, ...pathnameParts].join('-');
};
