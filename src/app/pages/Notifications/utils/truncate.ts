const TITLE_MAX_LENGTH = 70;
const DESCRIPTION_MAX_LENGTH = 110;

export const truncateTitle = (title: string) =>
  title.slice(0, TITLE_MAX_LENGTH) + (title.length > TITLE_MAX_LENGTH ? '...' : '');

export const truncateDescription = (description: string) =>
  description.slice(0, DESCRIPTION_MAX_LENGTH) + (description.length > DESCRIPTION_MAX_LENGTH ? '...' : '');
