import React, { Component, ErrorInfo } from 'react';

import classNames from 'clsx';

import { ReactComponent as DangerIcon } from 'app/icons/danger.svg';
import { t, T } from 'lib/i18n';

export interface ErrorBoundaryProps extends React.PropsWithChildren {
  className?: string;
  whileMessage?: string;
  wholeErrorMessageFn?: (error: Error, online: boolean, defaultMessage: string) => string;
  beforeTryAgain?: (error: Error) => void | Promise<void>;
}

type ErrorBoundaryState = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error) {
    return { error: error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(error.message, errorInfo.componentStack);
  }

  componentDidMount() {
    window.addEventListener('reseterrorboundary', () => {
      if (this.state.error) {
        this.tryAgain();
      }
    });
  }

  async tryAgain() {
    if (this.props.beforeTryAgain) {
      await this.props.beforeTryAgain(this.state.error!);
    }
    this.setState({ error: null });
  }

  getDefaultErrorMessage() {
    const { whileMessage } = this.props;
    const online = getOnlineStatus();
    const firstPart = whileMessage ? t('smthWentWrongWhile', [whileMessage]) : t('smthWentWrong');

    return online ? firstPart : [firstPart, t('mayHappenBecauseYouAreOffline')].join('. ');
  }

  render() {
    if (this.state.error) {
      const online = getOnlineStatus();
      const { wholeErrorMessageFn: wholeMessageFn } = this.props;
      const defaultMessage = this.getDefaultErrorMessage();

      return (
        <div className={classNames('w-full', 'flex items-center justify-center', this.props.className)}>
          <div className={classNames('max-w-xs', 'p-4', 'flex flex-col items-center', 'text-red-600')}>
            <DangerIcon className="h-16 w-auto stroke-current" />

            <T id="oops">{message => <h2 className="mb-1 text-2xl">{message}</h2>}</T>

            <p className="mb-4 text-sm opacity-90 text-center font-light">
              {wholeMessageFn ? wholeMessageFn(this.state.error, online, defaultMessage) : defaultMessage}
            </p>

            <T id="tryAgain">
              {message => (
                <button
                  className={classNames(
                    'mb-6',
                    'px-4 py-1',
                    'bg-red-500 rounded',
                    'border border-black border-opacity-5',
                    'flex items-center',
                    'text-white text-shadow-black',
                    'text-sm font-semibold',
                    'transition duration-300 ease-in-out',
                    'opacity-90 hover:opacity-100',
                    'shadow-sm hover:shadow'
                  )}
                  onClick={() => this.tryAgain()}
                >
                  {message}
                </button>
              )}
            </T>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function getOnlineStatus() {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean' ? navigator.onLine : true;
}
