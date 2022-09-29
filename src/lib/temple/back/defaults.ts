import { IntercomServer } from 'lib/intercom';

export const intercom = new IntercomServer();

export class PublicError extends Error {}
