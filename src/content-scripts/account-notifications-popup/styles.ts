import { ACCOUNT_NOTIFICATION_POPUP_AD_HEIGHT } from 'lib/notifications';

export const ACCOUNT_NOTIFICATION_POPUP_STYLES = `
  :host {
    all: initial;
    position: fixed;
    top: 8px;
    right: 40px;
    z-index: 2147483647;
    width: 360px;
    max-width: calc(100vw - 32px);
    pointer-events: auto;
    font-family: Inter, system-ui, sans-serif;
    color: #151618;
    color-scheme: light;
  }

  * {
    box-sizing: border-box;
  }

  .card {
    background: #fbfbfb;
    border-radius: 8px;
    box-shadow: 0px 2px 8px 0px rgba(0, 0, 0, 0.08);
    overflow: hidden;
    cursor: pointer;
  }

  .header {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 16px;
  }

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
  }

  .logo img {
    width: 20px;
    height: 20px;
  }

  .title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #aeaeb2;
    cursor: pointer;
    flex-shrink: 0;
  }

  .close svg {
    width: 24px;
    height: 24px;
    fill: currentColor;
  }

  .body {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0 4px 4px;
  }

  .row {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 8px;
    text-decoration: none;
    color: inherit;
  }

  .row:hover {
    background: #e3ecf8;
  }

  .icon {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
  }

  .icon img {
    width: 83.3333%;
    aspect-ratio: 1;
    border-radius: 999px;
    object-fit: cover;
  }

  .badge {
    position: absolute;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border-radius: 999px;
    background: #fff;
    border: 0.8px solid #e4e4e4;
    color: #1373e4;
  }

  .badge svg {
    width: 14px;
    height: 14px;
    fill: currentColor;
  }

  .text {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
  }

  .text-row {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  .item-title {
    flex: 1;
    min-width: 0;
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
    max-height: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-description {
    min-width: 0;
    margin: 0;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    max-height: 16px;
    color: #151618;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .item-description.muted {
    color: #707070;
  }

  .dot {
    width: 8px;
    height: 8px;
    margin: 6px;
    border-radius: 999px;
    background: #1373e4;
    flex-shrink: 0;
  }

  .ad {
    position: relative;
    display: flex;
    align-items: center;
    padding-vertical: 8px;
  }

  .ad-iframe {
    width: 100%;
    height: ${ACCOUNT_NOTIFICATION_POPUP_AD_HEIGHT}px;
    border: none;
    display: block;
  }

  .ad-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #fbfbfb;
  }

  .ad-spinner {
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid #e4e4e4;
    border-top-color: #1373e4;
    animation: ad-spin 0.8s linear infinite;
  }

  .ad-fallback {
    justify-content: center;
  }

  .ad-fallback-text {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    color: #aeaeb2;
  }

  @keyframes ad-spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
