export function assertUnreachable(value: never, comment?: string): any {
  let details = '';
  if (comment) details = `. ${comment}`;
  else if (value !== undefined) details = `. typeof value = ${typeof value}`;

  throw new Error('Unreachable code' + details);
}
