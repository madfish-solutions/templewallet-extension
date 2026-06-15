export function getPopupStyles() {
  return `
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    .tw-popup,
    .tw-popup button {
      font-family: Inter, Arial, sans-serif;
    }

    .tw-popup {
      width: 360px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.08);
      overflow: visible;
      position: relative;
      animation: tw-slide-in 0.3s ease-out;
    }

    @keyframes tw-slide-in {
      from { opacity: 0; transform: translateY(-12px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .tw-popup-header {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 16px;
      border-bottom: 0.5px solid #E4E4E4;
      position: relative;
    }

    .tw-popup-temple-icon {
      width: 20px;
      height: 20px;
      margin: 2px;
    }

    .tw-popup-title {
      font-size: 16px;
      font-weight: 500;
      color: #151618;
      flex: 1;
      line-height: 24px;
    }

    .tw-popup-header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .tw-popup-settings-btn {
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 4px 8px;
      border: none;
      background: rgba(19, 115, 228, 0.15);
      color: #1373E4;
      font-size: 12px;
      font-weight: 500;
      line-height: 16px;
      cursor: pointer;
      border-radius: 6px;
      transition: background 0.15s;
      white-space: nowrap;
    }

    .tw-popup-settings-btn:hover {
      background: #D7E3F2;
    }

    .tw-popup-close-btn {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: transparent;
      cursor: pointer;
      margin: 4px;
    }

    .tw-popup-settings-dropdown {
      position: absolute;
      right: 52px;
      top: 44px;
      padding: 8px;
      background: #fff;
      border-radius: 6px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      overflow: hidden;
      z-index: 10;
    }

    .tw-popup-dropdown-item {
      display: flex;
      align-items: center;
      gap: 4px;
      padding: 6px 8px;
      border: none;
      border-radius: 6px;
      background: transparent;
      cursor: pointer;
      font-size: 12px;
      font-weight: 300;
      line-height: 16px;
      color: #151618;
      width: 100%;
      text-align: left;
      white-space: nowrap;
    }

    .tw-popup-dropdown-icon {
      width: 16px;
      height: 16px;
      margin: 4px;
    }

    .tw-popup-dropdown-item:hover {
      background: #E3ECF8;
    }

    .tw-popup-body {
      padding: 24px 16px 16px;
    }

    .tw-popup-offer-card {
      display: flex;
      gap: 8px;
      align-items: flex-start;
      margin-bottom: 24px;
    }

    .tw-popup-merchant-icon {
      width: 100px;
      height: 50px;
      border-radius: 8px;
      object-fit: contain;
      flex-shrink: 0;
      background: #F3F4F6;
    }

    .tw-popup-merchant-icon-placeholder {
      width: 100px;
      height: 50px;
      border-radius: 8px;
      background: #F3F4F6;
      flex-shrink: 0;
    }

    .tw-popup-offer-info {
      flex: 1;
      min-width: 0;
    }

    .tw-popup-offer-title {
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      color: #000000;
      margin-bottom: 4px;
    }

    .tw-popup-offer-desc {
      font-size: 12px;
      font-weight: 300;
      line-height: 16px;
      color: #707070;
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
      font-size: 12px;
      cursor: pointer;
      padding: 2px 0 0;
      font-weight: 400;
    }

    .tw-popup-show-more:hover {
      color: #2563EB;
    }

    .tw-popup-activate-btn {
      width: 100%;
      padding: 8px;
      background: #FF5B00;
      color: #fff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      line-height: 24px;
      cursor: pointer;
    }

    .tw-popup-activate-btn:hover {
      background: #E85300;
    }

    .tw-popup-activate-btn:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  `;
}
