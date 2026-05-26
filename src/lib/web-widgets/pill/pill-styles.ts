export const PILL_STYLES = `
  .tw-pill {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 6px;
    background-color: rgba(255, 91, 0, 0.15);
    color: #FF5B00;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-style: normal;
    font-weight: 400;
    line-height: 16px;
    max-width: 220px;
    vertical-align: middle;
    box-sizing: border-box;
    cursor: pointer;
  }

  .tw-pill__icon {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    object-fit: cover;
    flex: none;
  }

  .tw-pill__label {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .tw-hover-placeholder {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 452px;
    min-height: 376px;
    padding: 4px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    opacity: 0;
    transition: opacity 100ms ease;
    pointer-events: none;
  }

  .tw-hover-placeholder--visible {
    opacity: 1;
    pointer-events: auto;
  }
`;
