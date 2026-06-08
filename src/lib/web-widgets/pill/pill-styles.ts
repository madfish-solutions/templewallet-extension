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
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    width: 452px;
    height: 392px;
    padding: 4px;
    border-radius: 16px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.1);
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(6px);
    transition: opacity 160ms ease, transform 160ms ease;
    pointer-events: none;
  }
  /* Slides up into place when below the pill; slides down when shown above (matches the
     temple-deals google-search popup appear animation). */
  .tw-hover-placeholder--above {
    transform: translateY(-6px);
  }

  .tw-hover-placeholder--visible {
    opacity: 1;
    transform: translateY(0);
    pointer-events: auto;
  }

  .tw-hover-placeholder--visible::before {
    content: '';
    position: absolute;
    left: 0;
    right: 0;
    top: -10px;
    height: 10px;
  }
  .tw-hover-placeholder--above::before {
    top: auto;
    bottom: -10px;
  }

  .tw-card {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    position: relative;
    box-sizing: border-box;
    font-family: 'Inter', sans-serif;
    color: #151618;
    text-align: left;
  }
  .tw-card *,
  .tw-card *::before,
  .tw-card *::after {
    box-sizing: border-box;
  }
  /* Native form controls don't inherit font-family — without this buttons fall back to the UA font (Arial). */
  .tw-card button,
  .tw-card input,
  .tw-card select,
  .tw-card textarea {
    font-family: inherit;
  }

  .tw-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 48px;
    padding: 8px 12px;
  }
  .tw-card__collection {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
    text-decoration: none;
    cursor: pointer;
  }
  .tw-card__collection-label {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    min-width: 0;
  }
  .tw-card__collection-link-icon {
    display: none;
    flex: none;
    width: 16px;
    height: 16px;
    color: #1373e4;
    fill: currentColor;
  }
  .tw-card__collection:hover .tw-card__collection-name {
    color: #1373e4;
  }
  .tw-card__collection:hover .tw-card__collection-link-icon {
    display: inline-flex;
  }
  .tw-card__avatar {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    object-fit: cover;
    flex: none;
  }
  .tw-card__avatar--empty {
    background: linear-gradient(135.75deg, #ff5b00 2%, #f4be38 103%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tw-card__avatar-fallback {
    width: 20px;
    height: auto;
  }
  .tw-card__avatar-fallback path {
    fill: #ffffff;
  }
  .tw-card__collection-name {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: #151618;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .tw-card__header-actions {
    display: flex;
    align-items: center;
    flex: none;
    position: relative;
  }
  .tw-card__icon-btn {
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: #AEAEB2;
    font-size: 16px;
    line-height: 1;
    cursor: pointer;
    border-radius: 6px;
    padding: 0;
  }
  .tw-card__icon-btn:hover {
    background: #f4f4f4;
  }

  .tw-card__body {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 12px 16px;
    border-radius: 8px;
    background: #FBFBFB;
  }
  .tw-card__body--blurred {
    filter: blur(6px);
    opacity: 0.6;
    pointer-events: none;
    user-select: none;
  }

  /* Loading & not-found states: centered, no card background. */
  .tw-card__body--state {
    align-items: center;
    justify-content: center;
    background: none;
  }

  .tw-card__trust {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .tw-card__tag {
    display: inline-flex;
    align-items: center;
    gap: 2px;
    padding: 4px 8px;
    border-radius: 6px;
    background: #f4f4f4;
    border: 0.5px solid #e4e4e4;
    color: #151618;
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    white-space: nowrap;
  }
  .tw-card__tezos-logo {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #ffffff;
    border: 0.8px solid #f4f4f4;
  }
  .tw-card__tezos-logo--inner {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: none;
    border-radius: 50%;
    background: #2C7DF7;
    width: 10px;
    height: 10px;
  }
  .tw-card__tezos-icon {
    display: block;
    width: 8px;
    height: 8px;
  }
  .tw-card__tezos-icon path {
    fill: #ffffff;
  }

  .tw-card__content {
    display: flex;
    gap: 16px;
    margin-top: 12px;
    margin-bottom: 16px;
  }
  .tw-card__media {
    width: 140px;
    height: 140px;
    border-radius: 8px;
    object-fit: cover;
    flex: none;
    background: #f4f4f4;
  }
  .tw-card__media--empty {
    background: #f4f4f4;
  }

  .tw-card__info {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-width: 0;
  }
  .tw-card__name {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: #151618;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  .tw-card__price-block {
    margin-top: 8px;
  }
  .tw-card__price {
    font-family: 'Rubik', sans-serif;
    font-weight: 500;
    font-size: 24px;
    line-height: 36px;
    color: #000000;
  }
  .tw-card__price--auction {
    color: #34cc4e;
  }
  .tw-card__fiat {
    font-family: 'Rubik', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 20px;
    color: #707070;
  }

  .tw-card__divider {
    height: 1px;
    background: #e4e4e4;
    margin: 8px 0;
  }
  .tw-card__props {
    display: flex;
    gap: 24px;
  }
  .tw-card__prop {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  .tw-card__prop-label {
    font-size: 12px;
    line-height: 16px;
    color: #707070;
  }
  .tw-card__prop-value {
    font-family: 'Rubik', sans-serif;
    font-size: 12px;
    line-height: 16px;
    color: #151618;
  }

  .tw-card__cta {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    height: 40px;
    border-radius: 8px;
    background: #e3ecf8;
    color: #1373e4;
    font-family: 'Inter', sans-serif;
    font-size: 16px;
    font-weight: 600;
    text-decoration: none;
  }
  .tw-card__cta:hover {
    background: #d7e4f5;
  }
  .tw-card__cta-icon {
    width: 20px;
    height: 20px;
    flex: none;
    fill: currentColor;
  }

  .tw-card__ad {
    display: flex;
    align-items: center;
    position: relative;
    flex: none;
    height: 78px;
  }
  .tw-card__ad-iframe {
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  }
  .tw-card__ad-loader {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
  }

  .tw-card__welcome {
    position: absolute;
    left: 0;
    right: 0;
    top: 48px;
    bottom: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 30px 26px;
    background: rgba(255, 255, 255, 0.8);
  }
  .tw-card__welcome-center {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    text-align: center;
  }
  .tw-card__welcome-icon {
    width: 32px;
    height: 32px;
    margin-bottom: 6px;
  }
  .tw-card__welcome-icon path {
    fill: #1373E4;
  }
  .tw-card__welcome-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 24px;
    color: #151618;
  }
  .tw-card__welcome-subtitle {
    font-size: 12px;
    font-weight: 400;
    line-height: 16px;
    color: #707070;
    max-width: 340px;
  }
  .tw-card__welcome-bottom {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .tw-card__continue {
    width: 100%;
    height: 40px;
    border: none;
    border-radius: 8px;
    background: #1373E4;
    color: #ffffff;
    font-size: 16px;
    line-height: 24px;
    font-weight: 500;
    cursor: pointer;
  }
  .tw-card__continue:hover {
    background: #1062c9;
  }
  .tw-card__welcome-agreement {
    font-size: 10px;
    font-weight: 400;
    line-height: 12px;
    color: #707070;
    text-align: center;
  }

  .tw-card__state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    min-height: 224px;
    padding: 0px 10px;
    text-align: center;
  }
  .tw-card__spinner-box {
    padding: 12px;
    border-radius: 8px;
    background: #ffffff;
    border: 1px solid #f4f4f4;
    box-shadow: 0 0 4px rgba(0, 0, 0, 0.08);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .tw-card__spinner {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2.5px solid #e4e4e4;
    border-top-color: #1373e4;
    animation: tw-card-spin 0.8s linear infinite;
  }
  @keyframes tw-card-spin {
    to {
      transform: rotate(360deg);
    }
  }
  .tw-card__loading-text {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 600;
    line-height: 16px;
    color: #707070;
  }
  .tw-card__state-text {
    font-size: 14px;
    line-height: 20px;
    color: #AEAEB2;
  }
  .tw-card__state-text--bold {
    font-weight: 500;
  }
  .tw-card__sadface {
    display: block;
    width: 88px;
    height: 88px;
    color: #c2c2c8;
    fill: currentColor;
  }

  .tw-card__menu {
    position: absolute;
    top: 36px;
    right: 32px;
    z-index: 10;
    min-width: 148px;
    padding: 8px;
    border-radius: 6px;
    background: #ffffff;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16), 0 2px 8px rgba(0, 0, 0, 0.08);
    display: flex;
    flex-direction: column;
  }
  .tw-card__menu-item {
    display: flex;
    align-items: center;
    gap: 4px;
    width: 100%;
    padding: 6px 8px;
    border: none;
    background: transparent;
    border-radius: 6px;
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    color: #151618;
    cursor: pointer;
    text-align: left;
  }
  .tw-card__menu-item:hover {
    background: #f4f4f4;
  }
  .tw-card__menu-item--danger {
    color: #eb5757;
  }
  .tw-card__menu-icon {
    width: 24px;
    height: 24px;
    flex: none;
  }
  .tw-card__menu-icon path {
    fill: #1373E4;
  }
  .tw-card__menu-item--danger .tw-card__menu-icon path {
    fill: #FF3B30;
  }
  .tw-card__close-icon {
    width: 16px;
    height: 16px;
    stroke: currentColor;
  }
  .tw-card__settings-icon {
    width: 24px;
    height: 24px;
  }
`;
