const FONT_FAMILY = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";

export function getPopupStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: inherit;
    }

    .tw-popup {
      width: 360px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      font-family: ${FONT_FAMILY};
      overflow: visible;
      animation: tw-slide-in 0.3s ease-out;
    }

    @keyframes tw-slide-in {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tw-popup-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px;
      border-bottom: 1px solid #F3F4F6;
      position: relative;
    }

    .tw-popup-temple-icon {
      width: 20px;
      height: 20px;
    }

    .tw-popup-title {
      font-size: 16px;
      font-weight: 600;
      color: #151618;
      flex: 1;
    }

    .tw-popup-header-actions {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .tw-popup-settings-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      border: none;
      background: rgba(19, 115, 228, 0.15);
      color: #1373E4;
      font-family: ${FONT_FAMILY};
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s;
      white-space: nowrap;
    }

    .tw-popup-settings-btn:hover {
      background: rgba(19, 115, 228, 0.2);
    }

    .tw-popup-settings-btn-open {
      background: #F4F4F4;
      color: #707070;
    }

    .tw-popup-settings-btn-open:hover {
      background: #EBEBEB;
    }

    .tw-popup-btn-icon {
      width: 10px;
      height: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      border-radius: 8px;
      transition: background 0.15s;
    }

    .tw-popup-btn-icon:hover {
      background: #F3F4F6;
    }

    .tw-popup-settings-dropdown {
      position: absolute;
      right: 40px;
      top: 42px;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      z-index: 10;
      border: 1px solid #E5E7EB;
    }

    .tw-popup-dropdown-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 14px 16px;
      border: none;
      background: transparent;
      cursor: pointer;
      font-family: ${FONT_FAMILY};
      font-size: 12px;
      color: #151618;
      width: 100%;
      text-align: left;
      white-space: nowrap;
      transition: background 0.15s;
    }

    .tw-popup-dropdown-icon {
      width: 16px;
      height: 16px;
      padding: 4px;
      box-sizing: content-box;
      flex-shrink: 0;
    }

    .tw-popup-dropdown-item-snooze {
      padding-bottom: 6px;
    }

    .tw-popup-dropdown-item-disable {
      padding-top: 6px;
    }

    .tw-popup-dropdown-item:hover {
      background: #F9FAFB;
    }

    .tw-popup-body {
      padding: 24px 16px 16px;
    }

    .tw-popup-offer-card {
      display: flex;
      gap: 16px;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .tw-popup-merchant-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: contain;
      flex-shrink: 0;
      background: #F9FAFB;
    }

    .tw-popup-merchant-icon-placeholder {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      background: #F3F4F6;
      flex-shrink: 0;
    }

    .tw-popup-offer-info {
      flex: 1;
      min-width: 0;
    }

    .tw-popup-offer-title {
      font-size: 16px;
      font-weight: 600;
      color: #000000;
      margin-bottom: 4px;
    }

    .tw-popup-offer-desc {
      font-size: 12px;
      color: #707070;
      line-height: 1.4;
    }

    .tw-popup-offer-desc-clamped {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .tw-popup-show-more {
      background: none;
      border: none;
      color: #1373E4;
      font-family: ${FONT_FAMILY};
      font-size: 12px;
      cursor: pointer;
      padding: 2px 0 0;
      font-weight: 500;
    }

    .tw-popup-show-more:hover {
      color: #2563EB;
    }

    .tw-popup-activate-btn {
      width: 100%;
      padding: 12px;
      background: #FF5B00;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-family: ${FONT_FAMILY};
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.15s;
    }

    .tw-popup-activate-btn:hover {
      background: #E65200;
    }

    .tw-popup-activate-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .tw-popup-disclaimer {
      margin-top: 24px;
      padding: 0 24px;
      font-family: ${FONT_FAMILY};
      font-size: 10px;
      color: #9CA3AF;
      line-height: 1.4;
      text-align: center;
    }

    .tw-popup-disclaimer a {
      color: #9CA3AF;
      text-decoration: underline;
      font-weight: 600;
    }
  `;
}
