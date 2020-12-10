import { IntercomServer } from "lib/intercom/server";

export const intercom = new IntercomServer();

export class PublicError extends Error {}
