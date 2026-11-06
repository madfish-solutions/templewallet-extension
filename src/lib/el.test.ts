import { el } from './el';

describe('el', () => {
  it('returns the matching HTML element for a standard tag', () => {
    const button = el('button', 'close', 'Close');

    expect(button).toBeInstanceOf(HTMLButtonElement);
    expect(button.className).toBe('close');
    expect(button.textContent).toBe('Close');
  });

  it('omits class and text when they are not provided', () => {
    const host = el('div');

    expect(host).toBeInstanceOf(HTMLDivElement);
    expect(host.className).toBe('');
    expect(host.textContent).toBe('');
  });
});
