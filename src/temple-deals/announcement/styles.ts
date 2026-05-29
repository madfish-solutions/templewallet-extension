const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function getDealsAnnouncementStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: inherit;
    }

    .tw-deals-popup {
      width: 360px;
      background: #FBFBFB;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      font-family: ${FONT_FAMILY};
      overflow: hidden;
      animation: tw-slide-in 0.3s ease-out;
    }

    @keyframes tw-slide-in {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tw-deals-header {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 16px;
      border-bottom: 1px solid #E4E4E4;
    }

    .tw-deals-temple-icon {
      width: 20px;
      height: 20px;
    }

    .tw-deals-title {
      font-family: ${FONT_FAMILY};
      font-size: 16px;
      font-weight: 500;
      color: #151618;
      flex: 1;
    }

    .tw-deals-close-btn {
      background: none;
      border: none;
      cursor: pointer;
      color: #AEAEB2;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .tw-deals-body {
      padding: 24px 16px 16px;
      display: flex;
      flex-direction: column;
    }

    .tw-deals-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tw-deals-hero {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .tw-deals-hero-img {
      width: 120px;
      height: 65px;
      object-fit: contain;
      flex-shrink: 0;
    }

    .tw-deals-offer-title {
      font-family: ${FONT_FAMILY};
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      color: #151618;
      flex: 1;
    }

    .tw-deals-offer-body {
      font-family: ${FONT_FAMILY};
      font-size: 12px;
      font-weight: 300;
      color: #707070;
      line-height: 16px;
    }

    .tw-deals-activate-btn {
      width: 100%;
      background: #FF5B00;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-family: ${FONT_FAMILY};
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      margin-top: 24px;
      margin-bottom: 8px;
    }

    .tw-deals-activate-btn:hover {
      opacity: 0.95;
    }

    .tw-deals-disclaimer {
      font-family: ${FONT_FAMILY};
      font-size: 10px;
      font-weight: 300;
      color: #707070;
      line-height: 12px;
      text-align: center;
    }

    .tw-deals-success-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 16px 16px 32px;
      gap: 16px;
    }

    .tw-deals-success-anim {
      width: 42px;
      height: 42px;
    }

    .tw-deals-success-title {
      font-family: ${FONT_FAMILY};
      font-size: 16px;
      font-weight: 500;
      color: #151618;
      text-align: center;
    }

    .tw-deals-success-body {
      font-family: ${FONT_FAMILY};
      font-size: 12px;
      font-weight: 300;
      color: #707070;
      line-height: 16px;
      text-align: center;
      margin-bottom: 8px;
    }

    .tw-deals-got-it-btn {
      width: 100%;
      background: #FF5B00;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      padding: 8px 12px;
      font-family: ${FONT_FAMILY};
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
    }

    .tw-deals-got-it-btn:hover {
      opacity: 0.95;
    }
  `;
}
