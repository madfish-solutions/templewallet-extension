import { AI_CHATBOT_ADS_TIMING } from './constants';

export function getStyles(): string {
  return `
    :host {
      all: initial;
    }

    .temple-nudge {
      display: flex;
      align-items: center;
      background: #FFFFFF;
      border-radius: 8px;
      box-shadow: 0 2px 8px 0 rgba(0, 0, 0, 0.08);
      box-sizing: border-box;
      opacity: 0;
      overflow: hidden;
      padding: 8px 8px 8px 16px;
      pointer-events: auto;
      position: relative;
      transition: opacity ${AI_CHATBOT_ADS_TIMING.entranceMs}ms cubic-bezier(0.2, 0.8, 0.2, 1);
      height: 40px;
      width: 608px;
    }

    .temple-nudge-visible {
      opacity: 1;
    }

    .temple-nudge-exiting {
      opacity: 0;
      transition-duration: ${AI_CHATBOT_ADS_TIMING.exitMs}ms;
    }

    .temple-copy {
      font-family: Inter, Arial, sans-serif;
      font-size: 12px;
      font-style: normal;
      font-weight: 300;
      line-height: 16px;
      color: #707070;
    }

    .temple-copy span {
      font-size: 12px;
      font-style: normal;
      font-weight: 500;
      line-height: 16px;
      color: #1373E4;
    }

    .temple-enable {
      appearance: none;
      background: #1373E4;
      border: 0;
      border-radius: 6px;
      color: #FFFFFF;
      cursor: pointer;
      flex: 0 0 auto;
      font-family: Inter, Arial, sans-serif;
      font-size: 12px;
      font-style: normal;
      font-weight: 500;
      line-height: 16px;
      padding: 4px 8px;
      margin-left: 8px;
      margin-right: 12px;
    }

    .temple-enable:hover {
      background: #1062C2;
    }

    .temple-close {
      display: inline-flex;
      justify-content: center;
      align-items: center;
      appearance: none;
      background: transparent;
      border: 0;
      padding: 0;
      cursor: pointer;
    }

    .temple-countdown {
      background: #1373E4;
      height: 2px;
      left: 0;
      position: absolute;
      top: 0;
      width: 100%;
    }
  `;
}
