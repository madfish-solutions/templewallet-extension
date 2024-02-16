import React, { PropsWithChildren, Component, ErrorInfo, memo } from 'react';

import clsx from 'clsx';

import { ReactComponent as DangerIcon } from 'app/icons/danger.svg';
import { t, T } from 'lib/i18n';
import { getOnlineStatus } from 'lib/ui/get-online-status';

export class BoundaryError extends Error {
  constructor(public readonly message: string, public readonly beforeTryAgain: EmptyFn) {
    super(message);
  }
}

interface Props extends PropsWithChildren {
  className?: string;
  whileMessage?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, ErrorBoundaryState> {
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

  tryAgain = () => {
    const { error } = this.state;
    if (error instanceof BoundaryError) {
      error.beforeTryAgain();
    }
    this.setState({ error: null });
  };

  getDefaultErrorMessage() {
    const { whileMessage } = this.props;
    const online = getOnlineStatus();
    const firstPart = whileMessage ? t('smthWentWrongWhile', [whileMessage]) : t('smthWentWrong');

    return online ? firstPart : [firstPart, t('mayHappenBecauseYouAreOffline')].join('. ');
  }

  render() {
    const { className, children } = this.props;
    const { error } = this.state;

    const errorMessage = error instanceof BoundaryError ? error.message : this.getDefaultErrorMessage();

    return error ? (
      <ErrorBoundaryContent errorMessage={errorMessage} onTryAgainClick={this.tryAgain} className={className} />
    ) : (
      children
    );
  }
}

interface ErrorBoundaryContentProps {
  errorMessage: string;
  className?: string;
  onTryAgainClick: EmptyFn;
}

export const ErrorBoundaryContent = memo<ErrorBoundaryContentProps>(({ errorMessage, className, onTryAgainClick }) => (
  <div className={clsx('w-full flex items-center justify-center', className)}>
    <div className="max-w-xs p-4 flex flex-col items-center text-red-600">
      <DangerIcon className="h-16 w-auto stroke-current" />

      <h2 className="mb-1 text-2xl">
        <T id="oops" />
      </h2>

      <p className="mb-4 text-sm opacity-90 text-center font-light">{errorMessage}</p>

      <button
        className={clsx(
          'mb-6 px-4 py-1',
          'bg-red-500 rounded',
          'border border-black border-opacity-5',
          'flex items-center',
          'text-white text-shadow-black',
          'text-sm font-semibold',
          'transition duration-300 ease-in-out',
          'opacity-90 hover:opacity-100',
          'shadow-sm hover:shadow'
        )}
        onClick={onTryAgainClick}
      >
        <T id="tryAgain" />
      </button>
    </div>
  </div>
));
