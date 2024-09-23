// Original: https://github.com/dicebear/dicebear/blob/8.x/packages/%40dicebear/initials/src/utils/convertColor.ts

export function convertColor(color: string): string {
  return 'transparent' === color ? color : `#${color}`;
}
