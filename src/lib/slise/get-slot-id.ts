export const getSlotId = () => {
  const hostnameParts = window.location.hostname.split('.').filter(part => part !== 'www');
  const serviceId = hostnameParts[0];
  const pathnameParts = window.location.pathname.split('/').filter(part => part !== '' && !/0x[0-9a-f]+/i.test(part));

  return [serviceId, ...pathnameParts].join('-');
};
